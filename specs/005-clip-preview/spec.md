# Feature Specification: See the clip before cutting it

**Feature Branch**: `005-clip-preview`

**Created**: 2026-11-17

**Status**: Draft

**Input**: Watching a timecode is not the same as watching the clip. Let the user
see a candidate before deciding to cut it.

## Why this slice exists

A candidate row says `[ 3:34 → 4:16 ] 0:42`, and the user has to decide whether
that is the passage they meant. The subtitle lines help, but a speaker's face,
a cut, a silence — the things that decide whether a clip is usable — are not in
the text. Every video tool the user has seen before shows the picture; this one
does not, and "trust the timecode" is a poor excuse for that.

Feature 002 gave the offset control a way to be heard. This gives the candidate
a way to be seen, and it is the same mechanism: FFmpeg produces the bytes, the
interface plays them, and no file is left behind.

## What this slice is not

- **Not a player for the whole recording.** The webview cannot open MKV or AV1,
  so a player over the source file would fail silently on the recordings this
  project is actually built for. A seekable player needs a full proxy of the
  file and is its own slice.
- Not a thumbnail strip, not a waveform, not a scrub bar over the source.
- Not a change to what is cut. The preview shows the same range the card shows.

Neither 002 nor 003 may claim video preview is out of scope any more; those
lines are superseded here.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Look at the candidate (Priority: P1)

The user searches, reads three candidates, and wants to see the second one. They
press "show", a player appears in the row, and it plays the passage.

**Why this priority**: It is the whole slice. Everything else is bookkeeping
around it.

**Independent Test**: on the fixture recording, press show on a candidate and
confirm the picture plays the passage the card's timecodes name.

**Acceptance Scenarios**:

1. **Given** a candidate, **When** the user asks to see it, **Then** the player
   appears in that row and plays the candidate's range from its start.
2. **Given** a second candidate, **When** the user asks to see that one, **Then**
   the first player is replaced, not stacked.
3. **Given** a preview already showing, **When** the user presses the same
   control, **Then** the player disappears and the row is back to its text.
4. **Given** a candidate the user moved the boundaries of, **When** the user
   asks to see it, **Then** the preview covers the moved range, not the original.

### User Story 2 - A long candidate does not become a long wait (Priority: P2)

The candidate is two minutes. The user presses show and the player appears in
about a second, playing the beginning of the range, with a line saying that is
what they are seeing.

**Why this priority**: Encoding two minutes before showing anything would make
the control feel broken. The preview is for deciding, so it has to be quick.

**Acceptance Scenarios**:

1. **Given** a candidate longer than the preview limit, **When** the preview
   is produced, **Then** it covers the first part of the range and says so.
2. **Given** a preview being produced, **When** the user presses the control
   again, **Then** the request is cancelled in the interface and no stale
   preview replaces the current state.

### Edge Cases

- **The recording has no audio.** The preview plays without sound; it is not an
  error and nothing is said about it.
- **FFmpeg fails.** The named failure appears in the ordinary error bar and the
  row keeps its text.
- **The user asks for two previews in a row quickly.** Only the last answer is
  shown; an answer that arrives for a superseded request is dropped.
- **The temp file cannot be deleted.** The preview still plays; one file remains
  in the operating system's temp directory. The plan records where.
- **A clip of two seconds.** Still previewed; the player is not hidden for
  short ranges.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The user MUST be able to ask for a preview of any candidate from
  its row, and the preview MUST cover the range the row currently shows.
- **FR-002**: The preview MUST be produced by FFmpeg from the session's video,
  scaled down for speed, and encoded so the webview can decode it without
  negotiation (H.264 in MP4, AAC audio when there is audio).
- **FR-003**: A preview MUST NOT exceed a documented limit; when the candidate is
  longer, the preview MUST cover the beginning of the range and the interface
  MUST say that it does.
- **FR-004**: The preview MUST be delivered to the interface in memory as a data
  URL. Any temporary file FFmpeg needs MUST be written in the operating system's
  temporary directory and deleted before the command returns.
- **FR-005**: The interface MUST show at most one preview at a time.
- **FR-006**: A preview request MUST be cancellable from the interface, and an
  answer to a superseded request MUST NOT be displayed.
- **FR-007**: A failed preview MUST report its cause and MUST NOT change the
  candidate list.
- **FR-008**: The feature MUST perform no network request and MUST NOT send any
  part of the recording anywhere.
- **FR-009**: The preview MUST use the session's video file, not a copy.

### Key Entities

- **Preview**: the encoded bytes, the duration actually covered, and whether the
  range was cut short.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A twelve second candidate on the fixture recording produces a
  playable MP4 whose header is a real `ftyp` box and which carries `moov` and
  `mdat`, in under four megabytes.
- **SC-002**: A candidate longer than the limit produces exactly the limit, and
  the response says the range was truncated.
- **SC-003**: No file matching the preview's temporary name pattern remains in
  the temp directory after the call returns.
- **SC-004**: An empty or inverted range is refused with the named error.
- **SC-005**: The whole flow still completes with the network interface down.

## Assumptions

- The limit is 20 seconds at 360 lines. Chosen so the encode is a second or two
  on a laptop and the bytes stay under a few megabytes in memory.
- Preview quality is deliberately low: this is for recognising the passage, not
  for judging the picture. What is cut keeps the source quality.
- The player is the platform's own `<video>` element with its controls. No custom
  transport, no frame stepping.
- A seekable player over the whole recording remains out of scope, and this spec
  records why: the webview cannot decode MKV, and the recordings here are MKV.
