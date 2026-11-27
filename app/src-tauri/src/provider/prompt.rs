//! The one prompt.
//!
//! A model is shown the criterion, the candidate ids, and the cues with their
//! line numbers. It is never shown a timecode, a path or a duration, and the
//! instruction says so twice: once as a rule, once as a reminder that line
//! numbers are the only coordinates it has (constitution, article V).

use super::Shortlist;

/// How many characters a reason may take. Enforced when the answer is read.
pub const MAX_REASON_CHARS: usize = 240;

/// A rough token count for the budget, not a tokeniser. Four characters per
/// token is the usual rule of thumb for this kind of prose, and it errs high for
/// Turkish, which is what a budget wants.
pub fn estimate_tokens(text: &str) -> usize {
    (text.chars().count() / 4) + 1
}

/// Build the prompt for one request.
pub fn build(shortlist: &Shortlist) -> String {
    let mut prompt = String::with_capacity(2_048);

    prompt.push_str("Rank the candidate passages below for one criterion.\n\n");
    prompt.push_str("Criterion: ");
    prompt.push_str(&shortlist.criterion);
    prompt.push_str("\n\n");

    prompt.push_str(
        "Each candidate is a set of subtitle lines. A line is written as #<number> followed by \
         its text; the number is that line's index in the recording.\n\n",
    );

    for candidate in &shortlist.candidates {
        prompt.push_str(&format!("[candidate {}]\n", candidate.candidate));
        for (index, text) in &candidate.cues {
            prompt.push_str(&format!("#{index} {text}\n"));
        }
        prompt.push('\n');
    }

    prompt.push_str("Answer with JSON only, in exactly this shape:\n");
    prompt.push_str(r#"{"order":[{"candidate":1,"reason":"...","cues":[1,2]}]}"#);
    prompt.push_str("\n\nRules:\n");
    prompt.push_str(
        "- Put every candidate you were given into the order, best first for the criterion.\n",
    );
    prompt.push_str(&format!(
        "- Give one reason sentence per candidate, at most {MAX_REASON_CHARS} characters, in the \
         language of the subtitle text.\n"
    ));
    prompt.push_str("- Cite only line numbers that appear under that candidate.\n");
    prompt.push_str(
        "- Never write a timecode or a duration. The line numbers are the only coordinates.\n",
    );
    prompt.push_str("- Do not invent candidates, and do not leave one out.\n");

    prompt
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::provider::{shortlist, Shortlisted, MAX_PROMPT_CHARS_FOR_TEST};

    fn list() -> Shortlist {
        Shortlist {
            criterion: "kaygı".into(),
            candidates: vec![
                Shortlisted {
                    candidate: 1,
                    cues: vec![(41, "kaygı duyuyorum".into()), (42, "ve endişe".into())],
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

    /// A timecode looks like `1:23` or `01:23:45`. The prompt must not contain
    /// one, because a model that sees one will start answering with them.
    fn contains_timecode(text: &str) -> bool {
        let bytes: Vec<char> = text.chars().collect();
        let mut run = 0;
        for (index, ch) in bytes.iter().enumerate() {
            if ch.is_ascii_digit() {
                run += 1;
                continue;
            }
            if *ch == ':' && (1..=2).contains(&run) {
                // Two digits after the colon and a digit before it: a timecode.
                if bytes
                    .get(index + 1)
                    .is_some_and(|next| next.is_ascii_digit())
                    && bytes
                        .get(index + 2)
                        .is_some_and(|next| next.is_ascii_digit())
                {
                    return true;
                }
            }
            run = 0;
        }
        false
    }

    #[test]
    fn the_prompt_names_the_criterion_and_every_cue() {
        let prompt = build(&list());

        assert!(prompt.contains("Criterion: kaygı"));
        assert!(prompt.contains("[candidate 1]"));
        assert!(prompt.contains("#41 kaygı duyuyorum"));
        assert!(prompt.contains("[candidate 2]"));
        assert!(prompt.contains("#88 yine kaygı"));
    }

    #[test]
    fn the_prompt_carries_no_timecode_and_no_path() {
        let prompt = build(&list());

        assert!(!contains_timecode(&prompt), "the prompt carries a timecode");
        assert!(!prompt.contains('/'), "the prompt carries a path separator");
        assert!(!prompt.contains(".mp4"));
        assert!(!prompt.contains(".mkv"));
    }

    #[test]
    fn the_fixture_prompt_stays_under_the_budget() {
        let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../eval/fixtures/tr-tedx-kaygi.srt");
        if !path.is_file() {
            eprintln!("skipped: the subtitle fixture is not present");
            return;
        }

        let (text, encoding) = crate::subtitle::read_file(&path).expect("the fixture decodes");
        let table = crate::subtitle::parse_table(&text, encoding.as_str());
        let found = crate::criterion::find(
            &table,
            &["kaygı".to_string(), "endişe".to_string()],
            crate::criterion::Bounds {
                min_ms: 8_000,
                max_ms: 120_000,
            },
            table.last_end_ms(),
        )
        .expect("the fixture produces candidates");

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

        let prompt = build(&shortlist::build("kaygı, endişe", candidates));

        assert!(
            prompt.chars().count() <= MAX_PROMPT_CHARS_FOR_TEST,
            "the prompt is {} characters",
            prompt.chars().count()
        );
        assert!(
            estimate_tokens(&prompt) <= 4_000,
            "{} tokens",
            estimate_tokens(&prompt)
        );
        assert!(!contains_timecode(&prompt));
    }
}
