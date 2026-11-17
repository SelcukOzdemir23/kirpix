# Kirpix

A desktop application that finds the clips you are looking for in a subtitled
recording and cuts them on your own machine.

You drop in a video and its subtitles, say what you want (a total duration, a
topic, one complete arc, a strong hook, or your own sentence in plain language),
and Kirpix returns candidate clips as cards. Each card carries a timecode, the
subtitle lines it was built from, and a reason. You keep the ones you want,
adjust the boundaries, and cut.

**Status: in development.** The project site is live and the decisions are
written down. The application is being built; nothing is released yet.

## Repository layout

```
site/          the project site (Astro, static, Turkish and English)
app/           the desktop application (Tauri 2 + React), not scaffolded yet
specs/         one folder per feature, written before the code
eval/          fixed evaluation recordings, fixtures and ground truth
.specify/      Spec Kit templates, scripts and the constitution
AGENTS.md      how to work in this repository
```

## The constitution

`.specify/memory/constitution.md` holds ten articles that every spec, plan, task
and line of code must satisfy. Two are non-negotiable:

- **Local by default.** Video, audio, frames and cut output never leave the
  device. The only data that may leave is subtitle text, to a provider the user
  configured, after an explicit confirmation.
- **The device works alone.** No telemetry, no accounts, no background network
  requests. With a local model or heuristic mode, the whole flow must complete
  with the network down.

The rest cover optional AI, evidence behind every clip, line indices instead of
model timestamps, a token budget that excludes reading, determinism, small
runnable slices, visible failures, and an evaluation set as the definition of
quality.

## Working on the site

```sh
cd site
npm install
npm run dev       # http://localhost:4321
npm run build     # -> site/dist
```

Static output, no backend, no runtime. Deploy by uploading `site/dist`.

## Working on the application

Not started. The order is set by `specs/`: subtitle ingest and alignment first,
then the criteria engine, then the provider layer, then Whisper.

Requirements for a build: Rust (stable), Node 20+, and the Tauri Linux
dependencies (`webkit2gtk-4.1`, `javascriptcoregtk-4.1`, `gtk+-3.0`). FFmpeg is
bundled with the app, so no system FFmpeg is needed at runtime.

## License

MIT. The evaluation recordings in `eval/` are licensed separately; see
`eval/README.md`.
