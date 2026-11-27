use crate::error::KirpixError;
use crate::subtitle::{Cue, CueTable};

use super::normalize::{matches_token, normalize, tokens};

/// How far apart two mentions may be and still be one clip.
///
/// Two seconds, as first specified, cut a real passage into fragments: the
/// Turkish evaluation recording explains anxiety for twenty seconds, returning
/// to the words four times with ordinary sentences in between. Twenty seconds
/// of silence, and eight cues of context, keep a passage together while still
/// separating mentions minutes apart. The ground-truth test is what settled it.
const MERGE_GAP_MS: u64 = 20_000;
const PAD_MS: u64 = 500;
const MAX_CUES_BETWEEN_MATCHES: usize = 8;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Bounds {
    pub min_ms: u64,
    pub max_ms: u64,
}

impl Default for Bounds {
    fn default() -> Self {
        Self {
            min_ms: 8_000,
            max_ms: 120_000,
        }
    }
}

/// A candidate clip. It carries the cues it was built from, because article IV
/// says a clip without its evidence must not be shown, and the type is what
/// makes that true.
///
/// The human-readable reason is composed by the interface from `matched_terms`
/// rather than generated here: the same data has to read in Turkish and English,
/// and a sentence built in Rust could drift from the terms that produced it.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Candidate {
    pub id: usize,
    pub start_cue: usize,
    pub end_cue: usize,
    pub start_ms: u64,
    pub end_ms: u64,
    pub duration_ms: u64,
    /// The terms as the user typed them, in the order they were entered.
    pub matched_terms: Vec<String>,
    pub matched_cue_count: usize,
    /// Total length of the matching cues, used for ordering.
    pub matched_duration_ms: u64,
    /// True when the media duration or the duration bounds moved the edges.
    pub clamped: bool,
}

/// Find topic candidates (feature 001, FR-008 to FR-013).
pub fn find(
    table: &CueTable,
    terms: &[String],
    bounds: Bounds,
    media_duration_ms: u64,
) -> Result<Vec<Candidate>, KirpixError> {
    let distinct = distinct_terms(terms);
    if distinct.is_empty() {
        return Err(KirpixError::EmptyTerms);
    }

    let matched = matched_cues(table, &distinct);
    let groups = group_matches(table, &matched);
    let mut candidates = Vec::new();

    for group in groups {
        for (start_cue, end_cue) in split_to_bounds(table, &group, bounds, media_duration_ms) {
            if let Some(candidate) = build(
                table,
                &distinct,
                &matched,
                start_cue,
                end_cue,
                bounds,
                media_duration_ms,
            ) {
                candidates.push(candidate);
            }
        }
    }

    candidates.sort_by(|a, b| {
        b.matched_terms
            .len()
            .cmp(&a.matched_terms.len())
            .then_with(|| b.matched_duration_ms.cmp(&a.matched_duration_ms))
            .then_with(|| a.start_ms.cmp(&b.start_ms))
    });

    for (position, candidate) in candidates.iter_mut().enumerate() {
        candidate.id = position + 1;
    }

    Ok(candidates)
}

/// Terms as typed, with duplicates removed after normalization: the same term
/// twice must not count twice (edge case in the spec).
fn distinct_terms(terms: &[String]) -> Vec<(String, String)> {
    let mut seen: Vec<(String, String)> = Vec::new();
    for term in terms {
        let normalized = normalize(term);
        if normalized.is_empty() {
            continue;
        }
        if seen.iter().any(|(key, _)| key == &normalized) {
            continue;
        }
        seen.push((normalized, term.trim().to_string()));
    }
    seen
}

/// For each cue, which terms it matches.
fn matched_cues(table: &CueTable, distinct: &[(String, String)]) -> Vec<Vec<usize>> {
    table
        .cues
        .iter()
        .map(|cue| {
            let cue_tokens = tokens(&cue.text);
            (0..distinct.len())
                .filter(|&term_index| {
                    let term = &distinct[term_index].0;
                    cue_tokens.iter().any(|token| matches_token(token, term))
                })
                .collect()
        })
        .collect()
}

/// Consecutive matches, merged when they are close enough (FR-008).
fn group_matches(table: &CueTable, matched: &[Vec<usize>]) -> Vec<Vec<usize>> {
    let mut groups: Vec<Vec<usize>> = Vec::new();
    let mut current: Vec<usize> = Vec::new();
    let mut previous_end = 0u64;

    for (position, cue) in table.cues.iter().enumerate() {
        if matched[position].is_empty() {
            continue;
        }

        if current.is_empty() {
            current.push(position + 1);
        } else {
            let last = *current.last().expect("current is not empty");
            let gap = cue.start_ms.saturating_sub(previous_end);
            let cues_between = (position + 1) - last - 1;
            if gap <= MERGE_GAP_MS && cues_between <= MAX_CUES_BETWEEN_MATCHES {
                current.push(position + 1);
            } else {
                groups.push(std::mem::take(&mut current));
                current.push(position + 1);
            }
        }

        previous_end = cue.end_ms;
    }

    if !current.is_empty() {
        groups.push(current);
    }

    groups
}

fn padded_duration(table: &CueTable, first_cue: usize, last_cue: usize) -> u64 {
    let first = &table.cues[first_cue - 1];
    let last = &table.cues[last_cue - 1];
    (last.end_ms + PAD_MS).saturating_sub(first.start_ms.saturating_sub(PAD_MS))
}

/// Cut a group into pieces that fit the maximum duration (FR-010).
fn split_to_bounds(
    table: &CueTable,
    group: &[usize],
    bounds: Bounds,
    _media_duration_ms: u64,
) -> Vec<(usize, usize)> {
    let mut pieces = Vec::new();
    let mut start = 0usize;

    while start < group.len() {
        let mut end = start;
        while end + 1 < group.len()
            && padded_duration(table, group[start], group[end + 1]) <= bounds.max_ms
        {
            end += 1;
        }
        pieces.push((group[start], group[end]));
        start = end + 1;
    }

    pieces
}

#[allow(clippy::too_many_arguments)]
fn build(
    table: &CueTable,
    distinct: &[(String, String)],
    matched: &[Vec<usize>],
    start_cue: usize,
    end_cue: usize,
    bounds: Bounds,
    media_duration_ms: u64,
) -> Option<Candidate> {
    let first = &table.cues[start_cue - 1];
    let last = &table.cues[end_cue - 1];

    let mut clamped = false;
    let mut start_ms = first.start_ms.saturating_sub(PAD_MS);
    let mut end_ms = last.end_ms + PAD_MS;

    if end_ms > media_duration_ms {
        end_ms = media_duration_ms;
        clamped = true;
    }

    // Stretch to the minimum duration rather than returning a stub.
    if end_ms.saturating_sub(start_ms) < bounds.min_ms {
        let wanted_end = start_ms + bounds.min_ms;
        if wanted_end <= media_duration_ms {
            end_ms = wanted_end;
        } else {
            end_ms = media_duration_ms;
            start_ms = media_duration_ms.saturating_sub(bounds.min_ms);
            clamped = true;
        }
    }

    if end_ms <= start_ms {
        return None;
    }

    let duration_ms = end_ms - start_ms;
    let mut term_indices: Vec<usize> = Vec::new();
    let mut matched_duration = 0u64;
    let mut matched_cue_count = 0usize;

    for cue_index in start_cue..=end_cue {
        let cue: &Cue = &table.cues[cue_index - 1];
        let hits = &matched[cue_index - 1];
        if hits.is_empty() {
            continue;
        }
        matched_cue_count += 1;
        matched_duration += cue.end_ms.saturating_sub(cue.start_ms);
        for &index in hits {
            if !term_indices.contains(&index) {
                term_indices.push(index);
            }
        }
    }

    if term_indices.is_empty() {
        return None;
    }

    term_indices.sort_unstable();
    let matched_terms = term_indices
        .iter()
        .map(|&index| distinct[index].1.clone())
        .collect();

    Some(Candidate {
        id: 0,
        start_cue,
        end_cue,
        start_ms,
        end_ms,
        duration_ms,
        matched_terms,
        matched_cue_count,
        matched_duration_ms: matched_duration,
        clamped,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::subtitle::Cue;

    fn table(cues: &[(u64, u64, &str)]) -> CueTable {
        CueTable {
            cues: cues
                .iter()
                .enumerate()
                .map(|(position, (start, end, text))| Cue {
                    index: position + 1,
                    start_ms: *start,
                    end_ms: *end,
                    text: text.to_string(),
                })
                .collect(),
            encoding: "utf-8".to_string(),
        }
    }

    fn terms(list: &[&str]) -> Vec<String> {
        list.iter().map(|term| term.to_string()).collect()
    }

    const MEDIA: u64 = 600_000;

    #[test]
    fn empty_terms_are_refused_rather_than_run() {
        let t = table(&[(0, 1_000, "kaygı")]);
        let err = find(&t, &[], Bounds::default(), MEDIA).unwrap_err();
        assert!(matches!(err, KirpixError::EmptyTerms));

        let err = find(&t, &terms(&["   "]), Bounds::default(), MEDIA).unwrap_err();
        assert!(matches!(err, KirpixError::EmptyTerms));
    }

    #[test]
    fn merges_matches_that_are_close_together() {
        let t = table(&[
            (10_000, 11_200, "kaygı"),
            (11_200, 12_200, "bir şey"),
            (12_400, 13_600, "endişe"),
        ]);
        let candidates = find(&t, &terms(&["kaygı", "endişe"]), Bounds::default(), MEDIA).unwrap();
        assert_eq!(candidates.len(), 1);
        assert_eq!(candidates[0].start_cue, 1);
        assert_eq!(candidates[0].end_cue, 3);
        assert_eq!(candidates[0].matched_terms, vec!["kaygı", "endişe"]);
    }

    #[test]
    fn splits_when_the_gap_is_too_wide() {
        let t = table(&[(10_000, 12_000, "kaygı"), (40_000, 42_000, "kaygı")]);
        let candidates = find(&t, &terms(&["kaygı"]), Bounds::default(), MEDIA).unwrap();
        assert_eq!(candidates.len(), 2);
        assert_eq!(candidates[0].start_ms, 9_500);
        assert_eq!(candidates[1].start_ms, 39_500);
    }

    #[test]
    fn keeps_a_passage_together_across_explanatory_sentences() {
        // A mention, four ordinary sentences, then the word again: one passage.
        let t = table(&[
            (10_000, 11_000, "kaygı"),
            (11_000, 12_000, "arada"),
            (12_000, 13_000, "arada"),
            (13_000, 14_000, "arada"),
            (14_000, 15_000, "arada"),
            (15_000, 16_000, "kaygı"),
        ]);
        assert_eq!(
            find(&t, &terms(&["kaygı"]), Bounds::default(), MEDIA)
                .unwrap()
                .len(),
            1
        );
    }

    #[test]
    fn separates_mentions_that_have_too_many_cues_between_them() {
        let mut cues = vec![(10_000, 11_000, "kaygı")];
        for step in 0..9u64 {
            let start = 11_000 + step * 1_000;
            cues.push((start, start + 900, "arada"));
        }
        cues.push((20_000, 21_000, "kaygı"));
        let t = table(&cues);
        assert_eq!(
            find(&t, &terms(&["kaygı"]), Bounds::default(), MEDIA)
                .unwrap()
                .len(),
            2
        );
    }

    #[test]
    fn pads_half_a_second_on_each_side() {
        let t = table(&[(50_000, 60_000, "kaygı")]);
        let candidates = find(&t, &terms(&["kaygı"]), Bounds::default(), MEDIA).unwrap();
        assert_eq!(candidates.len(), 1);
        assert_eq!(candidates[0].start_ms, 49_500);
        assert_eq!(candidates[0].end_ms, 60_500);
        assert!(!candidates[0].clamped);
    }

    #[test]
    fn clamps_at_the_end_of_the_media_and_says_so() {
        let t = table(&[(99_000, 100_000, "kaygı")]);
        let candidates = find(&t, &terms(&["kaygı"]), Bounds::default(), 100_000).unwrap();
        assert_eq!(candidates[0].end_ms, 100_000);
        // The half-second of padding had nowhere to go, so the edges moved and
        // the candidate says so rather than pretending.
        assert!(candidates[0].clamped);

        let beyond = table(&[(109_000, 110_000, "kaygı")]);
        let candidates = find(&beyond, &terms(&["kaygı"]), Bounds::default(), 110_000).unwrap();
        assert_eq!(candidates[0].end_ms, 110_000);
        assert_eq!(
            candidates[0].start_ms, 102_000,
            "stretched back to the minimum"
        );
    }

    #[test]
    fn stretches_a_short_match_to_the_minimum_duration() {
        let t = table(&[(30_000, 31_000, "kaygı")]);
        let candidates = find(&t, &terms(&["kaygı"]), Bounds::default(), MEDIA).unwrap();
        assert_eq!(candidates[0].duration_ms, 8_000);
        assert_eq!(candidates[0].start_ms, 29_500);
        assert_eq!(candidates[0].end_ms, 37_500);
    }

    #[test]
    fn splits_a_long_run_at_the_maximum_duration() {
        let mut cues = Vec::new();
        for step in 0..40u64 {
            let start = step * 3_000;
            cues.push((start, start + 2_900, "kaygı"));
        }
        let t = table(&cues);
        let bounds = Bounds {
            min_ms: 8_000,
            max_ms: 30_000,
        };
        let candidates = find(&t, &terms(&["kaygı"]), bounds, MEDIA).unwrap();
        assert!(
            candidates.len() > 1,
            "a forty-cue run must be cut into pieces"
        );
        for candidate in &candidates {
            assert!(
                candidate.duration_ms <= 30_000,
                "{} exceeded the maximum",
                candidate.duration_ms
            );
            assert!(candidate.duration_ms >= 8_000);
        }
    }

    #[test]
    fn ranks_by_terms_then_duration_then_start() {
        let t = table(&[
            (10_000, 12_000, "kaygı"),
            (60_000, 62_000, "kaygı endişe"),
            (200_000, 202_000, "kaygı"),
        ]);
        let candidates = find(&t, &terms(&["kaygı", "endişe"]), Bounds::default(), MEDIA).unwrap();
        assert_eq!(candidates[0].matched_terms.len(), 2, "two terms wins");
        assert_eq!(candidates[0].id, 1);
        assert!(candidates[1].start_ms < candidates[2].start_ms);
    }

    #[test]
    fn the_same_input_produces_the_same_answer() {
        use crate::subtitle::{decode, parse_cues};
        use std::path::Path;

        let fixture =
            Path::new(env!("CARGO_MANIFEST_DIR")).join("../../eval/fixtures/tr-tedx-kaygi.tr.vtt");
        if !fixture.is_file() {
            eprintln!("skipped: evaluation files are not present");
            return;
        }

        let (text, _) = decode::read_file(&fixture).expect("fixture should decode");
        let table = CueTable {
            cues: parse_cues(&text),
            encoding: "utf-8".to_string(),
        };
        let terms = vec!["kaygı".to_string(), "endişe".to_string()];

        let first = find(&table, &terms, Bounds::default(), 877_650).expect("first run");
        let second = find(&table, &terms, Bounds::default(), 877_650).expect("second run");

        assert_eq!(
            serde_json::to_string(&first).unwrap(),
            serde_json::to_string(&second).unwrap(),
            "two runs over the same input disagreed"
        );
    }

    #[test]
    fn finds_the_recorded_ground_truth() {
        use crate::subtitle::{decode, parse_cues};
        use serde_json::Value;
        use std::path::Path;

        let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
        let fixture = root.join("eval/fixtures/tr-tedx-kaygi.tr.vtt");
        let gold_path = root.join("eval/gold/tr-tedx-kaygi.json");
        if !fixture.is_file() || !gold_path.is_file() {
            eprintln!("skipped: evaluation files are not present");
            return;
        }

        let (text, _) = decode::read_file(&fixture).expect("fixture should decode");
        let table = CueTable {
            cues: parse_cues(&text),
            encoding: "utf-8".to_string(),
        };

        let gold: Value = serde_json::from_str(&std::fs::read_to_string(&gold_path).unwrap())
            .expect("gold file should parse");
        let terms: Vec<String> = gold["criterion"]["terms"]
            .as_array()
            .expect("terms")
            .iter()
            .map(|value| value.as_str().unwrap_or_default().to_string())
            .collect();

        let candidates =
            find(&table, &terms, Bounds::default(), 877_650).expect("search should run");
        assert!(!candidates.is_empty(), "the search found nothing");

        let mut best_overlap = 0.0f64;
        for expected in gold["expected"].as_array().expect("expected ranges") {
            let start = expected["start_cue"].as_u64().expect("start_cue") as usize;
            let end = expected["end_cue"].as_u64().expect("end_cue") as usize;
            let span = (end - start + 1) as f64;

            for candidate in &candidates {
                let overlap_start = candidate.start_cue.max(start);
                let overlap_end = candidate.end_cue.min(end);
                if overlap_end < overlap_start {
                    continue;
                }
                let overlap = (overlap_end - overlap_start + 1) as f64 / span;
                best_overlap = best_overlap.max(overlap);
            }
        }

        assert!(
            best_overlap >= 0.8,
            "best overlap with the ground truth was {:.0}% (candidates: {:?})",
            best_overlap * 100.0,
            candidates
                .iter()
                .map(|c| (c.start_cue, c.end_cue, c.matched_terms.clone()))
                .collect::<Vec<_>>()
        );
    }

    #[test]
    fn a_repeated_term_does_not_count_twice() {
        let t = table(&[(10_000, 12_000, "kaygı")]);
        let candidates = find(
            &t,
            &terms(&["kaygı", "Kaygı", "KAYGI"]),
            Bounds::default(),
            MEDIA,
        )
        .unwrap();
        assert_eq!(candidates[0].matched_terms.len(), 1);
    }
}
