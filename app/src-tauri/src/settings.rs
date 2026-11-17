//! What the application remembers between runs.
//!
//! The appearance is not here. It is a swap of CSS variables owned by the
//! interface, which applies it before the first paint; a round trip through this
//! module would paint once with the wrong one. What is here is the provider mode:
//! the backend acts on it, so the backend stores it.
//!
//! Nothing secret belongs in this file. Keys live in the operating system
//! keychain (see `provider::keychain`), and the constitution says so.
//!
//! An unreadable file is reported and never replaced: the caller decides what the
//! screen says, and the file is only overwritten when a person chooses a setting.

use std::fs;
use std::path::{Path, PathBuf};

use crate::provider::Mode;

/// The file's shape. `default` on the struct is what lets a file written by an
/// older build load: a field it did not have takes its own default, and the rest
/// is kept as written.
#[derive(Debug, Clone, Default, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Settings {
    pub mode: Mode,
}

/// One settings file, at a path the caller chooses. Tests pass a temporary path;
/// the application passes its own config directory.
pub struct Store {
    path: PathBuf,
}

impl Store {
    pub fn new(path: impl Into<PathBuf>) -> Self {
        Self { path: path.into() }
    }

    pub fn path(&self) -> &Path {
        &self.path
    }

    /// `Ok(None)` when the file is not there yet: a first run is not a failure.
    pub fn load(&self) -> Result<Option<Settings>, String> {
        let text = match fs::read_to_string(&self.path) {
            Ok(text) => text,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
            // The reason only. Callers that show a sentence name the file from
            // `path()`, so a screen does not print the path twice.
            Err(error) => return Err(format!("could not be read: {error}")),
        };

        serde_json::from_str(&text)
            .map(Some)
            .map_err(|error| format!("is not a settings file: {error}"))
    }

    /// Write through a temporary neighbour and rename, so a crash mid-write cannot
    /// leave half a JSON document behind: the file on disk is always one whole
    /// version or the other.
    pub fn save(&self, settings: &Settings) -> Result<(), String> {
        if let Some(parent) = self.path.parent() {
            fs::create_dir_all(parent)
                .map_err(|error| format!("{} could not be created: {error}", parent.display()))?;
        }

        let body = serde_json::to_string_pretty(settings)
            .map_err(|error| format!("the settings could not be written: {error}"))?;
        let temporary = self.path.with_extension("json.tmp");
        fs::write(&temporary, body)
            .map_err(|error| format!("{} could not be written: {error}", temporary.display()))?;
        fs::rename(&temporary, &self.path)
            .map_err(|error| format!("{} could not be written: {error}", self.path.display()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::provider::{CloudConfig, CloudProvider, LocalConfig};

    /// A path in the temporary directory that no other test uses.
    fn scratch(name: &str) -> PathBuf {
        let unique = format!("kirpix-settings-{name}-{}.json", std::process::id());
        let path = std::env::temp_dir().join(unique);
        let _ = fs::remove_file(&path);
        path
    }

    #[test]
    fn a_missing_file_is_a_first_run_not_a_failure() {
        let store = Store::new(scratch("missing"));
        assert_eq!(store.load(), Ok(None));
    }

    #[test]
    fn a_saved_mode_comes_back_the_same() {
        let store = Store::new(scratch("roundtrip"));
        let settings = Settings {
            mode: Mode::Local(LocalConfig {
                address: "http://127.0.0.1:11434/v1".into(),
                model: "qwen2.5:7b".into(),
            }),
        };
        store.save(&settings).expect("save");
        assert_eq!(store.load(), Ok(Some(settings)));
        let _ = fs::remove_file(store.path());
    }

    #[test]
    fn a_corrupt_file_is_reported_and_not_overwritten() {
        let path = scratch("corrupt");
        fs::write(&path, "{ not json").expect("write");
        let store = Store::new(&path);
        let error = store.load().expect_err("corrupt file must fail");
        assert!(error.contains("is not a settings file"), "{error}");
        // Reading never writes: the person's broken file is still there to inspect.
        assert_eq!(fs::read_to_string(&path).expect("read"), "{ not json");
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn a_field_written_by_an_older_build_takes_its_default() {
        let path = scratch("older");
        fs::write(&path, "{}").expect("write");
        let loaded = Store::new(&path).load().expect("load").expect("some");
        assert_eq!(loaded.mode, Mode::default());
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn a_field_a_later_build_added_is_ignored_rather_than_fatal() {
        let path = scratch("later");
        fs::write(
            &path,
            r#"{ "mode": { "mode": "cloud", "provider": "deepSeek", "model": "deepseek-chat" }, "future": 1 }"#,
        )
        .expect("write");
        let loaded = Store::new(&path).load().expect("load").expect("some");
        assert_eq!(
            loaded.mode,
            Mode::Cloud(CloudConfig {
                provider: CloudProvider::DeepSeek,
                model: "deepseek-chat".into(),
            })
        );
        let _ = fs::remove_file(&path);
    }
}
