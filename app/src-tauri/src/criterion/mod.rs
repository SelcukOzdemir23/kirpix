pub mod normalize;
pub mod topic;

pub use normalize::{matches_token, normalize, tokens};
pub use topic::{find, Bounds, Candidate};
