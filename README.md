# Kirpix

A desktop app that finds the moments you are looking for in a subtitled video and cuts them on your own machine.

You drop in a video and its subtitles, say what you want (a total duration, a topic, one complete arc, a strong hook, or your own sentence in plain language), and Kirpix returns candidate clips as cards. Each card carries a timecode, the subtitle lines it was built from, and a reason. You keep the ones you want, adjust the boundaries, and cut.

**Status: in development.** This repository currently holds the project site and the written decisions behind the app. The application itself is not published yet. See [Where it stands](https://github.com/SelcukOzdemir23/kirpix) on the site for the current list.

## Why subtitles, not frames

Meaning in a talk lives in the words, not the picture. Reading a transcript takes seconds, needs no GPU, and lets the app tell you why each clip was chosen. Reading video frames is slow, expensive and hard to explain.

Three consequences shape the architecture:

- **Local first.** Video never leaves the machine. Cutting runs on a bundled FFmpeg. The app works with the network off.
- **Explainable.** Every clip maps back to subtitle lines, so the reason is a fact rather than a claim.
- **Criterion based.** The app does not decide what "the best moment" is. You state the criterion.

## Principles

- **You pick the model.** A local model through Ollama or LM Studio, or a cloud API (DeepSeek, OpenAI, Claude). With a cloud provider only the subtitle text is sent, and the app says so before it happens. No account, no telemetry, no cookies.
- **AI is optional.** A heuristic mode works from audio energy and sentence boundaries when no model is configured.
- **Spend tokens on decisions, not reading.** Parsing, alignment, segmentation and shortlisting are deterministic. The model only ranks shortlisted candidates, so a one hour recording sends a few thousand tokens instead of the whole transcript.

## This repository

```
src/
  content/copy.ts        every string on the site, Turkish and English
  components/            page sections (Astro, no client JS)
  layouts/Layout.astro   document head, fonts, language alternates
  pages/index.astro      Turkish (default)
  pages/en/index.astro   English
  styles/global.css      design tokens and base styles
public/                  favicon and logo
```

Static site, no backend and no server runtime. Tailwind runs through PostCSS.

## Commands

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # -> dist/
npm run preview
```

Deployment is a static upload of `dist/` (Cloudflare Pages, Netlify, GitHub Pages). No CI workflow is included on purpose; the site needs a build step, not a pipeline.

## Roadmap

1. Subtitle reading, extraction from the container, and alignment against the video.
2. The four criteria and candidate selection, with reasons.
3. Cutting with FFmpeg, preview and export.
4. Whisper, for videos that ship without subtitles.

## License

MIT
