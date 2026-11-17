use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

use serde::{Deserialize, Serialize};

use super::ffmpeg;
use crate::error::KirpixError;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClipRequest {
    pub start_ms: u64,
    pub end_ms: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CutResult {
    pub path: String,
    /// Measured from the file that was written, not from what was requested.
    pub duration_ms: u64,
    pub status: &'static str,
    pub message: Option<String>,
}

impl CutResult {
    fn ok(path: PathBuf, duration_ms: u64) -> Self {
        Self {
            path: path.display().to_string(),
            duration_ms,
            status: "ok",
            message: None,
        }
    }

    fn failed(message: String) -> Self {
        Self {
            path: String::new(),
            duration_ms: 0,
            status: "failed",
            message: Some(message),
        }
    }
}

/// Cut one clip. Re-encoding, not stream copying: a stream copy snaps to the
/// nearest keyframe and produces a file whose first frame is not the one that
/// was asked for, which is the fastest way to make a clipping tool look broken.
pub fn cut_one(
    video: &Path,
    request: &ClipRequest,
    out_dir: &Path,
    mut on_progress: impl FnMut(u64),
) -> Result<PathBuf, KirpixError> {
    if request.end_ms <= request.start_ms {
        return Err(KirpixError::EmptyRange {
            start_ms: request.start_ms,
            end_ms: request.end_ms,
        });
    }

    std::fs::create_dir_all(out_dir).map_err(|err| KirpixError::OutputNotWritable {
        dir: out_dir.display().to_string(),
        reason: err.to_string(),
    })?;

    let binary = ffmpeg::resolve("ffmpeg")?;
    let target = unique_path(out_dir, video, request);

    let duration_ms = request.end_ms - request.start_ms;
    let start = format!("{:.3}", request.start_ms as f64 / 1000.0);
    let length = format!("{:.3}", duration_ms as f64 / 1000.0);

    let mut child = Command::new(&binary.path)
        .args(["-hide_banner", "-loglevel", "error", "-nostdin"])
        .args(["-ss", &start])
        .arg("-i")
        .arg(video)
        .args(["-t", &length])
        .args(["-map", "0:v:0", "-map", "0:a:0?"])
        .args(["-sn", "-dn"])
        .args(["-c:v", "libx264", "-preset", "veryfast", "-crf", "20"])
        .args(["-pix_fmt", "yuv420p"])
        .args(["-c:a", "aac", "-b:a", "128k"])
        .args(["-movflags", "+faststart"])
        .args(["-progress", "pipe:1", "-nostats"])
        .arg(&target)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|err| KirpixError::MediaUnreadable {
            path: video.display().to_string(),
            reason: err.to_string(),
        })?;

    if let Some(stdout) = child.stdout.take() {
        let reader = BufReader::new(stdout);
        for line in reader.lines().map_while(Result::ok) {
            // `-progress` reports out_time_us in microseconds despite the name.
            if let Some(value) = line.strip_prefix("out_time_us=") {
                if let Ok(micros) = value.trim().parse::<u64>() {
                    let done_ms = micros / 1000;
                    let percent = (done_ms * 100 / duration_ms.max(1)).min(100);
                    on_progress(percent);
                }
            }
        }
    }

    let output = child.wait_with_output().map_err(|err| KirpixError::FfmpegFailed {
        clip: target.display().to_string(),
        code: -1,
        tail: err.to_string(),
    })?;

    if !output.status.success() {
        let _ = std::fs::remove_file(&target);
        let tail = String::from_utf8_lossy(&output.stderr)
            .lines()
            .last()
            .unwrap_or("no output")
            .to_string();
        return Err(KirpixError::FfmpegFailed {
            clip: target.display().to_string(),
            code: output.status.code().unwrap_or(-1),
            tail,
        });
    }

    // A file that exists but does not probe is not a clip.
    ffmpeg::probe(&target)?;
    Ok(target)
}

/// Cut several clips, measuring each one and never letting one failure stop the
/// rest (FR-019).
pub fn cut_batch(
    video: &Path,
    requests: &[ClipRequest],
    out_dir: &Path,
    mut on_progress: impl FnMut(usize, u64),
) -> Vec<CutResult> {
    let mut results = Vec::with_capacity(requests.len());

    for (index, request) in requests.iter().enumerate() {
        match cut_one(video, request, out_dir, |percent| on_progress(index, percent)) {
            Ok(path) => match ffmpeg::probe(&path) {
                Ok(info) => results.push(CutResult::ok(path, info.duration_ms)),
                Err(err) => results.push(CutResult::failed(err.to_string())),
            },
            Err(err) => results.push(CutResult::failed(err.to_string())),
        }
    }

    results
}

/// `<stem>-<start>-<end>.mp4`, with a counter when that name is taken. An
/// existing file is never overwritten (FR-018).
fn unique_path(out_dir: &Path, video: &Path, request: &ClipRequest) -> PathBuf {
    let stem = video
        .file_stem()
        .and_then(|name| name.to_str())
        .unwrap_or("clip");
    let base = format!(
        "{stem}-{}-{}",
        stamp(request.start_ms),
        stamp(request.end_ms)
    );

    let mut candidate = out_dir.join(format!("{base}.mp4"));
    let mut counter = 2;
    while candidate.exists() {
        candidate = out_dir.join(format!("{base}-{counter}.mp4"));
        counter += 1;
    }
    candidate
}

/// `HHMMSS`, using whole seconds, enough to tell one clip from another.
fn stamp(ms: u64) -> String {
    let total = ms / 1000;
    let hours = total / 3600;
    let minutes = (total % 3600) / 60;
    let seconds = total % 60;
    format!("{hours:02}{minutes:02}{seconds:02}")
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    fn eval(path: &str) -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR")).join("../../eval").join(path)
    }

    fn scratch(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("kirpix-tests-{name}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        dir
    }

    #[test]
    fn stamps_whole_seconds() {
        assert_eq!(stamp(0), "000000");
        assert_eq!(stamp(213_656), "000333", "whole seconds, rounded down");
        assert_eq!(stamp(3_723_500), "010203");
    }

    #[test]
    fn refuses_an_empty_range() {
        let request = ClipRequest { start_ms: 5_000, end_ms: 5_000 };
        let err = cut_one(Path::new("/nonexistent.mp4"), &request, Path::new("/tmp"), |_| {}).unwrap_err();
        assert!(matches!(err, KirpixError::EmptyRange { .. }));
    }

    #[test]
    fn cuts_a_real_clip_and_measures_it() {
        let video = eval("media/tr-tedx-kaygi.mp4");
        if !video.is_file() {
            eprintln!("skipped: evaluation media is not present");
            return;
        }
        let out = scratch("cut");
        let request = ClipRequest { start_ms: 213_656, end_ms: 255_536 };

        let mut percents = Vec::new();
        let path = cut_one(&video, &request, &out, |percent| percents.push(percent)).expect("cut should succeed");

        let info = ffmpeg::probe(&path).expect("the cut file should probe");
        let expected = request.end_ms - request.start_ms;
        assert!(
            (info.duration_ms as i64 - expected as i64).abs() <= 250,
            "duration was {} ms, expected about {}",
            info.duration_ms,
            expected
        );
        assert!(path.file_name().unwrap().to_str().unwrap().ends_with(".mp4"));
        assert!(!percents.is_empty(), "progress should have been reported");
        assert!(percents.iter().all(|percent| *percent <= 100));
    }

    #[test]
    fn never_overwrites_an_existing_file() {
        let video = eval("media/tr-tedx-kaygi.mp4");
        if !video.is_file() {
            eprintln!("skipped: evaluation media is not present");
            return;
        }
        let out = scratch("collision");
        let request = ClipRequest { start_ms: 213_656, end_ms: 219_000 };

        let first = cut_one(&video, &request, &out, |_| {}).expect("first cut");
        let second = cut_one(&video, &request, &out, |_| {}).expect("second cut");

        assert_ne!(first, second);
        assert!(first.exists() && second.exists());
    }

    #[test]
    fn one_failure_does_not_stop_the_batch() {
        let video = eval("media/tr-tedx-kaygi.mp4");
        if !video.is_file() {
            eprintln!("skipped: evaluation media is not present");
            return;
        }
        let out = scratch("batch");
        let requests = [
            ClipRequest { start_ms: 0, end_ms: 0 },          // empty, refused
            ClipRequest { start_ms: 213_656, end_ms: 219_000 }, // real
        ];

        let results = cut_batch(&video, &requests, &out, |_, _| {});
        assert_eq!(results.len(), 2);
        assert_eq!(results[0].status, "failed");
        assert_eq!(results[1].status, "ok");
        assert!(Path::new(&results[1].path).exists());
    }
}
