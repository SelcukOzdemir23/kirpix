//! The confirmation gate.
//!
//! Nothing leaves the machine until the user has agreed to a specific payload:
//! this mode, this model, this many lines, this many characters. The gate is
//! what makes that a rule rather than a dialog someone remembers to show
//! (feature 004, FR-005).

use super::{Answer, Mode, ModelClient, ProviderError, Shortlist};

/// What the user agreed to. Built by the interface from the facts the
/// application stated; compared here against the payload that is actually built.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Confirmation {
    pub mode: Mode,
    pub cue_count: usize,
    pub char_count: usize,
}

impl Confirmation {
    /// The confirmation for a shortlist, as the dialog would state it.
    pub fn of(mode: &Mode, shortlist: &Shortlist) -> Self {
        Self {
            mode: mode.clone(),
            cue_count: shortlist.cue_count(),
            char_count: shortlist.char_count(),
        }
    }
}

/// Refuse unless the payload is the one that was confirmed.
pub fn check(
    confirmation: &Confirmation,
    shortlist: &Shortlist,
    mode: &Mode,
) -> Result<(), ProviderError> {
    if &confirmation.mode != mode
        || confirmation.cue_count != shortlist.cue_count()
        || confirmation.char_count != shortlist.char_count()
    {
        return Err(ProviderError::Unconfirmed);
    }
    Ok(())
}

/// The only path a model call may take from the application.
///
/// The gate runs first, so a payload that changed after the dialog opened never
/// reaches a client at all.
pub fn rank_confirmed(
    client: &dyn ModelClient,
    shortlist: &Shortlist,
    mode: &Mode,
    confirmation: &Confirmation,
) -> Result<Answer, ProviderError> {
    check(confirmation, shortlist, mode)?;
    client.rank(shortlist)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::provider::{CloudConfig, CloudProvider, LocalConfig, Shortlisted};
    use std::cell::RefCell;

    struct CountingClient {
        calls: RefCell<usize>,
    }

    impl ModelClient for CountingClient {
        fn models(&self) -> Result<Vec<String>, ProviderError> {
            Ok(vec![])
        }

        fn rank(&self, _shortlist: &Shortlist) -> Result<Answer, ProviderError> {
            *self.calls.borrow_mut() += 1;
            Ok(Answer::default())
        }
    }

    fn local_mode() -> Mode {
        Mode::Local(LocalConfig {
            address: "http://127.0.0.1:11434/v1".into(),
            model: "qwen".into(),
        })
    }

    fn shortlist() -> Shortlist {
        Shortlist {
            criterion: "kaygı".into(),
            candidates: vec![Shortlisted {
                candidate: 1,
                cues: vec![(41, "kaygı".into()), (42, "ve endişe".into())],
            }],
            left_out: 0,
            truncated: vec![],
        }
    }

    #[test]
    fn the_confirmed_payload_goes_through() {
        let mode = local_mode();
        let list = shortlist();
        let client = CountingClient {
            calls: RefCell::new(0),
        };

        let confirmation = Confirmation::of(&mode, &list);
        rank_confirmed(&client, &list, &mode, &confirmation)
            .expect("the confirmed payload is sent");

        assert_eq!(*client.calls.borrow(), 1);
    }

    #[test]
    fn a_payload_that_changed_after_the_dialog_never_reaches_the_client() {
        let mode = local_mode();
        let list = shortlist();
        let client = CountingClient {
            calls: RefCell::new(0),
        };

        let mut confirmation = Confirmation::of(&mode, &list);
        confirmation.char_count += 1;

        let error = rank_confirmed(&client, &list, &mode, &confirmation).unwrap_err();

        assert_eq!(error, ProviderError::Unconfirmed);
        assert_eq!(*client.calls.borrow(), 0, "nothing was sent");
    }

    #[test]
    fn a_different_cue_count_is_refused() {
        let mode = local_mode();
        let list = shortlist();
        let mut confirmation = Confirmation::of(&mode, &list);
        confirmation.cue_count = 99;

        assert_eq!(
            check(&confirmation, &list, &mode),
            Err(ProviderError::Unconfirmed)
        );
    }

    #[test]
    fn a_different_mode_is_refused() {
        let list = shortlist();
        let confirmed = local_mode();

        // Same shortlist, but the user changed the address before sending: the
        // dialog they agreed to no longer describes what would happen.
        let changed = Mode::Local(LocalConfig {
            address: "http://192.0.2.10:11434/v1".into(),
            model: "qwen".into(),
        });

        let confirmation = Confirmation::of(&confirmed, &list);
        assert_eq!(
            check(&confirmation, &list, &changed),
            Err(ProviderError::Unconfirmed)
        );
    }

    #[test]
    fn a_different_model_is_refused() {
        let list = shortlist();
        let cloud = Mode::Cloud(CloudConfig {
            provider: CloudProvider::DeepSeek,
            model: "deepseek-chat".into(),
        });
        let other = Mode::Cloud(CloudConfig {
            provider: CloudProvider::DeepSeek,
            model: "deepseek-reasoner".into(),
        });

        let confirmation = Confirmation::of(&cloud, &list);
        assert_eq!(
            check(&confirmation, &list, &other),
            Err(ProviderError::Unconfirmed)
        );
    }
}
