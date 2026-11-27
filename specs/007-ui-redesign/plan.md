# Implementation Plan: Interface redesign

**Branch**: `007-ui-redesign` | **Date**: 2026-11-27 | **Spec**: [spec.md](spec.md)

**Input**: `specs/007-ui-redesign/spec.md`, with the owner's answers in its
Clarifications section. Design decisions are in [research.md](research.md).

## Summary

Rebuild the interface as layout C: on opening a recording, five criterion cards
(Topic live, four inactive and numbered); after a search, a criterion bar, a
candidate list beside a detail area (player, boundary controls, marked lines),
a ruler that selects, and a closable strip of written files. A new visual
identity (research R1–R4) replaces the current one. The 845-line `App.tsx` is
split into hooks that own state and calls, and screens that render props.

One backend change, additive: `session_cues` takes the search terms and
returns, per cue, where the terms matched, computed by the existing matcher
(R5). Nothing else in Rust changes.

## Technical Context

**Language/Version**: TypeScript 5 with React 19 (interface); Rust 1.100 (one
pure function and one command argument)

**Primary Dependencies**: unchanged, plus two bundled font packages
(`@fontsource-variable/atkinson-hyperlegible-next`, `…-mono`, OFL-1.1); the two
current font packages are removed

**Storage**: unchanged (appearance in local storage, model in `settings.json`)

**Testing**: `cargo test` for the marking function; `tsc --noEmit`; screenshots
from the fixture page (R6); `scripts/check.sh` gains the 300-line rule (R8)

**Target Platform**: Linux first (WebKitGTK); nothing Linux-only in the
interface, per the product document

**Project Type**: desktop application (Tauri 2)

**Performance Goals**: no change to search or cut; selecting a candidate starts
no encoding (FR-014); the cue page for a selection is one call, as today

**Constraints**: 880×600 minimum window; light, dark and system appearances;
Turkish and English; no network; no new backend request kinds

**Scale/Scope**: 5 screen states, about 20 interface files, 1 Rust function

## Constitution Check

*Gate: before Phase 0 research, re-checked after Phase 1 design.*

| Article | Gate | Before | After design |
| --- | --- | --- | --- |
| I Local by default | No media leaves the device; the slice adds no path | PASS | PASS |
| II Works alone | No network request added; offline flow unchanged | PASS | PASS |
| III AI optional | Heuristic stays default; the engine is named in the recording line (FR-010) and the result badge stays | PASS | PASS |
| IV Evidence out | Evidence is now beside the player, with matched words marked from the matcher itself (R5) | PASS | PASS |
| V Line indices | Marks are spans of cue text, not times; no model involvement | PASS | PASS |
| VI Tokens on decisions | Marking is deterministic code, no tokens | PASS | PASS |
| VII Determinism | `term_spans` is a pure function; candidate data unchanged (SC-005) | PASS | PASS |
| VIII Small slices | Four inactive cards are inert, numbered entries with no code path (1.3.0, FR-021) | PASS (1.3.0) | PASS |
| IX Failures visible | Every 001–006 error keeps its sentence; the system-FFmpeg note stays on screen | PASS | PASS |
| X Eval set | SC-004 is tested over both fixtures; SC-001 is a recorded manual row | PASS | PASS |
| Stack | React, TypeScript, Rust; no new runtime dependency besides fonts | PASS | PASS |
| Code structure | The slice exists partly to meet it: 300-line rule enforced by `check.sh`; state in hooks; domain change is pure | PASS | PASS |
| Language | Every string in both languages in `i18n/copy.ts` | PASS | PASS |
| Licences | The two new OFL fonts are added to `THIRD_PARTY.md`, the two removed ones taken out | PASS | PASS |

No violation, so Complexity Tracking is empty.

## The visual identity (owner approval gate)

The identity in research R1–R4, shown in the screenshots attached to this plan
(`specs/007-ui-redesign/identity/`), is **one proposal for the owner to approve
or correct** (Clarifications). No interface task after T003 starts until the
owner has approved it; T003 records the approval.

In short:

- **One bold element**: subtitle yellow marks the words the search matched, in
  the lines and on the ruler. Nothing else uses it.
- **Everything else quiet**: a lifted grey-green ground, ink text, ink-filled
  primary action, one blue for selected and focused.
- **Type for legibility**: Atkinson Hyperlegible Next, with its Mono sibling for
  timecodes only.
- **Removed, because they read as generated** (R1): all-caps labels, dotted meta
  strings, monospace labels, tinted near-black, one radius for everything.

## Project Structure

### Documentation (this feature)

```text
specs/007-ui-redesign/
├── spec.md
├── plan.md            # this file
├── research.md        # R1–R9
├── data-model.md      # screen states and view types
├── quickstart.md      # how to check the slice by hand and by script
├── contracts/
│   └── ipc.md         # the one changed command
├── identity/          # proposal screenshots (T002)
├── checklists/requirements.md
└── tasks.md           # /speckit-tasks
```

### Source Code

```text
app/
├── index.html
├── screens.html                 # dev-only fixture page entry (R6)
└── src/
    ├── main.tsx                 # applies appearance before first paint (006)
    ├── App.tsx                  # composes hooks, picks the screen; < 150 lines
    ├── api.ts                   # backend calls and types (marks added)
    ├── styles.css               # tokens (R3), control kinds (R4)
    ├── theme.ts                 # unchanged
    ├── i18n/copy.ts             # strings, both languages
    ├── state/                   # one hook per concern, owns state and calls
    │   ├── useSession.ts        # open, tracks, offset, cue sample (002)
    │   ├── useSearch.ts         # criterion inputs, candidates, selection, bounds, keep (001)
    │   ├── useRanking.ts        # plan, confirm, rank (004)
    │   ├── usePreview.ts        # one preview at a time, superseded answers dropped (005)
    │   ├── useCut.ts            # output folder, progress, written files (001)
    │   ├── useSettings.ts       # language, appearance, mode, settings report (006)
    │   └── useDrop.ts           # drag and drop (003)
    ├── screens/                 # one per screen state; props in, elements out
    │   ├── StartScreen.tsx
    │   ├── TrackScreen.tsx
    │   ├── CriterionScreen.tsx
    │   ├── ResultsScreen.tsx
    │   └── SettingsScreen.tsx
    ├── components/
    │   ├── TopBar.tsx           # name, recording line, settings, language
    │   ├── RecordingLine.tsx    # duration, cues, source, engine, offset (FR-010)
    │   ├── AlignmentPanel.tsx   # 002 offset controls, opened from the line (FR-011)
    │   ├── CriterionCards.tsx   # five cards; inactive ones inert (FR-003, FR-021)
    │   ├── TopicInputs.tsx      # terms and duration bounds (FR-004)
    │   ├── CriterionBar.tsx     # compact criterion after a search (FR-005)
    │   ├── CandidateList.tsx    # rows, keep boxes, model reasons (004)
    │   ├── CandidateDetail.tsx  # player, boundary controls, lines (FR-007)
    │   ├── BoundaryControls.tsx
    │   ├── CueLines.tsx         # lines with marks (FR-008)
    │   ├── Ruler.tsx            # marks are controls (FR-023)
    │   ├── CutStrip.tsx         # written files, folder, failures (FR-024)
    │   ├── Button.tsx           # the five control kinds (R4)
    │   ├── ConfirmDialog.tsx    # kept (004)
    │   ├── ModelPanel.tsx       # kept (004, 006)
    │   └── TrackChooser.tsx     # kept (002)
    └── dev/
        ├── screens.tsx          # renders a named state at a given size
        └── fixtures.ts          # fixed data from the Turkish evaluation search

app/src-tauri/src/
├── criterion/marks.rs           # new: term_spans, pure (R5)
└── commands.rs                  # session_cues takes optional terms
```

Removed: `components/CandidateCard.tsx`, `TimelineStrip.tsx`, `CriteriaForm.tsx`,
`OffsetControls.tsx`, `SectionLabel.tsx`, `SettingsView.tsx` — each is replaced
by a file above; logic moves, it is not rewritten.

**Structure decision**: the existing single desktop project. Hooks are the
seam between behaviour and rendering, so the behaviour of 001–006 moves into
`state/` unchanged, and the redesign happens in `screens/` and `components/`.

## Order of work

1. **Identity proposal** (no app code): the tokens and control kinds as a
   standalone page, screenshots of the results state at 880×600 and 1100×760
   in both appearances. **Owner approval gate.**
2. **Backend marks**: `term_spans` with its tests over both fixtures (SC-004),
   `session_cues` takes `terms`. The interface ignores the new field until 5.
3. **Split without redesign**: move state into hooks, behaviour unchanged, the
   old screen still rendered. The app stays runnable and looks as it does
   today; this is the step that proves no behaviour moved.
4. **Identity in the app**: fonts, tokens, `Button` kinds; old screen, new look.
5. **New screens**: start, criterion, results (list, detail, marks, ruler,
   strip), alignment panel, settings and track screens restyled.
6. **Fixture page and evidence**: screenshots of every state, contrast table,
   control enumeration (SC-008), 300-line rule in `check.sh`.
7. **Verification**: the machine box and the person box (constitution 1.2.0).

Each numbered step is one or more tasks, one commit each, and the app runs
after every one.

## Risks

- **Moving 45 pieces of state at once.** Step 3 exists to keep the move and the
  redesign apart: if the old screen behaves the same after the move, the
  redesign cannot have broken behaviour by accident.
- **WebKitGTK rendering of variable fonts.** Checked in the first desktop run;
  the fixture screenshots are Chromium and are not evidence of it.
- **Marks and normalisation.** Turkish folding changes lengths in rare cases
  (dotted İ folds to two code points). Spans are computed on the original text
  token by token, and the test asserts that every span's text normalises to a
  token that matches.
- **880×600 with a player.** The detail area may need the player and the lines
  to share height; checked in step 1 before any code.

## Complexity Tracking

None.
