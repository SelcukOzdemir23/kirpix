# Data model: Interface redesign

The slice adds no stored data. These are the view types the screens render
from (FR-019); every field comes from a backend type that already exists,
except `Cue.marks`.

## Screen state

Exactly one at a time (spec › Key Entities). `results-cut` and `results-empty`
on the fixture page are variants of `results` (the cut strip open; no
candidate matched), not states of their own.

| State | Shown when | Primary action |
| --- | --- | --- |
| `start` | no recording open | pick a file |
| `tracks` | a container was opened and its track is not chosen | choose a track |
| `criterion` | a recording is open, no search has returned | find clips |
| `results` | a search returned (possibly zero candidates) | cut N clips |
| `settings` | settings are open; closing returns the previous state unchanged | — |

Transitions: `start → tracks | criterion` on open; `tracks → criterion` on a
chosen track; `criterion → results` on search; `results → results` on a new
search from the criterion bar; any → `criterion` on an offset change while
results exist (002: results are discarded); any ↔ `settings`.

## CriterionCard

| Field | Type | Rule |
| --- | --- | --- |
| `id` | `topic` \| `duration` \| `arc` \| `hook` \| `own` | fixed order (FR-002) |
| `built` | boolean | only `topic` is `true` in 007 |
| `roadmap` | `"009"` … `"012"` \| null | required when `built` is false (FR-003) |

An unbuilt card renders text only and has no handler (FR-021).

## Selection

| Field | Type | Rule |
| --- | --- | --- |
| `selectedId` | candidate id \| null | null only when the list is empty (FR-009); first candidate on arrival |
| `kept` | set of candidate ids | all kept on arrival, as today |
| `bounds` | per candidate `{ startMs, endMs }` | unchanged from 001 |

## Cue (changed)

`Cue` as returned by `session_cues` gains one field:

| Field | Type | Rule |
| --- | --- | --- |
| `marks` | `[start, end][]` | UTF-16 offsets into `text`, sorted, non-overlapping; empty when no terms were passed or nothing matched |

## Cut strip

`CutResult[]` from 001, plus the output folder. Open after a cut; closable;
does not change the selection (FR-024).
