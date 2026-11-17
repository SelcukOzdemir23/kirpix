# Tasks: Subtitle sources and alignment

**Input**: `spec.md`, `plan.md`

**Rule**: one task, one commit, and the application still builds and runs after
each.

## Phase 1: Fixtures

- [x] **T001** Add the fixtures and record them in `eval/manifest.json`: an MKV
  carrying the Turkish recording with two text subtitle tracks (one SubRip, one
  ASS, both tagged `tur` with different titles), and an SRT copy of the same
  recording shifted forward by 3.5 seconds.
  *Done when*: `ffprobe` reports both tracks with their languages and titles,
  and the shifted file's first cue starts at `00:00:03,500`.
  *Note*: this was already done while planning, because the plan depended on
  whether the toolchain could produce the files at all. The manifest now lists
  both subtitle files, the shifted one, and the two embedded streams.

## Phase 2: Sources

- [x] **T002** Probe subtitle tracks: index, codec, language, title, and whether
  the codec stores text or pictures.
  *Evidence*: seven tests. The classifier covers the four picture codecs and
  the common text ones, matching on real FFprobe codec names; the probe on the
  MKV fixture returns both tracks with `tur` and `subrip`/`ass`, and both are
  classified as text.
  *Depends on*: T001

- [x] **T003** Extract a chosen track to a cue table by reading FFmpeg's standard
  output, writing nothing to disk.
  *Done when*: the MKV's SubRip track yields 239 cues, the same count and the
  same first and last text as the sidecar SRT (SC-001).
  *Evidence*: **SC-001 is met.** The embedded SubRip track and the sidecar SRT
  produce the same 239 cues with identical first and last text. An ASS track
  converts through the same parser, and a stream index that does not exist
  returns `TrackNotText` naming the stream.
  *Depends on*: T002

- [x] **T004** Open a session from a chosen track, and the interface to choose
  one. The sidecar and embedded paths share one code path from the cue table
  onwards.
  *Done when*: opening the MKV lists two tracks and either one produces a
  session.
  *Evidence*: `open_embedded` reports 239 cues with the label "Metin" and the
  source `embedded`; a missing stream index returns `TrackMissing`. The chooser
  was rendered from seeded data: two readable tracks, one picture track shown
  disabled with the reason, and a way out to a file.
  *Note*: the session now records where its cues came from, as a file or as a
  track, and the interface shows which. Nothing downstream changed, which was
  the point of putting both sources behind one cue table.
  *Depends on*: T003

## Phase 3: Alignment

- [ ] **T005** The offset: stored on the session, applied by deriving a shifted
  cue table, never mutating the source. Report how many cues were clamped to
  zero.
  *Done when*: every cue moves by exactly the offset, indices do not change,
  and a search on a shifted table returns candidates shifted by the same amount
  (SC-004).
  *Depends on*: T004

- [ ] **T006** Audio sample: four seconds around a cue as mono 16 kHz WAV under
  the application's temporary directory, exposed to the interface through a
  scoped asset protocol.
  *Done when*: the sample probes as PCM, stays under one megabyte, and the
  previous sample is removed when a new one is made.
  *Depends on*: T004

- [ ] **T007** Offset controls and a "hear this cue" action in the interface,
  with the clamped-cue count shown when it is not zero.
  *Done when*: the offset can be set in 0.1, 0.5 and 1 second steps, reset, and
  the search that follows uses the shifted times.
  *Depends on*: T005, T006

## Phase 4: Verification

- [ ] **T008** Close the acceptance criteria: SC-001 and SC-004 as tests,
  SC-002 by applying minus 3.5 seconds to the shifted fixture and comparing with
  the unshifted file, SC-003 and SC-005 as described in the spec, and SC-006 as
  a manual row. Record what could not be automated.
  *Depends on*: T005, T006, T007

## Definition of done for the slice

- Every functional requirement maps to a task above.
- `cargo test` passes with the fixtures present.
- A shifted subtitle is corrected by ear, not only by arithmetic.
- The constitution check in the pull request is complete.
