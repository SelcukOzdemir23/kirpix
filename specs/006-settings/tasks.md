# Tasks: One place for the choices that are not about this file

**Input**: `spec.md`, `plan.md`

**Rule**: one task, one commit, and the application still builds and runs after
each.

**Status**: implemented and merged (#13, squashed: the five tasks are one
commit on `master`, `c84caa7`). T005p holds the checks owed to a person.

## Phase 1: The appearance

- [x] **T001** Give the appearance three states and a control that sets them:
  `theme.ts` reads and writes the choice, applies it before React renders, and
  `styles.css` maps the tokens onto the three selectors; `Ayarlar` in the header
  opens a view in the working pane holding the three chips.
  *Done when*: the three states repaint the whole window immediately, the choice
  survives a reload, and `Sistem` still follows the desktop.
  *Evidence*: `app/src/theme.ts` is the only writer of the choice; `main.tsx`
  applies it before `createRoot`, so the first frame is already right.
  `styles.css` now writes each colour once in a `--light-*` or `--dark-*` slot
  and maps it in three blocks — system, explicit light, explicit dark — with
  `color-scheme` set on all three so the scrollbars follow too.
  Four screenshots at 880×600 from the built `dist`: explicit `Koyu`, explicit
  `Açık`, `Sistem` on a light desktop, and `Sistem` on a dark desktop (the last
  one taken with the media query forced, because the headless browser could not
  be told the desktop was dark — the flag that should do it changed nothing).
  The stored choice is read and applied on the first paint: a page that writes
  the key and reloads lands in that appearance without a flash, which is the
  same path a restart takes.
  *Not checked here*: a real restart of the Tauri window (needs a desktop
  session), recorded with the other open desktop checks at the end.

## Phase 2: The model, moved

- [x] **T002** Move the model panel out of the rail into the settings view, and
  give the rail a one-line engine statement in its place.
  *Done when*: no model control remains in the rail, the rail's engine line names
  what the next search will use, and every model behaviour of feature 004 still
  works from its new home.
  *Evidence*: `SettingsView` now renders `ModelPanel` unchanged, with the same
  `onMode` handler the rail had — the move is a relocation, and mode changes
  still clear the old ranking. The rail's model section is gone; in its place a
  single row, `MOTOR` and `Yerel · qwen2.5:7b`, plain text with a tooltip that
  widens to the address when the row truncates. Screenshots at 880×600 in both
  appearances show the settings pane with the model controls and the rail
  without them.
  *What the screenshots also show, and what the spec now says instead of
  pretending otherwise*: at 880×600 the shift section straddles the fold. The
  rail has scrolled since 003, so it is reachable, and SC-004 was reworded from
  "no clipped section" to reachability, with the reason recorded in the spec's
  assumptions.

## Phase 3: The file

- [x] **T003** Add `settings.rs`: the settings file, its load and its atomic
  save, wired to the provider state, with `get_settings` and `set_mode`
  persisting. The mode, address, model and provider survive a restart.
  *Done when*: a Rust test covers round trip, missing file and a missing field,
  and no test touches a real config directory.
  *Evidence*: `settings.rs` holds `Settings { mode }` and a `Store` that reads,
  writes through a temporary neighbour and renames. Nine tests, 111 in the crate
  (was 102): round trip, first run, corrupt file naming itself and left
  untouched, a field an older build did not write, a field a later build added,
  and three on the state — a chosen mode is there after a restart, a first run
  starts heuristic, an unreadable file is kept and cleared by a write, and a
  state with no store refuses to pretend it saved. Every test uses
  `std::env::temp_dir()`; none reads the real config directory.
  `set_mode` now writes before it adopts: a mode that could not be written is not
  a mode that was chosen, and the failure comes back as
  `ProviderError::Settings`. `get_mode` became `get_settings`, which answers with
  the mode, the file's path and the reason the file could not be read, so a
  screen cannot show the default without the reason for it.
  *Not checked here*: the real file on a real machine — the path comes from
  Tauri's config directory, which only exists in a desktop session.

- [x] **T004** State an unreadable settings file instead of silently starting on
  defaults.
  *Done when*: a corrupt file produces a running application, a stated line with
  the file's path on the settings screen, and the line goes away once a setting
  is written.
  *Evidence*: the settings view opens with a `role="status"` block in the danger
  colour: the sentence in the current language, then `DOSYA` and the absolute
  path in mono. Screenshot at 880×600 with a corrupt file's message.
  The path is printed once, not twice: `Store::load` now returns the reason
  alone, and the screen takes the path from `Store::path`, which is what the
  earlier draft got wrong — the sentence and the file line both printed it.
  *The line goes away*: `remember_mode` clears `load_error` after a successful
  write, and the interface re-reads `get_settings` after every change instead of
  trusting what it sent, so the screen shows what the file says. Covered by
  `an_unreadable_file_is_kept_and_cleared_by_a_write`; the transition itself is
  not screenshotted, because it needs a click.
  *Also covered*: a failed write is no longer silent — `set_mode` answers with
  `ProviderError::Settings`, and the alert states it in both languages.

## Phase 4: The evidence

- [x] **T005** Check the result the way it will be used: settings at 880×600 and
  1100×760, in all three appearances, in both languages; and record honestly
  which checks need a desktop session.
  *Done when*: screenshots exist for each combination, the rail shows no clipped
  section at the minimum size, and `spec.md`'s success criteria are each either
  checked or named as outstanding.
  *Evidence*: seven screenshots from the built `dist`, each by setting the stored
  choice and reloading, which is the same path a restart takes:
  settings at 880×600 and 1100×760 in `Açık` and in `Koyu`; settings in English
  at 880 and at 1100; the corrupt-file message at 880; the results list at 880 to
  show the rail without a model section.
  Contrast from the token values, both appearances: body text 17.8:1, secondary
  text 7.2–9.9:1 on surface and surface-2. SC-007 holds with room.
  *SC by SC*: SC-001 by the explicit light and dark screenshots (the `Sistem`
  case was checked in T001); SC-002 **outstanding** — the first frame needs a
  recording of a real window; SC-003 by four Rust tests and the engine line in
  the screenshots, but the real file **outstanding** (needs a desktop session);
  SC-004 by the two sizes; SC-005 by reading the writer — no field of `Settings`
  is a key, and the key path is untouched; SC-006 by tests and by the
  corrupt-file screenshot; SC-007 above; SC-008 by `cargo test` (111), `tsc
  --noEmit` and `npm run build`.
  *Outstanding, all needing a desktop session*: the first frame after a restart
  with `Koyu` chosen; the real `settings.json` path on this machine; and that a
  model choice made in the window is the one that runs after closing and
  reopening it.
  *Split (2026-11-27, constitution 1.2.0)*: this box records what the machine
  proved. What a person owes is the open box below, so the record no longer
  says "done" while checks are waiting.

- [ ] **T005p** *Owed to a person, at a desktop.*
  - [ ] with `Koyu` chosen, the first frame after a restart is dark (SC-002);
  - [ ] the real `settings.json` path on this machine is the one the settings
    screen names;
  - [ ] a model chosen in the window is the one that runs after closing and
    reopening it (SC-003).
  *Depends on*: T005.
