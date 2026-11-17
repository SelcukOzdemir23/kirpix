# Tasks: One place for the choices that are not about this file

**Input**: `spec.md`, `plan.md`

**Rule**: one task, one commit, and the application still builds and runs after
each.

**Status**: not started. Every box is open; evidence is written when the task is
done, never before.

## Phase 1: The appearance

- [ ] **T001** Give the appearance three states and a control that sets them:
  `theme.ts` reads and writes the choice, applies it before React renders, and
  `styles.css` maps the tokens onto the three selectors; `Ayarlar` in the header
  opens a view in the working pane holding the three chips.
  *Done when*: the three states repaint the whole window immediately, the choice
  survives a reload, and `Sistem` still follows the desktop.
  *Evidence*: …

## Phase 2: The model, moved

- [ ] **T002** Move the model panel out of the rail into the settings view, and
  give the rail a one-line engine statement in its place.
  *Done when*: no model control remains in the rail, the rail's engine line names
  what the next search will use, and every model behaviour of feature 004 still
  works from its new home.
  *Evidence*: …

## Phase 3: The file

- [ ] **T003** Add `settings.rs`: the settings file, its load and its atomic
  save, wired to the provider state, with `get_settings` and `set_mode`
  persisting. The mode, address, model and provider survive a restart.
  *Done when*: a Rust test covers round trip, missing file and a missing field,
  and no test touches a real config directory.
  *Evidence*: …

- [ ] **T004** State an unreadable settings file instead of silently starting on
  defaults.
  *Done when*: a corrupt file produces a running application, a stated line with
  the file's path on the settings screen, and the line goes away once a setting
  is written.
  *Evidence*: …

## Phase 4: The evidence

- [ ] **T005** Check the result the way it will be used: settings at 880×600 and
  1100×760, in all three appearances, in both languages; and record honestly
  which checks need a desktop session.
  *Done when*: screenshots exist for each combination, the rail shows no clipped
  section at the minimum size, and `spec.md`'s success criteria are each either
  checked or named as outstanding.
  *Evidence*: …
