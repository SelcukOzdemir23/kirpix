# Research: Sound-aware edges

Phase 0 of `/speckit-plan`. Every number here was measured on the evaluation
recordings on 2026-11-27, on the development machine, before it was written
into the spec or the plan.

## R1. How the sound is read

**Decision**: FFmpeg decodes the audio to mono 8 kHz signed 16-bit PCM on its
standard output; Rust reads it and computes the level of each 10 ms window
(RMS, in dB relative to full scale). Everything after decoding is a pure
function of the samples.

**Rationale**: the level of every window is what the threshold (R2) needs;
`silencedetect` only reports pauses against a threshold given in advance, and
parsing its log is the "scraping stderr" plan decision 5 of 001 rejected. Raw
PCM on a pipe needs no temporary file (002 FR-010's reasoning). 14:37 of audio
is 14 MB at this rate, read in one pass.

**Alternatives**: `silencedetect` (fixed threshold, log parsing);
`astats` with metadata printing (still text parsing, slower); a Rust audio
decoder crate (a second decoder beside the FFmpeg the app already depends on,
and AV1/Opus support to maintain).

## R2. What counts as a pause, and where an edge goes

**Decision**:

- *Threshold*: halfway, in dB, between the 10th percentile of the window levels
  and their median. On `tr-tedx-kaygi`: p10 −46.4 dB, median −29.0 dB,
  threshold −38 dB.
- *Pause*: a run of windows below the threshold lasting at least 150 ms.
- *Placed start*: inside the pause before the speech, `pause.end − min(150 ms,
  pause length / 2)`; *placed end*: `pause.start + min(150 ms, pause length /
  2)`. So at least 75 ms of the pause stays inside the clip at each end.
- *Allowed*: the nearest such point within 1.5 s of the subtitle edge, that does
  not enter the first or last matched line (start ≤ first matched cue's start,
  end ≥ last matched cue's end), and keeps the clip within 001's bounds.

**Measured** on the topic search "kaygı, endişe":

| Max move | Placed | Moves (s) |
| --- | --- | --- |
| 1.5 s | 4 / 8 | −0.80, −0.47, +0.42, +0.43 |
| 2.0 s | 6 / 8 | the four above, −1.60, +1.85 |
| 3.0 s | 6 / 8 | same as 2.0 s |

The first candidate (cues 59–70) has no pause of 150 ms or more within 3 s of
either edge. Reaching six of eight at 1.5 s needed 100 ms "pauses" with a
raised threshold: a 100 ms gap can be a stop consonant inside a word, and a
setting chosen because it hits the target on the one recording it is tested
on is the tuning article X forbids. The owner chose 1.5 s and four of eight
(spec › Clarifications).

**Alternatives**: a fixed threshold (−35 dB and −30 dB at 0.25 s found 89
pauses, the nearest up to 12 s from an edge: a hall with an audience has a
raised floor); the 25th or 30th percentile (placed the same four at 150 ms).

## R3. The subtitle offset, measured on the way

Not a decision of this slice, recorded because it answers the 002 suspicion
that the sample "does not quite line up". For 193 of the 239 cues there is a
speech onset (a pause end) within 2 s of the cue's start: speech starts a
median 154 ms after the cue starts (mean 109 ms, quartiles −256 ms and
+275 ms). There is no systematic offset; the spread is the precision of the
subtitles themselves. The bug assessment can cite this.

## R4. When it runs

**Decision**: reading starts when a recording is opened, on a worker thread,
and its result is kept in the session. A search returns subtitle edges plus
the placement when the pauses are already known; when they arrive after a
search, the interface asks for the placement of the candidates on screen
whose edges the user has not moved. Reading the 14:37 recording took 1.3 s
with `silencedetect`; the PCM read is measured in the implementation and
recorded against SC-004.

## R5. What the interface draws

- Ruler: pauses of 500 ms or more (83 on the Turkish recording at the R2
  threshold), as a faint band under the candidate marks.
- Detail: every pause between 3 s before the clip and 3 s after it, on a thin
  strip with the clip's edges, so an edge move can aim at one.
- Row: the move of each placed edge in tenths of a second, or "not on a
  pause".
