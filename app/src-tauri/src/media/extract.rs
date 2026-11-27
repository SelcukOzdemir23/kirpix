use std::path::Path;
use std::process::{Command, Stdio};

use super::ffmpeg;
use crate::error::KirpixError;
use crate::subtitle::{parse_table, CueTable};

/// Read one subtitle track out of the container.
///
/// FFmpeg writes the track to its standard output as SRT, so nothing is left
/// beside the user's media and every text codec lands in the same parser: ASS
/// and TTML are converted on the way out rather than needing a reader each
/// (feature 002, FR-003).
pub fn extract_track(video: &Path, stream_index: usize) -> Result<CueTable, KirpixError> {
    let binary = ffmpeg::resolve("ffmpeg")?;

    let output = Command::new(&binary.path)
        .args(["-hide_banner", "-loglevel", "error", "-nostdin"])
        .arg("-i")
        .arg(video)
        .args(["-map", &format!("0:{stream_index}")])
        .args(["-f", "srt", "-"])
        .stdin(Stdio::null())
        .output()
        .map_err(|err| KirpixError::MediaUnreadable {
            path: video.display().to_string(),
            reason: err.to_string(),
        })?;

    if !output.status.success() {
        let tail = String::from_utf8_lossy(&output.stderr)
            .lines()
            .last()
            .unwrap_or("no output")
            .to_string();
        return Err(KirpixError::TrackNotText { stream_index, tail });
    }

    let text = String::from_utf8_lossy(&output.stdout).to_string();
    let table = parse_table(&text, "embedded");

    if table.is_empty() {
        return Err(KirpixError::SubtitleEmpty {
            path: format!("{} stream {stream_index}", video.display()),
        });
    }

    Ok(table)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::subtitle::read_file;

    fn eval(path: &str) -> std::path::PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../eval")
            .join(path)
    }

    #[test]
    fn the_embedded_track_matches_the_sidecar_file() {
        let mkv = eval("media/tr-tedx-kaygi.mkv");
        let sidecar = eval("fixtures/tr-tedx-kaygi.srt");
        if !mkv.is_file() || !sidecar.is_file() {
            eprintln!("skipped: fixtures are not present");
            return;
        }

        let embedded = extract_track(&mkv, 2).expect("the subrip track should extract");
        let (text, encoding) = read_file(&sidecar).expect("sidecar should read");
        let from_file = parse_table(&text, encoding.as_str());

        assert_eq!(embedded.len(), 239);
        assert_eq!(
            embedded.len(),
            from_file.len(),
            "embedded and sidecar disagree"
        );
        assert_eq!(embedded.cues[0].text, from_file.cues[0].text);
        assert_eq!(
            embedded.cues[238].text, from_file.cues[238].text,
            "the last line should match too"
        );
    }

    #[test]
    fn an_ass_track_is_converted_to_text() {
        let mkv = eval("media/tr-tedx-kaygi.mkv");
        if !mkv.is_file() {
            eprintln!("skipped: fixtures are not present");
            return;
        }

        let table = extract_track(&mkv, 3).expect("the ass track should extract");
        assert!(table.len() > 200, "an ASS track should yield real lines");
        assert!(
            table.cues[0].text.contains("Hepinize") || table.cues[0].text.contains("Transcriber")
        );
    }

    #[test]
    fn a_stream_that_does_not_exist_is_named() {
        let mkv = eval("media/tr-tedx-kaygi.mkv");
        if !mkv.is_file() {
            eprintln!("skipped: fixtures are not present");
            return;
        }

        let err = extract_track(&mkv, 9).unwrap_err();
        assert!(matches!(
            err,
            KirpixError::TrackNotText {
                stream_index: 9,
                ..
            }
        ));
    }
}
