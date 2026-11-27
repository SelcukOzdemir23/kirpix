//! What the budget allows sending.
//!
//! The prompt is built from a shortlist, and the shortlist is built by this
//! module from the deterministic search's own order. Nothing here asks a model
//! what to include: the trim is code, and what it dropped is counted so the
//! interface can say so (constitution, article VI).

use super::{Shortlist, Shortlisted};

/// The most characters the prompt may carry. Roughly four thousand tokens at
/// four characters each, which leaves a one hour recording's best twenty
/// candidates in and keeps the answer's budget separate.
pub const MAX_PROMPT_CHARS: usize = 16_000;

/// The instructions and the JSON shape take room too. Reserving it here keeps
/// the arithmetic honest without this module having to build a prompt.
pub const INSTRUCTION_RESERVE_CHARS: usize = 1_200;

/// How many candidates may travel in one request.
pub const MAX_CANDIDATES: usize = 20;

/// How many cues of one candidate may travel. A two minute candidate at four
/// seconds a line sits well under this; a pathological one is shortened and the
/// truncation is recorded rather than hidden.
pub const MAX_CUES_PER_CANDIDATE: usize = 60;

/// Trim a candidate list to what the budget allows, keeping its order.
///
/// A candidate that does not fit is left out and counted, never sent in part.
pub fn build(criterion: &str, candidates: Vec<Shortlisted>) -> Shortlist {
    let mut budget = MAX_PROMPT_CHARS
        .saturating_sub(INSTRUCTION_RESERVE_CHARS)
        .saturating_sub(criterion.chars().count());

    let mut kept = Vec::new();
    let mut truncated = Vec::new();
    let mut left_out = 0;

    for candidate in candidates {
        let mut cues = candidate.cues;

        if cues.len() > MAX_CUES_PER_CANDIDATE {
            cues.truncate(MAX_CUES_PER_CANDIDATE);
            truncated.push(candidate.candidate);
        }

        let cost: usize = cues.iter().map(|(_, text)| text.chars().count()).sum();

        if kept.len() >= MAX_CANDIDATES || cost > budget {
            left_out += 1;
            continue;
        }

        budget -= cost;
        kept.push(Shortlisted {
            candidate: candidate.candidate,
            cues,
        });
    }

    Shortlist {
        criterion: criterion.to_string(),
        candidates: kept,
        left_out,
        truncated,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::criterion::{self, Bounds};
    use crate::subtitle::{parse_table, read_file};
    use std::path::{Path, PathBuf};

    fn eval(path: &str) -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../eval")
            .join(path)
    }

    fn candidate(id: u64, cues: usize, chars: usize) -> Shortlisted {
        Shortlisted {
            candidate: id,
            cues: (0..cues)
                .map(|index| (index + 1, "x".repeat(chars)))
                .collect(),
        }
    }

    #[test]
    fn the_order_is_kept_and_a_candidate_that_does_not_fit_is_counted() {
        let list = build("kaygı", (1..=30).map(|id| candidate(id, 2, 10)).collect());

        assert_eq!(list.candidates.len(), MAX_CANDIDATES);
        assert_eq!(list.left_out, 30 - MAX_CANDIDATES);
        // The deterministic order decides which ones fit.
        assert_eq!(list.candidates[0].candidate, 1);
        assert_eq!(
            list.candidates[MAX_CANDIDATES - 1].candidate,
            MAX_CANDIDATES as u64
        );
    }

    #[test]
    fn a_candidate_over_the_cue_cap_is_shortened_and_says_so() {
        let list = build("kaygı", vec![candidate(7, 70, 5)]);

        assert_eq!(list.candidates[0].cues.len(), MAX_CUES_PER_CANDIDATE);
        assert_eq!(list.truncated, vec![7]);
    }

    #[test]
    fn the_character_budget_stops_the_list_before_the_candidate_cap_does() {
        // 20 candidates of 5 000 characters is 100 000, well past the budget.
        let list = build(
            "kaygı",
            (1..=20).map(|id| candidate(id, 1, 5_000)).collect(),
        );

        assert!(list.candidates.len() < MAX_CANDIDATES);
        assert!(list.char_count() + INSTRUCTION_RESERVE_CHARS <= MAX_PROMPT_CHARS);
        assert!(list.left_out > 0);
    }

    #[test]
    fn the_fixture_search_fits_the_budget() {
        let path = eval("fixtures/tr-tedx-kaygi.srt");
        if !path.is_file() {
            crate::testing::skip("the subtitle fixture is not present");
            return;
        }

        let (text, encoding) = read_file(&path).expect("the fixture should decode");
        let table = parse_table(&text, encoding.as_str());
        let found = criterion::find(
            &table,
            &["kaygı".to_string(), "endişe".to_string()],
            Bounds {
                min_ms: 8_000,
                max_ms: 120_000,
            },
            table.last_end_ms(),
        )
        .expect("the fixture should produce candidates");

        let candidates: Vec<Shortlisted> = found
            .iter()
            .map(|candidate| Shortlisted {
                candidate: candidate.id as u64,
                cues: (candidate.start_cue..=candidate.end_cue)
                    .filter_map(|index| table.cue(index))
                    .map(|cue| (cue.index, cue.text.clone()))
                    .collect(),
            })
            .collect();
        let offered = candidates.len();

        let list = build("kaygı, endişe", candidates);

        assert!(
            !list.candidates.is_empty(),
            "the fixture should keep something"
        );
        assert!(
            list.candidates.len() + list.left_out == offered,
            "every candidate is either sent or counted"
        );
        assert!(
            list.char_count() + INSTRUCTION_RESERVE_CHARS <= MAX_PROMPT_CHARS,
            "{} characters of cues",
            list.char_count()
        );
    }
}
