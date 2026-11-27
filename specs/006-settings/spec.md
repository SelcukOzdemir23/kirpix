# Feature Specification: One place for the choices that are not about this file

**Feature Branch**: `006-settings`

**Created**: 2026-11-17

**Status**: Merged (#13). Open: T005p, three checks owed to a person.

**Input**: The owner changed the operating system theme to test the dark
appearance and could not find a theme control in the application. They expected
a settings place, and expected the model to be chosen there too.

## Why this slice exists

The application has settings and no place to put them. The appearance follows
the operating system exactly and cannot be told otherwise: feature 003's
[FR-014](../003-desktop-shell/spec.md) made the system the only opinion. The
model, the local address, the model name and the cloud provider sit in a rail
section that is the fifth thing down a column that at 880×600 clips them, and
they are forgotten every time the application closes, because the provider
state lives in memory.

So there are two defects and one missing surface. The defects are that a
choice the owner wants to make has no control, and that a choice the
application already offers does not survive a restart. The missing surface is
the place the owner looked for and did not find.

The slice adds no provider, no new model call and no new network path. It moves
an existing panel and adds one control.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Change the appearance without leaving the application (Priority: P1)

The owner wants the dark appearance on a light desktop, or the opposite. They
open `Ayarlar`, pick `Koyu`, and the window changes under the cursor. When they
restart, it is still dark. When they pick `Sistem`, it follows the desktop
again.

**Why this priority**: the owner asked for this and could not find it. It is the
reason the slice exists.

**Independent Test**: change the appearance in each of the three states and
confirm the whole window follows, including the rail, the cards and the ruler;
restart and confirm the choice is kept.

**Acceptance Scenarios**:

1. **Given** any screen, **When** the user picks `Koyu`, **Then** every surface
   in the window is dark before they touch anything else, with no relaunch and
   no flash of the old appearance.
2. **Given** an explicit choice, **When** the operating system theme changes,
   **Then** the application keeps the explicit choice.
3. **Given** `Sistem` and the operating system in dark, **When** the owner
   switches the desktop to light, **Then** the application follows without a
   relaunch.
4. **Given** `Koyu` and the application restarted, **Then** the window opens
   dark, with no visible light frame first.

---

### User Story 2 - Choose the model where the other choices are (Priority: P1)

The model section leaves the rail for `Ayarlar`. The rail keeps the source, the
shift and the criteria, and gains one line that names the engine that will run.
The choice survives a restart.

**Why this priority**: this is the half of the owner's request that names the
model, and the clipped rail section at 880×600 is a defect already recorded.

**Independent Test**: set `Yerel` with an address and a model name, restart,
and confirm the rail's engine line and the settings panel both show it.

**Acceptance Scenarios**:

1. **Given** a session, **When** the user opens `Ayarlar`, **Then** the model
   controls are there, unchanged in behaviour from feature 004.
2. **Given** a mode, address and model chosen, **When** the application is
   restarted, **Then** the mode, address and model are the same, and the rail's
   engine line says so.
3. **Given** the rail, **When** no model panel is in it, **Then** the source,
   the shift and the criteria fit at 880×600 with no clipped section.
4. **Given** a cloud provider chosen, **When** the user leaves and returns,
   **Then** the key is still the keychain's, is still shown as `anahtar
   kayıtlı`, and is still absent from any file the slice writes.

---

### User Story 3 - Know when a setting could not be read (Priority: P2)

The settings file is corrupt or unreadable. The application starts on defaults
and the settings screen says so in one line, instead of pretending nothing
happened.

**Why this priority**: constitution IX. A settings file that silently reverts is
how a person loses an hour wondering why the model changed itself.

**Independent Test**: write garbage into the settings file, start the
application, and read the settings screen.

**Acceptance Scenarios**:

1. **Given** an unreadable settings file, **When** the application starts,
   **Then** it runs on defaults and the settings screen states that the file
   could not be read and what the path is.
2. **Given** that state, **When** the user chooses a setting, **Then** the file
   is written again and the message goes away.

---

### Edge Cases

- The settings file does not exist on first run: that is not an error, and no
  message is shown.
- The file is readable but holds an older shape, missing a field: the missing
  field takes its default and the rest is kept. Nothing is invented for it.
- The stored model name no longer exists in the local runtime: the choice is
  kept as written and the failure appears where the request is made, as it does
  today.
- Settings are open when the user drops a file on the window: the drop is
  handled as it is everywhere else, and settings stays open.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `Ayarlar` MUST be reachable from the window's own header on every
  screen, as one bounded control, without a menu.
- **FR-002**: `Ayarlar` MUST open in the working pane and MUST leave the rail as
  it was: the source, the shift and the criteria stay visible and usable while
  settings are open.
- **FR-003**: Appearance MUST offer exactly three states — `Sistem`, `Açık`,
  `Koyu` — with `Sistem` as the default, and MUST show which one is active.
- **FR-004**: Choosing an appearance MUST repaint the whole window immediately,
  with no relaunch and no reload, and MUST NOT require the operating system to
  change.
- **FR-005**: `Sistem` MUST follow the operating system's scheme, including
  changes made while the window is open. An explicit choice MUST ignore those
  changes.
- **FR-006**: The appearance MUST be applied before the first paint, so an
  explicitly dark window never shows a light frame while it starts.
- **FR-007**: The appearance choice MUST survive a restart.
- **FR-008**: The model controls MUST move to `Ayarlar` and MUST behave exactly
  as feature 004 left them. The rail MUST NOT carry a model section.
- **FR-009**: The rail MUST name the engine that will run on the next search, in
  one line: `Sezgisel`, `Yerel · <model>` or `Bulut · <model>`. It MUST be text,
  not a second way into settings.
- **FR-010**: The mode, the local address, the local model name and the cloud
  provider MUST survive a restart. The key MUST remain in the keychain.
- **FR-011**: Settings MUST NOT write a secret to any file. A key that the user
  saved before this slice MUST still be found after it.
- **FR-012**: When the settings file cannot be read, the application MUST start
  on defaults, MUST keep working, and MUST say so on the settings screen with
  the file's path.
- **FR-013**: Leaving `Ayarlar` MUST return the working pane to what it held
  before, without repeating a search, a cut or a preview.
- **FR-014**: Every label in settings MUST exist in Turkish and English, and no
  component may hardcode a user-facing string.
- **FR-015**: Every control in settings MUST be live: a control that changes
  nothing is not shipped.
- **FR-016**: The slice MUST NOT add a network request, a telemetry path, or a
  new dependency beyond what 004 already uses for serialisation.

### Key Entities

- **Setting**: one named choice, stored by the part of the application that acts
  on it. The appearance belongs to the interface; the model belongs to the
  backend.
- **Engine line**: the rail's one-line statement of which engine the next search
  will use.
- **Settings view**: the working pane's fourth state, beside empty, tracks and
  results.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From one build, three screenshots — `Sistem` with the desktop in
  dark, `Açık`, `Koyu` — show every surface following one choice, with no
  surface left in the other appearance.
- **SC-002**: With `Koyu` chosen and the application restarted, the first frame
  drawn is dark. Checked by recording the window during start-up.
- **SC-003**: A chosen mode, address and model are read back unchanged after a
  restart. Checked by reading the settings file and by the rail's engine line.
- **SC-004**: At 880×600 the rail holds source, engine line, shift and criteria,
  scrolls to all of them, and shows no model control; the settings view scrolls
  to all of its controls and cuts none of them horizontally. Checked by
  screenshot at that size.
- **SC-005**: No secret appears in any file the slice writes. Checked by saving a
  cloud key, setting a mode, and reading the settings file.
- **SC-006**: A corrupt settings file produces a starting application and a
  stated message, covered by a Rust test and by one run by hand.
- **SC-007**: Body text on its background stays at least 7:1 and secondary text
  at least 4.5:1 in all three appearance states, from the token values.
- **SC-008**: The application still builds and its tests still pass.

## Assumptions

- **The settings place is a view, not a dialog.** A dialog over the results would
  make the rail and the criteria unreachable while a model address is typed. The
  working pane already switches between empty, tracks and results; settings is
  the fourth state of the same pane.
- **Storage is split by owner, and that is the rule.** The appearance is a token
  swap owned by the interface, stored where the interface can read it before the
  first paint. The model is provider state owned by the backend, stored in a
  plain JSON file beside the application's other local data. The owner sees one
  screen; the rule is that a setting lives with the code that acts on it.
- The settings file is plain text. The constitution keeps *secrets* in the
  keychain, and none of these four values is a secret.
- `Ayarlar` belongs in the header beside the language switch, not in the rail:
  the rail is about this file, settings are about the application.
- No reset button, no import or export, no per-feature settings section. The
  slice is the surface and its two occupants.
- **The rail scrolls, and will always have a section across the fold at some
  window height.** That is feature 003's design and this slice does not change
  it. What it removes is the model section from that column, not the scroll, so
  SC-004 asks for reachability rather than for a fold that falls in a tidy
  place.
