//! The model layer's seam.
//!
//! Nothing in this module talks to a network or to a keychain. It names the
//! three modes, the shape of what goes to a model, the shape of what may come
//! back, and the two traits the rest of the application is allowed to know about:
//! [`ModelClient`] and [`KeyStore`].
//!
//! Keeping the seam this thin is what lets the whole slice be tested offline: a
//! fake client and an in-memory key store implement both traits, so no test ever
//! reaches a real server or the operating system's secret service.

use std::collections::HashMap;

/// Which way results are produced. Heuristic is the default and is the only mode
/// that cannot degrade: it needs no model, no key and no network.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(tag = "mode", rename_all = "camelCase")]
pub enum Mode {
    Heuristic,
    Local(LocalConfig),
    Cloud(CloudConfig),
}

impl Default for Mode {
    fn default() -> Self {
        Self::Heuristic
    }
}

/// A server on this machine. The address is visible and editable, so a server on
/// another port is a setting rather than a code change.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalConfig {
    pub address: String,
    pub model: String,
}

/// A provider over the network. One variant today; a second one is a variant,
/// not a second shape of request.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CloudConfig {
    pub provider: CloudProvider,
    pub model: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum CloudProvider {
    DeepSeek,
}

/// One candidate as the model sees it: the id the deterministic pass gave it and
/// the cues it is made of. No timecode is ever put in front of a model
/// (constitution, article V).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Shortlisted {
    pub candidate: u64,
    pub cues: Vec<(usize, String)>,
}

/// What the budget allows sending, and what it did not.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Shortlist {
    pub criterion: String,
    pub candidates: Vec<Shortlisted>,
    /// How many candidates the deterministic trim left out. Stated in the
    /// interface, never dropped quietly.
    pub left_out: usize,
}

impl Shortlist {
    /// Every cue in the payload, for the character count the confirmation names.
    pub fn cue_count(&self) -> usize {
        self.candidates.iter().map(|entry| entry.cues.len()).sum()
    }

    /// The payload's size, as the confirmation counts it.
    pub fn char_count(&self) -> usize {
        let criterion = self.criterion.chars().count();
        let cues = self
            .candidates
            .iter()
            .flat_map(|entry| entry.cues.iter())
            .map(|(_, text)| text.chars().count())
            .sum::<usize>();
        criterion + cues
    }
}

/// What the model is allowed to say about one candidate: one sentence, and the
/// cue indices that sentence rests on.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Ranking {
    pub candidate: u64,
    pub reason: String,
    pub cues: Vec<usize>,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct Answer {
    pub order: Vec<Ranking>,
}

/// The one thing a model client can do.
pub trait ModelClient {
    /// The models the server says it serves. Empty when it does not say.
    fn models(&self) -> Result<Vec<String>, ProviderError>;

    /// Rank a shortlist for the criterion and say why, per candidate.
    fn rank(&self, shortlist: &Shortlist) -> Result<Answer, ProviderError>;
}

/// Where a key comes from. A trait so that no test depends on a running secret
/// service, and so that the production path is the only one that touches it.
pub trait KeyStore {
    fn get(&self, provider: CloudProvider) -> Result<Option<String>, ProviderError>;
    fn set(&mut self, provider: CloudProvider, key: &str) -> Result<(), ProviderError>;
    fn clear(&mut self, provider: CloudProvider) -> Result<(), ProviderError>;
}

/// An in-memory key store. The tests use this; the application never does.
#[derive(Debug, Default)]
pub struct MemoryKeyStore {
    keys: HashMap<CloudProvider, String>,
}

impl MemoryKeyStore {
    pub fn new() -> Self {
        Self::default()
    }
}

impl KeyStore for MemoryKeyStore {
    fn get(&self, provider: CloudProvider) -> Result<Option<String>, ProviderError> {
        Ok(self.keys.get(&provider).cloned())
    }

    fn set(&mut self, provider: CloudProvider, key: &str) -> Result<(), ProviderError> {
        self.keys.insert(provider, key.to_string());
        Ok(())
    }

    fn clear(&mut self, provider: CloudProvider) -> Result<(), ProviderError> {
        self.keys.remove(&provider);
        Ok(())
    }
}

/// One closed set of ways the model layer can fail. The interface renders these;
/// it never invents a sentence of its own (constitution, article IX).
///
/// No variant may carry a key. That is the point of the type: a failure that
/// repeats the secret in a message or a log is worse than the failure.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum ProviderError {
    /// Nothing answered at that address.
    Unreachable { address: String },
    /// The provider refused the key. The message is the provider's own, redacted.
    Auth { message: String },
    /// Rate-limited or temporarily unavailable.
    Busy { retry_after_ms: u64 },
    /// The answer was not the shape that was asked for.
    MalformedAnswer { detail: String },
    /// An index the candidate does not contain, or a candidate that was not sent.
    InvalidIndex { candidate: u64, index: usize },
    /// The payload no longer matches what the user confirmed.
    Unconfirmed,
    /// Cloud mode with no key stored.
    MissingKey { provider: CloudProvider },
}

impl std::fmt::Display for ProviderError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Unreachable { address } => write!(f, "nothing answered at {address}"),
            Self::Auth { message } => write!(f, "the key was refused: {message}"),
            Self::Busy { retry_after_ms } => {
                write!(f, "the provider was busy; waited {retry_after_ms} ms")
            }
            Self::MalformedAnswer { detail } => write!(f, "the answer was not usable: {detail}"),
            Self::InvalidIndex { candidate, index } => {
                write!(f, "candidate {candidate} does not contain cue {index}")
            }
            Self::Unconfirmed => write!(f, "nothing was sent: the payload changed after confirmation"),
            Self::MissingKey { provider } => write!(f, "no key is stored for {provider:?}"),
        }
    }
}

impl std::error::Error for ProviderError {}

#[cfg(test)]
mod tests {
    use super::*;

    /// A client that answers from a table, and remembers what it was asked.
    #[derive(Default)]
    struct FakeClient {
        asks: std::cell::RefCell<Vec<Shortlist>>,
    }

    impl ModelClient for FakeClient {
        fn models(&self) -> Result<Vec<String>, ProviderError> {
            Ok(vec!["a-model".into()])
        }

        fn rank(&self, shortlist: &Shortlist) -> Result<Answer, ProviderError> {
            self.asks.borrow_mut().push(shortlist.clone());
            Ok(Answer {
                order: shortlist
                    .candidates
                    .iter()
                    .map(|entry| Ranking {
                        candidate: entry.candidate,
                        reason: "it mentions the criterion".into(),
                        cues: entry.cues.iter().map(|(index, _)| *index).collect(),
                    })
                    .collect(),
            })
        }
    }

    fn shortlist() -> Shortlist {
        Shortlist {
            criterion: "kaygı".into(),
            candidates: vec![
                Shortlisted {
                    candidate: 1,
                    cues: vec![(41, "kaygı".into()), (42, "ve endişe".into())],
                },
                Shortlisted {
                    candidate: 2,
                    cues: vec![(88, "yine kaygı".into())],
                },
            ],
            left_out: 3,
        }
    }

    #[test]
    fn a_client_ranks_what_it_was_given() {
        let client = FakeClient::default();

        let answer = client.rank(&shortlist()).expect("the fake always answers");

        assert_eq!(answer.order.len(), 2);
        assert_eq!(answer.order[0].candidate, 1);
        assert_eq!(answer.order[0].cues, vec![41, 42]);
        assert_eq!(client.asks.borrow().len(), 1);
        assert_eq!(client.asks.borrow()[0].left_out, 3);
    }

    #[test]
    fn the_payload_is_counted_the_way_the_confirmation_counts_it() {
        let list = shortlist();

        assert_eq!(list.cue_count(), 3);
        // "kaygı" + "kaygı" + "ve endişe" + "yine kaygı".
        assert_eq!(list.char_count(), 5 + 5 + 9 + 10);
    }

    #[test]
    fn the_key_store_round_trips_and_clears() {
        let mut store = MemoryKeyStore::new();

        assert_eq!(store.get(CloudProvider::DeepSeek).unwrap(), None);

        store.set(CloudProvider::DeepSeek, "sk-test").unwrap();
        assert_eq!(
            store.get(CloudProvider::DeepSeek).unwrap(),
            Some("sk-test".to_string())
        );

        store.clear(CloudProvider::DeepSeek).unwrap();
        assert_eq!(store.get(CloudProvider::DeepSeek).unwrap(), None);
    }

    #[test]
    fn a_mode_serialises_with_its_address_and_without_losing_the_default() {
        assert_eq!(Mode::default(), Mode::Heuristic);
        assert_eq!(serde_json::to_string(&Mode::Heuristic).unwrap(), r#"{"mode":"heuristic"}"#);

        let local = Mode::Local(LocalConfig {
            address: "http://127.0.0.1:11434/v1".into(),
            model: "qwen".into(),
        });
        let json = serde_json::to_string(&local).unwrap();
        assert!(json.contains(r#""mode":"local""#), "{json}");
        assert!(json.contains(r#""address":"http://127.0.0.1:11434/v1""#), "{json}");
        assert_eq!(serde_json::from_str::<Mode>(&json).unwrap(), local);

        let cloud = Mode::Cloud(CloudConfig {
            provider: CloudProvider::DeepSeek,
            model: "deepseek-chat".into(),
        });
        let json = serde_json::to_string(&cloud).unwrap();
        assert!(json.contains(r#""provider":"deepSeek""#), "{json}");
        assert_eq!(serde_json::from_str::<Mode>(&json).unwrap(), cloud);
    }

    #[test]
    fn every_failure_says_what_happened() {
        let cases = [
            ProviderError::Unreachable {
                address: "http://127.0.0.1:11434/v1".into(),
            },
            ProviderError::Auth {
                message: "401".into(),
            },
            ProviderError::Busy {
                retry_after_ms: 2_000,
            },
            ProviderError::MalformedAnswer {
                detail: "expected an object".into(),
            },
            ProviderError::InvalidIndex {
                candidate: 2,
                index: 99,
            },
            ProviderError::Unconfirmed,
            ProviderError::MissingKey {
                provider: CloudProvider::DeepSeek,
            },
        ];

        for error in cases {
            let text = error.to_string();
            assert!(!text.is_empty(), "{error:?} has no message");
            assert!(!text.contains("sk-"), "{text} leaked something");
        }
    }
}
