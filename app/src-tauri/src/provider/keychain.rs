//! Keys in the operating system's keychain.
//!
//! Nothing else in the application is allowed to hold a key beyond the call that
//! needs it, and nothing at all is allowed to write one to a file, a log or an
//! error (constitution, Additional Constraints).

use super::{CloudProvider, KeyStore, ProviderError};

/// The service name the entries are filed under. Reversing the bundle
/// identifier keeps a namespace nothing else uses.
const SERVICE: &str = "dev.kirpix.app";

/// The account name per provider: what the user sees in their keychain manager.
fn account(provider: CloudProvider) -> &'static str {
    match provider {
        CloudProvider::DeepSeek => "deepseek",
    }
}

/// The production [`KeyStore`]: one entry per provider, in the OS keychain.
///
/// Every test uses [`super::MemoryKeyStore`] instead, so `cargo test` never asks
/// a real secret service for anything — and never leaves a key behind on a
/// developer's machine.
pub struct KeychainStore;

impl KeyStore for KeychainStore {
    fn get(&self, provider: CloudProvider) -> Result<Option<String>, ProviderError> {
        let entry = entry(provider)?;
        match entry.get_password() {
            Ok(key) => Ok(Some(key)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(err) => Err(ProviderError::Keyring {
                detail: err.to_string(),
            }),
        }
    }

    fn set(&mut self, provider: CloudProvider, key: &str) -> Result<(), ProviderError> {
        entry(provider)?
            .set_password(key)
            .map_err(|err| ProviderError::Keyring {
                detail: err.to_string(),
            })
    }

    fn clear(&mut self, provider: CloudProvider) -> Result<(), ProviderError> {
        match entry(provider)?.delete_credential() {
            // Already gone is the state the caller asked for.
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(err) => Err(ProviderError::Keyring {
                detail: err.to_string(),
            }),
        }
    }
}

fn entry(provider: CloudProvider) -> Result<keyring::Entry, ProviderError> {
    keyring::Entry::new(SERVICE, account(provider)).map_err(|err| ProviderError::Keyring {
        detail: err.to_string(),
    })
}

/// Replace a key with a marker before a message can reach a screen or a log.
///
/// Used on the provider's own words: some of them echo the credential back, and
/// an error that repeats a secret is worse than the error.
pub fn redact(message: &str, key: Option<&str>) -> String {
    match key {
        Some(key) if !key.is_empty() => message.replace(key, "[redacted]"),
        _ => message.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_message_that_repeats_the_key_loses_it() {
        let message = "invalid api key: sk-abc123 for this account";

        let redacted = redact(message, Some("sk-abc123"));

        assert!(!redacted.contains("sk-abc123"), "{redacted}");
        assert!(redacted.contains("[redacted]"), "{redacted}");
    }

    #[test]
    fn a_message_without_a_key_is_left_alone() {
        assert_eq!(redact("rate limited", None), "rate limited");
        assert_eq!(redact("rate limited", Some("")), "rate limited");
    }
}
