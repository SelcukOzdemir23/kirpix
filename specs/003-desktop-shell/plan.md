# Implementation Plan: The desktop shell

**Branch**: `003-desktop-shell` | **Spec**: `spec.md`

**Input**: Feature specification from `specs/003-desktop-shell/spec.md`

## Summary

Replace the single centred column with a two-pane window: a fixed rail for the
inputs, a working pane for one result at a time, and a ruler across the top of
the pane with every candidate marked where it actually sits. Ship the two
typefaces the project site uses. Make dropping a file the same choice as picking
one.

No Rust changes. The Tauri commands and their payloads are untouched; this is
presentation only.

## Constitution check

- **I. Local by default / II. The device works alone**: no new process, no new
  request. The typefaces are bundled files, not a font CDN. Passes.
- **IV. Criterion in, evidence out**: the candidate row gains the matched line
  count next to the matched terms. The reason line stays derived from
  `matchedTerms`. Passes.
- **IX. Failures are visible**: the drop wording appears only when the listener
  registered; the picture-track reason stays on the row; the system-FFmpeg note
  stays at the foot of the rail. Passes.
- **X. The evaluation set defines quality**: the ruler is drawn from the
  candidate times of the fixture search, so it can be checked against
  `startMs / durationMs` rather than against an impression. Passes.
- **Additional constraint, language**: both faces are OFL, and the repository
  has no third-party licence file yet. Recorded in the spec's assumptions as a
  follow-up; not a blocker for this slice.

## Layout

```
┌────────────────────────────────────────────────────────────────────┐
│ Kirpix                                              [TR] [EN]      │ 52
├──────────────────────┬─────────────────────────────────────────────┤
│ KAYNAK               │ TÜM KAYIT            0:00 — 14:38          │
│ tr-tedx-kaygi.mkv    │ ├────┬────▪────┬──█──┬────▪────┬─────▪──┤   │ 52
│ 14:38 · 239 satır    │ 0:00        3:40      7:19     10:59  14:38  │
│ Türkçe (tur) [gömülü]│                                             │
│ Değiştir             │ 3 aday kesit                          2:04  │
│ ─────────────────    │ ┌─────────────────────────────────────────┐ │
│ KAYDIRMA      +0,5 sn│ │ [ 3:34 → 4:16 ] 0:42   satırlar  çıkar  │ │
│ -1 -0,5 -0,1 +…      │ │ «kaygı», «endişe» geçiyor · 9 satır     │ │
│ ─────────────────    │ └─────────────────────────────────────────┘ │
│ ARAMA                │ …                                           │
│ [kaygı, endişe     ] │                                             │
│ [8] [120]            │                                             │
│ [Kesitleri bul     ] │                                             │
│                      ├─────────────────────────────────────────────┤
│ (system media note)  │ [Seçilenleri kırp]                    2:04  │
└──────────────────────┴─────────────────────────────────────────────┘
        356px                          flexible
```

The rail is `w-[356px] shrink-0` and scrolls; the window is `h-[100dvh]` and
does not. The working pane is a column: the ruler (fixed), the subject
(scrolling), and a footer bar when there is something to cut.

## Typography

Budgets, not suggestions — they are what the screenshots were checked against.

| Role | Face | Size |
| --- | --- | --- |
| Wordmark | Space Grotesk 600 | 14.5px |
| Pane heading | Space Grotesk 500 | 17px |
| Lead sentence | Space Grotesk 400 | 13.5px |
| Body, names | Space Grotesk 400 | 12.5–13px |
| Secondary, reasons | Space Grotesk 400 | 11–11.5px |
| Section labels | JetBrains Mono 400, caps, 0.12em | 10.5px |
| Timecodes, paths, counts | JetBrains Mono 400, `tabular-nums` | 10–13px |

Rule of thumb: mono is for values that come from data; the moment a label is
prose it is sans. Section labels are the only caps.

## Palette

Unchanged from the site, plus two derived values the layout needs.

| Token | Value | Used for |
| --- | --- | --- |
| `ink` | `#0a0a0d` | window, inputs |
| `surface` | `#101015` | cards, ruler |
| `surface-2` | `#15151d` | hovered/active card, pressed toggle |
| `line` | `rgba(255,255,255,0.09)` | every hairline |
| `text` / `muted` | `#f2f0f7` / `#a8a5b6` | body / secondary |
| `accent` | `#8b7cf8` | marks, focus ring, current value, step numbers |
| `accent-dim` | `rgba(139,124,248,0.14)` | the base of a mark |

Primary actions stay `bg-text text-ink` (white on near black). The accent is
never a button fill, which keeps the site's rule: the accent means state.

## Components

| File | Change |
| --- | --- |
| `src/App.tsx` | Shell, rail, panes, drop handling, start/idle/empty states, written-files view |
| `src/components/TimelineStrip.tsx` | **new** — the ruler and the marks |
| `src/components/TrackChooser.tsx` | **new** — the track list, moved out of `App` and given a grid |
| `src/components/CandidateCard.tsx` | Row restyle: bracketed in/out points, matched line count, reset beside the row actions |
| `src/components/CriteriaForm.tsx`, `OffsetControls.tsx` | Rail-sized fields; short step labels |
| `src/useDropZone.ts` | **new** — registers the drop listener and reports whether it worked |
| `src/styles.css`, `src/main.tsx` | Fonts, tokens, focus ring, pane scrollbars |
| `src/format.ts` | `folderOf` for the written-files view |
| `src/i18n/copy.ts` | New strings, dead strings removed |

## Decisions carried in from Issue 2

1. **Layout: list beside the candidates?** Neither. The list stays in one
   column, and the chart of the recording goes above it. Two side-by-side lists
   would ask the eye to compare timecodes; one ruler answers "where" before the
   list is read.
2. **The card's visual language**: an edit decision list row. Bracketed in and
   out points in mono, duration beside them, the evidence line under, and the
   row's actions in a quiet cluster on the right. No thumbnails, because there
   is no video preview in this slice and an empty frame is a promise.
3. **Brand**: the site's. Same palette, same two faces, so the app and the site
   read as one product.

## Verification

- `npm --prefix app run build` — types and bundle.
- `cd app/src-tauri && cargo test` — untouched, still runs.
- Screenshots of five states (first run, track choice, results, written files,
  idle) at 1100×760 and 880×600, taken from mock data injected into `App.tsx`,
  with `App.tsx` restored afterwards and `git status` checked for leftovers.
- The mark positions are read out of the rendered DOM and compared with
  `startMs / durationMs`, rather than eyeballed.
- What a screenshot cannot show — a real drag from the file manager, hover
  pairing with a pointer — is left unticked in `tasks.md` with the reason.

## Out of scope

- Video preview, thumbnails, waveform.
- Icons, menus, keyboard shortcuts, window controls.
- Persisting layout or language between runs.
- Any change to the Rust side or the cut pipeline.

## Note on numbering

Feature 003 was going to be the provider layer. This slice takes the number
because it lands before that work; the provider layer becomes 004 when it is
specced.
