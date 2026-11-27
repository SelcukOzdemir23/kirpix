# Third-party components

The constitution requires FFmpeg, model and font licenses to be documented in
the repository. This file is that record. Rust and npm dependencies carry their
own licenses in `Cargo.lock` and `package-lock.json`; only components that ship
as files or binaries, or that change what a distributor owes, are listed here.

## Fonts

Bundled with both the application (`app/`) and the site (`site/`) through
Fontsource packages, served from the build output, never from a remote host.

| Font | Package | License |
| --- | --- | --- |
| Familjen Grotesk | `@fontsource-variable/familjen-grotesk` | SIL Open Font License 1.1 |
| JetBrains Mono | `@fontsource-variable/jetbrains-mono` | SIL Open Font License 1.1 |

The full license text ships inside each package (`node_modules/<package>/LICENSE`).
The OFL allows bundling and redistribution with software; it forbids selling the
fonts on their own and reusing the reserved names for modified versions.

## FFmpeg and FFprobe

**Today**: not bundled. The application resolves binaries next to the
executable, then in `app/src-tauri/binaries`, then on `PATH`, and says on
screen when it fell back to the system copy. A development machine uses its own
FFmpeg; on the reference machine that build is configured with `--enable-gpl`.

**When packaging lands**: the bundled build must be chosen with its license in
mind. An LGPL build (no `--enable-gpl`, no `--enable-nonfree`) is compatible
with distributing Kirpix under MIT, provided the FFmpeg binaries stay separate
executables and their source offer and license text ship alongside. A GPL build
would make the distributed bundle subject to the GPL. Kirpix only needs
decoding, H.264 and AAC encoding and WAV output: H.264 encoding through
`libx264` is GPL, so an LGPL build needs another encoder (for example
`libopenh264`). This choice is recorded as open, to be settled in the packaging
spec.

## Models

None are bundled. Local models are served by the user's own Ollama, LM Studio
or compatible server under their own licenses; Kirpix talks to them over the
OpenAI-compatible API and downloads nothing.

## Evaluation recordings

`eval/media/` is not in the repository. Each recording's license is listed in
`eval/manifest.json` and `eval/README.md`.
