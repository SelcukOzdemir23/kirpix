---
description: "Task list for 007, interface redesign"
---

# Tasks: Interface redesign

**Input**: `specs/007-ui-redesign/` — spec.md, plan.md, research.md,
data-model.md, contracts/ipc.md, quickstart.md, identity/ (approved)

**Tests**: requested where the spec names an automated check: SC-004 (marks),
SC-005 (unchanged determinism and cut tests), SC-006 (300-line rule). Other
criteria are screenshots, tables or person checks, each with its own task.

**Rules**: one task, one commit; the app builds and runs after each; a box is
ticked in the commit that does the task. Paths are relative to `app/` unless
they start with `app/src-tauri/`, `scripts/` or `specs/`.

**Order**: the plan's order of work. State moves into hooks *before* the screen
changes (Phase 2), so a behaviour change cannot hide inside the redesign.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an open task)
- **[Story]**: US1, US2, US3 from spec.md

---

## Phase 1: Setup

- [x] T001 Swap the bundled typefaces: add `@fontsource-variable/atkinson-hyperlegible-next` and `…-mono`, remove `familjen-grotesk` and `jetbrains-mono` in `package.json`; import them in `src/main.tsx`; set the two font tokens in `src/styles.css`; replace the two font rows in `THIRD_PARTY.md` (research R2). The old layout renders in the new faces.

---

## Phase 2: Foundational

**Purpose**: the one backend change, the state split, the identity in the app,
and the fixture page. No screen changes shape until this phase is done.

- [x] T002 Add `term_spans(text, terms) -> Vec<(usize, usize)>` in `app/src-tauri/src/criterion/marks.rs` (pure, UTF-16 offsets, sorted, non-overlapping, built on `normalize::matches_token`), export it from `criterion/mod.rs`, and test it: Turkish suffixes and case, a token matching two terms gives one span, punctuation is not marked, and over every cue of both evaluation fixtures a cue has spans exactly when the topic search counts it as matching (SC-004, contracts/ipc.md invariant).
- [x] T003 Pass the terms through: `session_cues` in `app/src-tauri/src/commands.rs` takes optional `terms` and returns `marks` per cue (data-model.md `Cue.marks`); add `marks` to `Cue` and the optional argument to `api.sessionCues` in `src/api.ts`. The interface does not use the field yet.
- [x] T004 (FR-019) Move language, appearance, mode and the settings report into `src/state/useSettings.ts`, and drag and drop into `src/state/useDrop.ts`; `src/App.tsx` calls them. No visible change.
- [x] T005 Move opening, track choice, offset and cue samples into `src/state/useSession.ts`. No visible change.
- [x] T006 Move criterion inputs, candidates, bounds, kept set and selection into `src/state/useSearch.ts`, with selection following data-model.md `Selection.selectedId` (first candidate on arrival, null only when empty). No visible change apart from the first candidate being selected.
- [x] T007 Move plan, confirmation and ranking into `src/state/useRanking.ts`, and preview into `src/state/usePreview.ts` (one at a time, superseded answers dropped, as 005). No visible change.
- [x] T008 Move output folder, cut progress and written files into `src/state/useCut.ts`. `src/App.tsx` now holds only composition and the old JSX. Run the determinism and cut tests unchanged (SC-005).
- [x] T009 Apply the approved identity (FR-015, FR-017, FR-022) to the old screen: the tokens of research R3 (with `edge` and `on-marker`) in `src/styles.css` for light, dark and system (FR-017), and `src/components/Button.tsx` with the five kinds of research R4; replace ad-hoc button classes with it.
- [x] T010 Add the fixture page: `screens.html`, `src/dev/screens.tsx`, `src/dev/fixtures.ts` (the Turkish evaluation search for "kaygı, endişe"), a second Vite entry used only by `npm run screens`, rendering a named state at a given size and theme (research R6, FR-019). It renders the old screens until Phase 3 replaces them.

**Checkpoint**: behaviour is where it was, in the new look, with state in hooks.

---

## Phase 3: User Story 1 — choose what to look for, then look at what was found (P1) 🎯 MVP

**Goal**: cards on opening, a criterion bar after a search, the list beside
the detail with marked lines, a ruler that selects.

**Independent test**: open the Turkish fixture, search "kaygı, endişe", select
the first candidate; player, boundary controls and lines are visible together
at 880×600 and 1100×760 (spec US1).

- [x] T011 [P] [US1] `src/components/TopBar.tsx` and `src/components/RecordingLine.tsx`: name, duration, engine, offset when not zero, Altyazı hizası, Ayarlar, language (FR-010). Used by the old screen in place of its header.
- [x] T012 [P] [US1] `src/screens/StartScreen.tsx`: drop area, file picker as the only primary action, one sentence on what Kirpix does (FR-001).
- [x] T013 [P] [US1] `src/components/CriterionCards.tsx` and `src/components/TopicInputs.tsx`: five cards in order from data-model.md `CriterionCard.id`, only cards with data-model.md `CriterionCard.built` selectable, unbuilt cards inert text with "Henüz yok" and `CriterionCard.roadmap` (FR-002, FR-003, FR-021); topic terms and bounds (FR-004).
- [x] T014 [US1] `src/screens/CriterionScreen.tsx` composing T013 with "Kesitleri bul" as its primary action; `src/App.tsx` shows it in the `criterion` state of data-model.md.
- [x] T015 [P] [US1] `src/components/CriterionBar.tsx`: the chosen criterion, its terms editable, bounds as text, "Yeniden ara" (FR-005).
- [x] T016 [P] [US1] `src/components/CandidateList.tsx`: rows with keep box, range, duration, reason sentence without dotted strings, the model's reason and order when ranked (004), selected row marked by bar and tint (FR-006, FR-009).
- [x] T017 [P] [US1] `src/components/CueLines.tsx`: lines with timecodes, matched words wrapped as marks from `Cue.marks` (data-model.md), semibold and `on-marker` on `marker`, listen action per line (FR-007, FR-008); `src/state/useSearch.ts` requests the selected candidate's cues with the terms.
- [x] T018 [P] [US1] `src/components/Ruler.tsx`: quarter ticks, one mark per candidate positioned from its times (003 FR-005), each mark a button that selects its candidate and scrolls its row into view, kept and dropped marks distinct (FR-023).
- [x] T019 [US1] `src/components/CandidateDetail.tsx` and `src/screens/ResultsScreen.tsx`: player (preview only on request, FR-014), boundary area as today, lines; bar, list, detail and ruler laid out per the approved identity; the system-FFmpeg note beside the player when the backend reports one (FR-010, constitution Media); `src/App.tsx` shows it in the `results` state; the no-match message replaces the list (spec edge case).
- [x] T020 [US1] Remove what Phase 3 replaced: `CandidateCard.tsx`, `TimelineStrip.tsx`, `CriteriaForm.tsx`, `SectionLabel.tsx`, the old rail and pane JSX in `src/App.tsx`; strings no longer used leave `src/i18n/copy.ts`; every new string exists in Turkish and English there (FR-020).

**Checkpoint**: US1's independent test passes from the fixture page and in the window.

---

## Phase 4: User Story 2 — keep, adjust and cut from one place (P2)

**Independent test**: with three candidates, untick one, move one boundary,
cut, find two files whose durations match their rows (spec US2).

- [x] T021 [P] [US2] `src/components/BoundaryControls.tsx`: one step choice (1 sn / 1 satır) and a minus and plus per edge, reset only after a move, original edges kept on the ruler (FR-025, 001 FR-015, 003 FR-007; data-model.md `Selection.bounds`).
- [x] T022 [US2] The cut action in the list footer: label states the number of kept candidates (data-model.md `Selection.kept`), disabled at zero, folder shown and changeable beside it, and the system-FFmpeg note there when reported (FR-012, FR-024, FR-010).
- [x] T023 [US2] `src/components/CutStrip.tsx`: written files, folder, failures with reasons, progress while cutting, closable, candidates stay (FR-024).

---

## Phase 5: User Story 3 — fix the subtitle timing without leaving the results (P3)

**Independent test**: open the shifted fixture, apply +3.5 s from the
alignment control, the first cue moves and a sample plays (spec US3).

- [x] T024 [US3] `src/components/AlignmentPanel.tsx` opened from the recording line: offset steps, reset, clamped count, cue count and subtitle source (FR-011); results discarded on change with the 002 message; remove `OffsetControls.tsx`.
- [x] T025 [P] [US3] `src/screens/TrackScreen.tsx` and `src/screens/SettingsScreen.tsx` in the new identity, settings returning the previous state unchanged (006 FR-013); remove `SettingsView.tsx`.

---

## Phase 6: Polish and verification

- [x] T026 Add the 300-line rule for `app/src/**/*.{ts,tsx}` to `scripts/check.sh`, naming any file over (FR-018, SC-006, research R8).
- [x] T027 [P] Screenshots from the fixture page of `start`, `tracks`, `criterion`, `results`, `results-cut`, `results-empty`, `settings` at 880×600 and 1100×760, light and dark, into `specs/007-ui-redesign/evidence/` (SC-002, SC-003).
- [x] T028 [P] Contrast table from the final token values (SC-007) and the enumeration of every control on the results screen with its kind and visible difference, both languages (SC-008, FR-016), and a table of every action that exists today with the screen it is reached from (FR-013), in `specs/007-ui-redesign/evidence/README.md`.
- [ ] T029 Records: superseded notes on 003 FR-001, FR-002, FR-004, FR-016 (rail, faces, pane subjects, cursor) where 007 replaces them; `README.md` describes the new screen.
- [ ] T030 *Verified by the machine*: `./scripts/check.sh` passes; SC-004, SC-005, SC-006 by test; SC-002, SC-003, SC-007, SC-008 by the evidence above. Ticked with the results written here.
- [ ] T031 *Owed to a person, at a desktop*:
  - [ ] SC-001: from a clean start, open the Turkish recording, search, cut one clip; name any unclear control; record the time (owner, familiar user);
  - [ ] fonts and layout in the real WebKitGTK window, light and dark;
  - [ ] a ruler mark selected by keyboard (quickstart step 3);
  - [ ] the alignment control with a real sample (quickstart step 4).

---

## Dependencies

- T001 before T009. T002 → T003 → T017.
- T004 → T005 → T006 → T007 → T008 (each moves state the next one reads).
- Phase 2 before Phase 3. T009 before any Phase 3 component (they use `Button`).
- T010 before T027.
- Phase 3: T011, T012, T013, T015, T016, T017, T018 in parallel; T014 after T013; T019 after T015–T018; T020 last.
- Phase 4 after T019. Phase 5 after T019. T021 and T025 can run beside others.
- T026 after T020 (until then `App.tsx` is over 300 lines). T030 after all; T031 is the person box.

## Parallel examples

- Phase 3: `TopBar`, `StartScreen`, `CriterionCards`, `CriterionBar`, `CandidateList`, `CueLines`, `Ruler` are separate files fed by props; they can be built side by side and assembled in T014 and T019.
- Phase 6: screenshots (T027) and the contrast and control tables (T028).

## Implementation strategy

- **MVP**: Phases 1–3. After T020 the new screen works end to end for the topic
  criterion; cutting still works through the existing footer until T022.
- **Then** US2 (cutting in the new layout), US3 (alignment and the restyled
  secondary screens), polish and evidence.
- One commit per task, pushed as it lands; the pull request after T030, with
  T031 listed as owed.
