/// What a subtitle track actually holds. A codec that stores pictures cannot be
/// read as text, and pretending otherwise produces an empty cue table and a
/// confusing "no matches" (feature 002, FR-004).
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub enum TrackKind {
    Text,
    Picture,
}

/// The codecs that store pictures. Everything else FFprobe reports as a
/// subtitle is text, and if extraction then fails it fails with a named error
/// rather than a guess.
const PICTURE_CODECS: &[&str] = &["dvd_subtitle", "dvb_subtitle", "hdmv_pgs_subtitle", "xsub"];

pub fn classify(codec: &str) -> TrackKind {
    let lower = codec.to_ascii_lowercase();
    if PICTURE_CODECS.iter().any(|known| *known == lower) {
        TrackKind::Picture
    } else {
        TrackKind::Text
    }
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SubtitleTrack {
    /// The stream index inside the container, which is what extraction needs.
    pub stream_index: usize,
    pub codec: String,
    pub language: Option<String>,
    pub title: Option<String>,
    pub kind: TrackKind,
}

impl SubtitleTrack {
    /// What the interface shows when a title is missing.
    pub fn label(&self) -> String {
        match (&self.language, &self.title) {
            (_, Some(title)) if !title.is_empty() => title.clone(),
            (Some(language), _) if !language.is_empty() => language.to_uppercase(),
            _ => format!("track {}", self.stream_index),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn known_picture_codecs_are_pictures() {
        for codec in ["hdmv_pgs_subtitle", "dvd_subtitle", "dvb_subtitle", "xsub"] {
            assert_eq!(classify(codec), TrackKind::Picture, "{codec}");
        }
    }

    #[test]
    fn text_codecs_are_text() {
        for codec in ["subrip", "srt", "ass", "ssa", "mov_text", "webvtt", "ttml"] {
            assert_eq!(classify(codec), TrackKind::Text, "{codec}");
        }
    }

    #[test]
    fn classification_ignores_case() {
        assert_eq!(classify("HDMV_PGS_SUBTITLE"), TrackKind::Picture);
        assert_eq!(classify("SubRip"), TrackKind::Text);
    }

    #[test]
    fn labels_prefer_the_title() {
        let with_title = SubtitleTrack {
            stream_index: 2,
            codec: "subrip".into(),
            language: Some("tur".into()),
            title: Some("Metin".into()),
            kind: TrackKind::Text,
        };
        assert_eq!(with_title.label(), "Metin");

        let language_only = SubtitleTrack {
            title: None,
            ..with_title.clone()
        };
        assert_eq!(language_only.label(), "TUR");

        let bare = SubtitleTrack {
            language: None,
            ..language_only
        };
        assert_eq!(bare.label(), "track 2");
    }
}
