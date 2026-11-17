use std::path::{Path, PathBuf};

use crate::error::KirpixError;
use crate::media::{extract_track, ffmpeg, MediaInfo};
use crate::subtitle::{read_file, parse_table, CueTable};

/// Where the cues came from. Both paths end in the same cue table, which is the
/// point: nothing downstream cares how the subtitles arrived.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SubtitleSource {
    File(PathBuf),
    Track { stream_index: usize, label: String },
}

impl SubtitleSource {
    pub fn label(&self) -> String {
        match self {
            Self::File(path) => path
                .file_name()
                .and_then(|name| name.to_str())
                .unwrap_or("subtitle file")
                .to_string(),
            Self::Track { label, .. } => label.clone(),
        }
    }

    pub fn kind(&self) -> &'static str {
        match self {
            Self::File(_) => "file",
            Self::Track { .. } => "embedded",
        }
    }
}

/// One open video and its subtitle file. Held by the application, so the
/// interface never has to send several hundred cues back to search.
#[derive(Debug)]
pub struct Session {
    pub video: PathBuf,
    pub source: SubtitleSource,
    pub media: MediaInfo,
    pub table: CueTable,
    /// Applied at read time, never written back to the subtitle file. Positive
    /// moves the cues later in the recording.
    pub offset_ms: i64,
}

/// What the interface needs after the offset changes.
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OffsetInfo {
    pub offset_ms: i64,
    /// How many cues would start before zero and were clamped to it.
    pub clamped_cues: usize,
}

/// What the interface needs to draw the loaded state.
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionInfo {
    pub video_path: String,
    /// What to show for the subtitles: a file name, or a track label.
    pub subtitle_label: String,
    /// `file` or `embedded`, so the interface can say which.
    pub subtitle_source: String,
    pub duration_ms: u64,
    pub cue_count: usize,
    pub encoding: String,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub has_audio: bool,
    /// Which FFprobe answered: bundled or a system install.
    pub media_source: String,
    pub offset_ms: i64,
}

impl Session {
    pub fn info(&self) -> SessionInfo {
        SessionInfo {
            video_path: self.video.display().to_string(),
            subtitle_label: self.source.label(),
            subtitle_source: self.source.kind().to_string(),
            duration_ms: self.media.duration_ms,
            cue_count: self.table.len(),
            encoding: self.table.encoding.clone(),
            width: self.media.width,
            height: self.media.height,
            has_audio: self.media.has_audio,
            media_source: self.media.source.clone(),
            offset_ms: self.offset_ms,
        }
    }

    /// The cue table with the offset applied. The stored table is never
    /// mutated, so clearing the offset is free and cannot drift.
    pub fn table_with_offset(&self) -> CueTable {
        if self.offset_ms == 0 {
            return self.table.clone();
        }

        let shift = |value: u64| -> u64 { (value as i64 + self.offset_ms).max(0) as u64 };
        CueTable {
            cues: self
                .table
                .cues
                .iter()
                .map(|cue| crate::subtitle::Cue {
                    index: cue.index,
                    start_ms: shift(cue.start_ms),
                    end_ms: shift(cue.end_ms),
                    text: cue.text.clone(),
                })
                .collect(),
            encoding: self.table.encoding.clone(),
        }
    }

    /// How many cues the current offset would push before the start.
    pub fn clamped_cues(&self) -> usize {
        if self.offset_ms >= 0 {
            return 0;
        }
        self.table
            .cues
            .iter()
            .filter(|cue| (cue.start_ms as i64 + self.offset_ms) < 0)
            .count()
    }

    pub fn offset_info(&self) -> OffsetInfo {
        OffsetInfo {
            offset_ms: self.offset_ms,
            clamped_cues: self.clamped_cues(),
        }
    }

    /// Cues `from..=to`, one based, clamped to the table. Paging keeps the
    /// interface from receiving the whole file to show twenty lines.
    pub fn cues(&self, from: usize, to: usize) -> Vec<crate::subtitle::Cue> {
        let table = self.table_with_offset();
        let start = from.max(1);
        let end = to.min(table.len());
        if start > end {
            return Vec::new();
        }
        table.cues[start - 1..end].to_vec()
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
        source: SubtitleSource::File(subtitle.to_path_buf()),
        media,
        table,
        offset_ms: 0,
    })
}

/// Open a session from a track the container already carries.
pub fn open_embedded(video: &Path, stream_index: usize) -> Result<Session, KirpixError> {
    let media = ffmpeg::probe(video)?;

    let track = media
        .subtitle_tracks
        .iter()
        .find(|track| track.stream_index == stream_index)
        .ok_or(KirpixError::TrackMissing { stream_index })?;

    let table = extract_track(video, stream_index)?;
    let label = track.label();

    Ok(Session {
        video: video.to_path_buf(),
        source: SubtitleSource::Track {
            stream_index,
            label,
        },
        media,
        table,
        offset_ms: 0,
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
    fn opens_from_the_embedded_track() {
        let video = eval("media/tr-tedx-kaygi.mkv");
        if !video.is_file() {
            eprintln!("skipped: evaluation media is not present");
            return;
        }

        let session = open_embedded(&video, 2).expect("the track should open");
        let info = session.info();

        assert_eq!(info.cue_count, 239);
        assert_eq!(info.subtitle_source, "embedded");
        assert_eq!(info.subtitle_label, "Metin");
        assert_eq!(session.source.kind(), "embedded");
    }

    #[test]
    fn names_a_track_that_is_not_there() {
        let video = eval("media/tr-tedx-kaygi.mkv");
        if !video.is_file() {
            eprintln!("skipped: evaluation media is not present");
            return;
        }

        let err = open_embedded(&video, 42).unwrap_err();
        assert!(matches!(err, KirpixError::TrackMissing { stream_index: 42 }));
    }

    fn open_fixture() -> Option<Session> {
        let video = eval("media/tr-tedx-kaygi.mp4");
        let subs = eval("fixtures/tr-tedx-kaygi.tr.vtt");
        if !video.is_file() || !subs.is_file() {
            eprintln!("skipped: evaluation files are not present");
            return None;
        }
        Some(open(&video, &subs).expect("session should open"))
    }

    #[test]
    fn the_offset_moves_every_cue_and_keeps_its_index() {
        let Some(mut session) = open_fixture() else {
            return;
        };
        let before = session.cues(1, 239);

        session.offset_ms = 3_000;
        let after = session.cues(1, 239);

        assert_eq!(before.len(), after.len());
        for (original, moved) in before.iter().zip(after.iter()) {
            assert_eq!(original.index, moved.index, "indices must not change");
            assert_eq!(moved.start_ms, original.start_ms + 3_000);
            assert_eq!(moved.end_ms, original.end_ms + 3_000);
            assert_eq!(original.text, moved.text);
        }
    }

    #[test]
    fn clearing_the_offset_restores_the_original_times() {
        let Some(mut session) = open_fixture() else {
            return;
        };
        let before = session.cues(1, 10);

        session.offset_ms = -2_500;
        session.offset_ms = 0;

        assert_eq!(session.cues(1, 10), before);
    }

    #[test]
    fn a_negative_offset_is_clamped_and_counted() {
        let Some(mut session) = open_fixture() else {
            return;
        };

        session.offset_ms = -1_000;
        let info = session.offset_info();

        assert_eq!(info.offset_ms, -1_000);
        assert!(info.clamped_cues >= 1, "the first cue starts at zero");
        assert_eq!(session.cues(1, 1)[0].start_ms, 0, "never below zero");
    }

    #[test]
    fn the_search_moves_with_the_offset() {
        use crate::criterion::{find, Bounds};

        let Some(mut session) = open_fixture() else {
            return;
        };
        let terms = vec!["kaygı".to_string(), "endişe".to_string()];

        let base = find(
            &session.table_with_offset(),
            &terms,
            Bounds::default(),
            session.media.duration_ms,
        )
        .expect("search should run");

        session.offset_ms = 3_000;
        let shifted = find(
            &session.table_with_offset(),
            &terms,
            Bounds::default(),
            session.media.duration_ms,
        )
        .expect("search should run");

        assert!(!base.is_empty());
        assert_eq!(base.len(), shifted.len());
        for (original, moved) in base.iter().zip(shifted.iter()) {
            assert_eq!(moved.start_ms, original.start_ms + 3_000);
            assert_eq!(moved.end_ms, original.end_ms + 3_000);
            assert_eq!(original.start_cue, moved.start_cue);
        }
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
