# Tasks: Topic clip slice

**Input**: `spec.md`, `plan.md`

**Rule**: one task, one commit, and the application still builds and runs after
each. A task that cannot be demonstrated on its own is too large.

Paths are relative to `app/` unless stated.

## Phase 1: Scaffold

- [x] **T001** Scaffold Tauri 2 with React, TypeScript, Vite and Tailwind in
  `app/`. One window, one page, an empty state that says what to do.
  *Done when*: `npm run tauri dev` opens a window on Linux and `npm run build`
  succeeds.
  *Evidence*: `npm run build` writes `app/dist`; `cargo check` finishes clean
  against Tauri 2.12.6; the built page renders at 1100x760 with the palette
  applied. The window was not launched in the development environment, so the
  first `npm run tauri dev` on a desktop is still owed by the user.

- [x] **T002** Resolve the media binaries and probe a file. Resolution order:
  beside the executable, then `src-tauri/binaries`, then a system install, with
  the source returned so a system fallback is never silent.
  *Refined during the task*: bundling as `externalBin` moves to the release
  feature. The system FFmpeg here is 424 KB and dynamically linked against
  libav*, so copying it into the bundle would ship a binary that only works on
  this machine. Releases need static builds, and they belong with packaging,
  where the size budget in the constitution is measured.
  *Evidence*: `cargo test` probes `eval/media/tr-tedx-kaygi.mp4` at 877,650 ms
  with audio and video streams present; a missing path returns
  `MediaUnreadable`; both binaries resolve.
  *Depends on*: T001

## Phase 2: Subtitle core

- [x] **T003** `Cue`, `CueTable`, and decoding: UTF-8 with byte order mark
  stripped, then Windows-1254, then `SubtitleUnreadable` naming the file.
  *Done when*: unit tests cover all three paths.
  *Refined during the task*: Windows-1254 maps every byte, so decoding cannot
  fail there. The real guard against a file that is neither is the empty-table
  check after parsing, and `SubtitleUnreadable` covers the file that cannot be
  read at all.
  *Evidence*: four decoding tests pass, covering UTF-8, a stripped byte order
  mark, Windows-1254 and CRLF normalisation.

- [x] **T004** VTT parser that implements FR-003 step by step, tested against
  `eval/fixtures/en-single-story.en.vtt`: exactly 357 cues, the repeated block
  collapsed, the run-on timestamp split, and cue 38 text starting "Because all I
  had read were books".
  *Evidence*: the English fixture parses to 357 cues and the Turkish one to 239,
  matching the counts in `eval/manifest.json` that were produced by an
  independent reference parser. Two implementations agreeing on both files is
  the check that the rule is written clearly enough to be followed.
  *Depends on*: T003

- [x] **T005** SRT fixtures and tests. One parser covers both formats, so the
  task became fixture work rather than a second parser.
  *Refined during the task*: instead of inventing an SRT, `eval/fixtures/
  tr-tedx-kaygi.srt` is rendered from the real VTT with ffmpeg, and a small
  `app/src-tauri/tests/fixtures/edge.srt` covers what the render does not: CRLF
  endings, inline tags, an empty cue and a verbatim repeat.
  *Evidence*: the rendered SRT parses to 239 cues, with the transcriber credit
  first and "Hepinize merhabalar" second; the edge file yields two cues out of
  four. This also showed the two formats are not interchangeable, since the same
  count comes with shifted boundaries, so gold files now record which fixture
  they belong to.
  *Depends on*: T003

- [x] **T006** `open_session` and `session_cues` commands, plus the file pickers
  that call them. The screen shows file names, media duration and cue count.
  *Done when*: opening the Turkish recording shows 14:37 and 239 cues.
  *Evidence*: `cargo test` opens the Turkish recording through `session::open`
  and reports 239 cues, utf-8 and 877,650 ms, and pages cues within bounds; the
  built screen renders with no page errors and an empty state that says what to
  do. The picker to command path needs a desktop run to observe, because the
  dialog is the operating system's; that run is still owed by the user, along
  with the T001 window check.
  *Note*: the media source is shown on screen when it is a system FFmpeg, so a
  development fallback never looks like a normal state.
  *Depends on*: T002, T004

## Phase 3: Matching

- [x] **T007** Normalization: Unicode NFC, Turkish case folding for dotted and
  dotless i, punctuation to space, whitespace collapsed.
  *Done when*: `KAYGI` matches `kaygı`, and `endişe` matches `endişesi` under the
  four-character rule.
  *Corrected during the task*: this task originally said `İstanbul` and
  `ıstanbul` should normalize the same way. They must not: the first is
  "istanbul" and the second is a different spelling, and folding the dotless i
  into the dotted one would make the matcher wrong in the language it exists
  for. The circumflex is folded instead, so `kâğıt` and `kağıt` agree, while
  ç ğ ı ö ş ü stay distinct.
  *Evidence*: six tests cover case, circumflex, punctuation, the four-character
  suffix rule, no-match-inside-a-word, and tokenisation.

- [x] **T008** Topic matching, merging, half-second padding, clamping, duration
  bounds, ordering by distinct terms then matched duration then start. Unit
  tests on hand-built tables, plus a test against the recorded ground truth.
  *Amended during the task*: the two second merge window, as specified, turned
  one passage into four fragments on the real recording (cues 59-60, 63, 66, 70
  where the expected answer is 59-70). The window is now twenty seconds and
  eight cues, and FR-008 records the change. The ground-truth test is what
  decided it, which is what article X asks for.
  *Evidence*: twelve tests. The ground-truth test now overlaps the expected
  range by 100 percent, where the specified window managed 17.
  *Depends on*: T007

- [x] **T009** Candidate construction with `matched_terms`, and a guarantee that
  a candidate without matched cues cannot exist.
  *Amended during the task*: the reason sentence is composed by the interface
  from `matchedTerms` instead of being generated in Rust. The same data has to
  read in Turkish and English, and a sentence built in Rust could drift from
  the terms that produced it. Article IV is satisfied by the data, not by the
  wording.
  *Evidence*: the builder returns no candidate when a range contains no matched
  cue, and `matched_terms` is ordered by the order the user typed them.
  *Depends on*: T008

## Phase 4: Interface

- [x] **T010** Search form: terms, minimum and maximum duration, search disabled
  while the term list is empty, plus the candidate list. Turkish and English
  strings in `i18n/copy.ts`.
  *Evidence*: the screen was rendered from seeded data and inspected at
  1100x900: form, three cards, the running total and the duration badge. The
  dialog and the command round trip still need a desktop run.
  *Depends on*: T009

- [x] **T011** Candidate card: range, duration, reason, and an expandable list of
  its cues with their own timecodes. Reject action. A card with no evidence is
  not rendered.
  *Note*: the reason sentence is composed from `matchedTerms` in the interface,
  per T009, so it exists in both languages without a second source of truth.
  *Depends on*: T010

- [x] **T012** Boundary adjustment by one second and by one cue, with reset, kept
  in view state until the cut.
  *Note*: cue moves are computed from the loaded cue list, which includes one
  cue beyond each edge. Choosing by timestamp rather than by position means the
  buttons still behave after a one second move has already shifted the edge.
  *Depends on*: T011

## Phase 5: Cutting

- [x] **T013** `cut_clips` command: re-encoding builder, `-ss` before `-i`, `-t`
  for duration, `-progress pipe:1` parsing, collision-safe naming, per-clip
  result, and one failure not aborting the batch.
  *Done when*: cutting one candidate writes a file whose duration is within
  0.25 s of the requested range, verified by FFprobe.
  *Evidence*: a test cuts 41.88 s from the Turkish recording, probes the file
  and finds 41.88 s, and the same command line run by hand produces h264 1280x720
  with aac audio at exactly the requested length. Four more tests cover naming,
  collisions, empty ranges and a batch that survives a failure.
  *Depends on*: T002, T012

- [x] **T014** Cut panel: output folder picker, per-clip progress, result list
  with paths. Errors appear per clip.
  *Amended during the task*: the "reveal the folder" action is dropped. It
  needs the opener plugin and a permission, and it earns its place when the app
  is installed and the user no longer has a terminal in the output folder. The
  path of every written file is shown instead.
  *Evidence*: the panel was rendered from seeded data and inspected: button,
  progress readout and the list of written files with their durations.
  *Depends on*: T013

## Phase 6: Verification

- [ ] **T015** Verification. The automated half is done and passing; the manual
  rows are not.
  *Done*: SC-001, the search on the Turkish recording overlaps a recorded range
  by 100 percent; SC-004, two runs produce byte-identical candidates; and the
  duration half of SC-002, since a cut clip is measured at the length its card
  showed, within 250 ms.
  *Owed to a person with a desktop*: play one clip from each recording and
  confirm it starts and ends where the card said (SC-002); run the whole flow
  with the network interface down (SC-005); and flip `eval/gold/*.json` from
  `proposed` to `reviewed` once the ranges have been read.
  *Desktop session (CachyOS, KWin on Wayland, reported by the owner)*: a clip cut
  from the Turkish recording was played and starts and ends where its card
  said. Still owed: one clip from the English recording, the offline run, and
  the gold review.
  *Added by the analysis of 2026-11-27*: SC-006 was never in this list. Also
  owed: on each recording, one candidate the owner accepts without moving its
  boundaries, one row per recording.
  This box stays open until those four are done, because a spec that says
  "verified" while half of it has not been looked at is worse than one that
  says exactly what is left.
  *Depends on*: T008, T013

## Definition of done for the slice

- Every functional requirement in `spec.md` maps to a task above.
- `cargo test` passes with the fixtures present.
- One clip cut from each eval recording is played and accepted.
- The flow runs with the network interface down.
- The constitution check in the pull request is complete and every box is true.
