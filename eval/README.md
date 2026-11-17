# Evaluation set

Article X of the constitution says quality is measured against a fixed set of
real recordings, not against impressions. This is that set.

`manifest.json` is the source of truth: sources, licenses, durations, cue counts
and checksums. Adding a recording means adding an entry there, not dropping a
file in a folder.

## What is committed and what is not

| Path | Committed | Why |
| --- | --- | --- |
| `fixtures/*.vtt` | Yes | Small, and parser tests need real cue files without the videos |
| `media/*.mp4` | No (gitignored) | Large, and the sources are downloadable |

Rebuild the media folder with:

```sh
mkdir -p eval/media
yt-dlp -f "h264-1200k" -o "eval/media/en-single-story.%(ext)s" \
  "https://www.ted.com/talks/chimamanda_ngozi_adichie_the_danger_of_a_single_story"
yt-dlp -f "bv*[height<=720]+ba/b[height<=720]" --merge-output-format mp4 \
  -o "eval/media/tr-tedx-kaygi.%(ext)s" "https://www.youtube.com/watch?v=xzo8DPcVRZw"
```

`manifest.json` and `fixtures/` are checked in; if the checksums drift, the set
is no longer fixed and the numbers stop being comparable.

## Contents

| id | Spoken | Length | Subtitle files |
| --- | --- | --- | --- |
| `en-single-story` | English | 18.5 min | English and Turkish |
| `tr-tedx-kaygi` | Turkish | 14.6 min | Turkish |

The Turkish track of `en-single-story` is a human translation, not spontaneous
speech. It exercises the Turkish text path but reads cleaner than real Turkish
speech, so `tr-tedx-kaygi` is the recording that matters for Turkish quality.

Both are short. A long recording (40+ minutes) is required before the chunking
and token-budget work starts; it is deliberately not invented here.

## Attribution

- *The danger of a single story*, Chimamanda Ngozi Adichie, TED, CC BY-NC-ND 4.0.
- *Korku, Kaygı ve Endişe: Zihnimiz Bize Ne Anlatıyor?*, Hakan Türkçapar,
  TEDxIstanbul, CC BY-NC-ND 4.0. Downloaded from YouTube.

Both are used for local, non-commercial testing only. Files are unmodified.

## Ground truth

Expected clips live in `gold/<id>.json`, one file per recording, written by hand
and reviewed once, then treated as data:

```json
{
  "id": "tr-tedx-kaygi",
  "criterion": { "mode": "topic", "terms": ["kaygı", "endişe"] },
  "expected": [
    { "start_cue": 12, "end_cue": 58, "note": "why this range is the right answer" }
  ]
}
```

Cue indices are 1-based, the same numbering the interface shows and the
specification uses. Never timestamps, for the same reason the product uses them.
