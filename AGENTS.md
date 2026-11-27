# Working in this repository

Read two files before anything else:

- `.specify/memory/constitution.md`: the rules. It outranks specs, plans and
  code, and every plan review checks the work against it.
- `.specify/memory/product.md`: what Kirpix is for, who it is for, and the
  numbered roadmap. Every spec names the roadmap item it delivers.

## Layout

- `site/` the project site. Astro, static, no client JavaScript, no backend.
  Turkish at `/`, English at `/en/`. All copy lives in `site/src/content/copy.ts`.
- `app/` the desktop application. Tauri 2 shell, Rust for filesystem, process
  control, keychain and FFmpeg invocation, React and TypeScript for the
  interface. Run with `cd app && npm run tauri dev`.
- `specs/` one folder per feature, numbered, written before the code.
- `eval/` the fixed evaluation set. `manifest.json` is the source of truth;
  `eval/media/` is gitignored. See `eval/README.md`.
- `.specify/` Spec Kit scaffolding. Do not edit generated scripts or templates
  to work around a rule; amend the constitution instead.

## Process

This repository follows the Spec Kit sequence, run through its commands
(Spec Kit 1.4.5, Claude integration, skills in `.claude/skills/`):

| Step | Command | Output |
| --- | --- | --- |
| Specify | `/speckit-specify` | `specs/NNN-name/spec.md` and the branch |
| Clarify | `/speckit-clarify` | the owner's answers written into the spec |
| Plan | `/speckit-plan` | `plan.md` and its design notes, checked against the constitution |
| Tasks | `/speckit-tasks` | `tasks.md` |
| Analyze | `/speckit-analyze` | a consistency report across spec, plan and tasks, before any code |
| Implement | `/speckit-implement` | one commit per task |
| Converge | `/speckit-converge` | the code held against the spec; gaps appended as tasks |

Clarify and Analyze are not optional here: the owner answers the questions,
and no code is written while Analyze reports a critical issue. Bugs go through
`/speckit-bug-assess`, `/speckit-bug-fix`, `/speckit-bug-test` (reports under
`.specify/bugs/`). Do not edit files under `.specify/scripts`,
`.specify/templates` or `.claude/skills` by hand; `specify integration upgrade`
manages them. One feature folder per slice.

- No implementation task without a spec that states its acceptance criteria.
- Every acceptance criterion maps to a test or a documented manual check against
  `eval/`.
- A plan that violates the constitution stops. Amendments go through the
  Governance section, with a version bump.
- One task, one commit, and the app stays runnable after each commit.
- One feature at a time, in number order. A spec may be written ahead, code may
  not: finish and merge feature N before starting feature N+1. No two features
  in flight at once. A merged feature is not reopened. A fix that makes the code
  do what its merged spec already says is a `fix-*` branch through the bug
  commands; a change to what the spec says is the next numbered slice.
- The cycle, every time: spec (with the owner's answers to its open
  questions), plan, tasks, then a branch named after the spec
  (`NNN-short-name`), one commit per task, a pull request, merge, delete the
  branch. Then the next spec.
- Merge with a merge commit, never squash, so the task commits stay on
  `master`. Never merge with `--admin`; if protection blocks a merge, fix the
  reason.
- A chore (`chore-*` branch) changes no behaviour: records, docs, formatting,
  lint, tooling. It needs no spec but goes through a pull request.
- `./scripts/check.sh` passes before every pull request.
- A task box is ticked in the commit that does the task. Verification is two
  boxes: *verified by the machine* (ticked when the tests pass) and *owed to a
  person* (open, naming each check, until that person has done it).
- Specs, code, comments and commit messages in English. The interface ships in
  Turkish and English.

## Branches and merges

```
master ──●───────────────●──────────────●──   always runnable, protected
          \             /  \            /
           007-ui-redesign   chore-records
           one commit per task   no behaviour change
```

| Branch | Starts from | Holds | Merges when |
| --- | --- | --- | --- |
| `NNN-short-name` | `master`, after `/speckit-specify` | one feature: its spec, plan, tasks, then one commit per task | `/speckit-analyze` has no critical finding, every task is done or names what a person owes, `check.sh` passes, the owner approves |
| `chore-short-name` | `master` | records, docs, formatting, lint, tooling, tests that pin existing behaviour | `check.sh` passes, the owner approves |
| `fix-short-name` | `master`, after `/speckit-bug-assess` | the scoped fix and its report under `.specify/bugs/` | `/speckit-bug-test` has recorded the verification |

The steps, every time:

1. `git switch master && git pull --ff-only`
2. create the branch (the spec command does this for a feature)
3. commit each task on its own; push
4. `./scripts/check.sh`, then `gh pr create` with the checks' summary
5. the owner reviews; `gh pr merge <n> --merge --delete-branch`
6. `git switch master && git pull --ff-only && git branch -D <branch>`

Never: squash, rebase onto `master` after review, `--admin`, force-push to
`master`, or a second feature branch while one is open. A chore may run
beside a feature when it touches none of the feature's files.

## Commands

```sh
cd site && npm install && npm run dev      # site, http://localhost:4321
cd site && npm run build                   # -> site/dist
cd app && npm install && npm run tauri dev # the desktop app
./scripts/check.sh                         # every check, before a PR
```

Rust is installed under `~/.cargo` (rustup, minimal profile). Add it to the
shell with `export PATH="$HOME/.cargo/bin:$PATH"` or source `~/.cargo/env`.

## Things that are not allowed

- Sending media anywhere. Subtitle text only, to a configured provider, after an
  explicit confirmation.
- Telemetry, analytics, crash reporting, accounts, remote config.
- Asking a model for timestamps. Models return cue indices.
- Sending a model the whole transcript when deterministic code can shortlist
  candidates first.
- Silent fallbacks. If the app degrades, it says so where the work happens.
