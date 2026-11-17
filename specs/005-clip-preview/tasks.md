# Tasks: See the clip before cutting it

**Input**: `spec.md`, `plan.md`

**Rule**: one task, one commit, and the application still builds and runs after
each.

- [x] **T001** Add `media/preview.rs`: encode a range to a temp MP4, read it
  back, delete it, and report the covered duration and whether it was truncated.
  *Done when*: a twelve second range from the fixture yields an MP4 with real
  `ftyp`, `moov` and `mdat` boxes under four megabytes; a length over the limit
  yields exactly the limit and says it was truncated; an inverted range returns
  `EmptyRange`; and the temporary file is gone when the call returns.
  *Evidence*: four tests, all passing. On the fixture, a twelve second range is
  229 KB and takes 0.54 s wall clock; `ffprobe` reports `h264 640x360` and `aac`,
  both 12.000 s. The tests assert the box structure, the size ceiling, the
  truncation at the 20 s limit, the deletion of the temp file, and the refusal
  of an empty or inverted range.
  *Depends on*: nothing.

- [x] **T002** Register `preview_clip` and allow the media sources it needs.
  *Done when*: the command returns a data URL and the policy permits `data:` and
  `blob:` media — which also unblocks the audio sample from feature 002.
  *Evidence*: the command is registered in `lib.rs` and returns
  `data:video/mp4;base64,…`. The policy is now
  `default-src 'self'; style-src 'self' 'unsafe-inline'; media-src 'self' data: blob:`,
  read out of `tauri.conf.json` after the build. The audio sample from 002 was
  indeed being blocked before this: its data URL falls back to `default-src`.
  Unverified: that the webview accepts a data-URL MP4 at runtime — the CSP is
  enforced only inside Tauri, and nothing here runs Tauri. That is T004.
  *Depends on*: T001.

- [x] **T003** Put the player in the row: one preview at a time, a generation
  counter that drops superseded answers, and the truncated line.
  *Done when*: pressing show plays the candidate's current range, pressing again
  closes it, a second press elsewhere replaces rather than stacks, and a late
  answer for a superseded request never appears.
  *Evidence*: the row carries a show control that reads `Göster` / `Kapat` /
  `Hazırlanıyor…`, and the player renders under that row only. One preview lives
  in `App`, so a second press replaces the first by construction. The request
  takes a ticket from a counter that is also bumped when the bounds move or the
  results are replaced, so an answer for a superseded range cannot paint over the
  current one. The range sent is `bounds[candidate.id] ?? candidate`, which is
  what the row shows.
  Screenshot: the player sits inside the first row, with the truncation line
  under it, and the other rows keep their text.
  *Honest limit*: the counter is verified by reading it, not by a test — this
  repository has no interface test suite. And the frame is black in the
  screenshot because a headless browser does not autoplay; the picture itself is
  T004.
  *Depends on*: T002.

- [ ] **T004** Verify: screenshots of the row with a player, the failure path,
  and what a person must still check in a real window — playback on WebKitGTK,
  which is not the engine the screenshots use.
  *State*: the screenshot half is done; playback is not. This stays open because
  the one thing that decides whether the feature works — does the window play the
  bytes — cannot be checked from here.
  *What a person has to do*: `cd app && npm run tauri dev`, open the fixture MKV,
  search, press `Göster` on a candidate, and confirm the picture plays and the
  sound matches the line under it. If it stays black, the next suspect is the
  `data:` media policy in a WebKit container, then the MP4's `faststart` layout.
  Also worth a look: press show on two rows in a row quickly, and confirm only
  one player ends up on screen.
  *Depends on*: T003.
