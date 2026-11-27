#!/usr/bin/env bash
# Run every check a pull request must pass, in the order a failure is cheapest
# to read. Exits non-zero on the first failure.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.cargo/bin:$PATH"

step() { printf '\n== %s\n' "$1"; }

step "rust: format"
(cd app/src-tauri && cargo fmt --check)

step "rust: lint"
if cargo clippy --version >/dev/null 2>&1; then
  (cd app/src-tauri && cargo clippy --all-targets -- -D warnings)
else
  echo "clippy is not installed: rustup component add clippy" >&2
  exit 1
fi

step "rust: documentation"
# Constitution, code structure: the number of public items without a doc
# comment only goes down. Lower the baseline when a change documents more.
doc_baseline=183
undocumented=$(cd app/src-tauri && CARGO_TARGET_DIR=target/doc-check RUSTFLAGS="-W missing-docs" cargo build --lib --quiet 2>&1 \
  | grep -c "^warning: missing documentation" || true)
echo "$undocumented public items without a doc comment (baseline $doc_baseline)"
if [ "$undocumented" -gt "$doc_baseline" ]; then
  echo "undocumented public items went up: document the new ones" >&2
  exit 1
fi

step "rust: test"
# Tests whose evaluation input is missing print one "skipped:" line each
# (app/src-tauri/src/testing.rs). Count them so a partial run is never read as
# a full one. KIRPIX_REQUIRE_EVAL=1 turns every skip into a failure.
test_log="$(mktemp)"
trap 'rm -f "$test_log"' EXIT
(cd app/src-tauri && cargo test --quiet -- --nocapture) 2>&1 | tee "$test_log" \
  | grep -E "^test result|^error|FAILED|panicked" || true
if grep -qE "^test result: FAILED|^error" "$test_log"; then
  echo "rust tests failed" >&2
  exit 1
fi
skipped=$( (grep -o "skipped: " "$test_log" || true) | wc -l | tr -d ' ')
ignored=$(grep -oE "[0-9]+ ignored" "$test_log" | awk '{n += $1} END {print n + 0}')
if [ "$ignored" -gt 0 ]; then
  printf 'NOTE: %s tests ignored as known failures (cargo test -- --ignored lists them)\n' "$ignored"
fi
if [ "$skipped" -gt 0 ]; then
  printf 'WARNING: %s tests skipped because eval/ input is missing (see eval/README.md)\n' "$skipped"
fi

step "app: component size"
# Constitution, code structure: a component file above 300 lines is a defect
# (feature 007, SC-006). Components (.tsx) and the hooks that hold their state
# are measured; data modules (strings, fixtures) are not components.
oversize=$(find app/src -name '*.tsx' -o -path 'app/src/state/*.ts' | xargs wc -l \
  | awk '$2 != "total" && $1 > 300 {print $2 " (" $1 " lines)"}')
if [ -n "$oversize" ]; then
  echo "over 300 lines:" >&2
  echo "$oversize" >&2
  exit 1
fi
echo "every component and hook is 300 lines or fewer"

step "app: typecheck and build"
(cd app && npx tsc --noEmit && npm run build --silent)

step "site: build"
(cd site && npm run build --silent)

if [ "${skipped:-0}" -gt 0 ]; then
  printf '\nall checks passed, %s tests skipped for missing eval/ input\n' "$skipped"
else
  printf '\nall checks passed\n'
fi
