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
    /// The subtitle file was read but holds no usable cue.
    SubtitleEmpty { path: String },
    /// A command was called before any session was opened.
    NoSession,
    /// The search ran with no usable term.
    EmptyTerms,
    /// A clip was requested with no duration.
    EmptyRange { start_ms: u64, end_ms: u64 },
    /// FFmpeg ran but did not produce a clip.
    FfmpegFailed { clip: String, code: i32, tail: String },
    /// The output folder could not be written to.
    OutputNotWritable { dir: String, reason: String },
    /// A subtitle stream could not be converted to text, usually because it
    /// stores pictures.
    TrackNotText { stream_index: usize, tail: String },
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
            Self::SubtitleEmpty { path } => {
                write!(f, "{path} holds no usable subtitle line")
            }
            Self::NoSession => write!(f, "no video has been opened yet"),
            Self::EmptyTerms => write!(f, "at least one term is needed to search"),
            Self::EmptyRange { start_ms, end_ms } => {
                write!(f, "the range {start_ms}..{end_ms} has no duration")
            }
            Self::FfmpegFailed { clip, code, tail } => {
                write!(f, "FFmpeg failed on {clip} with code {code}: {tail}")
            }
            Self::OutputNotWritable { dir, reason } => {
                write!(f, "{dir} could not be written to: {reason}")
            }
            Self::TrackNotText { stream_index, tail } => {
                write!(f, "subtitle stream {stream_index} could not be read as text: {tail}")
            }
        }
    }
}

impl std::error::Error for KirpixError {}
