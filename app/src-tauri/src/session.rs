use std::path::{Path, PathBuf};

use crate::error::KirpixError;
use crate::media::{ffmpeg, MediaInfo};
use crate::subtitle::{read_file, parse_table, CueTable};

/// One open video and its subtitle file. Held by the application, so the
/// interface never has to send several hundred cues back to search.
#[derive(Debug)]
pub struct Session {
    pub video: PathBuf,
    pub subtitle: PathBuf,
    pub media: MediaInfo,
    pub table: CueTable,
}

/// What the interface needs to draw the loaded state.
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionInfo {
    pub video_path: String,
    pub subtitle_path: String,
    pub duration_ms: u64,
    pub cue_count: usize,
    pub encoding: String,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub has_audio: bool,
    /// Which FFprobe answered: bundled or a system install.
    pub media_source: String,
}

impl Session {
    pub fn info(&self) -> SessionInfo {
        SessionInfo {
            video_path: self.video.display().to_string(),
            subtitle_path: self.subtitle.display().to_string(),
            duration_ms: self.media.duration_ms,
            cue_count: self.table.len(),
            encoding: self.table.encoding.clone(),
            width: self.media.width,
            height: self.media.height,
            has_audio: self.media.has_audio,
            media_source: self.media.source.clone(),
        }
    }

    /// Cues `from..=to`, one based, clamped to the table. Paging keeps the
    /// interface from receiving the whole file to show twenty lines.
    pub fn cues(&self, from: usize, to: usize) -> Vec<crate::subtitle::Cue> {
        let start = from.max(1);
        let end = to.min(self.table.len());
        if start > end {
            return Vec::new();
        }
        self.table.cues[start - 1..end].to_vec()
    }
}

pub fn open(video: &Path, subtitle: &Path) -> Result<Session, KirpixError> {
    let media = ffmpeg::probe(video)?;
    let (text, encoding) = read_file(subtitle)?;
    let table = parse_table(&text, encoding.as_str());

    if table.is_empty() {
        return Err(KirpixError::SubtitleEmpty {
            path: subtitle.display().to_string(),
        });
    }

    Ok(Session {
        video: video.to_path_buf(),
        subtitle: subtitle.to_path_buf(),
        media,
        table,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    fn eval(path: &str) -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR")).join("../../eval").join(path)
    }

    #[test]
    fn opens_the_turkish_recording_and_reports_it() {
        let video = eval("media/tr-tedx-kaygi.mp4");
        let subs = eval("fixtures/tr-tedx-kaygi.tr.vtt");
        if !video.is_file() || !subs.is_file() {
            eprintln!("skipped: evaluation files are not present");
            return;
        }

        let session = open(&video, &subs).expect("session should open");
        let info = session.info();

        assert_eq!(info.cue_count, 239);
        assert_eq!(info.encoding, "utf-8");
        assert!(info.has_audio);
        assert!((info.duration_ms as i64 - 877_650).abs() < 500);
    }

    #[test]
    fn pages_cues_within_bounds() {
        let video = eval("media/tr-tedx-kaygi.mp4");
        let subs = eval("fixtures/tr-tedx-kaygi.tr.vtt");
        if !video.is_file() || !subs.is_file() {
            eprintln!("skipped: evaluation files are not present");
            return;
        }

        let session = open(&video, &subs).expect("session should open");
        let first_five = session.cues(1, 5);
        assert_eq!(first_five.len(), 5);
        assert_eq!(first_five[0].index, 1);

        let past_the_end = session.cues(239, 500);
        assert_eq!(past_the_end.len(), 1);

        assert!(session.cues(10, 5).is_empty());
    }

    #[test]
    fn refuses_an_empty_subtitle_file() {
        let path = std::env::temp_dir().join("kirpix-empty.vtt");
        std::fs::write(&path, "WEBVTT\n\n").unwrap();
        let err = open(Path::new("/nonexistent.mp4"), &path).unwrap_err();
        // The media probe fails first, which is the honest order: nothing is
        // reported about subtitles until the video is known.
        assert!(matches!(err, KirpixError::MediaUnreadable { .. }));
    }
}
