# Tasks: The model layer

**Input**: `spec.md`, `plan.md`

**Rule**: one task, one commit, and the application still builds and runs after
each.

**Status**: prepared, not started. Nothing below is ticked; the spec's three
open questions come first.

## Phase 1: The seam

- [x] **T001** Add the `provider` module: `Mode`, the two configs, `Shortlist`,
  `Answer`, `ProviderError`, and the `ModelClient` and `KeyStore` traits, with a
  fake client and an in-memory key store so every later task can be tested
  offline.
  *Done when*: a test drives the fake client end to end through the trait and
  returns a ranked answer, and no module outside `provider` knows a provider
  name.
  *Evidence*: five tests, 68 in the crate. A fake client ranks a two-candidate
  shortlist through the trait and the test reads back what it was asked, so the
  seam is exercised, not just declared. The in-memory store round-trips and
  clears. `Mode` round-trips through serde for all three variants and defaults to
  heuristic. Every `ProviderError` variant prints a sentence and none of them
  contains a key.
  `grep` for `DeepSeek` or `Ollama` across `src-tauri/src` and `app/src` returns
  nothing outside `provider/`: the rest of the application does not know a
  provider by name yet, which is what makes T008's interface the only place that
  will.
  *Deviation from the task text*: there is no separate `ProviderConfig` type —
  `Mode::Local(LocalConfig)` and `Mode::Cloud(CloudConfig)` carry it, which
  removes a struct that would only ever have held the same two fields.
  *Depends on*: nothing.

- [x] **T002** Build the shortlist and the prompt: cap at twenty candidates and
  sixty cues each, estimate characters, record how many were left out, and build
  the one prompt from the plan.
  *Done when*: the fixture recording's search produces a prompt under the cap,
  the left-out count matches what was dropped, and the prompt contains no
  timecode and no path.
  *Evidence*: seven tests, 75 in the crate. On the fixture, `kaygı, endişe`
  offers **4 candidates and keeps all 4**, 21 cues, 1 095 characters of cue text;
  the built prompt is **1 974 characters, about 494 estimated tokens** — an eighth
  of the 16 000-character ceiling, so the ceiling is not doing any work on a
  fourteen minute recording. The trim keeps the deterministic order, leaves out
  and counts a candidate that does not fit, shortens a candidate past sixty cues
  and records which, and stops on characters before it stops on the candidate cap
  when the cues are large. The prompt is scanned for `h:mm` patterns and for path
  separators, and contains neither.
  *Deviation from the plan*: `Shortlist` carries a `truncated: Vec<u64>` beyond
  the shape in the plan, because shortening a candidate's cue list without
  recording it would be exactly the sort of quiet reduction this project keeps
  designing against.
  *For the open budget question*: at 494 tokens for the fixture, the proposed
  ceiling leaves room for a recording around thirty times longer before anything
  is left out.
  *Depends on*: T001.

- [x] **T003** Validate the answer: strict parse, unknown fields refused, every
  cue index inside the candidate it explains, reasons bounded and non-empty.
  *Done when*: tests cover a valid answer, an out-of-range index, an unknown
  candidate id, a missing field, a reason longer than the limit, and prose
  instead of JSON — each producing its own named failure.
  *Evidence*: nine tests, 84 in the crate. A grounded answer is read in the
  order it arrived. A cue the candidate does not contain is `InvalidIndex`
  naming both. An answer for a candidate that was never sent is dropped while
  the real rankings survive, as the spec's edge case says. Prose instead of
  JSON, an unknown field, an empty reason, a 241 character reason and a ranking
  with no cited line are each a named `MalformedAnswer`. An empty answer fails;
  a partial one is kept, because throwing away grounded sentences to punish a
  missing one helps nobody.
  *Decisions taken here*: `WireAnswer`/`WireRanking` use `deny_unknown_fields`,
  so a model that adds `"score"` is refused rather than half-read. A repeated
  candidate keeps its first ranking.
  *Depends on*: T001.

## Phase 2: Talking to a model

- [ ] **T004** Implement the OpenAI-compatible client and point it at a local
  server: list the models it serves, rank the shortlist, one retry on 429 and
  5xx, timeout, and `Unreachable` naming the address when nothing answers. The
  same client carries DeepSeek, with a key from T006 and the gate from T007.
  *Done when*: a stub server on `127.0.0.1:0` drives the whole path, the
  recorded request body matches the prompt the builder produced, and a dead port
  produces `Unreachable` with the address.
  *Evidence*: six tests against a real stub server on a random port, which
  records every request. The ranked answer comes back through the same validator
  T003 wrote. The recorded body carries the model, `temperature 0`, `top_p 1` and
  the prompt with its `#41`-style line numbers. A port with nothing on it gives
  `Unreachable` naming that address. A `429` with `Retry-After: 0` is retried
  exactly once and the second answer is used; a `500` twice is retried once and
  then fails with its status and the provider's last words; a `401` is not
  retried at all. `/models` lists what the server serves.
  *Deviation from the plan*: `ProviderError::Http { status, message }` was added
  for a status the layer has no better name for. The plan's table stopped at 429
  and 5xx, and folding "418" into `MalformedAnswer` would have said the answer
  was broken when the server was.
  *Depends on*: T002, T003.

- [ ] **T005** Point the same client at DeepSeek: fixed address, key from the
  keychain, the same ranking path. Its answer is validated by the same code.
  *Done when*: the stub sees the DeepSeek address, the key travels as a bearer
  header, and the recorded body is byte-identical to the local request for the
  same shortlist.
  *Evidence*: one test sends the same shortlist to a local client and to a cloud
  client and compares what the two stubs received: **the bodies are identical**,
  and the only difference is `Authorization: Bearer sk-test` on the cloud one.
  The three addresses the interface will offer are named in one place —
  `OLLAMA_BASE`, `LM_STUDIO_BASE`, `DEEPSEEK_BASE` — and a test holds them to
  their shape, so T008 reads them instead of writing them again.
  *What this does not cover yet*: the key is passed to `OpenAiClient::cloud` by
  the caller. Reading it from the keychain is T006, and the confirmation gate is
  T007; until then nothing in the application calls this client.
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
