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

- [ ] **T002** Register `preview_clip` and allow the media sources it needs.
  *Done when*: the command returns a data URL and the policy permits `data:` and
  `blob:` media — which also unblocks the audio sample from feature 002.
  *Depends on*: T001.

- [ ] **T003** Put the player in the row: one preview at a time, a generation
  counter that drops superseded answers, and the truncated line.
  *Done when*: pressing show plays the candidate's current range, pressing again
  closes it, a second press elsewhere replaces rather than stacks, and a late
  answer for a superseded request never appears.
  *Depends on*: T002.

- [ ] **T004** Verify: screenshots of the row with a player, the failure path,
  and what a person must still check in a real window — playback on WebKitGTK,
  which is not the engine the screenshots use.
  *Depends on*: T003.
