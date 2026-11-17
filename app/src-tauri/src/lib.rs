pub mod commands;
pub mod criterion;
pub mod error;
pub mod media;
pub mod provider;
pub mod session;
pub mod subtitle;

use std::sync::Mutex;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(Mutex::new(None::<session::Session>))
        .manage(Mutex::new(provider::state::ProviderState::new(Box::new(
            provider::keychain::KeychainStore,
        ))))
        .setup(|app| {
            let _ = app.get_webview_window("main");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::open_session,
            commands::list_tracks,
            commands::open_from_track,
            commands::session_cues,
            commands::search_topic,
            commands::set_offset,
            commands::cue_sample,
            commands::preview_clip,
            commands::get_mode,
            commands::set_mode,
            commands::list_models,
            commands::has_key,
            commands::set_key,
            commands::clear_key,
            commands::plan_request,
            commands::rank_candidates,
            commands::cut_clips
        ])
        .run(tauri::generate_context!())
        .expect("failed to start the Kirpix window");
}
