pub mod commands;
pub mod criterion;
pub mod error;
pub mod media;
pub mod provider;
pub mod session;
pub mod settings;
pub mod subtitle;
#[cfg(test)]
pub mod testing;

use std::sync::Mutex;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(Mutex::new(None::<session::Session>))
        .setup(|app| {
            let _ = app.get_webview_window("main");

            // The mode is remembered in the application's own config directory. If
            // there is none, the state says so and a mode change reports it rather
            // than appearing to have been saved.
            let keys = Box::new(provider::keychain::KeychainStore);
            let state = match app.path().app_config_dir() {
                Ok(directory) => provider::state::ProviderState::with_store(
                    keys,
                    settings::Store::new(directory.join("settings.json")),
                ),
                Err(error) => {
                    let mut state = provider::state::ProviderState::new(keys);
                    state.load_error = Some(format!("no settings directory was found: {error}"));
                    state
                }
            };
            app.manage(Mutex::new(state));
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
            commands::get_settings,
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
