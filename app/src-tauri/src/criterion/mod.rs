pub mod marks;
pub mod normalize;
pub mod topic;

pub use marks::{term_spans, Span};
pub use normalize::{matches_token, normalize, tokens};
pub use topic::{find, Bounds, Candidate};
