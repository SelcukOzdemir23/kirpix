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

## Contrast (T028; SC-007)

Computed from the final token values in `app/src/styles.css` (WCAG 2 relative
luminance). Every pair meets its threshold in both appearances.

| Pair | Use | Light | Dark | Needed |
| --- | --- | --- | --- | --- |
| `text` on `ink` | body text on the ground | 15.4 | 14.6 | 7 |
| `text` on `surface` | body text on lists and panels | 17.0 | 13.0 | 7 |
| `muted` on `ink` | secondary text on the ground | 6.2 | 7.6 | 4.5 |
| `muted` on `surface` | secondary text on lists and panels | 6.9 | 6.8 | 4.5 |
| `on-marker` on `marker` | marked word on its band | 11.7 | 7.5 | 7 |
| `surface` on `text` | primary action label on its fill | 17.0 | 13.0 | 7 |
| `accent` on `surface` | selected bar and focus ring | 7.0 | 6.4 | 3 |
| `edge` on `surface` | control border on a panel | 3.8 | 3.8 | 3 |
| `edge` on `ink` | control border on the ground | 3.5 | 4.3 | 3 |
| `danger` on `surface` | failure text | 7.4 | 7.1 | 4.5 |

Not computed: text on the selected row's tint, which is a translucent fill over
`surface`; it is lighter than `ink` in light mode and darker than `surface` in
dark mode, so it sits between two rows above that pass.

## Controls on the results screen (T028; SC-008, FR-016)

Kind as in research R4. "Difference" is what tells the kind apart without
colour.

| Control | Turkish | English | Kind | Difference |
| --- | --- | --- | --- | --- |
| Change file | Dosya değiştir | Change file | quiet | permanent underline |
| Subtitle timing | Altyazı hizası | Subtitle timing | secondary | bordered box; bar and tint while open |
| Settings | Ayarlar / Ayarları kapat | Settings / Close settings | secondary | bordered box; bar and tint while open |
| Language | English | Türkçe | quiet | permanent underline |
| Criterion | Konu | Topic | state, not a control | leading bar and tint |
| Words | (field) | (field) | input | bordered field |
| Shortest, longest | En kısa, En uzun | Shortest, Longest | input | bordered field with its label |
| Search again | Yeniden ara | Search again | secondary | bordered box |
| Keep box | (checkbox) | (checkbox) | input | native checkbox, ticked or empty |
| Candidate row | 3:34 – 4:16 … | 3:34 – 4:16 … | selectable row | leading bar and tint when selected |
| Folder | Değiştir | Change | quiet | permanent underline |
| Cut | 3 kesiti kes | Cut 3 clips | primary | the only filled block on screen |
| Preview | Önizle / Önizlemeyi kapat | Preview / Close preview | secondary / quiet | bordered box on the player; underline when open |
| Edge minus, plus | − / + | − / + | secondary | bordered square |
| Step | 1 sn · 1 satır | 1 s · 1 line | segmented | chosen option filled, other bordered |
| Reset edges | Sıfırla | Reset | quiet | underline; shown only after a move |
| Listen | dinle | listen | quiet | permanent underline |
| Ruler mark | (mark) | (mark) | selectable | filled band kept, dashed dropped, ring selected |
| Close strip | Kapat | Close | quiet | permanent underline |

No two visible controls share a label on this screen: the two "Değiştir"
of feature 003's complaint are now "Dosya değiştir" and the folder's
"Değiştir", which sits beside the word "Klasör" (003 FR-017).

## Every action of 001 to 006, and where it is now (T028; FR-013)

| Action | Feature | Reached from |
| --- | --- | --- |
| Pick a video | 001 | start screen (primary); top bar, Dosya değiştir |
| Drop a video, with or without a subtitle | 003 | the window, any state |
| Choose a subtitle file | 001 | track screen, Dosyadan seç; asked after picking a video with no track |
| Choose an embedded track | 002 | track screen |
| Type words, set shortest and longest | 001 | criterion screen; all three also in the criterion bar |
| Search | 001 | criterion screen (primary); criterion bar, Yeniden ara |
| Select a candidate | 007 | list row; ruler mark |
| Keep or drop a candidate | 001 | list row box |
| Move an edge by a second or a line | 001 | detail, step choice and − / + |
| Reset the edges | 001 | detail, Sıfırla after a move |
| Read the candidate's lines | 001 | detail |
| Listen to a line | 002 | detail, dinle |
| Preview a candidate | 005 | detail, Önizle |
| Shift the subtitles, reset the shift | 002 | top bar, Altyazı hizası |
| Choose the output folder | 001 | list footer, Değiştir; asked on first cut |
| Cut | 001 | list footer (primary) |
| Read what was written | 001 | strip under the work |
| Confirm or cancel a model request | 004 | dialog after a search in a model mode |
| Choose appearance | 006 | settings |
| Choose engine, address, model, key | 004, 006 | settings |
| Switch language | 001 | top bar |
| Dismiss an error | 001 | error bar, Kapat or Escape |
