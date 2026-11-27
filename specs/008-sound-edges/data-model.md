# Data model: Sound-aware edges

## Pause

| Field | Type | Rule |
| --- | --- | --- |
| `startMs` | u64 | start of the run of quiet windows |
| `endMs` | u64 | end of the run; `endMs − startMs ≥ 200` |

## SoundProfile

| Field | Type | Rule |
| --- | --- | --- |
| `pauses` | Pause[] | sorted by `startMs`, non-overlapping |
| `thresholdDb` | f32 | halfway between the 10th percentile and the median window level |
| `windowMs` | u32 | 10 |

## SoundState

One of `reading`, `ready` (with a `SoundProfile`), `unavailable` (with a
reason: `noAudio` or a decode failure's message).

## Placement

Per candidate, one value for each edge:

| Field | Type | Rule |
| --- | --- | --- |
| `start`, `end` | `{ placed: true, atMs, movedMs }` or `{ placed: false }` | `abs(movedMs) ≤ 1500`; a placed start ≤ first matched cue's start; a placed end ≥ last matched cue's end; the clip stays within 001's bounds |

The placed edges are the candidate's starting edges in the interface; the
user's moves start from them and reset returns to them (spec FR-011).
