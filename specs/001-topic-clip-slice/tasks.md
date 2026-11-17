# Tasks: Topic clip slice

**Input**: `spec.md`, `plan.md`

**Rule**: one task, one commit, and the application still builds and runs after
each. A task that cannot be demonstrated on its own is too large.

Paths are relative to `app/` unless stated.

## Phase 1: Scaffold

- [ ] **T001** Scaffold Tauri 2 with React, TypeScript, Vite and Tailwind in
  `app/`. One window, one page, an empty state that says what to do.
  *Done when*: `npm run tauri dev` opens a window on Linux and `npm run build`
  succeeds.

- [ ] **T002** Bundle FFmpeg and FFprobe as `externalBin`, with a Rust module
  that resolves them at runtime and probes a path given on the command line.
  *Done when*: a window action prints `{ duration_ms, width, height, has_audio }`
  for `eval/media/tr-tedx-kaygi.mp4` and reports a readable error when the file
  is missing.
  *Depends on*: T001

## Phase 2: Subtitle core

- [ ] **T003** `Cue`, `CueTable`, and decoding: UTF-8 with byte order mark
  stripped, then Windows-1254, then `SubtitleUnreadable` naming the file.
  *Done when*: unit tests cover all three paths.

- [ ] **T004** VTT parser that implements FR-003 step by step, tested against
  `eval/fixtures/en-single-story.en.vtt`: exactly 357 cues, the repeated block
  collapsed, the run-on timestamp split, and cue 38 text starting "Because all I
  had read were books".
  *Depends on*: T003

- [ ] **T005** SRT parser with the same cue model, tested on a small fixture
  committed next to the code, including a CRLF file and an inline tag.
  *Depends on*: T003

- [ ] **T006** `open_session` and `session_cues` commands, plus the file pickers
  that call them. The screen shows file names, media duration and cue count.
  *Done when*: opening the Turkish recording shows 14:37 and 239 cues.
  *Depends on*: T002, T004

## Phase 3: Matching

- [ ] **T007** Normalization: Unicode NFC, Turkish case folding for dotted and
  dotless i, punctuation to space, whitespace collapsed.
  *Done when*: `KAYGI` matches `kaygı`, `İstanbul` and `ıstanbul` normalize the
  same way, and `endişe` matches `endişesi` under the four-character rule.

- [ ] **T008** Topic matching, merging within two seconds, half-second padding,
  clamping, duration bounds, ordering by distinct terms then matched duration
  then start. Exhaustive unit tests on hand-built tables.
  *Depends on*: T007

- [ ] **T009** Candidate construction with `matched_terms` and a reason sentence
  generated from the matched lines. The type must make a candidate without
  matched cues unrepresentable.
  *Depends on*: T008

## Phase 4: Interface

- [ ] **T010** Search form: terms, minimum and maximum duration, search disabled
  while the term list is empty, plus the candidate list. Turkish and English
  strings in `i18n/copy.ts`.
  *Depends on*: T009

- [ ] **T011** Candidate card: range, duration, reason, and an expandable list of
  its cues with their own timecodes. Reject action. A card with no evidence is
  not rendered.
  *Depends on*: T010

- [ ] **T012** Boundary adjustment by one second and by one cue, with reset, kept
  in view state until the cut.
  *Depends on*: T011

## Phase 5: Cutting

- [ ] **T013** `cut_clips` command: re-encoding builder, `-ss` before `-i`, `-t`
  for duration, `-progress pipe:1` parsing, collision-safe naming, per-clip
  result, and one failure not aborting the batch.
  *Done when*: cutting one candidate writes a file whose duration is within
  0.25 s of the requested range, verified by FFprobe.
  *Depends on*: T002, T012

- [ ] **T014** Cut panel: output folder picker, per-clip progress, result list
  with paths, and an action to reveal the folder. Errors appear per clip.
  *Depends on*: T013

## Phase 6: Verification

- [ ] **T015** Golden and determinism tests: search both recordings and assert
  the 80 percent overlap against `eval/gold/` (SC-001), and byte-identical
  candidate output across two runs (SC-004). Record the manual rows for SC-002
  and SC-005 in the pull request, and flip `eval/gold/*.json` to `reviewed` once
  a person has confirmed the ranges.
  *Depends on*: T008, T013

## Definition of done for the slice

- Every functional requirement in `spec.md` maps to a task above.
- `cargo test` passes with the fixtures present.
- One clip cut from each eval recording is played and accepted.
- The flow runs with the network interface down.
- The constitution check in the pull request is complete and every box is true.
