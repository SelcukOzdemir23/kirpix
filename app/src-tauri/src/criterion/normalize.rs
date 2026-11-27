use unicode_normalization::UnicodeNormalization;

/// Fold one character the way Turkish needs, before consulting Unicode.
///
/// The two that matter are the dotted and dotless i: Unicode lowercases `I` to
/// `i`, which is wrong here, and `İ` lowercases to `i` plus a combining dot,
/// which would only cause trouble. The circumflexed vowels are folded to their
/// plain forms so that a term typed either way matches; the remaining Turkish
/// letters (ç ğ ı ö ş ü) stay distinct, because folding them would merge words
/// that mean different things.
fn fold(ch: char) -> char {
    match ch {
        'I' => 'ı',
        'İ' => 'i',
        'Â' => 'a',
        'â' => 'a',
        'Î' => 'i',
        'î' => 'i',
        'Û' => 'u',
        'û' => 'u',
        other => other,
    }
}

/// Normalize text and terms identically, which is the whole point: they are
/// compared afterwards (feature 001, FR-006).
///
/// Composition is normalized to NFC first, then characters are folded, lowered
/// and everything that is not a letter or digit becomes a separator.
pub fn normalize(text: &str) -> String {
    let composed: String = text.nfc().collect();
    let mut out = String::with_capacity(composed.len());
    let mut separator_pending = false;

    for ch in composed.chars() {
        for lower in fold(ch).to_lowercase() {
            if lower.is_alphanumeric() {
                if separator_pending && !out.is_empty() {
                    out.push(' ');
                }
                separator_pending = false;
                out.push(lower);
            } else {
                separator_pending = true;
            }
        }
    }

    out
}

pub fn tokens(text: &str) -> Vec<String> {
    normalize(text)
        .split(' ')
        .filter(|token| !token.is_empty())
        .map(str::to_string)
        .collect()
}

/// A token matches a term when it is the term, or the term plus at most four
/// further characters, which is how Turkish suffixes are caught without
/// matching unrelated words (FR-007).
pub fn matches_token(token: &str, normalized_term: &str) -> bool {
    if normalized_term.is_empty() {
        return false;
    }
    if token == normalized_term {
        return true;
    }
    if !token.starts_with(normalized_term) {
        return false;
    }
    token.chars().count() - normalized_term.chars().count() <= 4
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn folds_turkish_case_correctly() {
        assert_eq!(normalize("KAYGI"), "kaygı");
        assert_eq!(normalize("İSTANBUL"), "istanbul");
        assert_eq!(normalize("ISPARTA"), "ısparta");
        assert_eq!(normalize("Endişe"), "endişe");
    }

    #[test]
    fn folds_the_circumflex_but_keeps_the_other_letters() {
        assert_eq!(normalize("KÂĞIT"), normalize("KAĞIT"));
        assert_eq!(normalize("kâğıt"), "kağıt");
        // Folding ç ğ ö ş ü would merge words that mean different things.
        assert_ne!(normalize("şu"), normalize("su"));
        assert_ne!(normalize("çok"), normalize("cok"));
        assert_ne!(normalize("kaygı"), normalize("kaygi"));
    }

    #[test]
    fn strips_punctuation_and_collapses_space() {
        assert_eq!(normalize("  «Kaygı»,   endişe!  "), "kaygı endişe");
        assert_eq!(normalize("İstanbul'da"), "istanbul da");
        assert_eq!(normalize("..."), "");
    }

    #[test]
    fn matches_suffixes_up_to_four_characters() {
        let term = normalize("endişe");
        assert!(matches_token(&normalize("endişe"), &term));
        assert!(matches_token(&normalize("endişesi"), &term));
        assert!(matches_token(&normalize("ENDİŞELER"), &term));
        assert!(
            !matches_token(&normalize("endişelerim"), &term),
            "five extra characters is too many"
        );
    }

    #[test]
    fn does_not_match_inside_a_word() {
        let term = normalize("kaygı");
        assert!(!matches_token(&normalize("akaygı"), &term));
        assert!(!matches_token(&normalize("kay"), &term));
        assert!(!matches_token("", &term));
        assert!(
            !matches_token(&normalize("kaygı"), ""),
            "an empty term matches nothing"
        );
    }

    #[test]
    fn tokens_split_on_every_separator() {
        assert_eq!(
            tokens("kaygı, endişe; korku."),
            vec!["kaygı", "endişe", "korku"]
        );
    }
}
