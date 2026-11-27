# Feature Specification: Sound-aware edges

**Feature Branch**: `008-sound-edges`

**Created**: 2026-11-27

**Status**: Draft

**Roadmap item**: 008 in `.specify/memory/product.md` (sound signals)

**Input**: Read the recording's sound for pauses, so a clip's
edges can sit in a pause instead of cutting a word, and show where the
speaker talks and pauses on the ruler. The same data is what the duration
and hook criteria (009, 011) will use.

## Why this slice exists

Kirpix finds clips from subtitles, and subtitle times are not speech times. A
cue starts when the subtitler decided, often a breath early or late. On the
Turkish evaluation recording today, **none of the eight edges of the four
topic candidates falls inside a pause** (measured 2026-11-27, FFmpeg
`silencedetect`, below -32 dB for at least 0.12 s). The nearest pause is
0.13 s to 3.3 s away. A clip cut there starts or ends mid-word.

The product document promises a heuristic mode that looks at "silences, the
gaps between sentences, changes of topic". Today it looks only at words. This
slice adds the sound, without a model and without sending anything anywhere:
FFmpeg reads the audio locally, as it already does for previews. Reading the
14:37 Turkish recording for pauses took 1.3 s on the development machine.

The roadmap names this slice "sound signals, as data the criteria can use".
Data alone is not a slice a user can see (constitution VIII), so the visible
part is the edges: they land in pauses, and the ruler shows where the pauses
are.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edges that do not cut a word (Priority: P1)

The user searches, selects a candidate and previews it. The clip starts in the
pause before the first word and ends in the pause after the last one. When a
candidate's edge could not be placed in a pause close enough, the row says so.

**Why this priority**: This is the reason for the slice. A clip that starts
mid-word is the most visible flaw of a subtitle-based cutter.

**Independent Test**: Search "kaygı, endişe" on `tr-tedx-kaygi`; for every
candidate, both edges are inside a detected pause or marked as not placed, and
the cut file starts and ends in silence.

**Acceptance Scenarios**:

1. **Given** a candidate whose subtitle edge is near a pause, **When** the
   candidates are shown, **Then** the edge sits inside that pause and the
   candidate still contains every matched line.
2. **Given** a candidate edge with no pause within the allowed distance,
   **When** the candidates are shown, **Then** the edge stays where the
   subtitles put it and the row says that edge is not on a pause.
3. **Given** the same recording and terms, **When** the search runs twice,
   **Then** the edges are identical (constitution VII).

---

### User Story 2 - See where the speaker pauses (Priority: P2)

On the ruler and in the selected clip, the user sees speech and pauses, so a
manual edge move can aim for a pause.

**Why this priority**: The edge controls of 007 move by a second or a line.
Seeing the pauses makes those moves deliberate. It is also the first visible
use of the sound data the later criteria build on.

**Independent Test**: Open the Turkish recording; the ruler shows pauses at
the times FFmpeg reports them, and the selected clip shows its pauses.

**Acceptance Scenarios**:

1. **Given** a recording whose sound was read, **When** the ruler is drawn,
   **Then** pauses are drawn at their measured times, distinct from the
   candidate marks.
2. **Given** a selected candidate, **When** the detail area is shown, **Then**
   the pauses inside and around its range are visible against its edges.

---

### User Story 3 - Work without the sound (Priority: P3)

A recording has no audio track, or reading it fails. The search still works on
subtitles alone, and the screen says that edges were not placed on pauses and
why.

**Why this priority**: Constitution III and IX: the sound improves the edges,
it must not become a requirement, and its absence is said where it matters.

**Independent Test**: Open the silent copy used by the 002 tests; search
works, edges are the subtitle edges, and the screen says the sound could not
be read.

**Acceptance Scenarios**:

1. **Given** a recording without audio, **When** the user searches, **Then**
   candidates appear with subtitle edges and a sentence says there is no sound
   to place edges on.

### Edge Cases

- **Music, applause or room noise under the speech.** The pause threshold is
  measured against the recording's own quiet level, not a fixed number, so a
  noisy hall still has pauses. A recording with no pause at all is reported as
  such.
- **A pause inside the clip is longer than a few seconds** (a silent
  demonstration). It is shown; it does not split the candidate.
- **Moving an edge after it was placed.** The user's move wins and is kept;
  the placed edge is the starting point, as the search's edge was in 001.
- **The subtitle shift changes.** Pauses are measured on the sound, which the
  shift does not move; candidates are recomputed as in 002.
- **A very long recording.** Reading the sound runs once per opened recording,
  shows progress, and the search does not wait for it unless edges are to be
  placed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a recording with audio is opened, the application MUST read
  its sound locally into a list of pauses, each with a start and an end, and
  MUST NOT send any of it anywhere (constitution I, II).
- **FR-002**: The pause threshold MUST be derived from the recording's own
  level distribution, and the derived threshold MUST be recorded with the
  pauses so the result can be reproduced.
- **FR-003**: Reading the sound MUST be deterministic: the same file gives the
  same pauses (constitution VII).
- **FR-004**: Each candidate edge MUST be moved into the nearest pause within a
  maximum distance, outward or inward, provided the candidate keeps every
  matched line and stays within the duration bounds of 001.
- **FR-005**: An edge with no pause within the maximum distance MUST stay at
  its subtitle position, and the candidate MUST say which edge is not on a
  pause.
- **FR-006**: The placement MUST be computed from pause times and cue indices,
  never from a model (constitution V, VI).
- **FR-007**: The ruler MUST show pauses distinctly from candidate marks.
- **FR-008**: The detail area MUST show the pauses inside and around the
  selected candidate's range.
- **FR-009**: When the sound cannot be read (no audio, a decode failure), the
  search MUST still work on subtitle edges, and the screen MUST say once, where
  the results are, that edges were not placed and why (constitution IX).
- **FR-010**: Reading the sound MUST show that it is in progress and MUST NOT
  block opening the recording or searching.
- **FR-011**: The user's own edge moves (001, 007) MUST start from the placed
  edge and MUST be kept as before; reset returns to the placed edge.
- **FR-012**: The pause data MUST be available to later criteria as data, not
  only as drawing, with its threshold and the recording it belongs to.

[NEEDS CLARIFICATION: Should edges be placed in pauses automatically for every
candidate, or only when the user asks for it (per candidate, or for all)?]

[NEEDS CLARIFICATION: What is the maximum distance an edge may move to reach a
pause? The measurement above puts four of eight edges within 0.65 s and the
furthest at 3.3 s.]

### Key Entities

- **Pause**: a start and an end in recording time, measured from the sound.
- **Sound profile**: the pauses of one recording, the threshold that produced
  them, and whether the sound could be read.
- **Placed edge**: a candidate edge moved into a pause, with how far it moved,
  or marked as not placed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On `tr-tedx-kaygi` with "kaygı, endişe", every candidate edge is
  either inside a detected pause or marked as not placed; at least six of the
  eight edges are placed. Checked by a test against the evaluation recording.
- **SC-002**: The placed candidates still contain all their matched lines and
  respect the 8 to 120 second bounds. Checked by the same test.
- **SC-003**: Two reads of the same recording give byte-identical pause lists,
  and two searches give identical edges. Checked by test.
- **SC-004**: Reading the sound of the 14:37 Turkish recording takes under 5
  seconds on the development machine, and opening and searching do not wait
  for it. Measured and recorded.
- **SC-005**: A cut file made from a placed candidate starts and ends with at
  least 100 ms below the recording's pause threshold. Checked on one cut from
  each evaluation recording.
- **SC-006**: With the silent copy of the Turkish recording, search works and
  the screen names the missing sound. Checked by test and screenshot.
- **SC-007**: The whole flow still completes with the network interface down.

## Assumptions

- FFmpeg's audio filters are the measuring instrument: the same binary that
  cuts and previews, already a dependency, already local.
- The threshold is relative because the evaluation recording is a hall with an
  audience: fixed thresholds of -35 dB and -30 dB with 0.25 s found 89 pauses
  but placed the nearest one up to 12 s from an edge.
- Loudness (how loud each moment is) is not measured here. The hook criterion
  (011) needs it and will add it; measuring it now for a feature that does not
  exist would be the scaffolding article VIII forbids.
- The pause list is not stored on disk; it is read again when a recording is
  opened. Caching is a later concern if long recordings make it slow.
- Out of scope: finding topic changes, the duration and hook criteria
  themselves, estimating the subtitle offset from the sound (a bug assessment
  of the alignment suspicion from 002 is a separate piece of work).
