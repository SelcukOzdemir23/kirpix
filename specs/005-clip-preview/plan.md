# Implementation Plan: See the clip before cutting it

**Branch**: `005-clip-preview` | **Spec**: `spec.md`

**Input**: Feature specification from `specs/005-clip-preview/spec.md`

## Summary

One new module, one new command, one new CSP source, and a player inside the
candidate row. The encoding path already exists twice over — `sample.rs` for
sound and `cut.rs` for clips — so this is the third use of the same pattern,
not a new pipeline.

## Constitution check

- **I. Local by default / II. Device works alone**: nothing leaves the machine;
  the bytes go from the child process to the interface over the existing IPC
  channel. No network call is added. Passes.
- **IV. Criterion in, evidence out**: the preview is the evidence for the picture
  what the cue text is for the words. It never replaces the term line. Passes.
- **IX. Failures are visible**: a failed encode is a named error in the ordinary
  bar; a truncated preview is stated in the player's line, not implied. Passes.
- **Small, runnable slices**: it works on the fixture recording end to end.
  Passes.

## Encoding

```
ffmpeg -hide_banner -loglevel error -nostdin
  -ss <start> -i <video> -t <duration>
  -vf scale=-2:360
  -c:v libx264 -preset veryfast -crf 32 -profile:v main -pix_fmt yuv420p
  -c:a aac -b:a 96k -ac 2
  -movflags +faststart
  -y <temp file>
```

- `-ss` before `-i` for a fast seek, exactly as the cut path does.
- 360 lines and `crf 32`: recognisable, cheap, and small enough to carry in
  memory. A twenty second preview lands around a megabyte.
- Audio is AAC because the webview must not negotiate anything; a recording with
  no audio simply produces a silent file.
- `+faststart` and a real file rather than a pipe, because a fragmented MP4 over
  stdout is the kind of thing that plays in one webview and not the other. The
  file exists for the duration of one function call.

## Delivery to the interface

FFmpeg writes to `std::env::temp_dir()/kirpix-preview-<pid>-<start>-<end>.mp4`,
the bytes are read back, the file is deleted, and the response is

```
ClipPreview { url: "data:video/mp4;base64,…", duration_ms, truncated }
```

A data URL rather than a blob or an asset URL on purpose:

- it needs no asset-protocol scope, no extra permission and no cleanup in the
  interface;
- it is the same mechanism `cue_sample` already uses, so there is one way for
  FFmpeg output to reach the window, not two;
- deleting the file before returning keeps the promise that the only files this
  application leaves behind are the clips the user asked for.

The cost is a base64 expansion of about a third over a payload of roughly a
megabyte. Acceptable for a click; it would not be for a full-file player.

**CSP.** `media-src` falls back to `default-src 'self'`, which blocks both
`data:` URLs and blob URLs. The current policy blocks the audio sample from
feature 002 as well — that is a latent bug this slice fixes:
`media-src 'self' data: blob:`.

## Interface

- `CandidateCard` gains a third row action, `göster` / `show`, and an inline
  `<video controls autoPlay>` under the row when its preview is current.
- One preview at a time lives in `App`: `{ candidateId, url, durationMs,
  truncated }`, plus `previewingId`.
- The request carries a generation counter. When the answer arrives for a
  generation that is no longer current, it is dropped — the user pressed
  something else in the meantime.
- Pressing the control again clears the preview; pressing it while a request is
  in flight clears the state so the late answer is dropped.
- The truncated line reads `ilk 20 sn` beside the player.

## Files

| File | Change |
| --- | --- |
| `src-tauri/src/media/preview.rs` | **new** — the encode, the temp file, the limit |
| `src-tauri/src/media/mod.rs` | `pub mod preview;` and the re-export |
| `src-tauri/src/commands.rs` | `preview_clip` command, base64 response |
| `src-tauri/src/lib.rs` | register the command |
| `src-tauri/tauri.conf.json` | `media-src 'self' data: blob:` |
| `app/src/api.ts` | `ClipPreview` type and `previewClip` |
| `app/src/components/CandidateCard.tsx` | the action and the player |
| `app/src/App.tsx` | one preview at a time, generation counter |
| `app/src/i18n/copy.ts` | `show`, `hide`, `preparing`, `firstSeconds` |

## Testing

- Rust: encode a twelve second range from `eval/media/tr-tedx-kaygi.mp4`, assert
  the `ftyp`/`moov`/`mdat` boxes, the duration and the size ceiling; a longer
  range gives exactly the limit and reports truncation; an inverted range is
  refused; no file with the pattern remains afterwards (checked by listing the
  temp directory before and after, matching only this process's prefix).
- The command itself is a thin wrapper; it is covered by the module test plus a
  review of the base64 line.
- Interface: screenshots with a mocked preview whose URL points at a local MP4
  served next to `dist`, so the player is real and not a grey box.
- Manual, left open: the same preview inside a real Tauri window on WebKitGTK,
  where the decoder differs from Chromium.

## Out of scope

- A seekable player over the whole recording, thumbnails, waveforms.
- Caching previews between presses.
- Previews for the cut output.
