# Feature Specification: The desktop shell

**Feature Branch**: `003-desktop-shell`

**Created**: 2026-11-17

**Status**: Draft

**Input**: Give the application a desktop shape — layout, typography, file
picking — before it is shown to anyone.

## Why this slice exists

Features 001 and 002 built a working flow inside a single centred column of
cards. It works, and it reads like a web page that happens to be in a window: the
left 40% of a 1100px window is empty, the type is the system default, and the one
thing this application knows better than anyone — where in a ninety minute
recording the good parts are — is invisible until the user scrolls the list.

The picking flow has the same problem from the other side. "Video and subtitles"
is a button that opens an operating system dialog, twice, and no drag and drop.

This slice is the presentation of features 001 and 002, not new capability. It
adds no model call, no new media step, and nothing that leaves the device.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read the window as a tool (Priority: P1)

The user opens the application, picks a video, types two words, and finds the
left column has stayed still: it holds what they set, and the right pane holds
what came back.

**Why this priority**: Every later feature adds controls to that left column.
The column has to exist before there is a third control to put in it.

**Independent Test**: load a session and a search, and confirm the criteria stay
reachable while the result list scrolls, at the default and the minimum window
size.

**Acceptance Scenarios**:

1. **Given** the application window at its minimum size, **When** a session is
   open, **Then** the rail and the working pane each scroll on their own and the
   window itself never scrolls as a page.
2. **Given** a session, **When** the user changes a criterion, **Then** the
   controls and the results are visible at the same time.

---

### User Story 2 - See where the clips sit (Priority: P1)

A fourteen minute recording produces three candidates. The user sees, before
reading a single row, that two are next to each other in the first half and one
is near the end, and which one they removed.

**Why this priority**: A list of timecodes says "3:34" and the user cannot tell
whether that is early or late without arithmetic. Position is the whole point of
a timeline.

**Independent Test**: search the fixture, and compare each mark's position with
`startMs / durationMs` computed by hand.

**Acceptance Scenarios**:

1. **Given** a search with three candidates, **When** the results appear,
   **Then** each candidate is marked on a ruler spanning the whole recording, at
   a position matching its start and end.
2. **Given** a candidate whose start the user moved by one second, **When** the
   boundary is applied, **Then** its mark and its bracketed timecode both move,
   and the edges it came from stay visible as thin lines.
3. **Given** a candidate the user removed, **When** the list updates, **Then**
   the mark stays on the ruler, visibly not selectable.
4. **Given** a row under the mouse, **When** it is hovered, **Then** its mark
   is highlighted; hovering the mark highlights the row.

---

### User Story 3 - Bring the file in (Priority: P2)

The user drags an MKV from their file manager onto the window. If they also
dragged the SRT, it is used; if they did not, the application offers the tracks
the container already carries.

**Why this priority**: It is the same choice as picking from a dialog, made
faster, and it is the interaction a desktop user tries first.

**Independent Test**: drop the fixture MKV onto the window and confirm the track
list appears; drop it together with the SRT and confirm the session opens on
that file.

**Acceptance Scenarios**:

1. **Given** no session, **When** a video is dropped, **Then** the same path is
   taken as if it had been picked from the dialog.
2. **Given** a video and a subtitle dropped together, **When** the drop is
   handled, **Then** the subtitle is used instead of the container's tracks.
3. **Given** the window does not support drop events, **When** the first screen
   is shown, **Then** the control reads as a pick button and never claims to
   accept a drop.

### Edge Cases

- **A file that is neither video nor subtitle is dropped.** Ignored, with no
  error, because the user has expressed no intent the application can act on.
- **The drop listener fails to register.** The control falls back to its pick
  wording. It must not promise a drop target that does not exist.
- **A very long file name or path.** Truncated with the full value in the
  tooltip; the row height does not change.
- **Thirty candidates.** Marks are at least half a percent wide so a short clip
  stays visible; the rarer overlaps are allowed to touch.
- **A candidate at the very end of the recording.** Its mark is positioned from
  the same numbers as every other, so the last mark touches the right edge.
- **Window narrower than the content.** The rail keeps its width and the working
  pane shrinks; no horizontal scrollbar at the minimum size.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The window MUST be laid out as a fixed-width rail holding the
  inputs and a flexible working pane holding the result. The rail scrolls on its
  own; the page does not.
- **FR-002**: The application MUST ship its two typefaces rather than use system
  fonts: a sans for text and a monospaced face for every timecode, path and
  numeric value. Both are the faces the project site already uses.
- **FR-003**: One accent colour MUST be reserved for state — the selected or
  edited mark, the focus ring, the current value — and the primary action MUST
  NOT use it. No colour outside the palette except the error surface.
- **FR-004**: The working pane MUST show one subject at a time: the subtitle
  track choice, the candidate list, or the files that were written.
- **FR-005**: Every mark on the timeline MUST be positioned from the candidate's
  start and end against the session duration, the same numbers the list renders.
  No mark may be positioned from anything else.
- **FR-006**: The timeline MUST show a ruler with ticks and four labelled
  divisions, so a position can be read without hovering.
- **FR-007**: A candidate whose boundaries were edited MUST keep its original
  edges visible as thin lines, and a removed candidate MUST remain visible,
  marked as removed.
- **FR-008**: Dropping a video MUST be equivalent to picking one. A subtitle
  dropped with it MUST take precedence over the container's own tracks.
- **FR-009**: Drop wording MUST be shown only when the drop listener registered.
- **FR-010**: Each candidate MUST show the terms that matched and the number of
  subtitle lines they matched.
- **FR-011**: The view of written files MUST name the folder they were written
  to.
- **FR-012**: All interface copy MUST exist in Turkish and English, and no
  component may hardcode a user-facing string.
- **FR-013**: The slice MUST NOT add a video preview, a model call, or any
  network request.
- **FR-014**: The interface MUST follow the operating system's colour scheme,
  offering a light and a dark appearance from one set of tokens, and MUST switch
  when the system switches without a relaunch.
- **FR-015**: Body text MUST be legible at arm's length on a desktop display:
  15px for list content, 16px for timecodes, 13–14.5px for secondary text, and
  no interface text below 12px.
- **FR-016**: The interface MUST avoid the tell-tales of a web page in a
  window: no pointer cursor on buttons or rows, no text selection on chrome,
  and system-drawn scrollbars.
- **FR-018**: Every clickable thing MUST look clickable: a control carries a
  visible boundary or a permanent underline in its resting state, and answers
  both hover and press. An unbounded text label MUST NOT be the only thing that
  marks an action. Colour MUST encode function — state, selection, failure — and
  MUST NOT be the sole difference between a control and a label.
- **FR-017**: Every control MUST name the thing it acts on, and one word MUST
  NOT mean two things on the same screen. Where a control's effect is not
  obvious from its object, one line of plain text MUST say what it is for.

### Key Entities

- **Rail**: the input column: source, shift, criteria.
- **Working pane**: the one subject currently shown.
- **Mark**: a candidate's span on the ruler, derived from its times.
- **Ruler**: the whole recording, divided at quarter points.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At 1100×760 and at the 880×600 minimum, the rail and the working
  pane fit with no horizontal scrolling and no clipped control. Checked by
  screenshot at both sizes.
- **SC-002**: For every candidate of the fixture search, a mark's left and width
  percentages match `startMs / durationMs` and `(endMs - startMs) / durationMs`
  to within 0.5 percentage points. Checked from the rendered element.
- **SC-003**: Moving one boundary by one second moves that candidate's mark and
  its timecode by the same amount, and leaves the other marks untouched.
- **SC-004**: Where drop events are unavailable, no drop wording appears. Checked
  in the browser preview, where the event exists but the listener cannot
  register.
- **SC-005**: The built interface references the two bundled typefaces and makes
  no request for a font. Checked in `dist`: font files are emitted, and no
  `@import` of a remote face remains.
- **SC-006**: The application still builds and its tests still pass.
- **SC-007**: With the system set to light and with it set to dark, every
  screen renders with a readable contrast: body text on its background is at
  least 7:1 and secondary text at least 4.5:1, measured from the token values.
- **SC-008**: No interface text is below 12px and list content is at least
  15px, checked by reading the built stylesheet.
- **SC-009**: Switching the system scheme while the application is open changes
  the interface without a relaunch. Verified from the two rendered screenshots
  produced from the same build, one per scheme.
- **SC-010**: On the results screen no two visible controls share a label, and
  every label names its object. Checked by listing the labels of that screen in
  both languages.
- **SC-011**: Every clickable element on the results screen has a visible
  resting affordance — a border, a background, or an underline — and a distinct
  hover state. Checked by enumerating the interactive elements of that screen
  and naming the affordance each one carries.

## Assumptions

- **Revision, 2026-11-17**: the first pass took the site's near-black palette as
  the only appearance and set a scale that reads small on a desktop display.
  The product owner asked for three things at once: follow the system scheme,
  bigger type, and a layout that stops looking like a page. FR-014 to FR-016
  and the type scale in the plan are that revision.
- **Second revision, same day**: the sans changes from Space Grotesk to Familjen
  Grotesk, in the application and on the site together, because the old face is
  one of the retired defaults in current typography advice. The accent is
  unchanged; the mono is unchanged.
- **Fourth revision, same day (FR-015, FR-016, FR-018)**: the owner read the
  built screen and said the text was still small, that buttons did not look
  clickable, and that the typography and colour did not say what anything did.
  Two of those are one mistake. FR-016 had copied the native rule of no hover
  tint on push buttons; on a webview that leaves every secondary action looking
  exactly like a label. FR-018 reverses it and states the positive rule — a
  control carries a boundary or a permanent underline and answers hover and
  press — while FR-016 keeps the parts the owner confirmed (no hand cursor, no
  selectable chrome). The scale moves one step again. The owner also expected to
  find a text-size setting; there is none, and adding one is its own slice.
- **Third revision, same day (FR-017)**: reading the built screen, three names
  were doing two jobs each — `Göster` played a clip beside `Satırları göster`
  which expanded text, two `Sıfırla` buttons reset different things, `Değiştir`
  did not say what it changed, and the shift chips had no unit. The labels now
  name their objects and the shift section says what it is for.

- The visual identity continues the project site: same near-black palette, same
  one accent, same two typefaces. The app is not given a separate identity, and
  Issue 2's third question is answered "no" for this slice.
- No icon set is added. The interface uses text and two glyphs, so the slice adds
  no dependency beyond the fonts.
- Video preview remains out of scope, as it has been since feature 001.
- Both typefaces are under the SIL Open Font License. The constitution asks for
  third-party licences to be documented in the repository; that documentation
  does not exist yet, for the site either. Recorded here as a follow-up rather
  than silently added to this slice.
