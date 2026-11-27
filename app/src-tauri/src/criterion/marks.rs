//! Where in a line the search terms matched, so the interface can mark the
//! words the search actually found (feature 007, FR-008).
//!
//! The interface cannot work this out itself: normalisation folds Turkish case
//! and circumflexes and turns punctuation into separators, so "ENDİŞESİ" in a
//! line matches the term "endişe" only after rules that live here. This module
//! walks the original text word by word, normalises each word with the same
//! function the search uses, and reports the words that match. There is no
//! second rule to drift from the first.

use super::normalize::{matches_token, normalize};

/// A marked span of a line, as `[start, end)` in UTF-16 code units, the unit
/// JavaScript indexes strings by.
pub type Span = (usize, usize);

/// True when the character belongs to a word rather than separating words,
/// judged the way [`normalize`] judges it. Combining marks (U+0300–U+036F)
/// carry no letter of their own but stay inside the word they modify.
fn is_word_char(ch: char) -> bool {
    if ('\u{0300}'..='\u{036F}').contains(&ch) {
        return true;
    }
    !normalize(ch.encode_utf8(&mut [0; 4])).is_empty()
}

/// Split a line into its words, each with its UTF-16 span.
fn words(text: &str) -> Vec<(Span, &str)> {
    let mut out = Vec::new();
    let mut start: Option<(usize, usize)> = None; // (utf16 offset, byte offset)
    let mut utf16 = 0;

    for (byte, ch) in text.char_indices() {
        let word = is_word_char(ch);
        match (word, start) {
            (true, None) => start = Some((utf16, byte)),
            (false, Some((u, b))) => {
                out.push(((u, utf16), &text[b..byte]));
                start = None;
            }
            _ => {}
        }
        utf16 += ch.len_utf16();
    }
    if let Some((u, b)) = start {
        out.push(((u, utf16), &text[b..]));
    }
    out
}

/// The spans of `text` whose word matches one of `terms` under the search's
/// rule (feature 001, FR-006 and FR-007). Sorted and non-overlapping; a word
/// that matches two terms is one span. Empty terms are ignored.
pub fn term_spans(text: &str, terms: &[String]) -> Vec<Span> {
    let terms: Vec<String> = terms
        .iter()
        .map(|term| normalize(term))
        .filter(|term| !term.is_empty())
        .collect();
    if terms.is_empty() {
        return Vec::new();
    }

    words(text)
        .into_iter()
        .filter(|(_, word)| {
            let token = normalize(word);
            terms.iter().any(|term| matches_token(&token, term))
        })
        .map(|(span, _)| span)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::criterion::tokens;

    fn terms(list: &[&str]) -> Vec<String> {
        list.iter().map(|term| term.to_string()).collect()
    }

    /// The marked text, read back the way the interface slices it.
    fn marked(text: &str, spans: &[Span]) -> Vec<String> {
        let units: Vec<u16> = text.encode_utf16().collect();
        spans
            .iter()
            .map(|&(start, end)| String::from_utf16(&units[start..end]).unwrap())
            .collect()
    }

    #[test]
    fn marks_turkish_suffixes_and_case() {
        let text = "O ENDİŞESİ ve kaygısı, Kaygı ile birlikte.";
        let spans = term_spans(text, &terms(&["kaygı", "endişe"]));
        assert_eq!(marked(text, &spans), ["ENDİŞESİ", "kaygısı", "Kaygı"]);
    }

    #[test]
    fn does_not_mark_punctuation_or_unrelated_words() {
        let text = "«kaygı», kaygılandırıcılık";
        let spans = term_spans(text, &terms(&["kaygı"]));
        // The quotes and comma stay outside the span; the long word is more
        // than four characters past the term, so it is not a match (FR-007).
        assert_eq!(marked(text, &spans), ["kaygı"]);
    }

    #[test]
    fn a_word_matching_two_terms_is_one_span() {
        let text = "endişeler";
        let spans = term_spans(text, &terms(&["endişe", "endişeler"]));
        assert_eq!(spans, vec![(0, 9)]);
    }

    #[test]
    fn offsets_are_utf16_units() {
        // "‘" and "ı" are one UTF-16 unit each but more than one UTF-8 byte.
        let text = "‘Nereden çıktı bu?’ kaygı";
        let spans = term_spans(text, &terms(&["kaygı"]));
        assert_eq!(marked(text, &spans), ["kaygı"]);
        assert_eq!(spans, vec![(20, 25)]);
    }

    #[test]
    fn no_terms_no_marks() {
        assert!(term_spans("kaygı", &[]).is_empty());
        assert!(term_spans("kaygı", &terms(&["", "  "])).is_empty());
    }

    /// SC-004 and the contract's invariant, over every cue of both evaluation
    /// fixtures: the words found here are exactly the tokens the search reads,
    /// and a cue is marked exactly when the search counts it as matching.
    #[test]
    fn agrees_with_the_search_on_both_fixtures() {
        use crate::subtitle::{decode, parse_cues};
        use std::path::Path;

        let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../eval/fixtures");
        let cases = [
            ("tr-tedx-kaygi.tr.vtt", terms(&["kaygı", "endişe"])),
            ("en-single-story.en.vtt", terms(&["books", "story"])),
        ];
        for (file, search_terms) in cases {
            let path = root.join(file);
            if !path.is_file() {
                crate::testing::skip("evaluation files are not present");
                return;
            }
            let (text, _) = decode::read_file(&path).expect("fixture should decode");
            let normalized: Vec<String> = search_terms.iter().map(|t| normalize(t)).collect();
            let mut marked_cues = 0;

            for cue in parse_cues(&text) {
                let found: Vec<String> = words(&cue.text)
                    .iter()
                    .map(|(_, word)| normalize(word))
                    .collect();
                assert_eq!(found, tokens(&cue.text), "{file} cue {}", cue.index);

                let search_matches = tokens(&cue.text)
                    .iter()
                    .any(|token| normalized.iter().any(|term| matches_token(token, term)));
                let spans = term_spans(&cue.text, &search_terms);
                assert_eq!(
                    !spans.is_empty(),
                    search_matches,
                    "{file} cue {}: {:?}",
                    cue.index,
                    cue.text
                );
                marked_cues += usize::from(!spans.is_empty());
            }
            assert!(marked_cues > 0, "{file}: nothing was marked");
        }
    }
}
