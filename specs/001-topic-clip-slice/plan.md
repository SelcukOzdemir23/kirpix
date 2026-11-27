# Implementation Plan: Topic clip slice

**Branch**: `001-topic-clip-slice` | **Date**: 2026-11-17 | **Spec**: `spec.md`

**Input**: Feature 001, the deterministic topic path, no model.

## Summary

A Tauri 2 application that opens one video and one subtitle file, parses the
subtitle into a canonical cue table, matches topic terms against it, returns
bounded candidates with their evidence, and cuts the chosen ones with a bundled
FFmpeg into a folder the user picks.

Rust owns parsing, matching, media probing and cutting. TypeScript owns the
interface and nothing else. There is no model, no network, and no sidecar
process other than FFmpeg.

## Technical Context

| | |
| --- | --- |
| Shell | Tauri 2 |
| Core | Rust, stable (1.100 on the development machine) |
| Interface | React 19, TypeScript, Vite, Tailwind 4 |
| Media | FFmpeg and FFprobe, bundled as Tauri `externalBin` |
| Serialization | `serde` for the IPC surface |
| State | Rust holds the loaded session; the interface holds only view state |
| Storage | Application config directory for the output folder and duration bounds |
| Testing | `cargo test` for parsing, matching and the golden check; manual checks for playback and offline |
| Target | Linux first. Windows and macOS packaging is a later feature |
| Performance | Parse and search under two seconds on either eval recording (SC-003) |

## Constitution Check

| Article | Gate | Status |
| --- | --- | --- |
| I Local by default | No upload path exists. No network client is compiled in | PASS |
| II Works alone | No network code; SC-005 runs with the interface down | PASS |
| III AI optional | No model, no provider, no key | PASS |
| IV Evidence out | Every candidate carries cue indices, matched terms and a reason; the UI refuses a candidate without them | PASS |
| V Line indices | Candidates are built from cue indices; timestamps are derived | PASS |
| VI Tokens on decisions | No tokens spent | PASS |
| VII Determinism | Pure functions over the cue table; pinned ordering rules | PASS |
| VIII Small slice | One path, no scaffolding for later modes | PASS |
| IX Visible failures | Closed error taxonomy, one message per failure, no silent fallbacks | PASS |
| X Eval set | Golden test against `eval/gold/`, manual acceptance per recording | PASS |

No violations, so no complexity justification is required.

## Decisions

1. **Rust does the work, not the webview.** Parsing and matching in JavaScript
   would be faster to write and wrong: the same rules will later run against
   model output, and splitting the rules across two languages guarantees they
   drift. Rust owns them; the interface renders results.
2. **No local HTTP server, no port, no token.** Tauri's IPC is already the
   boundary. A localhost sidecar would add a port, a bearer token, a crash mode
   and a listening socket to a product whose promise is that nothing listens.
3. **FFmpeg as a bundled binary, not a crate.** `ffmpeg-sidecar` and friends
   still shell out, but hide the argument surface we need to control for FR-017
   and FR-018. Direct invocation, one builder function, tested.
4. **Cut by re-encoding with `-ss` before `-i` and `-t` for duration.** Stream
   copy snaps to keyframes and produces clips whose first frame is wrong. The
   seek lands before the requested point and decode continues to it, so the cut
   is frame accurate.
5. **FFprobe for media metadata.** Parsing `ffmpeg -i` stderr for a duration is
   a classic source of silent nonsense. FFprobe emits JSON.
6. **No video preview in this slice.** The interface shows the cue text, not the
   picture. That sidesteps the WebKitGTK H.264 problem entirely, and the user
   can open the produced file. A preview is a later feature with its own risk.
   *Superseded (recorded 2026-11-27)*: 005 added a preview.
7. **Session state in Rust.** One loaded video and cue table at a time, held in
   Tauri managed state. The interface never re-sends 400 cues to search.
8. **Progress from `-progress pipe:1`.** Machine-readable key/value lines on
   stdout, not log scraping on stderr.

## Project Structure

*Superseded (recorded 2026-11-27)*: the interface files below were never split
out; `App.tsx` holds them. The reason sentence moved from Rust to the
interface (T009), so `Candidate.reason` in the IPC sketch does not exist.
Feature 007 plans the interface structure again.

```
app/
  package.json
  vite.config.ts
  src/
    main.tsx
    App.tsx
    state.ts                 view state machine, one discriminated union
    i18n/copy.ts             Turkish and English strings
    components/
      FilePicker.tsx
      CriteriaForm.tsx
      CandidateList.tsx
      CandidateCard.tsx
      CutPanel.tsx
      ErrorBanner.tsx
  src-tauri/
    Cargo.toml
    tauri.conf.json
    binaries/                ffmpeg and ffprobe, per target triple
    src/
      main.rs                app wiring, managed state
      commands.rs            the IPC surface
      error.rs               error taxonomy, one enum, serialized
      subtitle/
        mod.rs
        model.rs             Cue, CueTable
        vtt.rs
        srt.rs
        decode.rs            UTF-8, then Windows-1254, then fail
      criterion/
        mod.rs
        normalize.rs         NFC, Turkish case folding, punctuation
        topic.rs             matching, merging, padding, bounds, ranking
        candidate.rs         Candidate, reason generation
      media/
        mod.rs               probe, cut
        ffmpeg.rs            command builders, progress parser
        names.rs             output file naming, collision handling
```

## IPC Surface

```rust
open_session(video_path: String, subtitle_path: String) -> SessionInfo
//   -> { duration_ms, cue_count, encoding, media: { width, height, has_audio } }

session_cues(from: usize, to: usize) -> Vec<CueView>
//   -> [{ index, start_ms, end_ms, text }]

search_topic(terms: Vec<String>, min_ms: u64, max_ms: u64) -> Vec<Candidate>
//   -> [{ id, start_cue, end_cue, start_ms, end_ms, duration_ms,
//         matched_terms: Vec<String>, reason: String, clamped: bool }]

cut_clips(clips: Vec<ClipRequest>, out_dir: String) -> Vec<CutResult>
//   ClipRequest -> { start_ms, end_ms, source_name }
//   CutResult   -> { path, duration_ms, status, message }
```

Rules the surface enforces:

- `search_topic` with an empty term list is rejected with `EmptyTerms`, not run
  as a search for nothing (FR-005).
- A `Candidate` cannot be constructed without at least one matched cue, so
  FR-013 holds by construction rather than by a check.
- `cut_clips` never overwrites: a name collision gets a suffix, and the result
  reports the final path (FR-018).
- One failed clip cannot abort the batch (FR-019).

## Error Taxonomy

```
SubtitleUnreadable { path, reason }
SubtitleEmpty
MediaUnreadable { path, reason }
MediaProbeFailed { path, code }
EmptyTerms
FfmpegMissing { path }
FfmpegFailed { clip, code, tail }
OutputNotWritable { dir, reason }
```

Each variant has one message in each language, plus the specific values, so the
interface never invents text (article IX).

## Testing

| Level | What | How |
| --- | --- | --- |
| Parser | Both fixtures produce 357 and 239 cues; the repeated block and the run-on timestamp are handled per FR-003 | `cargo test`, reading `eval/fixtures/` |
| Normalization | `KAYGI` matches `kaygı`; `endişe` matches `endişesi`; unrelated words do not match within the four-character limit | unit tests |
| Candidates | Merge within twenty seconds and eight cues (FR-008 as amended in T008), pad half a second, clamp, bounds, ordering | unit tests on small hand-built tables |
| Golden | Search on both recordings overlaps a gold range by at least 80 percent of its duration (SC-001) | `cargo test` reading `eval/gold/` |
| Determinism | Two runs produce identical candidate JSON (SC-004) | unit test |
| Manual | A cut file plays and matches the card duration within 0.25 s (SC-002) | one row per recording in the PR |
| Manual | The whole flow completes with the network interface down (SC-005) | once, recorded in the PR |

The golden test reads `eval/` by relative path from `app/src-tauri`, so it runs
only in a checkout that has the fixtures. Media files are needed for the manual
checks and the media tests, not for the golden test.

## Risks

- **Bundled FFmpeg size and linkage.** Two binaries per platform, and they have
  to be static builds: the system FFmpeg on the development machine is
  dynamically linked against seven libav libraries, so shipping it would work
  only where those libraries already exist. Measured against the 150 MB
  installer budget in the constitution before packaging work starts.
- **Windows and macOS binary handling.** Out of scope here, but the
  `externalBin` layout is chosen now so it does not have to change later.
- **No preview means the user cuts blind.** Accepted for this slice; the cue
  text plus the reason is the evidence, and the produced file is the check.
- **Turkish suffix rule is a heuristic.** Four characters covers common suffixes
  and will miss others. It is stated, tested and adjustable, rather than hidden
  inside a fuzzy match.

## Out of Scope

Subtitle alignment and offset correction, embedded subtitle tracks, speech
recognition, every criterion except topic, any model, video preview, batch
ingestion, Windows and macOS packaging.
