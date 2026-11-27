---
description: "Task list for 008, sound-aware edges"
---

# Tasks: Sound-aware edges

**Input**: `specs/008-sound-edges/` — spec.md, plan.md, research.md,
data-model.md, contracts/ipc.md, quickstart.md

**Tests**: requested by the spec's success criteria: SC-001 to SC-003 and
SC-006 by `cargo test` on the evaluation recording, SC-004 by measurement.

**Rules**: one task, one commit; the app builds and runs after each; a box is
ticked in the commit that does the task. Paths are relative to `app/` unless
they start with `app/src-tauri/` or `specs/`.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Foundational (the sound, as data)

- [ ] T001 Add `media/sound.rs` in `app/src-tauri/src/`: `read_levels(video)` decodes the audio with FFmpeg to mono 8 kHz s16le PCM on stdout and returns 10 ms window levels in dB (research R1); `NoAudio` when the probe finds no audio stream. Tests: the Turkish recording gives one level per 10 ms of its 877.65 s, two reads are identical (SC-003), the silent copy gives `NoAudio`.
- [ ] T002 Add `criterion/pauses.rs`: `threshold(levels)` halfway between the 10th percentile and the median, `pauses(levels, threshold, 200)` as data-model.md `Pause` (`Pause.startMs`, `Pause.endMs`, runs of at least 200 ms), the 6 dB floor of the plan, and `SoundProfile` (data-model.md `SoundProfile.pauses`, `.thresholdDb`, `.windowMs`). Unit tests on hand-built levels; an evaluation test records the Turkish threshold (about −38 dB).
- [ ] T003 Add `criterion/placement.rs`: `place(candidate, cues, profile, bounds, 1500)` returning data-model.md `Placement.start` and `Placement.end` by research R2's rule. Unit tests for each condition (nearest within 1.5 s, never into a matched line, bounds kept, no pause gives not placed). Evaluation test on `tr-tedx-kaygi`, "kaygı, endişe": every edge placed or marked, at least four of eight placed, no move over 1.5 s, matched lines and bounds kept (SC-001, SC-002).
- [ ] T004 Hold the sound in the session and expose it (contracts/ipc.md): `SoundState` (data-model.md) in `session.rs`; `read_sound` on a worker thread, `sound_pauses`, `place_edges` and the `placement` field of `search_topic` in `commands.rs`; the types and calls in `src/api.ts`. Measure and record the read time of the Turkish recording (SC-004).

**Checkpoint**: the backend places edges; the interface does not use it yet.

---

## Phase 2: User Story 1 — edges that do not cut a word (P1) 🎯 MVP

**Independent test**: search "kaygı, endişe" on the Turkish recording; each
row shows its moves or that an edge is not on a pause; a cut starts and ends in
quiet.

- [ ] T005 [US1] `src/state/useSession.ts` calls `read_sound` after a recording opens and holds the `SoundState`; `src/state/useSearch.ts` starts each candidate from its placed edges (FR-004), reset returns to them (FR-011), and when the sound becomes ready after a search, asks `place_edges` for the candidates whose edges the user has not moved (research R4).
- [ ] T006 [US1] `src/components/CandidateList.tsx`: one line per row with the move of each placed edge in tenths of a second or "not on a pause" (FR-005, FR-013); one sentence above the list while the sound is being read or when it is unavailable, with the reason (FR-009, FR-010). Strings in both languages in `src/i18n/copy.ts`.

---

## Phase 3: User Story 2 — see where the speaker pauses (P2)

- [ ] T007 [P] [US2] `src/components/Ruler.tsx`: a faint band for pauses of 500 ms or more from `sound_pauses`, under the candidate marks, which stay readable (FR-007).
- [ ] T008 [US2] `src/components/PauseStrip.tsx` in `src/components/CandidateDetail.tsx`: every pause from 3 s before to 3 s after the selected clip, with the clip's current edges (FR-008).

---

## Phase 4: User Story 3 — work without the sound (P3)

- [ ] T009 [US3] An evaluation test that opens the silent copy (as the 002 sample test builds it), searches, and gets candidates with no placement and the `noAudio` state; the fixture page gains a `results-nosound` state (SC-006, FR-009).

---

## Phase 5: Polish and verification

- [ ] T010 Fixture data with real pauses and placements in `src/dev/fixtures.ts`; screenshots of `results` and `results-nosound` at 880×600 and 1100×760, light and dark, in `specs/008-sound-edges/evidence/`; the 300-line rule still holds.
- [ ] T011 *Verified by the machine*: `KIRPIX_REQUIRE_EVAL=1 ./scripts/check.sh` passes with no test skipped; SC-001, SC-002, SC-003, SC-006 by test; SC-004 by the recorded measurement. Ticked with the results written here.
- [ ] T012 *Owed to a person, at a desktop*:
  - [ ] SC-005: cut one placed candidate from each evaluation recording and hear quiet at its start and end;
  - [ ] SC-007: the whole flow with the network interface down;
  - [ ] the moves line, the ruler band and the pause strip in the real window.

---

## Dependencies

T001 → T002 → T003 → T004 → T005 → T006. T007 and T008 after T004 (they read
`sound_pauses`), beside T005–T006. T009 after T004. T010 after T006–T009.
T011 last; T012 is the person box.

## Implementation strategy

MVP is Phases 1 and 2: placed edges and the rows that say so. Then the pauses
on screen, the no-sound path, and the evidence.
