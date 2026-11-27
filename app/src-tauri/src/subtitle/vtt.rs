use super::model::{Cue, CueTable};

/// Parse WebVTT and SRT into cues, following feature 001 FR-003 exactly:
///
/// 1. a line that begins with a timestamp range starts a cue;
/// 2. a cue's text runs until the next timestamp line, the next blank line, or
///    the end of the file, whichever comes first;
/// 3. inline markup is stripped, whitespace collapsed, and a cue left with no
///    text is dropped;
/// 4. a cue identical to the one immediately before it is dropped, because
///    files in the wild repeat blocks.
///
/// Both formats share this structure; SRT differs only in the decimal separator
/// and in numbering its cues, and a leading number line is ignored because no
/// cue is open when it arrives.
pub fn parse(text: &str) -> Vec<Cue> {
    let mut builder = Builder::default();

    for line in text.split('\n') {
        if let Some((start_ms, end_ms)) = parse_timing(line) {
            builder.flush();
            builder.pending = Some(Pending {
                start_ms,
                end_ms,
                lines: Vec::new(),
            });
        } else if line.trim().is_empty() {
            builder.flush();
        } else if let Some(pending) = builder.pending.as_mut() {
            pending.lines.push(line.to_string());
        }
    }

    builder.flush();
    builder.cues
}

pub fn parse_table(text: &str, encoding: &str) -> CueTable {
    CueTable {
        cues: parse(text),
        encoding: encoding.to_string(),
    }
}

#[derive(Default)]
struct Builder {
    cues: Vec<Cue>,
    pending: Option<Pending>,
}

struct Pending {
    start_ms: u64,
    end_ms: u64,
    lines: Vec<String>,
}

impl Builder {
    fn flush(&mut self) {
        let Some(pending) = self.pending.take() else {
            return;
        };

        let text = clean(&pending.lines.join(" "));
        if text.is_empty() {
            return;
        }

        let repeated = self.cues.last().is_some_and(|last| {
            last.start_ms == pending.start_ms && last.end_ms == pending.end_ms && last.text == text
        });
        if repeated {
            return;
        }

        self.cues.push(Cue {
            index: self.cues.len() + 1,
            start_ms: pending.start_ms,
            end_ms: pending.end_ms,
            text,
        });
    }
}

/// `00:01:41.639 --> 00:01:45.433 align:start` and the SRT comma form.
fn parse_timing(line: &str) -> Option<(u64, u64)> {
    let (start, rest) = line.split_once("-->")?;
    let start_ms = parse_timestamp(start.trim())?;
    let end_token = rest.split_whitespace().next()?;
    let end_ms = parse_timestamp(end_token)?;
    Some((start_ms, end_ms))
}

/// `HH:MM:SS.mmm`, `HH:MM:SS,mmm` or a bare `MM:SS.mmm`.
fn parse_timestamp(raw: &str) -> Option<u64> {
    let normalized = raw.replace(',', ".");
    let parts: Vec<&str> = normalized.split(':').collect();
    if parts.len() < 2 || parts.len() > 3 {
        return None;
    }

    let mut values = Vec::with_capacity(3);
    for part in &parts {
        values.push(part.parse::<f64>().ok()?);
    }
    if parts.len() == 2 {
        values.insert(0, 0.0);
    }

    let seconds = values[0] * 3600.0 + values[1] * 60.0 + values[2];
    Some((seconds * 1000.0).round() as u64)
}

fn clean(text: &str) -> String {
    let without_tags = strip_tags(text);
    let unescaped = without_tags
        .replace("&nbsp;", " ")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&amp;", "&");
    unescaped.split_whitespace().collect::<Vec<_>>().join(" ")
}

fn strip_tags(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    let mut inside = false;
    for ch in text.chars() {
        match ch {
            '<' => inside = true,
            '>' => inside = false,
            _ if !inside => out.push(ch),
            _ => {}
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::subtitle::decode;

    fn fixture(name: &str) -> Option<String> {
        let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../eval/fixtures")
            .join(name);
        if !path.is_file() {
            eprintln!("skipped: {} is not present", path.display());
            return None;
        }
        let (text, _) = decode::read_file(&path).expect("fixture should decode");
        Some(text)
    }

    #[test]
    fn parses_the_english_fixture_to_a_known_count() {
        let Some(text) = fixture("en-single-story.en.vtt") else {
            return;
        };
        let cues = parse(&text);

        // 390 timestamp pairs in the file, 357 cues under the rule: repeated
        // blocks collapse and a run-on timestamp starts a new cue.
        assert_eq!(cues.len(), 357, "cue count changed");
        assert_eq!(cues[0].index, 1);
        assert!(cues[37]
            .text
            .starts_with("Because all I had read were books"));
        assert!(
            !cues.iter().any(|c| c.text.contains("-->")),
            "a timestamp leaked into cue text"
        );
        assert!(
            !cues.windows(2).any(|w| w[0].start_ms == w[1].start_ms
                && w[0].end_ms == w[1].end_ms
                && w[0].text == w[1].text),
            "a repeated cue survived"
        );
    }

    #[test]
    fn parses_the_turkish_fixture_to_a_known_count() {
        let Some(text) = fixture("tr-tedx-kaygi.tr.vtt") else {
            return;
        };
        let cues = parse(&text);
        assert_eq!(cues.len(), 239, "cue count changed");
        assert!(cues[58]
            .text
            .starts_with("Yaklaşık 2-3 dakika sonra o korku"));
    }

    #[test]
    fn srt_timing_and_numbering() {
        let text = "1\n00:00:01,000 --> 00:00:02,500\nMerhaba.\n\n2\n00:00:03,000 --> 00:00:04,000\nDünya.\n";
        let cues = parse(text);
        assert_eq!(cues.len(), 2);
        assert_eq!(cues[0].start_ms, 1000);
        assert_eq!(cues[0].end_ms, 2500);
        assert_eq!(cues[1].text, "Dünya.");
    }

    #[test]
    fn strips_markup_collapses_space_and_drops_empty_cues() {
        let text = "WEBVTT\n\nNOTE a comment\n\n00:00:01.000 --> 00:00:02.000\n<c.yellow>kaygı</c>\nve   endişe\n\n00:00:03.000 --> 00:00:04.000\n<v Speaker>   </v>\n";
        let cues = parse(text);
        assert_eq!(cues.len(), 1);
        assert_eq!(cues[0].text, "kaygı ve endişe");
    }

    #[test]
    fn collapses_a_verbatim_repeat() {
        let text = "00:00:01.000 --> 00:00:02.000\na\n\n00:00:01.000 --> 00:00:02.000\na\n\n00:00:03.000 --> 00:00:04.000\nb\n";
        let cues = parse(text);
        assert_eq!(cues.len(), 2);
        assert_eq!(cues[1].index, 2);
    }

    #[test]
    fn reads_the_edge_srt_with_crlf_tags_and_a_repeat() {
        let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/edge.srt");
        let (text, _) = decode::read_file(&path).expect("edge fixture should decode");
        let cues = parse(&text);

        assert_eq!(
            cues.len(),
            2,
            "a repeat and an empty cue should both be dropped"
        );
        assert_eq!(cues[0].text, "kaygı ve endişe");
        assert_eq!(cues[0].start_ms, 1000);
        assert_eq!(cues[1].text, "Yalnızca bu satır kalmalı.");
        assert_eq!(cues[1].index, 2);
    }

    #[test]
    fn reads_the_srt_render_of_the_turkish_recording() {
        let Some(text) = fixture("tr-tedx-kaygi.srt") else {
            return;
        };
        let cues = parse(&text);

        assert_eq!(cues.len(), 239, "cue count changed");
        // FFmpeg's render carries the transcriber credit as the first cue, which
        // the VTT does not have. Same count, shifted boundaries: the two formats
        // are not interchangeable, so ground truth names the file it belongs to.
        assert!(cues[0].text.starts_with("Transcriber:"));
        assert!(cues[1].text.starts_with("Hepinize merhabalar"));
    }

    #[test]
    fn accepts_a_missing_hours_field() {
        assert_eq!(parse_timestamp("01:02.500"), Some(62_500));
        assert_eq!(parse_timestamp("01:02:03.500"), Some(3_723_500));
    }
}
