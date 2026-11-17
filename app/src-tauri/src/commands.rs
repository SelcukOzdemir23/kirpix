use std::path::Path;
use std::sync::Mutex;

use tauri::{AppHandle, Emitter, State};

use crate::criterion::{self, Bounds, Candidate};
use crate::provider::gate::{rank_confirmed, Confirmation};
use crate::provider::state::ProviderState;
use crate::provider::{
    client_for, CloudProvider, Mode, ModelClient, ProviderError, Shortlist, Shortlisted,
};
use base64::engine::general_purpose::STANDARD;
use base64::Engine as _;

use crate::media::{cut, encode_preview, ffmpeg, wav_around, ClipRequest, CutResult, SubtitleTrack};
use crate::error::KirpixError;
use crate::session::{self, OffsetInfo, Session, SessionInfo};
use crate::subtitle::Cue;

pub type SessionState<'a> = State<'a, Mutex<Option<Session>>>;
pub type ProviderStateRef<'a> = State<'a, Mutex<ProviderState>>;

#[tauri::command]
pub fn open_session(
    state: SessionState<'_>,
    video_path: String,
    subtitle_path: String,
) -> Result<SessionInfo, KirpixError> {
    let opened = session::open(video_path.as_ref(), subtitle_path.as_ref())?;
    let info = opened.info();
    *state.lock().expect("session lock") = Some(opened);
    Ok(info)
}

#[tauri::command]
pub fn session_cues(state: SessionState<'_>, from: usize, to: usize) -> Result<Vec<Cue>, KirpixError> {
    let guard = state.lock().expect("session lock");
    let session = guard.as_ref().ok_or(KirpixError::NoSession)?;
    Ok(session.cues(from, to))
}

#[tauri::command]
pub fn search_topic(
    state: SessionState<'_>,
    terms: Vec<String>,
    min_ms: u64,
    max_ms: u64,
) -> Result<Vec<Candidate>, KirpixError> {
    let guard = state.lock().expect("session lock");
    let session = guard.as_ref().ok_or(KirpixError::NoSession)?;
    criterion::find(
        &session.table_with_offset(),
        &terms,
        Bounds { min_ms, max_ms },
        session.media.duration_ms,
    )
}

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct CutProgress {
    index: usize,
    percent: u64,
}

/// Cut every clip the user kept and report each one separately. A failed clip
/// returns its own result instead of failing the call, so the rest still land.
#[tauri::command]
pub fn cut_clips(
    state: SessionState<'_>,
    app: AppHandle,
    clips: Vec<ClipRequest>,
    out_dir: String,
) -> Result<Vec<CutResult>, KirpixError> {
    let guard = state.lock().expect("session lock");
    let session = guard.as_ref().ok_or(KirpixError::NoSession)?;

    Ok(cut::cut_batch(
        &session.video,
        &clips,
        Path::new(&out_dir),
        |index, percent| {
            let _ = app.emit("cut-progress", CutProgress { index, percent });
        },
    ))
}

/// What subtitle tracks the file carries, before a session is opened.
#[tauri::command]
pub fn list_tracks(video_path: String) -> Result<Vec<SubtitleTrack>, KirpixError> {
    Ok(ffmpeg::probe(Path::new(&video_path))?.subtitle_tracks)
}

#[tauri::command]
pub fn open_from_track(
    state: SessionState<'_>,
    video_path: String,
    stream_index: usize,
) -> Result<SessionInfo, KirpixError> {
    let opened = session::open_embedded(Path::new(&video_path), stream_index)?;
    let info = opened.info();
    *state.lock().expect("session lock") = Some(opened);
    Ok(info)
}

/// Move every cue by the given amount. Positive is later.
#[tauri::command]
pub fn set_offset(state: SessionState<'_>, offset_ms: i64) -> Result<OffsetInfo, KirpixError> {
    let mut guard = state.lock().expect("session lock");
    let session = guard.as_mut().ok_or(KirpixError::NoSession)?;
    session.offset_ms = offset_ms;
    Ok(session.offset_info())
}

/// A few seconds of sound around a cue, as a data URL.
///
/// Nothing is written to disk: FFmpeg writes WAV to its output, and the bytes
/// travel to the interface inside the response. That keeps the promise that the
/// only files this application creates are the clips the user asked for.
#[tauri::command]
pub fn cue_sample(
    state: SessionState<'_>,
    cue_index: usize,
    seconds: f64,
) -> Result<String, KirpixError> {
    let guard = state.lock().expect("session lock");
    let session = guard.as_ref().ok_or(KirpixError::NoSession)?;

    let cue = session
        .table_with_offset()
        .cue(cue_index)
        .cloned()
        .ok_or(KirpixError::CueMissing { index: cue_index })?;

    let bytes = wav_around(&session.video, cue.start_ms, seconds.clamp(0.5, 15.0))?;
    Ok(format!("data:audio/wav;base64,{}", STANDARD.encode(bytes)))
}

/// A small copy of one range, for looking at it before cutting it.
///
/// The bytes come back as a data URL rather than a file or an asset-protocol
/// path: the webview cannot decode MKV or AV1, so it is handed H.264 in MP4, and
/// nothing is left on disk to clean up afterwards.
#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClipPreview {
    pub url: String,
    pub duration_ms: u64,
    pub truncated: bool,
}

#[tauri::command]
pub fn preview_clip(
    state: SessionState<'_>,
    start_ms: u64,
    end_ms: u64,
) -> Result<ClipPreview, KirpixError> {
    let guard = state.lock().expect("session lock");
    let session = guard.as_ref().ok_or(KirpixError::NoSession)?;

    let encoded = encode_preview(&session.video, start_ms, end_ms)?;

    Ok(ClipPreview {
        url: format!("data:video/mp4;base64,{}", STANDARD.encode(encoded.bytes)),
        duration_ms: encoded.duration_ms,
        truncated: encoded.truncated,
    })
}

// -- the model layer ------------------------------------------------------

/// What the confirmation dialog states, taken from the payload the application
/// would actually send rather than from numbers the interface guessed.
#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestPlan {
    mode: Mode,
    model: String,
    /// The address, for a local server; the fixed provider address for a cloud.
    address: String,
    candidate_count: usize,
    cue_count: usize,
    char_count: usize,
    /// Candidates the budget left out, so the interface can say so.
    left_out: usize,
    /// Candidates whose cue list was shortened to fit the per-candidate cap.
    shortened: usize,
}

/// One candidate as the model ranked it.
#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RankedCandidate {
    candidate: u64,
    reason: String,
    cues: Vec<usize>,
}

#[tauri::command]
pub fn get_mode(state: ProviderStateRef<'_>) -> Mode {
    state.lock().expect("provider lock").mode.clone()
}

#[tauri::command]
pub fn set_mode(state: ProviderStateRef<'_>, mode: Mode) {
    state.lock().expect("provider lock").mode = mode;
}

#[tauri::command]
pub fn list_models(address: String) -> Result<Vec<String>, ProviderError> {
    let client = crate::provider::openai::OpenAiClient::local(address, String::new());
    client.models()
}

#[tauri::command]
pub fn has_key(state: ProviderStateRef<'_>, provider: CloudProvider) -> Result<bool, ProviderError> {
    let guard = state.lock().expect("provider lock");
    Ok(guard.keys.get(provider)?.is_some())
}

#[tauri::command]
pub fn set_key(
    state: ProviderStateRef<'_>,
    provider: CloudProvider,
    key: String,
) -> Result<(), ProviderError> {
    let mut guard = state.lock().expect("provider lock");
    guard.keys.set(provider, &key)
}

#[tauri::command]
pub fn clear_key(state: ProviderStateRef<'_>, provider: CloudProvider) -> Result<(), ProviderError> {
    let mut guard = state.lock().expect("provider lock");
    guard.keys.clear(provider)
}

/// Build the shortlist the application would send for these criteria.
///
/// The same deterministic search the interface already ran, rebuilt here, so the
/// confirmation is compared against what would really leave rather than against
/// a count the interface remembered.
fn plan_shortlist(
    session: &Session,
    terms: &[String],
    min_ms: u64,
    max_ms: u64,
) -> Result<Shortlist, KirpixError> {
    let table = session.table_with_offset();
    let found = criterion::find(
        &table,
        terms,
        Bounds { min_ms, max_ms },
        session.media.duration_ms,
    )?;

    let candidates: Vec<Shortlisted> = found
        .iter()
        .map(|candidate| Shortlisted {
            candidate: candidate.id as u64,
            cues: (candidate.start_cue..=candidate.end_cue)
                .filter_map(|index| table.cue(index))
                .map(|cue| (cue.index, cue.text.clone()))
                .collect(),
        })
        .collect();

    Ok(crate::provider::shortlist::build(&terms.join(", "), candidates))
}

fn plan_of(mode: &Mode, shortlist: &Shortlist) -> RequestPlan {
    let (model, address) = match mode {
        Mode::Heuristic => (String::new(), String::new()),
        Mode::Local(config) => (config.model.clone(), config.address.clone()),
        Mode::Cloud(config) => (
            config.model.clone(),
            crate::provider::cloud_address(config.provider).to_string(),
        ),
    };

    RequestPlan {
        mode: mode.clone(),
        model,
        address,
        candidate_count: shortlist.candidates.len(),
        cue_count: shortlist.cue_count(),
        char_count: shortlist.char_count(),
        left_out: shortlist.left_out,
        shortened: shortlist.truncated.len(),
    }
}

/// What the dialog should say before anything is sent.
#[tauri::command]
pub fn plan_request(
    state: SessionState<'_>,
    provider: ProviderStateRef<'_>,
    terms: Vec<String>,
    min_ms: u64,
    max_ms: u64,
) -> Result<RequestPlan, KirpixError> {
    let guard = state.lock().expect("session lock");
    let session = guard.as_ref().ok_or(KirpixError::NoSession)?;
    let mode = provider.lock().expect("provider lock").mode.clone();
    let shortlist = plan_shortlist(session, &terms, min_ms, max_ms)?;
    Ok(plan_of(&mode, &shortlist))
}

/// Ask the model to rank the shortlist, once the user has agreed to it.
///
/// The gate runs inside `rank_confirmed`, so a payload that changed after the
/// dialog opened never reaches a client.
#[tauri::command]
pub fn rank_candidates(
    state: SessionState<'_>,
    provider: ProviderStateRef<'_>,
    terms: Vec<String>,
    min_ms: u64,
    max_ms: u64,
    confirmation: Confirmation,
) -> Result<Vec<RankedCandidate>, ProviderError> {
    let session_guard = state.lock().expect("session lock");
    let session = session_guard.as_ref().ok_or(ProviderError::NoSession)?;
    let provider_guard = provider.lock().expect("provider lock");
    let mode = provider_guard.mode.clone();

    let shortlist = plan_shortlist(session, &terms, min_ms, max_ms).map_err(|err| {
        ProviderError::MalformedAnswer {
            detail: err.to_string(),
        }
    })?;

    let client = client_for(&mode, provider_guard.keys.as_ref())?;
    let answer = rank_confirmed(&client, &shortlist, &mode, &confirmation)?;

    Ok(answer
        .order
        .into_iter()
        .map(|ranking| RankedCandidate {
            candidate: ranking.candidate,
            reason: ranking.reason,
            cues: ranking.cues,
        })
        .collect())
}
