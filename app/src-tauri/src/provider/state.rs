//! What the model layer remembers between commands: the chosen mode, and the
//! keys, which live behind the [`KeyStore`] this state was built with.

use super::{KeyStore, Mode};

pub struct ProviderState {
    pub mode: Mode,
    pub keys: Box<dyn KeyStore + Send>,
}

impl ProviderState {
    pub fn new(keys: Box<dyn KeyStore + Send>) -> Self {
        Self {
            mode: Mode::default(),
            keys,
        }
    }
}
