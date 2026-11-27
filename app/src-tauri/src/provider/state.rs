//! What the model layer remembers between commands: the chosen mode, and the
//! keys, which live behind the [`KeyStore`] this state was built with.

use super::{KeyStore, Mode};
use crate::settings::{Settings, Store};

pub struct ProviderState {
    pub mode: Mode,
    pub keys: Box<dyn KeyStore + Send>,
    /// Where the mode is remembered. `None` when the application could not find a
    /// config directory, which is stated rather than ignored: a setting that looks
    /// saved and is not would be a silent fallback.
    pub store: Option<Store>,
    /// Why the file could not be read at start-up, if it could not. Kept so the
    /// settings screen can say it until a setting is written.
    pub load_error: Option<String>,
}

impl ProviderState {
    pub fn new(keys: Box<dyn KeyStore + Send>) -> Self {
        Self {
            mode: Mode::default(),
            keys,
            store: None,
            load_error: None,
        }
    }

    /// Build the state from the settings file, in one place, so the mode and the
    /// error that comes with it cannot disagree.
    pub fn with_store(keys: Box<dyn KeyStore + Send>, store: Store) -> Self {
        let (mode, load_error) = match store.load() {
            Ok(Some(settings)) => (settings.mode, None),
            Ok(None) => (Mode::default(), None),
            Err(detail) => (Mode::default(), Some(detail)),
        };

        Self {
            mode,
            keys,
            store: Some(store),
            load_error,
        }
    }

    /// Remember the mode, then adopt it. In that order: a mode that could not be
    /// written is not a mode that was chosen.
    pub fn remember_mode(&mut self, mode: Mode) -> Result<(), String> {
        let store = self
            .store
            .as_ref()
            .ok_or_else(|| "no settings directory was found on this machine".to_string())?;
        store.save(&Settings { mode: mode.clone() })?;
        self.mode = mode;
        self.load_error = None;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::provider::{LocalConfig, MemoryKeyStore};

    fn scratch(name: &str) -> std::path::PathBuf {
        let path =
            std::env::temp_dir().join(format!("kirpix-state-{name}-{}.json", std::process::id()));
        let _ = std::fs::remove_file(&path);
        path
    }

    fn local() -> Mode {
        Mode::Local(LocalConfig {
            address: "http://127.0.0.1:11434/v1".into(),
            model: "qwen2.5:7b".into(),
        })
    }

    /// The whole point of the slice: what was chosen is what comes back.
    #[test]
    fn a_chosen_mode_is_there_after_a_restart() {
        let path = scratch("restart");
        {
            let mut first =
                ProviderState::with_store(Box::new(MemoryKeyStore::new()), Store::new(&path));
            first.remember_mode(local()).expect("remember");
        }
        let second = ProviderState::with_store(Box::new(MemoryKeyStore::new()), Store::new(&path));
        assert_eq!(second.mode, local());
        assert_eq!(second.load_error, None);
        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn a_first_run_starts_on_the_default_engine() {
        let state = ProviderState::with_store(
            Box::new(MemoryKeyStore::new()),
            Store::new(scratch("first")),
        );
        assert_eq!(state.mode, Mode::Heuristic);
        assert_eq!(state.load_error, None);
    }

    #[test]
    fn an_unreadable_file_is_kept_and_cleared_by_a_write() {
        let path = scratch("unreadable");
        std::fs::write(&path, "{ not json").expect("write");
        let mut state =
            ProviderState::with_store(Box::new(MemoryKeyStore::new()), Store::new(&path));
        assert_eq!(state.mode, Mode::Heuristic);
        assert!(state
            .load_error
            .as_deref()
            .unwrap_or_default()
            .contains("settings"));

        state.remember_mode(local()).expect("remember");
        assert_eq!(state.load_error, None);
        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn a_state_with_no_store_refuses_to_pretend() {
        let mut state = ProviderState::new(Box::new(MemoryKeyStore::new()));
        assert!(state.remember_mode(local()).is_err());
        assert_eq!(state.mode, Mode::Heuristic);
    }
}
