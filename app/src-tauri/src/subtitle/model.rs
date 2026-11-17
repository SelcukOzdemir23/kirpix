/// One subtitle line, as the rest of the program sees it.
///
/// `index` is the product's unit of meaning: the interface shows it, ground
/// truth records it, and a model will later return it instead of a timestamp
/// (constitution, article V). It is 1-based.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Cue {
    pub index: usize,
    pub start_ms: u64,
    pub end_ms: u64,
    pub text: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CueTable {
    pub cues: Vec<Cue>,
    pub encoding: String,
}

impl CueTable {
    pub fn len(&self) -> usize {
        self.cues.len()
    }

    pub fn is_empty(&self) -> bool {
        self.cues.is_empty()
    }

    pub fn cue(&self, index: usize) -> Option<&Cue> {
        self.cues.get(index.checked_sub(1)?)
    }

    /// The last moment any cue ends, in milliseconds.
    pub fn last_end_ms(&self) -> u64 {
        self.cues.iter().map(|c| c.end_ms).max().unwrap_or(0)
    }
}
