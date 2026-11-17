# Tasks: The desktop shell

**Input**: `spec.md`, `plan.md`

**Rule**: one task, one commit, and the application still builds and runs after
each.

## Phase 1: The shell

- [x] **T001** Rebuild the window as a rail and a working pane, ship the two
  typefaces, add the ruler with its marks, and make dropping a file the same
  choice as picking one.
  *Done when*: the five states (first run, track choice, results, written files,
  idle) render at 1100×760 and at the 880×600 minimum; every mark is placed from
  the candidate times; the drop wording appears only when the listener
  registered; no mock data is left in the tree.
  *Evidence*:
  - **SC-001**: screenshots at 1100×760 and 880×600 for the first-run, track,
    results and written-files states. The rail keeps its 356px, the pane takes
    the rest, nothing is clipped, and the window does not scroll as a page.
  - **SC-002, SC-003**: the marks were read out of the rendered DOM for a mock
    session of 878 000 ms and compared with the arithmetic:
    `214000/878000 = 24.3736%` rendered as `left: 24.3736%`,
    `42000/878000 = 4.7836%` as `width: 4.7836%`,
    `701000/878000 = 79.8405%`, `851000/878000 = 96.9248%`. The edited
    candidate shows its original edges at `46.9248%` and `51.139%` and its new
    span at `left: 46.6401%; width: 4.6697%`, which is `409500/878000` and
    `41000/878000`. All four agree to the digit, so a moved boundary moves the
    mark and the timecode together.
  - **SC-004**: in the browser preview the listener cannot register, and the
    source control renders as "Dosya seç" with no drop wording.
  - **SC-005**: `dist/assets` holds seven bundled `.woff2` files and the built
    CSS references no remote face; the typefaces are local files under the CSP's
    `default-src 'self'`.
  - **SC-006**: `npm --prefix app run build` passes, `cargo test` is unchanged
    and still passes.
  - Ships as one commit: the layout, the ruler and the picking flow share
    `App.tsx`, and any split of that file would leave a commit that does not
    compile. That makes this one task by the constitution's own test — "a task
    that cannot be reviewed alone is too large", and this one can be.

## Phase 2: What only a window can show

- [ ] **T002** Check the shell in a real window: drag the fixture MKV from the
  file manager onto the window, then the MKV together with the SRT, then an SRT
  alone onto an open session; hover a row and its mark; resize to 880×600.
  *Why it is open*: these need a running Tauri window and a pointer. A headless
  browser can show the fallback (no drop wording) but not a real drop, and no
  screenshot can prove a hover pair. A headless Chromium screenshot is not
  evidence for any of it.
