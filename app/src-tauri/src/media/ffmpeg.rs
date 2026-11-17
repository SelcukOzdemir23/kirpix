use std::path::{Path, PathBuf};
use std::process::Command;

use serde::Deserialize;

use crate::error::KirpixError;

/// Where a media binary came from. Surfaced rather than hidden: falling back to
/// a system install is allowed in development, but it must be visible.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Source {
    /// Shipped next to the application executable.
    BesideExecutable,
    /// Dropped into `src-tauri/binaries` for development or packaging.
    ProjectBinaries,
    /// A system install, development only.
    SystemPath,
}

#[derive(Debug, Clone)]
pub struct Binary {
    pub path: PathBuf,
    pub source: Source,
}

impl Source {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::BesideExecutable => "besideExecutable",
            Self::ProjectBinaries => "projectBinaries",
            Self::SystemPath => "systemPath",
        }
    }
}

/// Resolve a media binary. Order: beside the executable, then the project
/// binaries directory, then a system install. Never a silent search: the caller
/// gets the source back and is expected to show it when it is not the bundled
/// one.
pub fn resolve(name: &str) -> Result<Binary, KirpixError> {
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            let candidate = dir.join(name);
            if candidate.is_file() {
                return Ok(Binary {
                    path: candidate,
                    source: Source::BesideExecutable,
                });
            }
        }
    }

    let project = Path::new(env!("CARGO_MANIFEST_DIR")).join("binaries");
    if let Ok(entries) = std::fs::read_dir(&project) {
        let prefix = format!("{name}-");
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_file() {
                continue;
            }
            let file_name = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or_default();
            if file_name == name || file_name.starts_with(&prefix) {
                return Ok(Binary {
                    path,
                    source: Source::ProjectBinaries,
                });
            }
        }
    }

    #[cfg(unix)]
    {
        let system = PathBuf::from(format!("/usr/bin/{name}"));
        if system.is_file() {
            return Ok(Binary {
                path: system,
                source: Source::SystemPath,
            });
        }
    }

    Err(KirpixError::FfmpegMissing {
        name: name.to_string(),
    })
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaInfo {
    pub duration_ms: u64,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub has_audio: bool,
    /// Which binary answered, and where it came from.
    pub source: String,
}

#[derive(Deserialize)]
struct ProbeDoc {
    format: Option<ProbeFormat>,
    streams: Option<Vec<ProbeStream>>,
}

#[derive(Deserialize)]
struct ProbeFormat {
    duration: Option<String>,
}

#[derive(Deserialize)]
struct ProbeStream {
    codec_type: Option<String>,
    width: Option<u32>,
    height: Option<u32>,
}

/// Ask FFprobe for JSON rather than scraping `ffmpeg -i` output.
pub fn probe(file: &Path) -> Result<MediaInfo, KirpixError> {
    if !file.is_file() {
        return Err(KirpixError::MediaUnreadable {
            path: file.display().to_string(),
            reason: "file not found".to_string(),
        });
    }

    let binary = resolve("ffprobe")?;
    let output = Command::new(&binary.path)
        .args([
            "-v",
            "error",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
        ])
        .arg(file)
        .output()
        .map_err(|err| KirpixError::MediaUnreadable {
            path: file.display().to_string(),
            reason: err.to_string(),
        })?;

    if !output.status.success() {
        let tail = String::from_utf8_lossy(&output.stderr)
            .lines()
            .last()
            .unwrap_or("no output")
            .to_string();
        return Err(KirpixError::MediaProbeFailed {
            path: file.display().to_string(),
            tail,
        });
    }

    let doc: ProbeDoc =
        serde_json::from_slice(&output.stdout).map_err(|err| KirpixError::MediaProbeFailed {
            path: file.display().to_string(),
            tail: err.to_string(),
        })?;

    let seconds: f64 = doc
        .format
        .as_ref()
        .and_then(|f| f.duration.as_deref())
        .and_then(|d| d.parse().ok())
        .ok_or_else(|| KirpixError::MediaProbeFailed {
            path: file.display().to_string(),
            tail: "no duration in the container".to_string(),
        })?;

    let streams = doc.streams.unwrap_or_default();
    let video = streams
        .iter()
        .find(|s| s.codec_type.as_deref() == Some("video"));

    Ok(MediaInfo {
        duration_ms: (seconds * 1000.0).round() as u64,
        width: video.and_then(|s| s.width),
        height: video.and_then(|s| s.height),
        has_audio: streams
            .iter()
            .any(|s| s.codec_type.as_deref() == Some("audio")),
        source: binary.source.as_str().to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn eval_media() -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR")).join("../../eval/media/tr-tedx-kaygi.mp4")
    }

    #[test]
    fn resolves_both_binaries() {
        for name in ["ffmpeg", "ffprobe"] {
            let binary = resolve(name).expect("binary should resolve");
            assert!(binary.path.is_file());
        }
    }

    #[test]
    fn probes_the_turkish_recording() {
        let path = eval_media();
        if !path.is_file() {
            eprintln!("skipped: {} is not present", path.display());
            return;
        }
        let info = probe(&path).expect("probe should succeed");
        let expected = 877_650i64;
        assert!(
            (info.duration_ms as i64 - expected).abs() < 500,
            "duration was {} ms",
            info.duration_ms
        );
        assert!(info.has_audio);
        assert!(info.width.is_some() && info.height.is_some());
    }

    #[test]
    fn reports_a_missing_file_rather_than_guessing() {
        let err = probe(Path::new("/nonexistent/clip.mp4")).unwrap_err();
        assert!(matches!(err, KirpixError::MediaUnreadable { .. }));
    }
}
