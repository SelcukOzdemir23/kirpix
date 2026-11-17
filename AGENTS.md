# Working in this repository

Read `.specify/memory/constitution.md` before anything else. It outranks specs,
plans and code, and every plan review checks the work against it.

## Layout

- `site/` the project site. Astro, static, no client JavaScript, no backend.
  Turkish at `/`, English at `/en/`. All copy lives in `site/src/content/copy.ts`.
- `app/` the desktop application. Tauri 2 shell, Rust for filesystem, process
  control, keychain and FFmpeg invocation, React and TypeScript for the
  interface. Not scaffolded yet.
- `specs/` one folder per feature, numbered, written before the code.
- `eval/` the fixed evaluation set. `manifest.json` is the source of truth;
  `eval/media/` is gitignored. See `eval/README.md`.
- `.specify/` Spec Kit scaffolding. Do not edit generated scripts or templates
  to work around a rule; amend the constitution instead.

## Process

This repository follows the Spec Kit sequence: constitution, specify, plan,
tasks, implement. One feature folder per slice.

- No implementation task without a spec that states its acceptance criteria.
- Every acceptance criterion maps to a test or a documented manual check against
  `eval/`.
- A plan that violates the constitution stops. Amendments go through the
  Governance section, with a version bump.
- One task, one commit, and the app stays runnable after each commit.
- One feature at a time, in number order. A spec may be written ahead, code may
  not: finish and merge feature N before starting feature N+1. No two features
  in flight at once.
- Specs, code, comments and commit messages in English. The interface ships in
  Turkish and English.

## Commands

```sh
cd site && npm install && npm run dev      # site, http://localhost:4321
cd site && npm run build                   # -> site/dist
```

Rust is installed under `~/.cargo` (rustup, minimal profile). Add it to the
shell with `export PATH="$HOME/.cargo/bin:$PATH"` or source `~/.cargo/env`.

## Things that are not allowed

- Sending media anywhere. Subtitle text only, to a configured provider, after an
  explicit confirmation.
- Telemetry, analytics, crash reporting, accounts, remote config.
- Asking a model for timestamps. Models return cue indices.
- Sending a model the whole transcript when deterministic code can shortlist
  candidates first.
- Silent fallbacks. If the app degrades, it says so where the work happens.
