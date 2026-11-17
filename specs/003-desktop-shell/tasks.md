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

- [x] **T003** Take the shell's second pass: follow the system colour scheme
  with one token set, raise the type scale so list content is 14px and
  timecodes 15px, and apply the platform's own cursor, selection, scrollbar and
  button conventions.
  *Done when*: the same build renders in light and dark with no relaunch, no
  interface text is under 11px, and the cursor and selection behave the way a
  desktop window does.
  *Evidence*:
  - **SC-007**: contrast computed from the token values, light then dark —
    `text` 17.8 / 17.8, `muted` 6.4 / 8.8, `accent` 5.7 / 6.0, `danger` 7.7 /
    13.6 against the window; the lowest figure on a card surface is 5.29:1, so
    secondary text clears 4.5:1 and body text clears 7:1 in both appearances.
  - **SC-008**: the smallest size in the tree is 11px (the section labels and
    the ruler's quarter marks) and the largest body sizes are 14px, with
    timecodes at 15px. Read from the source by listing every `text-[…px]`.
  - **SC-009**: one build, two renders — the light screenshot was taken as the
    page serves it, the dark one with the browser forced to the dark scheme, so
    the scheme is a variable change and not a second build.
  - **Layout**: the search block is pinned to the foot of the rail, because at
    the 880×600 minimum the scrolling rail was cutting the primary action in
    half. Verified by screenshots at both sizes.
  - `npm --prefix app run build` passes and `cargo test` still reports 59.
  - Unverified, as before: a real window switching scheme live, and the pointer
    behaviour under a real mouse. Both are T002.

- [x] **T004** Make the screen say what it does: one word per job, and one line
  of plain text where the control's effect is not obvious from its object.
  *Done when*: no two visible controls on the results screen share a label, and
  every label names its object.
  *Evidence*: `Göster` became `İzle` (`Watch`), so it no longer collides with
  `Satırlar` (was `Satırları göster`) which expands the cues. The row's
  `Sıfırla` became `Aralığı sıfırla` (`Reset range`) so it no longer shares a
  word with the shift reset. `Değiştir` became `Dosya değiştir`, `gömülü` became
  `gömülü altyazı`, and the shift section is `Kaydırma (sn)` with
  `+0,5` beside it instead of six chips with no unit. The shift section gained
  one line: `Altyazı sesin önünde ya da arkasında kalıyorsa buradan kaydır.`
  Screenshots at 1100×760 and 880×600: the four row actions fit on one line at
  the minimum width, and the clamped chip now wraps to two lines instead of
  three.
  *Honest limit*: the labels are checked by eye and by reading the copy file;
  there is no interface test that asserts the rule.

- [x] **T005** Make the screen legible and make its controls look like controls:
  one step up on the whole scale, a boundary or permanent underline on anything
  clickable, and stronger secondary text.
  *Done when*: body 15px and timecodes 16px, nothing below 12px, every clickable
  thing drawn as a control, and the row's actions still fit on one line at
  880×600.
  *Evidence*: measured from the built source — the scale moved one step
  everywhere (list content 14→15, timecodes 15→16, labels 11→12), and the
  smallest size in the tree is 12px. Secondary text darkened in light
  (`#5e5e6d`→`#4c4c5c`) and lightened in dark (`#adabb9`→`#bcbac9`).
  Every row action is now a bounded chip with a hover; `Dosya değiştir` and the
  shift reset carry a permanent underline instead of appearing only on hover.
  The clamped note moved from the headline row to the evidence line, which is
  what let the four actions stay on one line at 880×600 — verified by screenshot
  at that size.
  *What the owner said first, and why it changed*: "yazılar çok küçük … butonların
  tıklanabilirliği belli olmuyor". FR-016's native rule (no hover tint on push
  buttons) is what made them look like labels; FR-018 now says the opposite.
  *Honest limit*: the sizes are fixed, not a setting. If a 15px body is still
  small on that display, the next step is a text-size control, which is its own
  slice — the owner asked where to change it and there is nowhere, yet.

- [ ] **T002** Check the shell in a real window: drag the fixture MKV from the
  file manager onto the window, then the MKV together with the SRT, then an SRT
  alone onto an open session; hover a row and its mark; resize to 880×600.
  *Why it is open*: these need a running Tauri window and a pointer. A headless
  browser can show the fallback (no drop wording) but not a real drop, and no
  screenshot can prove a hover pair. A headless Chromium screenshot is not
  evidence for any of it.
