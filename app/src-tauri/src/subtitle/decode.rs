use crate::error::KirpixError;

/// Which decoding produced the text. Shown to the user: a file that needed a
/// legacy decoding is a file whose timings deserve suspicion.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Encoding {
    Utf8,
    Utf8Bom,
    Windows1254,
}

impl Encoding {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Utf8 => "utf-8",
            Self::Utf8Bom => "utf-8-bom",
            Self::Windows1254 => "windows-1254",
        }
    }
}

/// Decode subtitle bytes.
///
/// UTF-8 first, with a byte order mark stripped, then Windows-1254 for the
/// Turkish files that predate it. Windows-1254 maps every byte, so it never
/// fails; the guard against a file that is neither is the empty-table check
/// after parsing, not this function.
pub fn decode(bytes: &[u8]) -> (String, Encoding) {
    if let Some(rest) = bytes.strip_prefix(&[0xEF, 0xBB, 0xBF]) {
        if let Ok(text) = std::str::from_utf8(rest) {
            return (normalize_newlines(text), Encoding::Utf8Bom);
        }
    }

    if let Ok(text) = std::str::from_utf8(bytes) {
        return (normalize_newlines(text), Encoding::Utf8);
    }

    let (text, _, _) = encoding_rs::WINDOWS_1254.decode(bytes);
    (normalize_newlines(&text), Encoding::Windows1254)
}

fn normalize_newlines(text: &str) -> String {
    text.replace("\r\n", "\n").replace('\r', "\n")
}

pub fn read_file(path: &std::path::Path) -> Result<(String, Encoding), KirpixError> {
    let bytes = std::fs::read(path).map_err(|err| KirpixError::SubtitleUnreadable {
        path: path.display().to_string(),
        reason: err.to_string(),
    })?;
    Ok(decode(&bytes))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn plain_utf8() {
        let (text, encoding) = decode("kaygı".as_bytes());
        assert_eq!(text, "kaygı");
        assert_eq!(encoding, Encoding::Utf8);
    }

    #[test]
    fn strips_a_byte_order_mark() {
        let mut bytes = vec![0xEF, 0xBB, 0xBF];
        bytes.extend_from_slice("endişe".as_bytes());
        let (text, encoding) = decode(&bytes);
        assert_eq!(text, "endişe");
        assert_eq!(encoding, Encoding::Utf8Bom);
    }

    #[test]
    fn decodes_windows_1254_as_a_last_resort() {
        // 0xFD is "ı" and 0xFE is "ş" in Windows-1254, and neither is valid UTF-8.
        let (text, encoding) = decode(b"kayg\xFD \xFEey");
        assert_eq!(encoding, Encoding::Windows1254);
        assert_eq!(text, "kaygı şey");
    }

    #[test]
    fn normalizes_crlf() {
        let (text, _) = decode(b"a\r\nb\rc");
        assert_eq!(text, "a\nb\nc");
    }
}
