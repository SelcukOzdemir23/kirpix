# Implementation Plan: Subtitle sources and alignment

**Branch**: `002-subtitle-sources` | **Date**: 2026-11-17 | **Spec**: `spec.md`

**Input**: Feature 002, subtitles the video already carries, and an offset that
can be checked by ear.

## Summary

Extend the probing step to report subtitle tracks, open a session from a chosen
one by reading FFmpeg's output rather than dropping a temporary file, add a
read-time offset that never touches the source, and produce a short WAV sample
around a cue so the offset can be verified by listening.

Nothing here introduces a model, a network call, or a new process boundary.

## Technical Context

| | |
| --- | --- |
| Shell and core | Unchanged: Tauri 2, Rust, React 19 |
| New dependency | None. `ffprobe` already reports streams; the offset is arithmetic |
| Media playback | No asset protocol and no temporary file: the sample arrives as a data URL and plays from memory |
| Storage | Nothing is written for a sample |
| Testing | `cargo test` against the MKV fixture, the shifted SRT, and codec classification |

## Constitution Check

| Article | Gate | Status |
| --- | --- | --- |
| I Local by default | No media path added; extraction reads a stream, the sample is local | PASS |
| II Works alone | No network code; SC-006 | PASS |
| III AI optional | No model involved | PASS |
| IV Evidence out | Clamped cues are reported, not moved quietly | PASS |
| V Line indices | The offset changes times, never indices | PASS |
| VI Tokens | Nothing is sent | PASS |
| VII Determinism | Offset arithmetic; extraction is a pure function of the file | PASS |
| VIII Small slice | Two inputs and one checkable control | PASS |
| IX Visible failures | Picture tracks, missing audio, clamped cues each say so | PASS |
| X Eval set | New fixtures recorded in the manifest before the tests use them | PASS |

## Decisions

1. **A track is extracted to stdout, never to a file beside the user's media.**
   `ffmpeg -i video -map 0:s:N -f srt -` is one command and leaves nothing
   behind. The alternative, a temporary `.srt` in the user's folder, is exactly
   the kind of litter a tool that claims to respect the user's disk should not
   create.
2. **Everything becomes text through FFmpeg.** ASS and TTML are converted to SRT
   on the way out, so one parser covers every text track instead of one per
   format.
3. **Picture codecs are classified by name before extraction.** `hdmv_pgs_subtitle`,
   `dvd_subtitle` and `dvb_subtitle` cannot produce text; the list is code, not
   a guess, and the interface marks the track before it is chosen.
4. **The offset produces a shifted cue table.** The stored table is never
   mutated; the offset yields a derived table for search and display. That keeps
   `criterion::find` untouched and makes the offset trivially reversible.
5. **The sample is WAV, mono, 16 kHz, held in memory.** Four seconds is 128 KB.
   Uncompressed audio needs no codec negotiation with the webview, which is the
   same reason feature 001 avoided video preview. It also means no temporary
   file and no asset-protocol scope to configure: FFmpeg writes to its output
   and the bytes ride back in the response.
6. **Clamped cues are counted, not flagged one by one.** The offset control
   reports how many cues start before zero after the shift, which is the
   information a user needs, without adding a field to every cue.

## Project Structure

*Superseded (recorded 2026-11-27)*: `TrackPicker.tsx` was built as
`TrackChooser.tsx`.

```
app/src-tauri/src/
  media/ffmpeg.rs        probe grows subtitle tracks; new extract_track()
  media/tracks.rs        codec classification, text or picture
  media/sample.rs        WAV sample around a cue, in memory
  session.rs             holds the source, the offset, and derives the shifted table
  commands.rs            list_tracks, open_from_track, set_offset, cue_sample
app/src/
  components/TrackPicker.tsx
  components/OffsetControls.tsx
```

## IPC Surface

```rust
open_session(video_path, subtitle_path)            // unchanged, feature 001
subtitle_tracks() -> Vec<Track>                    // after a video is probed
open_from_track(video_path, stream_index) -> SessionInfo
set_offset(offset_ms: i64) -> OffsetInfo           // { offsetMs, clampedCues }
cue_sample(cue_index: usize, seconds: f64) -> String  // data URL of a WAV
```

## Testing

| Level | What | How |
| --- | --- | --- |
| Classification | Real codec names map to text or picture | unit test |
| Extraction | The MKV's first text track yields the same 239 cues as the sidecar SRT | test against `eval/` |
| Offset | Every cue moves by exactly the offset; indices unchanged; negative starts clamp and are counted | unit test on a small table |
| Search | Candidates shift by exactly the offset (SC-004) | test on the Turkish recording |
| Sample | A four second sample is under one megabyte and probes as PCM | test, skipped when media is absent |
| Manual | A shifted subtitle is corrected by ear | one row in the pull request |

## Risks

- **The fixture carries two text tracks and no picture track.** FFmpeg cannot
  synthesise a bitmap subtitle from text, so that path is proven by
  classification tests and by the error it raises, not by a file.
- **Audio through the webview.** WAV is the safe format; if playback still
  fails on a platform, the sample path is the thing to look at first.
- **The offset can be absurd**, and the application will still apply it. That is
  deliberate: it is the user's number, and the sample is how they find out.

## Out of Scope

Video preview, remembering an offset between sessions, estimating the offset
from the audio, and any model.
