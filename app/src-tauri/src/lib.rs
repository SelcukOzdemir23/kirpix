pub mod commands;
pub mod criterion;
pub mod error;
pub mod media;
pub mod session;
pub mod subtitle;

use std::sync::Mutex;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(Mutex::new(None::<session::Session>))
        .setup(|app| {
            let _ = app.get_webview_window("main");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::open_session,
            commands::session_cues,
            commands::search_topic,
            commands::cut_clips
        ])
        .run(tauri::generate_context!())
        .expect("failed to start the Kirpix window");
}
