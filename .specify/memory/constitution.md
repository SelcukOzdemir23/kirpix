# Kirpix Constitution

Kirpix is a desktop application that finds the clips a user asked for in a
subtitled recording and cuts them on that user's own machine. These articles are
the rules every spec, plan, task and line of code must satisfy. Where this
document and any other document disagree, this document wins.

## Core Principles

### I. Local by Default (NON-NEGOTIABLE)

Video, audio, extracted frames, thumbnails and cut output never leave the
device. They are read from the filesystem, processed locally, and written back
to a folder the user chose.

The only data permitted to leave the device is text the user can already see on
screen (subtitle text), sent to a model provider the user configured, after an
explicit confirmation naming the provider and the payload. Any feature whose
path uploads media rather than text is out of scope.

### II. The Device Works Alone (NON-NEGOTIABLE)

No telemetry, no analytics, no crash reporting, no accounts, no remote config,
no background network requests. Every outbound request is user-initiated, is
visible in the interface, and states what it sends and where.

With a local model or heuristic mode selected, the entire flow must complete
with the network interface down. This is a release gate, not an aspiration.

### III. AI Is Optional

Every capability has a deterministic path that needs no model. Removing the
model layer may reduce selection quality; it must never remove the ability to
produce clips.

The active mode (local model, cloud provider, heuristic) is always visible while
the user works. The user is never told a result came from a model when it did
not, and never left guessing which mode produced it.

### IV. Criterion In, Evidence Out

The application does not decide what "the best moment" is. It answers the
criterion the user stated.

Every clip carries the subtitle lines it was built from and a human-readable
reason. A clip that cannot present its evidence must not be displayed.

### V. Line Indices, Never Model Timestamps

The model receives numbered subtitle cues and returns cue indices. Timestamps
are computed from the cue table. No code path may treat a timecode produced by a
model as authoritative, and no prompt may ask the model for one.

### VI. Tokens On Decisions, Not On Reading

Parsing, normalization, alignment, segmentation, candidate shortlisting and
cutting are deterministic and cost no tokens. Only ranking and justification of
already-shortlisted candidates may call a model.

The prompt payload for a one-hour recording stays within a documented budget.
Exceeding that budget is a defect, not a tuning problem.

### VII. Determinism Before Probability

Same input, same settings and same model configuration produce the same output;
generation parameters are pinned. Heuristic mode is fully deterministic.

Anything that can be computed is computed rather than predicted.

### VIII. Small, Runnable Slices

Every feature ships as a slice that runs end to end on a real file. No
scaffolding for unbuilt modes, no flags hiding half-features.

A slice that cannot be demonstrated with a real recording is not done.

### IX. Failures Are Visible

Errors state what failed, why, and what the user can do about it. No silent
fallbacks: when the application degrades, for example to heuristic mode, it says
so where the work happens.

### X. The Evaluation Set Defines Quality

"A good clip" is measured against a fixed set of real recordings with expected
ranges, not against anyone's impression. Every quality claim in a spec names the
recordings and the threshold used to check it.

## Additional Constraints

- **Stack**: Tauri 2 shell, Rust for filesystem, process control, keychain and
  media invocation, TypeScript and React for the interface. No Python, no local
  HTTP sidecar, no IPC port or bearer token.
- **Media**: a bundled FFmpeg binary invoked as a child process. A released
  build never depends on a system FFmpeg being installed. This is a release
  gate, like the offline run in article II: until the packaging feature ships
  the binary, development builds resolve a system FFmpeg, and the window says
  so wherever media work happens (article IX).
- **Secrets**: API keys live in the operating system keychain. Never in a
  plaintext file, never in logs, never in error messages.
- **Distribution**: Windows, macOS and Linux, unsigned. Code signing is out of
  scope until there is a reason to pay for it.
- **Size**: installer under 150 MB excluding models. Speech and language models
  are downloaded on demand, never bundled.
- **License**: MIT for the project. FFmpeg, model and font licenses are
  documented in the repository.
- **Code structure**: the code is meant to be read, by the next contributor
  and by anyone judging the project from its source.
  - *One reason to change per module.* Parsing, matching, ranking, media
    invocation, storage and the interface are separate modules; a file that
    does two of these jobs is split.
  - *The domain is pure.* `subtitle` and `criterion` take values and return
    values: no filesystem, no process, no network, no Tauri. Side effects live
    at the edge (`media`, `provider`, `settings`), and `commands.rs` only
    adapts between the interface and those modules.
  - *Depend on the contract, not the provider.* Anything with more than one
    implementation, or one that tests must replace (model clients, key
    storage), sits behind a trait the domain owns.
  - *Components render; they do not orchestrate.* Interface state and backend
    calls live in hooks and modules beside the components, not inside a screen
    component. A component file above 300 lines is a defect, fixed by the next
    slice that touches it.
  - *Names come from the spec* (cue, candidate, criterion, offset), and
    comments say why, not what. Public items carry a doc comment;
    the number without one, measured by `scripts/check.sh`, only goes down.
- **Language**: interface in Turkish and English. Specs, code, comments and
  commit messages in English.

## Development Workflow

- **Spec first.** Work follows the Spec Kit sequence: constitution, specify,
  clarify, plan, tasks, analyze, implement, converge. One feature folder per
  slice under `specs/`. Every spec names the roadmap item in
  `.specify/memory/product.md` it delivers; work that fits no item changes the
  product document first.
- **No task without a spec.** An implementation task must trace to a requirement
  whose acceptance criteria are written down.
- **Traceable acceptance.** Every acceptance criterion maps to an automated test
  or a documented manual check against the evaluation set. A feature's
  verification is two boxes: what the machine proved, ticked when it passes,
  and what a person owes, which stays open and names each check until that
  person has done it.
- **The plan passes the constitution.** A planned decision that violates an
  article stops the plan. Amendments go through Governance; workarounds do not.
- **One task, one commit.** Each task leaves the application buildable and
  runnable. A task that cannot be reviewed alone is too large. Merges keep the
  task commits: merge commits, not squashes.
- **One feature in flight, in number order.** A spec may be written ahead;
  code for feature N+1 waits until feature N is merged. A merged feature is
  not reopened: a change to its specified behaviour is a new numbered
  slice. A fix that brings the code back to what its spec already says goes
  through the bug commands on its own branch, with its report.
- **Chores are not features.** A change with no behaviour change (records,
  docs, formatting, lint, tooling) may go without a spec, on its own branch,
  through a pull request.
- **Checks before merge.** `scripts/check.sh` passes, and branch protection is
  not bypassed.

## Governance

- This constitution supersedes specs, plans, tasks and code. A spec that
  conflicts with it is wrong, however carefully it is written.
- **Amendments** require a written reason, a version bump, and a note on how
  existing specs are affected. Undocumented drift is not an amendment.
- **Versioning**: MAJOR for removing or redefining an article, MINOR for adding
  one, PATCH for wording that does not change meaning.
- **Review**: every plan review checks the plan against these articles and
  records the outcome. Skipping the check is a governance failure, not a
  shortcut.

**Version**: 1.2.0 | **Ratified**: 2026-11-17 | **Last Amended**: 2026-11-27

### Amendment log

- **1.2.0** (2026-11-27), MINOR: the bundled-FFmpeg rule becomes a release
  gate; a code-structure constraint is added; the workflow names every Spec Kit
  step, ties each spec to the product document, and splits verification into a
  machine box and a person box, and separates a bug fix (code back to its
  spec) from a behaviour change (a new slice). *Reason*: the analysis of 001 to 006 found the
  FFmpeg rule unmet by every build with no record of the deferral (finding D1),
  and two rules in use for person-owed checks (I1). The owner asked for code a
  reader can judge, so the structure the Rust side already follows is written
  down. *Effect on existing specs*: none rewritten. 004 T009 and 006 T005 are
  split into the two boxes. 183 public Rust items have no doc comment on the
  day of this amendment; that is the baseline. `app/src/App.tsx` (845 lines) breaks the
  component rule; 007 fixes it.
- **1.1.0** (2026-11-27), MINOR: four workflow rules added under Development
  Workflow (merge commits, one feature in flight in order, chores, checks
  before merge). *Reason*: features 003 and 005 were reopened or coded out of
  order, two merges squashed several task commits into one, and two used an
  admin bypass. *Effect on existing specs*: none are rewritten. 001 to 006 stay
  as merged; the history is not rewritten. The rules apply from 007 on.
