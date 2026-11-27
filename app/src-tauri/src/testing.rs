//! Test support shared by every module.
//!
//! Some tests read the evaluation set under `eval/`. The subtitle fixtures are
//! committed; the media is not (see `eval/README.md`). A test whose input is
//! absent does not pretend to pass quietly: it says it was skipped, and
//! `scripts/check.sh` counts those lines. With `KIRPIX_REQUIRE_EVAL=1` a skip
//! becomes a failure, so a machine that is supposed to hold the full set
//! cannot pass without running it.

/// The environment variable that turns a skip into a failure.
pub const REQUIRE_EVAL: &str = "KIRPIX_REQUIRE_EVAL";

/// Report that a test could not run because its input is missing.
///
/// Prints one `skipped:` line, which `scripts/check.sh` counts, or panics when
/// [`REQUIRE_EVAL`] is set to `1`.
pub fn skip(reason: &str) {
    if std::env::var(REQUIRE_EVAL).as_deref() == Ok("1") {
        panic!("{REQUIRE_EVAL}=1 but the test input is missing: {reason}");
    }
    eprintln!("skipped: {reason}");
}
