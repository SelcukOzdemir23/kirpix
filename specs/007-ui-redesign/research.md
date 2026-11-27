# Research: Interface redesign

Phase 0 of `/speckit-plan`. Each entry is a decision, why it was taken, and what
was set aside. Sources: the research page "Kirpix Arayüz Seçenekleri"
(2026-11-27), the owner's answers in `spec.md` › Clarifications, and Anthropic's
`frontend-design` skill (github.com/anthropics/skills, `skills/frontend-design`),
read as guidance and not installed: `.claude/skills/` is managed by Spec Kit.

## R1. What the current screen gets wrong, by the skill's own list

The skill names the traits that make an interface read as generated. The
current app has five of them, and they are the reason it reads that way:

| Trait | Where it is today |
| --- | --- |
| Tinted near-black ground with one bright accent | dark `--ink #0a0a0d` with violet `#8b7cf8` |
| Tracked-out ALL-CAPS labels above content | `SectionLabel` (`MOTOR`, `MODEL`, `KAYDIRMA`) |
| Meta strings joined with middle dots | the rail's `14:38 · 239 satır`, the engine line, card reasons |
| Monospace for small data labels | paths, counts and labels in JetBrains Mono |
| Identical rounded cards, one radius everywhere | candidate cards, panels, chips |

**Decision**: the new identity removes all five. Labels are sentence case and
only where a reader needs them; facts are laid out in a row with their own
labels instead of a dotted string; monospace is kept for one thing only,
timecodes, where columns of digits must line up; radius and borders follow the
role of an element, not a house style.

## R2. Typeface

**Decision**: Atkinson Hyperlegible Next for the interface, Atkinson
Hyperlegible Mono for timecodes only. Both OFL-1.1, both on Fontsource
(`@fontsource-variable/…` 5.3.0), both bundled; the latin-ext subsets cover
ç ğ ı İ ö ş ü and â (checked against each package's `unicode-range`).

**Rationale**: the owner's brief is legibility and "obvious what each control
does". Atkinson Hyperlegible was drawn by the Braille Institute so that
confusable letters (I l 1, 0 O, rn m) stay distinct at small sizes, which is the
brief stated as a typeface. It is a reason specific to this product, not a
fashionable default. The Mono sibling gives timecodes tabular digits that share
the family's shapes, so a timecode does not look like a different program.

**Alternatives**: keep Familjen Grotesk (pleasant, but chosen for the site's
display use and not for small UI text); IBM Plex Sans (legible, but the default
"engineering" choice); system UI fonts (forbidden by 003 FR-002). **Effect**:
003 FR-002 tied the app's faces to the site's. The app now diverges; the site
may follow in its own change. Recorded as a superseded note on 003 FR-002 when
this slice merges.

## R3. Colour

**Decision**: a neutral, slightly green-grey ground (not cream, not near-black),
ink-coloured primary actions, one blue for selection and focus, and a subtitle
yellow used for one purpose only: marking the words the search matched.

| Token | Light | Dark | Job |
| --- | --- | --- | --- |
| `ground` | `#F3F4F1` | `#1A1C1A` | window background |
| `surface` | `#FFFFFF` | `#232623` | lists, detail area, dialogs |
| `ink` | `#1B1D1B` | `#ECEDE8` | text, primary action fill |
| `quiet` | `#565C57` | `#A8AEA8` | secondary text |
| `rule` | `#D5D9D3` | `#3A3E3A` | dividers between regions, never a control's edge |
| `edge` | `#7D847E` | `#7A817A` | the border of every control at rest |
| `select` | `#2457A6` | `#86A9E6` | selected row, focus ring, current value |
| `marker` | `#F5D547` | `#C9A92E` | matched words, ruler marks (as a band) |
| `on-marker` | `#1B1D1B` | `#1A1C1A` | text on a marker band, dark in both appearances |
| `danger` | `#A1271E` | `#F09A91` | failures, destructive actions |

**Rationale**: yellow is the colour of subtitles and of a highlighter on a
transcript; here it means exactly "the search found this", in the lines and on
the ruler, and nowhere else. That is the one bold element (skill: "spend your
boldness in one place"). Everything else is quiet. Blue is reserved for "this is
selected or focused", so the two meanings never share a colour. The dark ground
is a lifted grey, not tinted near-black.

**Alternatives**: keep the violet accent (it marks state today, but in dark mode
it is the "near-black plus one bright accent" look); a warm palette (cream and
terracotta are the first trait in the skill's list).

Contrast, computed from these values before proposing them (WCAG 2 relative
luminance):

| Pair | Light | Dark | Needed |
| --- | --- | --- | --- |
| `ink` on `ground` / `surface` | 15.4 / 17.0 | 14.6 / 13.0 | 7 (SC-007) |
| `quiet` on `ground` / `surface` | 6.2 / 6.9 | 7.6 / 6.8 | 4.5 (SC-007) |
| `on-marker` on `marker` | 11.7 | 7.5 | 7 |
| `select` on `surface` | 7.0 | 6.4 | 3 (state, WCAG 1.4.11) |
| `edge` on `surface` / `ground` | 3.8 / 3.5 | 3.8 / 4.3 | 3 (control boundary, WCAG 1.4.11) |
| `danger` on `surface` | 7.4 | 7.1 | 4.5 |

Two findings changed the first draft. In dark mode, light text on the yellow
band was 1.9:1, so text on a marker is always `on-marker`. And the draft used
`rule` (1.4:1) for control borders, which is exactly the owner's complaint
that controls do not look like controls; controls now take `edge` (3.5:1 or
more). The marker band itself is pale against white (1.45:1), so a marked word
is also set semibold: the mark does not rest on colour alone.

## R4. Control kinds

**Decision**: five kinds, each distinct without colour (FR-016):

| Kind | Look | Example |
| --- | --- | --- |
| Primary | filled with `ink`, text in `surface`, the only filled control on screen | Kesitleri bul, 2 kesiti kes |
| Secondary | `surface` fill, 1px `edge` border, ink text | Önizle, Dosya değiştir |
| Quiet | text with a permanent underline | Sıfırla, Kapat |
| Inactive | dashed border, `quiet` text, a "009'da" line, no hover | the four coming cards |
| Destructive | `danger` text and border | Anahtarı sil |

Boundary controls use one step choice (a two-option segmented control, "1 sn"
or "1 satır") and a minus and a plus per edge, instead of four buttons per
edge, after the owner asked for less clutter (FR-025).

Selected state (a row, a card, a ruler mark) is a 3px `select` bar on the
leading edge plus `select`-tinted fill, so it reads in greyscale too.

## R5. Marking matched words (FR-008, SC-004)

**Decision**: Rust computes the marks. A new pure function in `criterion`
returns, for a line of text and the search terms, the spans of the original
text whose tokens match under the existing rule (`normalize::matches_token`).
`session_cues` gains an optional `terms` argument and each returned cue gains
`marks: [start, end][]` in UTF-16 code units, the unit JavaScript indexes
strings by.

**Rationale**: the spec forbids a second matcher. Normalisation changes text
(Turkish case folding, circumflex folding, punctuation to space), so the
interface cannot find "endişesi" from "endişe" without reimplementing it.
Computing spans next to the matcher keeps one rule.

**Alternatives**: return matched cue indices only and highlight whole lines
(loses which words); a JavaScript port of the normaliser (two rules that drift,
the exact thing 001's plan decision 1 rejected).

## R6. Screenshots without the backend (FR-019, SC-002, SC-003)

**Decision**: a development-only page, `app/screens.html`, renders every screen
state from fixed data in `app/src/dev/fixtures.ts`, at a size given in the URL.
It is a separate Vite entry used by `npm run screens`, not part of the bundled
app.

**Rationale**: the earlier slices took screenshots by patching `App.tsx` with a
script and restoring it, which is fragile and was a source of near-misses.
Screens that render from given state (FR-019) make a fixture page cheap, and it
doubles as the proof that FR-019 holds.

**Alternatives**: a component test framework (a new dependency for the one job
the fixture page already does); keep the patch script.

## R7. Where state lives (FR-018, FR-019)

**Decision**: one hook per concern, each owning its state and backend calls:
`useSession`, `useSearch`, `useRanking`, `usePreview`, `useCut`, `useSettings`,
`useDrop`. `App.tsx` composes them and chooses the screen; screens and
components take props only.

**Rationale**: this is the constitution's code-structure rule applied to the
45 `useState` calls now in one function. Each hook can be read and reviewed on
its own and maps to one earlier feature (002, 001, 004, 005, 001, 006, 003).

**Alternatives**: a state library (a dependency for a problem plain hooks
solve); a single reducer (one file, one reason to change per action, but still
one place every feature edits).

## R8. The 300-line rule as a check (SC-006)

**Decision**: `scripts/check.sh` fails when any `.ts` or `.tsx` file under
`app/src/` exceeds 300 lines, and names the file.

## R9. Rejected for this slice

- Animations beyond the existing hover and press responses: the skill warns
  that scattered motion reads as generated; the one moment of motion is the
  cards folding into the criterion bar, and it respects reduced motion.
- An icon set: text and the existing two glyphs are enough (003 assumption
  kept).
- Keyboard shortcuts for the list beyond focus order (spec: out of scope).
