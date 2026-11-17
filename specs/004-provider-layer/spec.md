# Feature Specification: The model layer

**Feature Branch**: `004-provider-layer`

**Created**: 2026-11-17

**Status**: Done — M1, M2 and M3 merged; four checks need a person, named in `tasks.md`

**Input**: Let the user point the application at a model they chose — on their
machine or over the network — and let that model rank the candidates and say
why, without ever sending the recording.

## Why this slice exists

Feature 001 finds candidates by matching words. That is honest and it is what
ships today, but it cannot answer "which of these nine passages is the one I
actually want", and the reason it prints is a list of terms, not a reason.

The site already promises this: a local model through Ollama or LM Studio, a
cloud model through DeepSeek, OpenAI or Claude, with the subtitle text and
nothing else leaving the machine, after a confirmation that says so. None of it
is built. This slice builds the first half of that promise — the local servers
and DeepSeek — and says plainly in the interface that the rest is not there yet,
because a picker entry for a provider that does not work is a lie with a
dropdown.

## What this slice is not

- It is not a new way to find candidates. Shortlisting stays deterministic
  (constitution VI). The model ranks what the deterministic pass already found
  and explains the ranking.
- It is not the free-text criterion ("en tartışmalı iddia nerede?"). That needs
  the shortlisting rule reworked first, and it is a slice of its own.
- It is not speech-to-text, transcription, or audio analysis.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Point the application at a model (Priority: P1)

The user runs Ollama, opens the model panel, picks "local", the application
finds the models it is serving, and the user chooses one. Nothing leaves the
machine.

**Why this priority**: It is the mode the product is named for — a local tool
that happens to use a model, not a cloud service with a local face.

**Independent Test**: with Ollama running and the network otherwise down, set
the model and complete a search that returns ranked candidates with reasons.

**Acceptance Scenarios**:

1. **Given** a local server answering on its usual port, **When** the user opens
   the model panel, **Then** the models it serves are listed by name, and one is
   chosen explicitly by the user.
2. **Given** a local model chosen, **When** the user searches, **Then** the mode
   is named in the interface before and after the request, and no request leaves
   the machine.
3. **Given** the local server is not running, **When** the user tries to use it,
   **Then** the panel says the server could not be reached and names the address
   it tried.

---

### User Story 2 - Send the subtitle text, after being told what it is (Priority: P1)

The user chooses a cloud model, pastes a key, and presses send. Before anything
leaves, a dialog names the provider, the model, and how much text will be sent —
and only that text.

**Why this priority**: This is the promise the site makes in writing. A model
call that happens without that dialog breaks the product's reason to exist.

**Independent Test**: with a cloud provider configured, search while watching a
packet capture or a stub server; nothing arrives before the dialog is accepted,
and what arrives is subtitle text only.

**Acceptance Scenarios**:

1. **Given** a cloud model configured and no confirmation given yet, **When**
   the user searches, **Then** no request is sent and a dialog appears naming
   the provider, the model, the number of cues and the character count.
2. **Given** the dialog, **When** the user cancels, **Then** nothing was sent
   and the search continues without the model.
3. **Given** the dialog accepted, **When** the answer arrives, **Then** the
   request that was made can be described by the same facts the dialog stated.
4. **Given** a key stored earlier, **When** the application restarts, **Then**
   the key is still usable and is not present in any file the application wrote.

---

### User Story 3 - The model ranks and explains, the application checks it (Priority: P2)

Nine candidates came back from the deterministic pass. The model is asked to
order them for the stated criterion and to give one sentence each. It answers
with cue indices; anything outside a candidate's own range is refused.

**Why this priority**: An answer that is displayed unchecked is the quiet
failure this project keeps designing against.

**Independent Test**: point the application at a stub that answers with an
out-of-range index, and confirm the answer is refused with a named error.

**Acceptance Scenarios**:

1. **Given** a shortlist, **When** the model answers, **Then** each candidate's
   reason is the model's sentence and the interface says the ranking came from
   the model, not from the term match.
2. **Given** an answer whose cue index does not exist or falls outside the
   candidate it claims to explain, **When** it is received, **Then** it is
   refused, the failure is named, and no unchecked reason is shown.
3. **Given** the model is unreachable mid-flow, **When** the request fails,
   **Then** the deterministic candidates stay on screen, labelled as the
   deterministic result, and the failure is stated where the results are.

### Edge Cases

- **A key is wrong or revoked.** Named as an authentication failure, with the
  provider's own message kept, and the key is not repeated in the error.
- **The provider rate-limits or times out.** One retry after a stated wait, then
  a named failure. No retry loop, no silent switch to another mode.
- **The model answers with prose instead of the requested shape.** Parsed
  strictly; a malformed answer is a named failure, not a guess.
- **The model answers for a candidate that was not asked about.** Ignored.
- **More candidates than the budget allows.** The deterministic ranking decides
  which are sent, and the interface says how many were left out.
- **The user switches mode after a search.** Results produced by the other mode
  are cleared, not relabelled.
- **The provider returns a reason in the wrong language.** Shown as it arrived;
  the application does not translate it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST offer three modes: heuristic (no model), a
  local model, and a cloud model. Heuristic MUST remain the default and MUST
  keep working when the model layer is absent entirely.
- **FR-002**: The active mode MUST be visible wherever results are produced, and
  MUST be visible while a request is in flight.
- **FR-003**: Local mode MUST work against a local server that speaks the
  OpenAI-compatible shape, on an address the user can see and change. One client
  then covers Ollama, LM Studio, and the vLLM or llama.cpp servers people point
  at models they tuned themselves (Unsloth's own product is a training toolkit —
  what it produces is served by one of those). Ollama's own model listing is
  called through the same client where the server offers it.
- **FR-004**: Cloud mode in this slice MUST work against DeepSeek's
  OpenAI-compatible endpoint, with the confirmation gate in FR-005. Anthropic's
  request shape, and OpenAI's own endpoint, are explicitly out of this slice and
  belong to a later one: one request shape now, more later, rather than two
  half-tested shapes now.
- **FR-005**: A cloud request MUST NOT be sent until the user confirms a dialog
  naming the provider, the model, the number of cues and the character count
  being sent. The confirmation MUST be per request, not per session.
- **FR-006**: The payload MUST contain subtitle text, cue indices, the
  criterion, and nothing else. No media, no timestamps, no file paths, no
  filenames beyond what the user typed as a criterion.
- **FR-007**: The model MUST be asked for cue indices and MUST NOT be asked for
  timecodes (constitution V).
- **FR-008**: Every index in an answer MUST be validated against the cues that
  candidate actually contains. An answer that fails validation MUST be refused
  with a named error, and no part of it shown as a reason.
- **FR-009**: The prompt MUST stay within a documented budget for any recording
  length, enforced by a deterministic shortlist. Candidates left out MUST be
  counted and stated in the interface.
- **FR-010**: Generation parameters MUST be pinned in one place and recorded in
  the plan. Two runs against the same model and answer produce identical output
  from this application; the spec MUST NOT claim that a cloud model is
  byte-identical run to run.
- **FR-011**: API keys MUST be stored in the operating system keychain, MUST NOT
  be written to a file, a log, or an error message, and MUST be removable from
  the interface.
- **FR-012**: When a model request fails, the deterministic candidates MUST stay
  on screen and the result MUST be labelled as the deterministic result. The
  failure MUST be stated where the results are; it MUST NOT be silent.
- **FR-013**: The application MUST make no request that the user did not
  initiate, including at start-up, and MUST NOT send anything when the mode is
  heuristic.
- **FR-014**: The mode panel MUST let the user name the model explicitly; the
  application MUST NOT choose a model on the user's behalf.
- **FR-015**: A local server that is not running MUST produce a named failure
  naming the address tried, not an empty model list.

### Key Entities

- **Mode**: heuristic, local, cloud — with the provider, address and model name
  that make it concrete.
- **Shortlist**: the deterministic candidates chosen to be sent, with the count
  left out.
- **Confirmation**: the facts shown before a request is allowed to leave.
- **Answer**: for each candidate, a rank position, one sentence, and the cue
  indices that sentence is grounded in.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With the network interface down and the mode heuristic, the whole
  flow from opening a file to writing clips completes. This stays the release
  gate it is today.
- **SC-002**: With a stub server, no request arrives before the confirmation is
  accepted, and the payload contains only cue text, indices and the criterion.
  Checked by inspecting the stub's recorded requests.
- **SC-003**: An answer with an index outside the candidate's range is refused,
  and the interface shows the named failure rather than a reason. Checked by
  test against the stub.
- **SC-004**: For the fixture recording, the prompt for a full search stays
  under the documented budget, and the number of candidates left out matches the
  number the interface states. Checked by counting tokens and by asserting the
  reported count.
- **SC-005**: A stored key is absent from every file the application writes and
  from every error payload; a test asserts this for the authentication failure
  path specifically.
- **SC-006**: Two identical stub answers produce identical candidate output;
  the candidate JSON is byte-identical between runs.
- **SC-007**: The mode is named on screen during and after a request, and a
  failed request leaves the deterministic candidates visible and labelled.

## Assumptions

- Streaming is out of scope. Responses are read whole; a long answer is a
  progress indicator, not a token stream.
- One model per mode at a time. Profiles, per-criterion models and per-job
  models are later.
- The local client speaks the OpenAI-compatible shape, which both Ollama and
  LM Studio serve. If one of them refuses, the failure names it rather than
  falling back to the other.
- Token counts are estimated by character count with a fixed divisor, not by a
  tokeniser per provider. The estimate is documented and conservative; a real
  tokeniser per provider is later work.
- No cost display. The interface states what is sent, not what it will cost.
- The reason sentence is displayed next to the term evidence, never instead of
  it (constitution IV).

## Decisions taken (2026-11-17)

1. **Local first, and local means anything OpenAI-shaped.** Ollama is the face
   of it, because that is what the site promises and what people already run;
   the same client reaches LM Studio and the servers people point at their own
   fine-tunes. The address is visible and editable, so a server on another port
   is a setting, not a code change.
2. **One cloud provider for now: DeepSeek.** Anthropic's shape and OpenAI's own
   endpoint wait for a later slice. The interface must not pretend they are
   there — a provider that is not in the build is not in the picker.
3. **Heuristic stays the default.** The model layer is something the user turns
   on, not something that arrives on.

## Open question (answer before implementation)

**The budget.** The plan proposes a prompt of at most 4 000 estimated tokens and
an answer of at most 1 000, with the shortlist capped at the twenty
highest-ranked candidates of sixty cues each. That fits a one hour recording and
leaves room for the criterion text. Confirm or set another number; the tasks can
start without it as long as `shortlist.rs` takes the number from one constant.
