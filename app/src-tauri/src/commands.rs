use std::path::Path;
use std::sync::Mutex;

use tauri::{AppHandle, Emitter, State};

use crate::criterion::{self, Bounds, Candidate};
use base64::engine::general_purpose::STANDARD;
use base64::Engine as _;

use crate::media::{cut, ffmpeg, wav_around, ClipRequest, CutResult, SubtitleTrack};
use crate::error::KirpixError;
use crate::session::{self, OffsetInfo, Session, SessionInfo};
use crate::subtitle::Cue;

pub type SessionState<'a> = State<'a, Mutex<Option<Session>>>;

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
