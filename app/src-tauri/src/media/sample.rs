use std::path::Path;
use std::process::{Command, Stdio};

use super::ffmpeg;
use crate::error::KirpixError;

/// How much of the sample plays before the cue starts.
const LEAD_MS: u64 = 500;

/// A short uncompressed sample of the sound around a moment.
///
/// The bytes come back in memory rather than as a file: FFmpeg writes WAV to its
/// standard output, so nothing is written to the user's disk at all and there is
/// nothing to clean up afterwards. WAV because the interface should not have to
/// negotiate a codec to let a person hear whether a line has been spoken yet
/// (feature 002, FR-009).
pub fn wav_around(video: &Path, center_ms: u64, seconds: f64) -> Result<Vec<u8>, KirpixError> {
    let info = ffmpeg::probe(video)?;
    if !info.has_audio {
        return Err(KirpixError::NoAudio {
            path: video.display().to_string(),
        });
    }

    let binary = ffmpeg::resolve("ffmpeg")?;
    let start_ms = center_ms.saturating_sub(LEAD_MS);

    let output = Command::new(&binary.path)
        .args(["-hide_banner", "-loglevel", "error", "-nostdin"])
        .args(["-ss", &format!("{:.3}", start_ms as f64 / 1000.0)])
        .arg("-i")
        .arg(video)
        .args(["-t", &format!("{seconds:.3}")])
        .args(["-vn", "-ac", "1", "-ar", "16000"])
        .args(["-c:a", "pcm_s16le", "-f", "wav", "-"])
        .stdin(Stdio::null())
        .output()
        .map_err(|err| KirpixError::MediaUnreadable {
            path: video.display().to_string(),
            reason: err.to_string(),
        })?;

    if !output.status.success() || output.stdout.is_empty() {
        let tail = String::from_utf8_lossy(&output.stderr)
            .lines()
            .last()
            .unwrap_or("no output")
            .to_string();
        return Err(KirpixError::FfmpegFailed {
            clip: format!("sample from {}", video.display()),
            code: output.status.code().unwrap_or(-1),
            tail,
        });
    }

    Ok(output.stdout)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn eval(path: &str) -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../eval")
            .join(path)
    }

    #[test]
    fn produces_a_four_second_wav_under_a_megabyte() {
        let video = eval("media/tr-tedx-kaygi.mp4");
        if !video.is_file() {
            crate::testing::skip("evaluation media is not present");
            return;
        }

        let bytes = wav_around(&video, 213_656, 4.0).expect("a sample should be produced");

        assert_eq!(&bytes[0..4], b"RIFF");
        assert_eq!(&bytes[8..12], b"WAVE");
        assert!(bytes.len() < 1_000_000, "sample was {} bytes", bytes.len());
        // 4 s at 16 kHz mono 16-bit, plus the header.
        let expected = 16_000 * 2 * 4;
        assert!(
            (bytes.len() as i64 - expected as i64).abs() < 4_096,
            "sample was {} bytes, expected about {}",
            bytes.len(),
            expected
        );
    }

    #[test]
    fn refuses_a_file_with_no_audio() {
        let video = eval("media/tr-tedx-kaygi.mp4");
        if !video.is_file() {
            crate::testing::skip("evaluation media is not present");
            return;
        }

        let silent = std::env::temp_dir().join("kirpix-silent.mp4");
        let binary = ffmpeg::resolve("ffmpeg").expect("ffmpeg");
        let status = Command::new(&binary.path)
            .args(["-hide_banner", "-loglevel", "error", "-y", "-i"])
            .arg(&video)
            .args(["-t", "2", "-an", "-c:v", "copy"])
            .arg(&silent)
            .status()
            .expect("ffmpeg should run");
        if !status.success() {
            crate::testing::skip("could not build a silent copy");
            return;
        }

        let err = wav_around(&silent, 1_000, 4.0).unwrap_err();
        assert!(matches!(err, KirpixError::NoAudio { .. }));
    }
}
