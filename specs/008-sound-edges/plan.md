# Implementation Plan: Sound-aware edges

**Branch**: `008-sound-edges` | **Date**: 2026-11-27 | **Spec**: [spec.md](spec.md)

**Input**: `specs/008-sound-edges/spec.md` with the owner's answers; decisions
and measurements in [research.md](research.md).

## Summary

Read each opened recording's audio once, locally, into 10 ms levels and a list
of pauses against a threshold derived from the recording itself. Move each
candidate edge into the nearest pause within 1.5 s when that keeps every
matched line and the 001 bounds; otherwise leave it and say so. Show long
pauses faintly on the ruler and all nearby pauses in the selected clip's
detail. Without sound, everything works on subtitle edges and the screen says
why.

## Technical Context

**Language/Version**: Rust 1.100 (analysis, placement, commands); TypeScript 5
with React 19 (display)

**Primary Dependencies**: none new; FFmpeg as already resolved by `media::ffmpeg`

**Storage**: none; the sound profile lives in the session and is read again
when a recording is opened

**Testing**: `cargo test` with pure tests for levels, threshold, pauses and
placement on hand-built inputs, and an evaluation test on `tr-tedx-kaygi`
(SC-001 to SC-003); `KIRPIX_REQUIRE_EVAL=1` in a checkout with media;
fixture page screenshots for the interface

**Target Platform**: Linux first; nothing platform-specific added

**Project Type**: desktop application (Tauri 2)

**Performance Goals**: reading the sound of the 14:37 recording under 5 s
(SC-004), off the interface thread; opening and searching never wait for it

**Constraints**: deterministic (constitution VII); local only (I, II); no
model (V, VI); 300-line rule for components and hooks; edges move at most
1.5 s

**Scale/Scope**: one Rust module for analysis, one for placement, two command
changes, three interface touches (row, ruler, detail)

## Constitution Check

| Article | Gate | Before | After design |
| --- | --- | --- | --- |
| I Local | Audio is decoded by the local FFmpeg into memory; nothing is written or sent | PASS | PASS |
| II Works alone | No network; SC-007 offline | PASS | PASS |
| III AI optional | No model involved; placement is heuristic and visible per row | PASS | PASS |
| IV Evidence | Every row says how far each edge moved or that it is not on a pause (FR-013, FR-005) | PASS | PASS |
| V Line indices | Placement uses cue indices and pause times; no model times | PASS | PASS |
| VI Tokens | No tokens | PASS | PASS |
| VII Determinism | Pure functions after decoding; a test reads twice and compares (SC-003) | PASS | PASS |
| VIII Small slice | Pauses only; loudness left to 011 | PASS | PASS |
| IX Failures visible | No audio or a decode failure is stated where results are (FR-009) | PASS | PASS |
| X Eval set | SC-001 is measured on `tr-tedx-kaygi` with its threshold written down; the target was lowered rather than the detector tuned (research R2) | PASS | PASS |
| Media | System FFmpeg in development, as today; release gate unchanged | PASS | PASS |
| Code structure | `media::sound` decodes (edge), `criterion::pauses` and `criterion::placement` are pure (domain); hooks hold interface state | PASS | PASS |

## Design

### Rust

- `media/sound.rs` (edge): `read_levels(video) -> Result<Levels, KirpixError>`
  runs FFmpeg to mono 8 kHz s16le PCM on stdout and returns 10 ms window
  levels in dB. `NoAudio` when the probe finds no audio stream.
- `criterion/pauses.rs` (pure): `threshold(levels) -> f32` (halfway between
  p10 and median), `pauses(levels, threshold, min_ms) -> Vec<Pause>`, and
  `SoundProfile { pauses, threshold_db, window_ms }`.
- `criterion/placement.rs` (pure): `place(candidate, cues, profile, bounds,
  max_move_ms) -> Placement { start: Edge, end: Edge }` where `Edge` is
  `Placed { at_ms, moved_ms }` or `NotPlaced`. Uses research R2's rule.
- `session.rs`: the session holds `sound: SoundState` — `Reading`,
  `Ready(SoundProfile)` or `Unavailable(reason)`.
- `commands.rs`:
  - `read_sound()` runs `read_levels` on a worker thread for the open
    session's video and stores the result; returns the state.
  - `search_topic` returns each candidate with its `placement` when the
    profile is ready, `placement: null` otherwise.
  - `place_edges(ids)` returns placements for those candidates once the
    profile is ready (for a search that finished first, research R4).
  - `sound_pauses(fromMs, toMs, minMs)` returns pauses in a range, for the
    ruler (min 500 ms) and the detail (all).

### Interface

- `state/useSession.ts`: after opening, call `read_sound`; hold the sound
  state.
- `state/useSearch.ts`: a candidate's starting edges are the placed edges when
  present; reset returns to them (FR-011). When the sound becomes ready after a
  search, request placements for candidates whose edges are unmoved.
- `components/CandidateList.tsx`: one line per row with the moves, or "not on
  a pause"; a list-level sentence when the sound is unavailable or still
  being read (FR-009, FR-010, FR-013).
- `components/Ruler.tsx`: a faint band for pauses ≥ 500 ms (FR-007).
- `components/PauseStrip.tsx` (new) in `CandidateDetail`: pauses from 3 s
  before to 3 s after the clip, with its edges (FR-008).

### Copy

Turkish and English for: "ses okunuyor", "ses okunamadı: …", "duraklamada
değil", "başlangıç −0,8 sn", and their English counterparts.

## Project Structure

```text
specs/008-sound-edges/
├── spec.md  plan.md  research.md  data-model.md  quickstart.md
├── contracts/ipc.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks

app/src-tauri/src/
├── media/sound.rs          # new: decode to levels
├── criterion/pauses.rs     # new: threshold, pauses, profile
├── criterion/placement.rs  # new: placing an edge
├── session.rs              # sound state
└── commands.rs             # read_sound, place_edges, sound_pauses; search returns placement

app/src/
├── api.ts                  # types and calls
├── state/useSession.ts     # read the sound after opening
├── state/useSearch.ts      # placed edges as the starting edges
├── components/CandidateList.tsx
├── components/Ruler.tsx
├── components/PauseStrip.tsx   # new
├── components/CandidateDetail.tsx
├── i18n/copy.ts
└── dev/fixtures.ts         # pauses and placements for the fixture page
```

**Structure decision**: the same split as 007. Decoding is an edge module next
to the other FFmpeg calls; thresholds, pauses and placement are pure domain
code next to the topic search they adjust.

## Risks

- **Memory for long recordings**: 8 kHz s16 is 57.6 MB per hour; levels are
  read as a stream and only 100 values per second are kept.
- **A recording that is quiet throughout** (very low p50): the threshold is
  relative and may mark speech as pause. A floor is applied: a pause must be at
  least 6 dB below the median, or the profile reports no pauses.
- **Placement after a search** races with the user's first edge move: only
  unmoved candidates are placed; the user's move always wins (FR-011).

## Complexity Tracking

None.
