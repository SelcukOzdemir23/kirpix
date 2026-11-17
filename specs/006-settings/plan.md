# Implementation Plan: One place for the choices that are not about this file

**Branch**: `006-settings` | **Spec**: `spec.md`

**Input**: Feature specification from `specs/006-settings/spec.md`

## Summary

Two owners, one surface. The interface gains an `Ayarlar` view in the working
pane holding the appearance switch, and the model panel moves there from the
rail. Rust gains a JSON settings file holding the provider mode, so a choice
made once is still there tomorrow.

Nothing about the search, the shortlist, the request or the cut changes. The
model panel is moved, not rewritten.

## Constitution check

- **I. Local by default**: the settings file is local; nothing new leaves the
  device. Passes.
- **II. Device works alone**: heuristic is still the default; settings never
  require a server. Passes.
- **III. AI is optional**: moving the panel does not make a model necessary, and
  the engine line states which engine runs. Passes.
- **IX. Failures are visible**: an unreadable settings file produces a stated
  line with its path, not a silent default. Passes, and it is FR-012.
- **VIII. Small, runnable slices**: after every task the application runs on a
  real file; no half-built mode is shipped. Passes.
- **Constraints**: no secret in the settings file (FR-011); no new dependency;
  both languages (FR-014). Passes.

## Architecture

### Appearance: one attribute, three states

Themes stay token swaps. Today the dark block is inside a media query and
nothing can override it, which is exactly the defect. The shape becomes:

```css
:root { --light-text: …; --dark-text: …; --app-text: var(--light-text); … }
@media (prefers-color-scheme: dark) { :root { --app-text: var(--dark-text); … } }
:root[data-theme='light'] { --app-text: var(--light-text); … }
:root[data-theme='dark']  { --app-text: var(--dark-text); … }
```

Each colour value appears once, in a `--light-*` or `--dark-*` slot; the three
blocks below are the same mechanical mapping. `color-scheme` is set on the same
three selectors so the system scrollbars follow the same choice.

*Rejected*: `light-dark()` would need one block instead of three, but it needs a
WebKitGTK recent enough that nobody has checked it on the machine this ships to
first, and the failure mode is invisible text. The three-block mapping works on
any webview.

*Rejected*: hardcoding `data-theme` from a Tauri command on start-up. It paints
once with the default before the command returns, which is the light flash FR-006
forbids.

### Where each setting lives

The appearance is a swap of CSS variables, so it is read and written by
`app/src/theme.ts` against `localStorage`, and applied at module load in
`main.tsx` before React renders. Synchronous, no IPC, no first-paint flash.

The provider mode is `Mode`, already serde-tagged in
`provider/mod.rs`. It is stored by Rust in one file:

```
<app config dir>/settings.json   { "mode": { "mode": "local", "address": "…", "model": "…" } }
```

with `#[serde(default)]` so a file written by an older build still loads, and a
write-to-temp-then-rename so a crash mid-write cannot leave half a file.

### The surface

`SettingsView` is a component, rendered in the working pane instead of the
empty/tracks/results content. The working pane's own state lives in `App`
(candidates, bounds, rejected), so returning from settings restores it without
any refetch — FR-013 is satisfied by construction, not by saving a snapshot.

The header gains one bounded button. The rail keeps source, engine line, shift
and criteria.

## Milestones

- **M1** — `Ayarlar` opens a view in the working pane; appearance switch works
  and persists.
- **M2** — the model panel moves into that view; the rail gains the engine line
  and no longer clips.
- **M3** — Rust stores the mode in `settings.json`; the choice survives a
  restart.
- **M4** — an unreadable file is stated on the settings screen.

## Verification

- `cargo test` for the settings file: round trip, missing file, corrupt file,
  missing field.
- `tsc --noEmit` and `npm run build`.
- Screenshots at 880×600 and 1100×760: settings open in each of the three
  appearances; the rail without the model section.
- By hand on a desktop session, and recorded as such in `tasks.md`: restart with
  `Koyu` chosen, and the absence of a light frame at start-up.

## Out of scope

- A reset-to-defaults control, import/export, and per-feature settings.
- Moving the shift or the criteria into settings.
- Any change to how a key is stored, read or cleared.
