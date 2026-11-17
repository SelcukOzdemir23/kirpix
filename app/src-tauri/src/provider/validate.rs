//! Reading what a model answered.
//!
//! An answer is only worth showing if every part of it can be grounded in the
//! shortlist that was sent: a candidate that was asked about, cue indices that
//! candidate actually contains, and one bounded sentence. Everything else is a
//! named failure rather than a guess (constitution, article IX).

use serde::Deserialize;

use super::prompt::MAX_REASON_CHARS;
use super::{Answer, ProviderError, Ranking, Shortlist};

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct WireAnswer {
    order: Vec<WireRanking>,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct WireRanking {
    candidate: u64,
    reason: String,
    cues: Vec<usize>,
}

/// Parse a model's answer and hold it against the shortlist it claims to explain.
///
/// Two decisions worth naming:
///
/// - A ranking for a candidate that was never sent is dropped, as the spec says.
///   A model that invents an id has still answered about the others.
/// - A candidate the answer leaves out is allowed to stay unexplained. The row
///   keeps its term evidence, and one missing sentence is not a reason to throw
///   away the sentences that were grounded.
pub fn read(shortlist: &Shortlist, raw: &str) -> Result<Answer, ProviderError> {
    let parsed: WireAnswer =
        serde_json::from_str(raw).map_err(|err| ProviderError::MalformedAnswer {
            detail: err.to_string(),
        })?;

    let mut order: Vec<Ranking> = Vec::with_capacity(parsed.order.len());

    for wire in parsed.order {
        let Some(sent) = shortlist
            .candidates
            .iter()
            .find(|candidate| candidate.candidate == wire.candidate)
        else {
            // Never asked about: ignored.
            continue;
        };

        // A repeated candidate keeps its first ranking.
        if order.iter().any(|kept| kept.candidate == wire.candidate) {
            continue;
        }

        let reason = wire.reason.trim().to_string();
        if reason.is_empty() {
            return Err(ProviderError::MalformedAnswer {
                detail: format!("candidate {} came back without a reason", wire.candidate),
            });
        }
        if reason.chars().count() > MAX_REASON_CHARS {
            return Err(ProviderError::MalformedAnswer {
                detail: format!(
                    "candidate {} has a {} character reason, over the {MAX_REASON_CHARS} allowed",
                    wire.candidate,
                    reason.chars().count()
                ),
            });
        }

        if wire.cues.is_empty() {
            return Err(ProviderError::MalformedAnswer {
                detail: format!("candidate {} cites no line", wire.candidate),
            });
        }

        for index in &wire.cues {
            if !sent.cues.iter().any(|(cue, _)| cue == index) {
                return Err(ProviderError::InvalidIndex {
                    candidate: wire.candidate,
                    index: *index,
                });
            }
        }

        order.push(Ranking {
            candidate: wire.candidate,
            reason,
            cues: wire.cues,
        });
    }

    if order.is_empty() {
        return Err(ProviderError::MalformedAnswer {
            detail: "no usable ranking came back".into(),
        });
    }

    Ok(Answer { order })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::provider::Shortlisted;

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
            left_out: 0,
            truncated: vec![],
        }
    }

    #[test]
    fn a_grounded_answer_is_read_in_the_order_it_arrived() {
        let raw = r#"{"order":[
            {"candidate":2,"reason":"like this one","cues":[88]},
            {"candidate":1,"reason":"also good","cues":[41,42]}
        ]}"#;

        let answer = read(&shortlist(), raw).expect("a grounded answer is usable");

        assert_eq!(answer.order.len(), 2);
        assert_eq!(answer.order[0].candidate, 2);
        assert_eq!(answer.order[0].reason, "like this one");
        assert_eq!(answer.order[1].cues, vec![41, 42]);
    }

    #[test]
    fn a_line_the_candidate_does_not_have_is_refused() {
        let raw = r#"{"order":[{"candidate":1,"reason":"ok","cues":[41,99]}]}"#;

        let error = read(&shortlist(), raw).unwrap_err();

        assert_eq!(
            error,
            ProviderError::InvalidIndex {
                candidate: 1,
                index: 99
            }
        );
    }

    #[test]
    fn an_answer_for_a_candidate_that_was_never_sent_is_dropped() {
        let raw = r#"{"order":[
            {"candidate":9,"reason":"invented","cues":[1]},
            {"candidate":1,"reason":"real","cues":[41]}
        ]}"#;

        let answer = read(&shortlist(), raw).expect("the real ranking survives");

        assert_eq!(answer.order.len(), 1);
        assert_eq!(answer.order[0].candidate, 1);
    }

    #[test]
    fn prose_instead_of_json_is_a_named_failure() {
        let error = read(&shortlist(), "I think candidate 1 is best.").unwrap_err();

        assert!(matches!(error, ProviderError::MalformedAnswer { .. }));
    }

    #[test]
    fn an_unknown_field_is_refused_rather_than_ignored() {
        let raw = r#"{"order":[{"candidate":1,"reason":"ok","cues":[41],"score":0.9}]}"#;

        let error = read(&shortlist(), raw).unwrap_err();

        assert!(matches!(error, ProviderError::MalformedAnswer { .. }));
    }

    #[test]
    fn a_reason_that_is_empty_or_too_long_is_refused() {
        let empty = r#"{"order":[{"candidate":1,"reason":"   ","cues":[41]}]}"#;
        assert!(matches!(
            read(&shortlist(), empty).unwrap_err(),
            ProviderError::MalformedAnswer { .. }
        ));

        let long = format!(
            r#"{{"order":[{{"candidate":1,"reason":"{}","cues":[41]}}]}}"#,
            "x".repeat(MAX_REASON_CHARS + 1)
        );
        assert!(matches!(
            read(&shortlist(), &long).unwrap_err(),
            ProviderError::MalformedAnswer { .. }
        ));
    }

    #[test]
    fn a_ranking_with_no_line_is_refused() {
        let raw = r#"{"order":[{"candidate":1,"reason":"ok","cues":[]}]}"#;

        assert!(matches!(
            read(&shortlist(), raw).unwrap_err(),
            ProviderError::MalformedAnswer { .. }
        ));
    }

    #[test]
    fn an_empty_answer_is_a_failure_and_a_partial_one_is_not() {
        assert!(matches!(
            read(&shortlist(), r#"{"order":[]}"#).unwrap_err(),
            ProviderError::MalformedAnswer { .. }
        ));

        // One of two candidates explained: the sentence is kept, the other row
        // keeps its term evidence.
        let partial = r#"{"order":[{"candidate":1,"reason":"ok","cues":[41]}]}"#;
        let answer = read(&shortlist(), partial).expect("a partial answer is usable");
        assert_eq!(answer.order.len(), 1);
    }

    #[test]
    fn a_repeated_candidate_keeps_its_first_ranking() {
        let raw = r#"{"order":[
            {"candidate":1,"reason":"first","cues":[41]},
            {"candidate":1,"reason":"second","cues":[42]}
        ]}"#;

        let answer = read(&shortlist(), raw).expect("the first ranking wins");

        assert_eq!(answer.order.len(), 1);
        assert_eq!(answer.order[0].reason, "first");
    }
}
