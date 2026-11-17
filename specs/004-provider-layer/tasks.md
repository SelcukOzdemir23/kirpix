# Tasks: The model layer

**Input**: `spec.md`, `plan.md`

**Rule**: one task, one commit, and the application still builds and runs after
each.

**Status**: prepared, not started. Nothing below is ticked; the spec's three
open questions come first.

## Phase 1: The seam

- [ ] **T001** Add the `provider` module: `Mode`, `ProviderConfig`, `Shortlist`,
  `Answer`, `ProviderError`, and the `ModelClient` and `KeyStore` traits, with a
  fake client and an in-memory key store so every later task can be tested
  offline.
  *Done when*: a test drives the fake client end to end through the trait and
  returns a ranked answer, and no module outside `provider` knows a provider
  name.
  *Depends on*: nothing.

- [ ] **T002** Build the shortlist and the prompt: cap at twenty candidates and
  sixty cues each, estimate characters, record how many were left out, and build
  the one prompt from the plan.
  *Done when*: the fixture recording's search produces a prompt under the cap,
  the left-out count matches what was dropped, and the prompt contains no
  timecode and no path.
  *Depends on*: T001.

- [ ] **T003** Validate the answer: strict parse, unknown fields refused, every
  cue index inside the candidate it explains, reasons bounded and non-empty.
  *Done when*: tests cover a valid answer, an out-of-range index, an unknown
  candidate id, a missing field, a reason longer than the limit, and prose
  instead of JSON — each producing its own named failure.
  *Depends on*: T001.

## Phase 2: Talking to a model

- [ ] **T004** Implement the OpenAI-compatible client and point it at a local
  server: list the models it serves, rank the shortlist, one retry on 429 and
  5xx, timeout, and `Unreachable` naming the address when nothing answers. The
  same client carries DeepSeek, with a key from T006 and the gate from T007.
  *Done when*: a stub server on `127.0.0.1:0` drives the whole path, the
  recorded request body matches the prompt the builder produced, and a dead port
  produces `Unreachable` with the address.
  *Depends on*: T002, T003.

- [ ] **T005** Point the same client at DeepSeek: fixed address, key from the
  keychain, the same ranking path. Its answer is validated by the same code.
  *Done when*: the stub sees the DeepSeek address, the key travels as a bearer
  header, and the recorded body is byte-identical to the local request for the
  same shortlist.
  *Depends on*: T004.

- [ ] **T005b** *(later slice, not this one)* The Anthropic messages shape and
  OpenAI's own endpoint. Recorded so the omission is a decision and not an
  oversight.

- [ ] **T006** Move keys to the OS keychain behind `KeyStore`, with set, read
  and clear, and a redaction rule for provider messages.
  *Done when*: the in-memory store covers the tests; an authentication failure
  whose message contains the key produces an error without it; a test asserts
  the key is absent from `Debug` output and from the error payload.
  *Depends on*: T001.

## Phase 3: The gate and the screen

- [ ] **T007** Add the confirmation gate: the command compares the payload it is
  about to send against the confirmed provider, model, cue count and character
  count, and refuses with `Unconfirmed` when they differ.
  *Done when*: a test confirms one payload and sends a different one, and
  nothing reaches the stub.
  *Depends on*: T004.

- [ ] **T008** Build the interface: the model section in the rail, the mode
  badge in the results header, the confirmation dialog, and the reason sentence
  beside the term evidence with the model's ordering applied.
  *Done when*: the mode is on screen before, during and after a request; a
  failed request leaves the deterministic candidates visible and labelled; the
  left-out count appears when the budget trimmed.
  *Depends on*: T004, T007.

- [ ] **T009** Verify against the evaluation set and record what a person must
  still check: heuristic mode with the network down on a real recording, and one
  live request against a local model.
  *Done when*: SC-002 to SC-007 have a passing test each, SC-001 is named as the
  manual check it is, and `tasks.md` states which rows remain open.
  *Depends on*: T008.

## Not in this slice

- The free-text criterion, the audio-energy criterion, and transcription. Each
  needs its own spec; the first two because they change how candidates are
  found, which is deterministic code today (constitution VI).
