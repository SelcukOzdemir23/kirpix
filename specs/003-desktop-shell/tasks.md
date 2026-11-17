# Tasks: The desktop shell

**Input**: `spec.md`, `plan.md`

**Rule**: one task, one commit, and the application still builds and runs after
each.

## Phase 1: The shell

- [ ] **T001** Rebuild the window as a rail and a working pane, ship the two
  typefaces, add the ruler with its marks, and make dropping a file the same
  choice as picking one.
  *Done when*: the five states (first run, track choice, results, written files,
  idle) render at 1100×760 and at the 880×600 minimum; every mark is placed from
  the candidate times; the drop wording appears only when the listener
  registered; no mock data is left in the tree.

## Phase 2: What only a window can show

- [ ] **T002** Check the shell in a real window: drag the fixture MKV from the
  file manager onto the window, then the MKV together with the SRT, then an SRT
  alone onto an open session; hover a row and its mark; resize to 880×600.
  *Why it is open*: these need a running Tauri window and a pointer. A headless
  browser can show the fallback (no drop wording) but not a real drop, and no
  screenshot can prove a hover pair. A headless Chromium screenshot is not
  evidence for any of it.
