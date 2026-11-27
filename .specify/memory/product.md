# Kirpix: what it is and where it is going

The constitution says how the work is done. This document says what the work
is for. Every spec names the roadmap item below that it delivers; a spec that
fits no item means this document changes first, in its own pull request.

## The problem

Someone has a recording an hour long — a podcast, a lecture, an interview, a
meeting — and wants a few minutes of it: the dense five minutes, the part
about one topic, a passage that stands on its own, the opening that makes a
stranger stop scrolling. Today that means watching the whole thing, taking
notes, scrubbing back and forth, and then cutting in an editor.

The tools that do this for you upload the recording to someone else's server,
pick "the best moment" by a rule they do not explain, and answer one question
nobody asked.

## What Kirpix does

It finds the clips **the user asked for** in a recording, shows why each one
was chosen, and cuts the ones the user keeps — **on the user's own machine**.

1. The user opens a video with its subtitles (a file, or a track the video
   already carries).
2. They state a criterion.
3. Kirpix reads the subtitles (and, from feature 008, the sound) and lists
   candidates: range, duration, the lines that justify it, and a reason.
4. The user keeps, drops or nudges each candidate, previews it, and cuts.

Meaning lives in the words, so the subtitle text is the primary signal: it is
fast to read, precise for "where do they talk about X", and it lets every
choice be explained by quoting the lines behind it.

### Four criteria, and a fifth in the user's own words

| Criterion | The user says | Feature |
| --- | --- | --- |
| Topic | "Find where these words or this subject come up" | 001 ✅ |
| Duration | "Give me the densest five minutes, in total" | 009 |
| Arc | "One passage with a beginning, a middle and an end" | 010 |
| Hook | "The openings that make someone stop and watch" | 011 |
| Own sentence | anything else, in a sentence, ranked by a model | 012 |

### The model is optional, and the user chooses it

- **Heuristic**: no model. Works the moment the app is installed. From 008 it
  also uses silences and sound energy, not only matching words.
- **Local**: Ollama, LM Studio or any OpenAI-compatible server on the user's
  machine. Nothing leaves the device.
- **Cloud**: DeepSeek today, others later. Only subtitle text is sent, never
  media, and only after a confirmation that names the provider and the size of
  what is sent.

## Who it is for

- **Creators** cutting a few short clips a week out of long episodes.
- **Teachers** pulling "the part where I explain X" out of a lecture recording.
- **Researchers** finding every passage on a subject across long interviews.
- **Anyone with a private recording** — a client call, an internal meeting —
  who needs to know it never left their machine.

## What it is not

- **Not a video editor.** No colour, no mixing, no transitions, no timeline
  editing. It finds the right place and cuts it.
- **Not a social media tool.** No uploading, no vertical reframing, no burned
  subtitles.
- **Not an AI showcase.** The model is a tool, and the app works without it.
- **Not a service.** No account, no subscription, no data collection.

## How we know it works

- **First clip in five minutes.** Someone who has never opened Kirpix gets
  their first clip within five minutes of launching it. Measured by hand, once
  per release, from a clean install.
- **Quality against the evaluation set.** Every criterion is measured against
  the recordings in `eval/` with expected ranges (constitution X), not by
  impression.
- **Offline.** The whole flow runs with the network down in heuristic and
  local mode (constitution II).

## Platforms

Linux first, and the reference machine is Linux. Windows and macOS are planned
from the start: nothing may be designed so that it only works on Linux, and
packaging decisions (FFmpeg licence and size) are made for all three at once.

## Roadmap

One feature at a time, in number order. A feature is merged before the next
one's code starts; specs may be written ahead.

| # | Feature | Delivers | State |
| --- | --- | --- | --- |
| 001 | Topic clip slice | Open, search by topic, evidence, adjust, cut | merged; person checks owed |
| 002 | Subtitle sources and alignment | Embedded tracks, offset, listen to a cue | merged; person checks owed |
| 003 | Desktop shell | Rail and working pane, type, palette, light and dark | merged; person checks owed |
| 004 | Provider layer | Heuristic, local and cloud modes; confirmation; keychain | merged; person checks owed |
| 005 | Clip preview | Watch a candidate before cutting | merged |
| 006 | Settings | Appearance and model in one place, remembered | merged; person checks owed |
| **007** | **Interface redesign** | A layout with room for all five criteria, chosen from researched options; the topic card works, the others are visibly not yet built | **next** |
| 008 | Sound signals | Silences and sound energy from FFmpeg, as data the criteria can use | |
| 009 | Duration criterion | Total-duration target filled from the densest passages | |
| 010 | Arc criterion | One self-contained passage, bounded by sentence and pause | |
| 011 | Hook criterion | Openings scored by text and sound | |
| 012 | Own-sentence criterion | A free sentence ranked by the chosen model; a guided local-model setup | |
| 013 | Transcription | Whisper for recordings with no subtitles, models downloaded on demand | |
| 014 | Linux package | An installer with FFmpeg bundled; closes the release gate in the constitution | |
| 015 | Windows and macOS | The same package on the other two platforms | |

**Smaller slices, scheduled when they fit**: remember the subtitle offset per
recording; Anthropic and OpenAI request shapes (004's deferred T005b); a
heuristic merge rule that keeps `en-single-story` 38–58 in one candidate (the
English golden test, ignored today).

### Why this order

- **The interface first (007)** because the owner does not like the current
  one, and every criterion after it needs a place on screen. Designing that
  place once, for all five, means no criterion redraws the screen.
- **Sound before the criteria that need it (008)** because duration and hook
  both depend on it, and the heuristic mode in the original description
  ("silences, pauses between sentences, changes of topic") is impossible
  without it.
- **Packaging last among the core (014)** because it fixes the FFmpeg and
  licence decisions for three platforms at once, and those depend on what the
  app finally invokes.

## Open product questions

- **FFmpeg licence for packaging.** Cutting and preview encode with `libx264`
  (GPL). Either the package ships a GPL FFmpeg, or another encoder is chosen.
  Decided in 014. See `THIRD_PARTY.md`.
- **Gold review.** `eval/gold/*.json` are `proposed`. The owner reads the
  ranges and marks them `reviewed`.
