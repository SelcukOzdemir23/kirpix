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

step "rust: test"
(cd app/src-tauri && cargo test --quiet)

step "app: typecheck and build"
(cd app && npx tsc --noEmit && npm run build --silent)

step "site: build"
(cd site && npm run build --silent)

printf '\nall checks passed\n'
