# Evidence: 007 interface redesign

## Screenshots (T027; SC-002, SC-003)

Rendered from the fixture page (`npm run screens`, research R6) in headless
Chromium, from the real search data in `app/src/dev/fixtures.ts`. File names
are `<state>_<appearance>_<width>x<height>.png`.

| State | What it shows |
| --- | --- |
| `start` | no recording open: tagline and one action (FR-001) |
| `tracks` | an MKV with two text tracks and one picture track (002) |
| `criterion` | the question, five cards, topic inputs, one primary action (FR-002–FR-004) |
| `results` | bar, list beside detail with marked lines, ruler (FR-005–FR-009, FR-023, FR-025) |
| `results-cut` | the same with the written-files strip open (FR-024) |
| `results-empty` | no line matched: the message instead of a list |
| `settings` | appearance and engine (006) |

Each state at 880×600 (the minimum window) and 1100×760, light and dark: 28
images.

**SC-002**: no state scrolls horizontally or clips a control at either size in
either appearance. Long values (the output folder) truncate with an ellipsis
and carry the full value as a tooltip.

**SC-003**: in `results` at 880×600 the player, both edge rows with their
buttons, the step choice and the first subtitle line are visible together
without scrolling.

**Not evidence of**: the real WebKitGTK window. Fonts, the native file dialogs,
playback and drag and drop are checked by a person (T031).
