# Feature Specification: Subtitle sources and alignment

**Feature Branch**: `002-subtitle-sources`

**Created**: 2026-11-17

**Status**: Merged (#3). Open: T008, the manual half of verification.

**Input**: Use the subtitle tracks a video already carries, and let the user line them up with the sound before searching.

## Why this slice exists

Feature 001 assumes the user has a subtitle file that already matches the
video. That assumption fails in the two ordinary cases: a container that
carries its own subtitle track, and a recording whose subtitles are shifted
by a constant.

Both failures are quiet. An offset subtitle produces a clip that is confidently
wrong, and a tool that silently cuts two seconds before the sentence is worse
than one that does nothing. This slice makes the source visible and the
alignment checkable.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use the track the video already carries (Priority: P1)

The user drops in an MKV with three subtitle tracks. The application lists them
with their language and codec, the user picks one, and the session opens
without a sidecar file.

**Why this priority**: It removes the most common extra step, and it is the
difference between "bring me an SRT" and "drop the file in".

**Independent Test**: open the fixture MKV with no sidecar file, choose the
Turkish track, and search. Produces the same candidates as the sidecar flow.

**Acceptance Scenarios**:

1. **Given** a video with embedded subtitle tracks, **When** the user opens it,
   **Then** each track is listed with its language and codec, and none is
   chosen on the user's behalf.
2. **Given** a chosen text track, **When** the session opens, **Then** the cue
   table holds the same lines as the equivalent sidecar file, with the same
   cue count.
3. **Given** a track that stores pictures rather than text, **When** the user
   picks it, **Then** the application says that this track cannot be read as
   text instead of returning an empty table.

---

### User Story 2 - Hear whether the subtitles line up (Priority: P2)

The subtitles are three seconds late. The user opens a cue, plays a few seconds
of the sound around it, hears that the line has not been spoken yet, and shifts
every cue forward until it has.

**Why this priority**: An offset control without a way to hear the result is a
guess. This is the smallest thing that makes the control honest.

**Independent Test**: on a recording whose subtitles were deliberately shifted,
apply the known shift and confirm with the sample that the line is now heard
when the cue says it is.

**Acceptance Scenarios**:

1. **Given** a loaded session, **When** the user asks to hear a cue, **Then** a
   short sample of the sound around that cue is played.
2. **Given** an offset of plus three seconds, **When** the user applies it,
   **Then** every cue's start and end move by three seconds, cue indices do not
   change, and the search returns candidates shifted by the same amount.
3. **Given** an applied offset, **When** the user resets it, **Then** the cue
   times return to the values the file carried.

### Edge Cases

- **A cue would start before zero.** The start is clamped to zero and the cue
  is marked as clamped rather than silently moved.
- **The video has no audio track.** The sample cannot be produced; the
  application says so and the offset controls stay usable, because a user may
  still know the offset from elsewhere.
- **A track carries pictures, not text** (PGS, VobSub, DVB). Named as such in
  the track list, and refused with an explanation if chosen.
- **Several tracks share a language.** They are distinguished by title and
  index, and the choice is the user's.
- **A cue ends after the media does.** Unchanged from feature 001: clamped, and
  reported.
- **The offset is huge** (minutes). Still applied; the application does not
  decide that the user is wrong.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST list every subtitle stream in the opened
  video with its index, codec, language tag when present, and title when
  present.
- **FR-002**: The user MUST be able to open a session from a chosen embedded
  track instead of a sidecar file, and the two paths MUST produce the same cue
  table for equivalent content.
- **FR-003**: Extracting a track MUST NOT write a temporary file next to the
  user's media; the text is read from the tool's output stream.
- **FR-004**: A track whose codec stores pictures MUST be identified as such
  before the user picks it, and choosing it MUST produce a named error rather
  than an empty table.
- **FR-005**: The user MUST be able to set a global offset applied to every cue,
  in steps of 0.1, 0.5 and 1 second, in both directions, and to reset it.
- **FR-006**: An offset MUST NOT change cue indices, MUST NOT re-parse the
  subtitle file, and MUST move every cue's start and end by exactly the offset.
- **FR-007**: A cue whose start would fall below zero after the offset MUST be
  clamped to zero and MUST be reported as clamped.
- **FR-008**: The search MUST operate on offset-adjusted times.
- **FR-009**: The user MUST be able to hear a short sample of the sound around a
  chosen cue, and the sample MUST be produced locally as uncompressed audio so
  that no codec support is required of the interface.
- **FR-010**: The sample MUST NOT be written to disk at all. It is produced in
  memory and handed to the interface, so there is nothing to clean up and
  nothing left behind. This is stricter than the draft, which allowed a
  temporary file, and it is free: FFmpeg can write WAV to its output.
- **FR-011**: When the media has no audio stream, the request for a sample MUST
  fail with a named error and MUST NOT block the rest of the interface.
- **FR-012**: The feature MUST perform no network requests.

### Key Entities

- **Subtitle track**: stream index, codec, language, title, and whether it can
  be read as text.
- **Offset**: a signed millisecond value applied at read time, never written
  back to the source file.
- **Sample**: a short uncompressed audio file produced around one cue, with its
  cue index and duration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Opening the embedded track of the fixture video produces the same
  cue count as the equivalent sidecar file, and the same first and last cue
  text.
- **SC-002**: For a fixture whose subtitles were shifted by a known amount, the
  first cue's start after applying the inverse offset is within 100 ms of where
  the unshifted file would put it.
- **SC-003**: A four second sample stays under one megabyte and plays in the
  application.
- **SC-004**: With an offset of plus or minus three seconds, every candidate
  returned by a search differs from the unshifted result by exactly that
  amount.
- **SC-005**: A track whose codec stores pictures is classified as such before
  it can be chosen, and choosing one produces a named error. Verified by unit
  test on the real codec names, because the fixture cannot carry one: see the
  assumption below.
- **SC-006**: The whole flow completes with the network interface down.

## Assumptions

- Samples are audio only. Video preview remains out of scope, as it has been
  since feature 001.
- Offsets are not remembered between sessions. Persisting them belongs with the
  feature that introduces settings.
  *Superseded (recorded 2026-11-27)*: 006 introduced settings and did not
  take this. It is a small slice on the roadmap in `.specify/memory/product.md`.
- Estimating the offset automatically from the audio is out of scope. This
  feature makes the adjustment possible and checkable; guessing it comes later,
  if at all.
- The fixture set grows by one MKV carrying two text subtitle tracks, and by a
  copy of the Turkish SRT shifted by three and a half seconds. Media stays out
  of the repository as before.
- **No picture-based track can be produced here.** FFmpeg has encoders for both
  DVD and DVB subtitles, and both refuse text input: "subtitle encoding
  currently possible only from text to text or bitmap to bitmap". Synthesising
  one would need a bitmap source that does not exist. So the picture path is
  classified and refused by rule, and tested against the codec names rather
  than against a file, and this line records why.
