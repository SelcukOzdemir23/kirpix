# Kirpix

A desktop application that finds the clips you are looking for in a subtitled
recording and cuts them on your own machine.

You drop in a video and its subtitles, say what you want (a total duration, a
topic, one complete arc, a strong hook, or your own sentence in plain language),
and Kirpix returns candidate clips as cards. Each card carries a timecode, the
subtitle lines it was built from, and a reason. You keep the ones you want,
adjust the boundaries, and cut.

**Status: in development, nothing released.** The application runs from source.
What works today: open a video with a subtitle file or an embedded text track,
shift the subtitles to match the sound, search by topic, preview a candidate,
adjust its boundaries and cut it with FFmpeg. A local model (Ollama, LM Studio
or any OpenAI-compatible server) or DeepSeek can rank the candidates and give
a reason, after a confirmation. Not built yet: the duration, arc, hook and
free-sentence criteria, Whisper transcription, and packaged installers.

## Repository layout

```
site/          the project site (Astro, static, Turkish and English)
app/           the desktop application (Tauri 2, Rust, React)
specs/         one folder per feature, written before the code
eval/          fixed evaluation recordings, fixtures and ground truth
.specify/      Spec Kit: the constitution, the product document and roadmap
               (memory/), analysis reports, templates and scripts
scripts/       check.sh runs every check a pull request must pass
AGENTS.md      how to work in this repository
LICENSE        MIT
THIRD_PARTY.md fonts, FFmpeg and models, and what each license asks
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

```sh
cd app
npm install
npm run tauri dev    # opens the window; the first run compiles the Rust side
```

Requirements: Rust stable with `rustfmt` and `clippy`, Node 20+, the Tauri
Linux dependencies (`webkit2gtk-4.1`, `javascriptcoregtk-4.1`, `gtk+-3.0`), and
FFmpeg on `PATH`. FFmpeg is not bundled yet; the window says so when it falls
back to the system copy. On Wayland with an NVIDIA GPU, a blank window or a
black preview is usually WebKitGTK's DMA-BUF renderer:
`WEBKIT_DISABLE_DMABUF_RENDERER=1 npm run tauri dev`.

Before opening a pull request:

```sh
./scripts/check.sh   # rustfmt, clippy, cargo test, app build, site build
```

Feature order and status live in `specs/`; each `tasks.md` says what is done
and which checks still need a person at a desktop.

## License

MIT, see `LICENSE`. Fonts, FFmpeg and models are covered in `THIRD_PARTY.md`.
The evaluation recordings in `eval/` are licensed separately; see
`eval/README.md`.
