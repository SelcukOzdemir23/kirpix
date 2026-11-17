use std::fmt;

/// One closed set of failures. The interface renders these; it never invents
/// error text of its own (constitution, article IX).
#[derive(Debug, Clone, serde::Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum KirpixError {
    /// No FFmpeg or FFprobe binary could be found.
    FfmpegMissing { name: String },
    /// The media file could not be read at all.
    MediaUnreadable { path: String, reason: String },
    /// FFprobe ran but did not return a usable description.
    MediaProbeFailed { path: String, tail: String },
    /// The subtitle file could not be read.
    SubtitleUnreadable { path: String, reason: String },
}

impl fmt::Display for KirpixError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::FfmpegMissing { name } => {
                write!(f, "{name} could not be found next to the application or in the project binaries")
            }
            Self::MediaUnreadable { path, reason } => {
                write!(f, "{path} could not be read: {reason}")
            }
            Self::MediaProbeFailed { path, tail } => {
                write!(f, "{path} was not recognised as media: {tail}")
            }
            Self::SubtitleUnreadable { path, reason } => {
                write!(f, "{path} could not be read as subtitles: {reason}")
            }
        }
    }
}

impl std::error::Error for KirpixError {}
