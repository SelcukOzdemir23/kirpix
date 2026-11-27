# Feature Specification: Interface redesign

**Feature Branch**: `007-ui-redesign`

**Created**: 2026-11-27

**Status**: Draft

**Roadmap item**: 007 in `.specify/memory/product.md`

**Input**: User description: "Replace the rail-and-pane screen with the hybrid
layout the owner chose from the research page: criterion cards when a file is
open, a compact criterion bar after a search, the candidate list beside the
player and the candidate's highlighted lines, a ruler across the bottom. Only
Topic works; the other four criteria are visible and marked as coming. One
primary action per screen. Fits 880×600. The visual identity may change if it
makes the screen more legible and makes it obvious what each control does. The
interface code is split so no component file exceeds 300 lines. No behaviour
of search, cut, preview, provider or settings changes."

## Why this slice exists

The owner does not like the current screen, and three concrete problems were
found when it was compared with similar tools (research page "Kirpix Arayüz
Seçenekleri", 2026-11-27):

1. **The product hides what it can do.** The product promises five criteria;
   the screen shows one search form. A first-time user cannot see that
   duration, arc, hook or a free sentence will ever be possible.
2. **The evidence is in three places.** The preview, the candidate's lines and
   the ruler are separate. A user cannot see a clip, hear it and read why it
   was chosen at the same time.
3. **The rail carries everything.** File, offset, engine and criterion are
   stacked in one narrow column, and at 880×600 one of them is always below the
   fold.

Every criterion after this one (009 to 012) needs a place on screen. Designing
that place once, for all five, means no later criterion redraws the screen.

The interface code is also part of the slice. The constitution (1.2.0, code
structure) treats a component file above 300 lines as a defect, and
`app/src/App.tsx` holds almost the whole interface in 845 lines.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose what to look for, then look at what was found (Priority: P1)

The user opens a recording. The screen asks one question, "what are you looking
for?", and shows five criterion cards. Topic is active; the other four are
visibly not ready and say which roadmap feature brings them. The user types two
words and presses the one primary button. The cards fold into a one-line bar at
the top, and the results take the screen: candidates on the left, and on the
right the selected candidate's player, its boundary controls, and its subtitle
lines with the matched words marked. A ruler across the bottom shows where every
candidate sits in the recording.

**Why this priority**: This is the whole redesign. If a user cannot see the
criteria on opening, and cannot see a clip and its evidence together after
searching, the slice has not delivered.

**Independent Test**: Open `eval/fixtures/tr-tedx-kaygi.tr.vtt` with its
recording, search for "kaygı, endişe", and select the first candidate. The
player, the boundary controls and the candidate's lines appear together without
scrolling, at 1100×760 and at 880×600.

**Acceptance Scenarios**:

1. **Given** a recording is open and nothing has been searched, **When** the
   screen renders, **Then** five criterion cards are visible, Topic is the only
   one that can be chosen, and each of the other four names its roadmap number
   and says it is not built yet.
2. **Given** topic terms are entered, **When** the user presses the primary
   button, **Then** the criterion cards are replaced by a one-line criterion bar
   naming the criterion and its terms, and the candidate list appears.
3. **Given** a candidate list, **When** the user selects a candidate, **Then**
   its player area, its boundary controls and its subtitle lines are shown
   beside the list, with every matched term marked in the lines.
4. **Given** a candidate list, **When** the user changes the terms from the
   criterion bar and searches again, **Then** the new candidates replace the old
   ones without returning to the cards.

---

### User Story 2 - Keep, adjust and cut from one place (Priority: P2)

The user unticks one candidate, moves the start of another by one second, plays
it, and presses the primary button, which now says how many clips it will cut.
The written files are listed with the folder they went to.

**Why this priority**: Cutting already works (001). This story makes sure the
new layout keeps every existing action reachable, with one primary action at a
time.

**Independent Test**: With three candidates, untick one, move one boundary,
cut, and find two files whose durations match their rows.

**Acceptance Scenarios**:

1. **Given** a candidate list, **When** the user unticks candidates, **Then**
   the primary button's label states the number of clips that will be cut, and
   it is disabled when that number is zero.
2. **Given** a selected candidate, **When** the user moves a boundary, **Then**
   the row, the ruler mark and the player range all show the new value, and the
   original edges stay visible as in 003.
3. **Given** a cut has finished, **When** the results are shown, **Then** a
   strip below the list names each written file and its folder, a failure
   names its clip and its reason as in 001, and the candidates stay on screen.

---

### User Story 3 - Fix the subtitle timing without leaving the results (Priority: P3)

The subtitles are late. The user opens the alignment control from the
recording's line at the top, shifts by half a second twice, listens to a line,
and closes it. The candidates update to the new times.

**Why this priority**: The offset (002) is used rarely but must stay reachable.
It moves out of the rail, so the place it moves to has to be specified.

**Independent Test**: Open the shifted fixture, apply +3.5 s through the
alignment control, and confirm the first cue's time changes and a cue sample
plays.

**Acceptance Scenarios**:

1. **Given** a recording is open, **When** the user opens the alignment control,
   **Then** the current offset, the step controls of 002, the reset and the
   clamped-cue count are shown, and the recording's line shows a non-zero offset
   while it is in force.
2. **Given** an offset change, **When** results were on screen, **Then** they
   are discarded and the user is told to search again, as in 002.

### Edge Cases

- **No recording open.** The screen shows the drop area and one sentence on
  what Kirpix does. The criterion cards are not shown, because there is nothing
  to search yet.
- **A container with several subtitle tracks.** The track choice of 002 takes
  the working area until a track is chosen; nothing else changes.
- **No candidate matched.** The criterion bar stays, and the working area says
  that no subtitle line matched, as in 001. It does not show an empty list.
- **A not-yet-built criterion is clicked.** Nothing is selected; the card
  already states it is not built, so no second message is needed.
- **The window is at its minimum size.** At 880×600 the criterion cards, the
  primary button, the candidate list and the selected candidate's controls are
  all reachable without horizontal scrolling.
- **Settings are open.** Settings (006) take the working area as today and give
  it back unchanged when closed.
- **A model ranked the candidates.** The engine badge and each candidate's
  reason sentence (004) appear in the new list, and the ranking order is kept.
- **Preview fails or the recording has no video stream.** The player area says
  why, as in 005; the lines and boundary controls stay usable.

## Requirements *(mandatory)*

### Functional Requirements

**Layout**

- **FR-001**: With no recording open, the window MUST show the drop area and the
  file picker as the only primary action, and one sentence that says what
  Kirpix does.
- **FR-002**: With a recording open and no search run, the working area MUST
  show the question "what are you looking for?" and five criterion cards in this
  order: Topic, Duration, Arc, Hook, Own sentence.
- **FR-003**: Each card MUST name its criterion and say in one line what it
  finds. Topic MUST be selectable. Every other card MUST be visibly inactive,
  MUST NOT be selectable, and MUST name the roadmap feature that builds it
  (Duration 009, Arc 010, Hook 011, Own sentence 012).
- **FR-004**: Under the selected card, the criterion's inputs MUST appear: for
  Topic, the terms and the minimum and maximum duration of 001.
- **FR-005**: After a search, the cards MUST be replaced by a one-line
  criterion bar that names the criterion and its inputs and lets the user edit
  them and search again without leaving the results.
- **FR-006**: The results MUST be laid out as a candidate list beside a detail
  area for the selected candidate, with a ruler of the whole recording below
  both.
- **FR-007**: The detail area MUST hold, together: the preview player of 005,
  the boundary controls of 001, and the candidate's subtitle lines with their
  own timecodes.
- **FR-008**: In the candidate's lines, every occurrence of a matched term MUST
  be visibly marked, and the mark MUST come from the same match rule as the
  search (001 FR-006, FR-007), not from a second matcher.
- **FR-009**: Exactly one candidate MUST be selected whenever the list is not
  empty; the first is selected when results arrive.
- **FR-023**: Each candidate's mark on the ruler MUST be a control: activating
  it, by pointer or keyboard, selects that candidate and brings its row into
  view in the list. The ruler MUST NOT seek the player.
- **FR-010**: The recording MUST be named in a line at the top of the window
  with its duration and the engine of 006 (article III), and the offset when
  it is not zero. Nothing else is in that line. The system-FFmpeg note
  (constitution, Media) is not in that line: it is shown where media work
  happens, beside the player and beside the cut action, whenever the backend
  reports a system FFmpeg.
- **FR-011**: The offset controls of 002 MUST move into an alignment control
  opened from that line, which also shows the cue count and the subtitle
  source. Their behaviour MUST NOT change.

**Actions**

- **FR-025**: Boundary adjustment MUST show one minus and one plus control per
  edge and a single step choice, one second or one line, shared by both edges;
  a reset appears only after an edge has moved. This keeps 001 FR-015 with four
  buttons instead of eight.
- **FR-012**: Each screen state MUST have exactly one primary action: pick a
  file; find clips; cut the kept clips. The cut action's label MUST state the
  number of kept candidates and MUST be disabled at zero.
- **FR-024**: After a cut, the written files, their folder and any failed clip
  with its reason MUST be listed in a closable strip below the candidate list.
  The candidates MUST stay on screen. The output folder MUST be shown and
  changeable beside the cut action.
- **FR-013**: Every action that exists today MUST stay reachable: keep or drop a
  candidate, move each edge by one second or one cue, reset, preview, listen to
  a cue, choose a track, change file, open settings, switch language, choose the
  output folder, cut.
- **FR-014**: The interface MUST NOT add, remove or change any request to the
  backend: search, cut, preview, sample, provider and settings calls keep their
  inputs, outputs and triggers, with one exception: FR-008 may add the
  positions of matched terms to what the backend already returns for a
  candidate's lines, computed by the existing matcher. A preview MUST still be
  encoded only when the user asks for it, not when a candidate is selected.

**Visual identity**

- **FR-015**: The visual identity MAY change. Whatever is chosen MUST satisfy
  003 FR-015 to FR-018: list text at least 15px, nothing below 12px, every
  control visibly a control at rest, one word per job, colour that encodes
  function.
- **FR-016**: Inactive, selected, primary, secondary and destructive controls
  MUST each look different from the others in both appearances (006), and the
  difference MUST NOT rest on colour alone.
- **FR-017**: The light, dark and system appearances of 006 MUST keep working,
  with every token defined for both.
- **FR-022**: The identity MUST draw on the subject's own material (subtitle
  lines, timecodes, the cut) rather than a generic dashboard look. The plan
  lists the generic patterns it rejects, and the owner's review of the plan's
  screenshots is the check.

**Code structure** (constitution 1.2.0)

- **FR-018**: No interface component file MAY exceed 300 lines.
- **FR-019**: Screen components MUST render from state they are given; state
  and backend calls MUST live in hooks or modules beside them, so that a
  screen can be rendered from fixed data for a screenshot without the backend.
- **FR-020**: All copy MUST stay in Turkish and English in the copy module,
  with no hardcoded user-facing string (003 FR-012).

- **FR-021**: An inactive criterion card MUST have no code path behind it: it
  renders its text and nothing else (constitution 1.3.0, article VIII).

### Key Entities

- **Screen state**: one of no recording, choosing a track, choosing a
  criterion, results, settings. Cut results are a strip inside results, not a
  state of their own. Exactly one is shown.
- **Criterion card**: a criterion's name, one line on what it finds, whether it
  is built, and the roadmap number when it is not.
- **Criterion bar**: the compact form of the chosen criterion and its inputs.
- **Selected candidate**: the one candidate the detail area shows.
- **Alignment control**: the offset of 002, opened from the recording's line.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From a clean start (settings reset), the owner opens the Turkish
  evaluation recording, searches "kaygı, endişe" and cuts one clip without
  help, and names no control whose job was unclear. The time taken is
  recorded; it is not the gate. Recorded as a manual check marked "owner,
  familiar user", because a first-time user was not tested.
- **SC-002**: At 880×600 and at 1100×760, in light and dark, every screen state
  renders with no horizontal scroll and no clipped control. Checked by
  screenshot of each state from fixed data.
- **SC-003**: On the results screen, the selected candidate's player, boundary
  controls and first subtitle line are all visible without scrolling at
  880×600. Checked by screenshot.
- **SC-004**: For the fixture search, every matched term in the selected
  candidate's lines is marked and no unmatched word is. Checked by a test over
  the marking function against the search's own matches.
- **SC-005**: The candidate data and the cut files for the fixture search are
  byte-identical to those produced before this slice. Checked by the existing
  determinism and cut tests, unchanged.
- **SC-006**: No interface component file is longer than 300 lines. Checked by
  `scripts/check.sh`.
- **SC-007**: In both appearances, body text is at least 7:1 and secondary text
  at least 4.5:1 against its background, from the token values.
- **SC-008**: Each control on the results screen is listed with its kind
  (primary, secondary, inactive, destructive) and the visible difference that
  marks it, in both languages. Checked by enumeration, as 003 SC-011 did.

## Clarifications

### Session 2026-11-27

- Q: Article VIII forbids scaffolding for unbuilt modes; may the four inactive
  criterion cards be shown? → A: Yes. Article VIII is amended (1.3.0) to allow
  an entry that cannot be chosen, names its roadmap number, and has no code
  behind it (FR-021).
- Q: Should the redesign avoid the generic look of generated interfaces? → A:
  Yes. The owner asked for an interface that is comfortable and distinct
  without being overdone, and that does not read as generated.
- Q: Should the plan propose one visual identity or two to choose from? → A:
  One. The plan proposes a single identity with screenshots; the owner approves
  it or asks for changes before the interface tasks start.
- Q: Does clicking a candidate's mark on the ruler select that candidate? → A:
  Yes. A mark selects its candidate and scrolls it into view in the list; marks
  are reachable by keyboard (FR-023).
- Q: Who checks that a first-time user can cut a clip unaided (SC-001)? → A:
  The owner, from a clean start with settings reset, recorded as "owner,
  familiar user". The owner put clarity above the five-minute figure: the
  check is that every control's job is clear without help; time is recorded
  but is not the gate.
- Q: Where are the written files listed after a cut? → A: In a strip below
  the candidate list that names each file, the folder and any failure; the
  candidates stay on screen and the strip can be closed. The output folder is
  chosen beside the cut button (FR-024).
- Q: Is the proposed identity approved? → A: Yes, with one instruction: less
  clutter, every feature minimal and clear. Applied before approval was
  recorded: the recording line keeps only name, duration and engine (FR-010,
  FR-011); boundary controls become a step choice and two buttons per edge
  (FR-025); the duplicate "change criterion" link is removed; inactive cards say
  "Henüz yok" with the roadmap number beside it.

- Q (recorded during convergence): FR-014 lists the backend calls whose
  triggers stay unchanged; does showing a candidate's lines beside its player
  (FR-007) change one? → A: Yes, one, and FR-007 requires it. Before 007 the
  lines were fetched when the user opened a card's lines; now they are fetched
  when a candidate is selected, with the search terms for the marks. It is a
  local call to the open session; nothing leaves the machine. No other request
  changed (T034).

## Assumptions

- **Layout C was chosen by the owner** on the research page of 2026-11-27, over
  a step-by-step flow (A) and a transcript-centred workspace (B). The inactive
  cards are visible by the owner's choice.
- **The visual identity is open.** The owner asked for a change if a better one
  improves legibility and makes each control's job obvious. The plan proposes
  one identity with screenshots, and the owner approves it or asks for changes
  before the interface tasks start. Fonts stay bundled (003 FR-002) and their licences are recorded in
  `THIRD_PARTY.md`.
- **The empty screen does not show the criterion cards.** They appear once a
  recording is open, because before that there is nothing to search.
- **Selecting a candidate does not start a preview.** Preview stays an explicit
  action (005), so selecting rows quickly never starts encoding.
- **Behaviour is frozen.** Search, cut, preview, sample, provider, settings and
  their Rust code do not change, except for FR-008: the matcher reports where
  in a line each term matched, so the interface marks exactly what the search
  matched. That is an added field, not a new rule.
- **Out of scope**: the four other criteria themselves, sound signals,
  remembering the offset, a text-size setting, keyboard shortcuts beyond what
  exists, and packaging.
