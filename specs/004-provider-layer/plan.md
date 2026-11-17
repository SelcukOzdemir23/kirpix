# Implementation Plan: The model layer

**Branch**: `004-provider-layer` | **Spec**: `spec.md`

**Input**: Feature specification from `specs/004-provider-layer/spec.md`

## Summary

Add a `provider` module to the Rust side: one trait, two request shapes, a
shortlist builder that enforces the budget, an answer validator, and a keychain
store behind another trait so the tests never touch a real secret service. On
the interface side: a mode panel in the rail, a confirmation dialog that states
what is about to leave, and a results header that names the mode.

Nothing in the existing search path changes. `criterion/topic.rs` keeps
producing candidates; the model is applied to what it produced.

## Constitution check

- **I. Local by default**: the payload is subtitle text, cue indices and the
  criterion, built by `shortlist` and printed by the confirmation dialog. No
  path may add a path or a filename. Passes.
- **II. Device works alone**: heuristic mode is the default and the whole flow
  keeps completing with the network down (SC-001). Every request is user
  initiated and stated. Passes.
- **III. AI is optional**: every mode has the deterministic path; removing the
  module removes ranking quality, not the ability to cut. Passes.
- **IV. Criterion in, evidence out**: the model's sentence is shown beside the
  term evidence, never instead of it. A candidate without evidence is still not
  displayed. Passes.
- **V. Cue indices**: the answer is indices only; the prompt forbids timecodes
  and the validator rejects anything that is not an index in range. Passes.
- **VI. Deterministic shortlisting**: the shortlist is built by code, capped by
  the budget, and the number left out is stated. Only ranking and justification
  reach the model. Passes.
- **VII. Determinism**: temperature 0, top_p 1, fixed max tokens, sorted
  candidate ids in the prompt, strict parsing. The application's output for a
  given answer is identical run to run (SC-006); a cloud model's own sampling is
  not claimed to be. Passes, with that sentence recorded here.
- **IX. Visible failures**: no fallback without a sentence. A failed request
  leaves the deterministic result labelled as such. Passes.
- **Secrets**: keychain only, `KeyStore` trait, never in a log or an error.
  Passes.

## Architecture

```
app/src-tauri/src/
  provider/
    mod.rs        Mode, ProviderConfig, Shortlist, Answer, ProviderError,
                  trait ModelClient { models(), rank() }, trait KeyStore
    openai.rs     OpenAI-compatible shape: Ollama, LM Studio, self-served, DeepSeek
    shortlist.rs  deterministic trim to the budget, left-out count
    prompt.rs     the one prompt, built from the shortlist
    validate.rs   strict parsing and index validation
    keyring.rs    KeyStore over the OS keychain, feature-gated for tests
  commands.rs     new commands: list_models, set_mode, set_key, has_key,
                  clear_key, rank_candidates
```

Two request shapes, because that is all the promised providers need:

| Provider | Shape | Address the user sees |
| --- | --- | --- |
| Ollama | OpenAI-compatible | `http://127.0.0.1:11434/v1` |
| LM Studio | OpenAI-compatible | `http://127.0.0.1:1234/v1` |
| vLLM, llama.cpp, anything self-served | OpenAI-compatible | whatever the user typed |
| DeepSeek | OpenAI-compatible | `https://api.deepseek.com/v1` |

One shape, four addresses, in this slice. Anthropic's messages shape and OpenAI's
own endpoint are a later slice: a provider in the picker must be a provider that
is tested, and two shapes tested half as well is the worse trade.

The address is visible and editable for local modes; DeepSeek's is fixed and
shown read-only, so a key is never posted to a stray host by a typo.

## Milestones

**M1 — the offline core (T001–T003). Reached.** Everything the model layer needs that can
be tested without a socket: the two traits, the budget and the trim, the prompt,
and the validator. At M1 no code touches a network or a keychain, and the whole
of it runs in `cargo test`. It is the point at which the shape of the feature is
settled and only transport, storage and screens remain.

**M2 — a real answer (T004–T007). Reached.** A stub server drives the client, the keychain
holds a key, and the confirmation gate refuses a payload that changed. At M2 the
application can make a request; it still has no screen that would cause one.

**M3 — a person can use it (T008–T009).** The mode panel, the badge, the dialog,
the reasons in the rows, and the verification pass.

## The prompt

One prompt, in English, built per request:

1. The criterion: the terms the user typed, verbatim.
2. The shortlist: for each candidate, its id, its cue indices and the text of
   those cues. Cue indices are printed as `#12`, never as a timecode.
3. The instruction: order the candidates for the criterion, and for each give
   one sentence, grounded in the cue indices you were given, returning JSON of
   the shape `{"order":[{"candidate":1,"reason":"...","cues":[12,13]}]}`.
4. Constraints: one sentence, at most 240 characters, no timecodes, no new
   indices.

Generation parameters, pinned in one place:

```
temperature: 0
top_p: 1
max_tokens: 1000
```

The answer is parsed with `serde_json` into a typed struct with
`deny_unknown_fields`. Anything else is `ProviderError::MalformedAnswer`.

## Budget

Characters, not tokens — documented as an estimate with the divisor in one
constant.

```
max prompt characters   = 16 000   (~4 000 tokens at 4 chars/token)
max candidates sent     = 20
max cues per candidate  = 60
max answer characters   = 4 000    (~1 000 tokens)
```

`shortlist` walks candidates in the order the deterministic search produced
(best first), takes cues in order, and stops when the next candidate would
exceed the cap. It records how many were left out; the interface prints that
number next to the result count. The fixture recording is the measuring stick
for SC-004.

## Confirmation

The dialog is not decoration: the Rust command takes the facts and returns them
in the response.

```
rank_candidates(criterion, confirmation: Confirmation)
Confirmation { provider, model, cue_count, char_count }   // built by the UI
```

Rust rebuilds the shortlist and compares: if the payload it is about to send
does not match the confirmed numbers, it refuses with `ProviderError::Unconfirmed`
and sends nothing. The UI shows the same numbers after the request, so the
claim "this is what left" is checkable against the answer.

## Keys

`KeyStore` trait with `get/set/clear`, service name `dev.kirpix.app`, account
`<provider>`. Production implementation over the `keyring` crate; tests use an
in-memory map. The trait exists so that `cargo test` never depends on a running
secret service and never writes a real key.

Key handling rules that the code must show:

- the key is read once per request, held in a `String`, and never formatted into
  an error;
- `ProviderError` has no variant that carries a key or a header value;
- authentication failures carry the provider's own message, with the key
  redacted if it appears in it;
- `clear_key` removes the entry.

## Failures

| Situation | Variant | What the user sees |
| --- | --- | --- |
| Local server down | `Unreachable { address }` | the address that was tried |
| Bad key | `Auth { message }` | the provider's message, redacted |
| 429 or 5xx | `Busy { retry_after }` | one retry, then the wait that was used |
| Not JSON / wrong shape | `MalformedAnswer` | the answer was not usable, nothing shown |
| Index out of range | `InvalidIndex { candidate, index }` | the candidate and the index |
| Payload ≠ confirmation | `Unconfirmed` | nothing was sent |
| Budget trim | not an error | "n of m candidates were sent" |

One retry, on 429 and 5xx only, after a stated wait. No retry on 4xx, no second
provider, no silent switch to heuristic.

## Interface

- **Model section in the rail**, under the criteria: mode segmented control;
  for local, the address and a "find models" button that lists what the server
  serves; for cloud, provider, model and key field (masked, with a delete
  action); a test-connection action.
- **Mode badge** in the results header: `sezgisel` or the model name, and the
  left-out count when the budget trimmed anything.
- **Confirmation dialog** naming provider, model, cue count and character count,
  with the two buttons "gönder" and "vazgeç".
- **Reason per candidate** from the answer, beside the term evidence, with the
  candidate's order following the model's ranking.

## Verification

- `cargo test` with an in-process stub server bound to `127.0.0.1:0` that
  records requests; assertions read the recorded body, not the application's
  own logs. Needs `tokio` (`rt-multi-thread`, `macros`) as a dev-dependency.
- The validator, the shortlist and the prompt builder are pure functions and
  tested without any server.
- SC-001 (network down, heuristic) remains a manual check on a real recording,
  as it is today.
- No test may reach a real provider, a real keychain, or the network.

## Out of scope

- Streaming, tokenisation per provider, cost display, multiple profiles.
- The free-text criterion and the audio-energy criterion.
- Transcription.
