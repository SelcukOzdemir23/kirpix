use std::sync::Mutex;

use tauri::State;

use crate::criterion::{self, Bounds, Candidate};
use crate::error::KirpixError;
use crate::session::{self, Session, SessionInfo};
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
        &session.table,
        &terms,
        Bounds { min_ms, max_ms },
        session.media.duration_ms,
    )
}
