# Quickstart: checking the interface redesign

## Automated

```sh
./scripts/check.sh        # includes the 300-line rule and the marks tests
```

`cargo test marks` runs the marking tests on both evaluation fixtures (SC-004).
Candidate and cut determinism tests run unchanged (SC-005).

## Screenshots from fixed data

```sh
cd app && npm run screens          # serves screens.html
# open http://localhost:1420/screens.html?state=results&w=880&h=600&theme=dark
```

States: `start`, `tracks`, `criterion`, `results`, `results-cut`,
`results-empty`, `settings`. Sizes 880×600 and 1100×760, themes light and dark
(SC-002, SC-003). The fixture data is the Turkish evaluation search for
"kaygı, endişe".

## By hand, in the real window

1. `cd app && npm run tauri dev` (on Wayland with NVIDIA:
   `WEBKIT_DISABLE_DMABUF_RENDERER=1`).
2. Reset settings (delete `settings.json`, clear the appearance choice), open
   `tr-tedx-kaygi`, search "kaygı, endişe", cut one clip; note any control
   whose job was unclear and the time taken (SC-001).
3. Click a ruler mark, then Tab to the next mark and press Enter: the
   candidate is selected and its row is in view (FR-023).
4. Open the alignment control from the recording line, shift +0.5 s, listen to
   a line, close; the results were cleared and the line shows the offset.
5. Switch Sistem / Açık / Koyu with results on screen.
