# Contract: sound commands

## New

```text
read_sound() -> SoundState
place_edges(ids: number[]) -> { id: number, placement: Placement }[]
sound_pauses(fromMs: number, toMs: number, minMs: number) -> Pause[]
```

- `read_sound` reads the open session's audio on a worker thread and stores
  the profile in the session. Called once after a recording opens. A second
  call while reading returns `reading`.
- `place_edges` places the given candidates of the last search. Errors with
  `soundNotReady` while reading, `noAudio` when unavailable.
- `sound_pauses` returns the pauses overlapping a range that last at least
  `minMs`; empty when the sound is not ready.

## Changed

```text
search_topic(terms, minMs, maxMs) -> CandidateWithPlacement[]
CandidateWithPlacement = Candidate & { placement: Placement | null }
```

`placement` is `null` while the sound is being read or unavailable; the
candidate's own `startMs` and `endMs` stay the subtitle edges, so nothing that
read them before changes.
