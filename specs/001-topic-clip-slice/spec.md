# Feature Specification: Topic clip slice

**Feature Branch**: `001-topic-clip-slice`

**Created**: 2026-11-17

**Status**: Draft

**Input**: Pick clips by topic from a subtitled video and cut them, deterministically, with no model.

## Why this slice exists

Article VIII of the constitution says every feature ships as a slice that runs
end to end on a real file. This is the first one: open a recording and its
subtitles, ask for a topic, get candidate clips with the lines that justify
them, cut one into a file that plays.

It deliberately involves no model. For a topic criterion, matching words is a
deterministic job, and article III says the product must work without AI. Doing
the deterministic version first proves the whole pipe, gives the evaluation set
something to measure, and leaves the model as an addition rather than a
foundation.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find and cut a clip by topic (Priority: P1)

The user has a 15 minute recording and a subtitle file. They open both, type the
words they care about, and run a search. The application lists candidate clips
with a timecode, a duration, and the subtitle lines that made each one a
candidate. The user keeps one and cuts it. A playable video file appears in the
folder they chose.

**Why this priority**: This is the product thesis in a single path. If a topic
search cannot produce a clip the user accepts, no other feature rescues the
product.

**Independent Test**: Run the flow against `eval/fixtures/tr-tedx-kaygi.tr.vtt`
and `eval/media/tr-tedx-kaygi.mp4` with the terms "kaygı" and "endişe", and cut
one candidate. Delivers a real clip on its own.

**Acceptance Scenarios**:

1. **Given** a video and its subtitle file, **When** the user supplies topic terms
   and starts the search, **Then** the application returns at least one
   candidate whose range overlaps the recorded ground truth for that recording,
   or states plainly that no subtitle line matched.
2. **Given** a candidate card, **When** the user cuts it, **Then** a video file
   exists in the chosen folder, plays, and its duration is within 0.25 seconds of
   the duration the card displayed.
3. **Given** the same video, subtitle file and terms, **When** the search runs
   twice, **Then** the candidate list is identical: same candidates, same order,
   same boundaries.

---

### User Story 2 - See the evidence and move the edges (Priority: P2)

Every candidate can be opened to show the exact subtitle lines behind it, each
with its own timecode. The user can move a candidate's start or end by one
second, or by one subtitle line, before cutting.

**Why this priority**: Article IV of the constitution forbids a clip without its
evidence. Boundaries produced by a rule rarely match a person's taste, and the
answer to that is a small correction, not a re-search.

**Independent Test**: For any candidate, the displayed lines correspond exactly
to the cues inside its range, and moving an edge changes the displayed duration
and the produced file.

**Acceptance Scenarios**:

1. **Given** a candidate card, **When** the user opens it, **Then** every line in
   the range is shown with its own timecode, in order, and the text matches the
   source subtitle after normalization.
2. **Given** a candidate, **When** the user moves the start one second later,
   **Then** the card duration and the cut file both reflect the new start, and
   the change survives until the user resets it.

---

### User Story 3 - Keep several and cut them all (Priority: P3)

The user keeps two or three candidates and cuts them in one action.

**Why this priority**: Useful, but the single-clip path already delivers the
value. This is the first place where batch behaviour and file naming matter.

**Independent Test**: Select three candidates, cut, and find three distinct files
in the output folder with names that identify their ranges.

**Acceptance Scenarios**:

1. **Given** three kept candidates, **When** the user starts the cut, **Then**
   three files are written, each within 0.25 seconds of its card duration.
2. **Given** one candidate fails to cut, **When** the run finishes, **Then** the
   remaining candidates have produced their files and the failure is reported
   with the reason.

### Edge Cases

- **No line matches.** The application says no subtitle line matched the terms.
  It does not present an empty list as a result.
- **Almost every line matches.** Candidates are still bounded by the maximum
  duration rule instead of returning the whole recording as one block.
- **Turkish case and suffixes.** The term "KAYGI" matches "kaygı"; "endişe"
  matches "endişesi" and "endişeler". The same rule applies to a term written
  with or without its circumflex.
- **Cue beyond the end of the media.** The candidate is clamped to the media
  duration and the clamping is reported on the card.
- **Overlapping cues.** Overlap is allowed in the cue table and handled when
  merging matches; it is not silently dropped.
- **Legacy encoding.** A subtitle file that is not valid UTF-8 is decoded as
  Windows-1254 before giving up, and the card says which decoding was used.
- **Byte order mark, CRLF line endings, inline markup.** All three are tolerated
  and never appear in the displayed text.
- **Whitespace-only or empty cues.** Ignored, not shown as matches.
- **Subtitle file with zero usable cues.** Reported as an unreadable subtitle
  file, not as "no matches".
- **The same term twice.** Does not double the score of a candidate.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to choose a video file (mp4, mkv, mov, webm) and
  a subtitle file (srt, vtt) from disk.
- **FR-002**: The application MUST parse both SRT and VTT into a single cue table
  of index, start, end and text.
- **FR-003**: Cue indices MUST be 1-based, stable for a given file, and the same
  numbering MUST be used in the interface, in imported ground truth and in any
  output the criterion produces.
- **FR-004**: Parsing MUST tolerate a byte order mark, CRLF line endings, inline
  markup, empty cues and overlapping cues.
- **FR-005**: Users MUST be able to enter one or more topic terms, and removing
  all of them MUST disable the search rather than search for nothing.
- **FR-006**: The application MUST normalize cue text and terms identically
  before matching: Unicode normalization, case folding that respects Turkish
  dotted and dotless i, punctuation stripped, whitespace collapsed.
- **FR-007**: A cue MUST match a term when a token in the cue equals the term, or
  begins with it and continues for at most four further characters, so that
  Turkish suffixes match without matching unrelated words.
- **FR-008**: Candidates MUST be built by merging matching cues that are
  separated by at most two seconds, and by no more than one non-matching cue.
- **FR-009**: Each candidate MUST be padded by half a second on each side and
  clamped to the media duration.
- **FR-010**: Candidates MUST respect a minimum duration of 8 seconds and a
  maximum of 120 seconds; both values MUST be visible and adjustable before the
  search runs.
- **FR-011**: Candidates MUST be ordered by the number of distinct matched terms,
  then by total matched cue duration, then by earliest start.
- **FR-012**: Every candidate MUST carry the indices of the cues inside its range
  and a reason sentence naming the terms that were found.
- **FR-013**: The application MUST NOT display a candidate whose evidence cannot
  be listed.
- **FR-014**: Users MUST be able to open a candidate and read its cues with their
  timecodes.
- **FR-015**: Users MUST be able to move a candidate's start and end by one
  second or by one cue, and to reset it to the original boundaries.
- **FR-016**: Users MUST be able to reject a candidate; rejected candidates MUST
  NOT be cut.
- **FR-017**: Cutting MUST write MP4 files with H.264 video and AAC audio into a
  user-chosen folder, re-encoding rather than stream-copying so that the first
  frame of a clip is intact.
- **FR-018**: Output file names MUST identify the source video and the clip
  range, and MUST NOT overwrite an existing file silently.
- **FR-019**: A cut MUST report its own outcome, and a failed cut MUST NOT stop
  the remaining cuts.
- **FR-020**: The feature MUST perform no network requests.
- **FR-021**: The feature MUST write nothing outside the chosen output folder and
  the application's own configuration directory.
- **FR-022**: Identical inputs and identical settings MUST produce an identical
  candidate list and identical output file names.

### Key Entities

- **Cue**: one subtitle line. Index (1-based), start, end, text, and the
  normalization of its text.
- **Cue table**: the cues of one subtitle file, plus the media duration they are
  matched against.
- **Topic criterion**: the list of terms and the duration bounds in force.
- **Candidate**: a range of cue indices, derived start and end, duration, the
  terms matched, and a reason sentence.
- **Selection**: the candidates the user kept, each with its possibly adjusted
  boundaries.
- **Cut result**: output path, measured duration, and status for one candidate.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On `tr-tedx-kaygi` with the terms "kaygı" and "endişe", the returned
  set contains a candidate that overlaps the recorded ground truth for at least
  80 percent of the ground truth duration.
- **SC-002**: Cutting that candidate produces a file that plays and whose duration
  is within 0.25 seconds of the duration shown on the card.
- **SC-003**: Parse and search together finish in under two seconds on either
  evaluation recording on the development machine.
- **SC-004**: Two consecutive runs on identical input produce byte-identical
  candidate data.
- **SC-005**: With the network interface disabled, the whole flow (open, search,
  cut) completes.
- **SC-006**: On both evaluation recordings, at least one candidate per recording
  is accepted by the user without moving its boundaries. Recorded as a manual
  check against `eval/`, one row per recording.

## Assumptions

- Subtitles are already aligned with the video. Offset correction is a later
  feature, and this slice assumes the recorded files are correct.
- The subtitle file is a sidecar. Extracting embedded tracks and generating
  subtitles with speech recognition are out of scope here.
- One video per run. Batch ingestion is not part of this slice.
- A model is not involved. The reason sentence is generated from the matched
  lines, and it must therefore read as a statement of fact, not a judgement.
- The interface strings for this feature ship in Turkish and English.
- Ground truth is recorded in `eval/gold/<id>.json` before this feature is
  considered done, because SC-001 and SC-006 cannot be checked without it.
