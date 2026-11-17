use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};

use super::ffmpeg;
use crate::error::KirpixError;

/// The longest preview, in milliseconds. Anything longer is cut to this, and the
/// answer says so rather than showing a shorter passage without a word.
pub const LIMIT_MS: u64 = 20_000;

/// Preview height in lines. Low on purpose: a preview is for recognising a
/// passage, not for judging the picture. What gets cut keeps the source quality.
const HEIGHT: u32 = 360;

#[derive(Debug)]
pub struct Encoded {
    pub bytes: Vec<u8>,
    pub duration_ms: u64,
    pub truncated: bool,
}

/// How many previews this process has started. Two clicks can race, and two
/// encoders writing one file would corrupt both answers.
static SEQUENCE: AtomicU64 = AtomicU64::new(0);

/// Where the encoder writes. Unique per call, in the system temp directory.
pub fn temp_path() -> PathBuf {
    let sequence = SEQUENCE.fetch_add(1, Ordering::Relaxed);
    std::env::temp_dir().join(format!("kirpix-preview-{}-{sequence}.mp4", std::process::id()))
}

/// A short, small copy of one range, as the bytes of an MP4.
///
/// The webview cannot open MKV or AV1, so it is never given the source file: it
/// is given H.264 in MP4, which both engines decode without negotiation. FFmpeg
/// needs a real file for an ordinary (non-fragmented) MP4, so it writes one in
/// the operating system's temporary directory and this function deletes it
/// before returning. The bytes travel to the interface inside the response.
pub fn encode(video: &Path, start_ms: u64, end_ms: u64) -> Result<Encoded, KirpixError> {
    encode_to(video, start_ms, end_ms, &temp_path())
}

/// The same, writing where the caller says. Split out so a test can watch one
/// file it named itself, instead of guessing at a temp path under load.
pub fn encode_to(
    video: &Path,
    start_ms: u64,
    end_ms: u64,
    target: &Path,
) -> Result<Encoded, KirpixError> {
    if end_ms <= start_ms {
        return Err(KirpixError::EmptyRange { start_ms, end_ms });
    }

    let requested = end_ms - start_ms;
    let duration_ms = requested.min(LIMIT_MS);
    let binary = ffmpeg::resolve("ffmpeg")?;

    let output = Command::new(&binary.path)
        .args(["-hide_banner", "-loglevel", "error", "-nostdin", "-y"])
        .args(["-ss", &format!("{:.3}", start_ms as f64 / 1000.0)])
        .arg("-i")
        .arg(video)
        .args(["-t", &format!("{:.3}", duration_ms as f64 / 1000.0)])
        .args(["-vf", &format!("scale=-2:{HEIGHT}")])
        .args([
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "32", "-profile:v", "main",
            "-pix_fmt", "yuv420p",
        ])
        .args(["-c:a", "aac", "-b:a", "96k", "-ac", "2"])
        .args(["-movflags", "+faststart"])
        .arg(target)
        .stdin(Stdio::null())
        .output()
        .map_err(|err| KirpixError::MediaUnreadable {
            path: video.display().to_string(),
            reason: err.to_string(),
        })?;

    // A recording with no audio still encodes; `-c:a` simply has nothing to do.
    let bytes = fs::read(target);
    let _ = fs::remove_file(target);

    if !output.status.success() {
        let tail = String::from_utf8_lossy(&output.stderr)
            .lines()
            .last()
            .unwrap_or("no output")
            .to_string();
        return Err(KirpixError::FfmpegFailed {
            clip: format!("preview of {}", video.display()),
            code: output.status.code().unwrap_or(-1),
            tail,
        });
    }

    let bytes = bytes.map_err(|err| KirpixError::MediaUnreadable {
        path: target.display().to_string(),
        reason: err.to_string(),
    })?;

    if bytes.is_empty() {
        return Err(KirpixError::FfmpegFailed {
            clip: format!("preview of {}", video.display()),
            code: 0,
            tail: "no output".into(),
        });
    }

    Ok(Encoded {
        bytes,
        duration_ms,
        truncated: requested > duration_ms,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn eval(path: &str) -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR")).join("../../eval").join(path)
    }

    fn fixture() -> Option<PathBuf> {
        let video = eval("media/tr-tedx-kaygi.mp4");
        if video.is_file() {
            Some(video)
        } else {
            eprintln!("skipped: evaluation media is not present");
            None
        }
    }

    /// The four bytes after the size are the box type. A file that starts with
    /// `ftyp` is a real MP4 and not an empty shell.
    fn has_box(bytes: &[u8], name: &[u8]) -> bool {
        bytes.windows(4).any(|window| window == name)
    }

    #[test]
    fn encodes_a_twelve_second_preview() {
        let Some(video) = fixture() else { return };

        let encoded = encode(&video, 214_000, 226_000).expect("a preview should be produced");

        assert_eq!(&encoded.bytes[4..8], b"ftyp", "the MP4 header should be present");
        assert!(has_box(&encoded.bytes, b"moov"), "the file needs its index");
        assert!(has_box(&encoded.bytes, b"mdat"), "the file needs its data");
        assert_eq!(encoded.duration_ms, 12_000);
        assert!(!encoded.truncated);
        assert!(
            encoded.bytes.len() < 4_000_000,
            "a twelve second preview was {} bytes",
            encoded.bytes.len()
        );
    }

    #[test]
    fn a_longer_range_is_cut_to_the_limit_and_says_so() {
        let Some(video) = fixture() else { return };

        let encoded = encode(&video, 60_000, 240_000).expect("a preview should be produced");

        assert_eq!(encoded.duration_ms, LIMIT_MS);
        assert!(encoded.truncated, "a cut range must be reported as truncated");
    }

    #[test]
    fn the_temporary_file_does_not_outlive_the_call() {
        let Some(video) = fixture() else { return };

        let target = temp_path();
        assert!(!target.exists(), "the test should start with no file");

        encode_to(&video, 214_000, 226_000, &target).expect("a preview should be produced");

        assert!(!target.exists(), "{} should have been deleted", target.display());
    }

    #[test]
    fn refuses_a_range_with_no_duration() {
        let Some(video) = fixture() else { return };

        let err = encode(&video, 5_000, 5_000).unwrap_err();
        assert!(matches!(err, KirpixError::EmptyRange { .. }));

        let err = encode(&video, 9_000, 4_000).unwrap_err();
        assert!(matches!(err, KirpixError::EmptyRange { .. }));
    }
}
