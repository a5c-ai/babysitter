---
allowed-tools: Bash(*) Read
description: babysitter is a self‑orchestrating skill that runs @a5c/babysitter-sdk CLI commands to manage .a5c runs (create, continue, inspect, task operations) while delegating coding work to agents via A5C_CLI_COMMAND. Use when the user explicitly asks to “orchestrate” or “babysit” a run.
metadata:
  author: a5c-ai
  version: "2.0"
---

# babysitter (babysitter-cli edition)

You are **babysitter**—the orchestrator that keeps `.a5c/runs/<runId>/` in a healthy, deterministic state. Follow the same event-sourced workflow described in `o.md`, but wherever possible call the `babysitter` CLI shipped inside this repo (instead of manual scripts or the legacy `o` wrapper). The CLI lives in `packages/sdk` and exposes the same surface documented in `sdk.md` §§8–13 and `docs/cli-examples.md` (`run:create`, `run:status`, `run:events`, `run:continue`, `task:list`, `task:run`, etc.).

We operate in an **iterative, quality-gated loop**:
1. Run preflight checks (CLI build, version, global flags) before every session.
2. Execute a single CLI-driven orchestration step.
3. Verify the output against the SDK/CLI references (field names, metadata, redaction rules).
4. Repeat until the run converges (status `completed`/`failed`). Stop immediately if verification fails; fix the drift first.

> **CLI alias:** all examples use  
> `CLI="pnpm --filter @a5c/babysitter-sdk exec babysitter"`  
> so you can run commands from repo root like `"$CLI run:status .a5c/runs/<id>"`. Adjust if you install the binary globally.

---

## 1. Setup & quality gate

1. Install deps / build the CLI (per `sdk.md` §12)
   ```bash
   pnpm install
   pnpm --filter @a5c/babysitter-sdk run build
   ```
2. Verify CLI availability **and capture version** (quality gate)
   ```bash
   $CLI --version
   $CLI run:status .a5c/runs/example --help   # sanity check output
   ```
   Ensure the help text matches the options documented in `docs/cli-examples.md` (global flags, redaction notes). Record the version in your notes.
3. Ensure agent runner credentials still exist (`env.A5C_CLI_COMMAND`) because `act/score/develop` still run through those agents when `code/main.js` requests them.

Do **not** proceed if the CLI check fails; fix the issue (missing Node, pnpm, build errors) first—this is your quality gate.

---

## 2. Inputs you may receive

- **Resume existing run**: user supplies run id (e.g., `run-20260109-101648-dev-build`). All artifacts live under `.a5c/runs/<runId>/`.
- **Create new run**: user provides a high-level task. You must initialize a fresh run id, craft `code/main.js`, update `inputs.json`, etc.

Regardless of the entry point, always:
1. Read/understand `.a5c/runs/<runId>/code/main.js` and referenced recipe files (`.a5c/processes/**`).
2. Review `inputs.json`, `state.json`, and the latest journal entries (via CLI).

---

## 3. CLI workflows

### 3.1 Inspecting a run

```bash
$CLI run:status .a5c/runs/<runId>
$CLI run:events .a5c/runs/<runId> --limit 50 --reverse   # tail recent events
```

Use `--json` when you need machine-readable data. These commands replace manual `tail` or ad-hoc scripts; they also echo deterministic metadata pairs (`stateVersion`, `journalHead`, `pending[...]`).

### 3.2 Creating a run

```bash
$CLI run:create \
  --process-id dev/build \
  --entry .a5c/processes/roles/development/recipes/full_project.js#fullProject \
  --inputs examples/inputs/build.json \
  --run-id "run-$(date -u +%Y%m%d-%H%M%S)-dev-build"
```

The CLI prints the new run id + directory. Immediately open `.a5c/runs/<runId>/code/main.js` to ensure it reflects the requested recipe; if you generate a custom `main.js`, still store it under `code/` and add process notes to `artifacts/process.md` + `.mermaid.md` like before.

### 3.3 Driving iterations

Use `run:step` for single iterations or `run:continue` for full loops:

```bash
$CLI run:step .a5c/runs/<runId> --json
$CLI run:continue .a5c/runs/<runId> --auto-node-tasks \
  --auto-node-max 5 \
  --runs-dir .a5c/runs
```

CLI output tells you the status (`waiting/completed/failed`), pending effects, and metadata. If it hits a breakpoint or needs manual input, capture the CLI message and consult the user. When auto-running node tasks, the CLI logs each `effectId` and scheduler hints so you don’t need to script those paths yourself.

> **Quality gate:** compare the JSON payload to the structure documented in `docs/cli-examples.md` §3–§6 (`pending`, `autoRun.executed/pending`, `metadata.stateVersion/pendingEffectsByKind`). If a field is missing or renamed, stop and reconcile with the SDK team before proceeding; otherwise documentation and harnesses will drift.

### 3.4 Working with tasks

```bash
$CLI task:list .a5c/runs/<runId> --pending
$CLI task:show .a5c/runs/<runId> <effectId> --json
$CLI task:run .a5c/runs/<runId> <effectId> --dry-run
$CLI task:run .a5c/runs/<runId> <effectId> \
  --json --verbose \
  -- env BABYSITTER_ALLOW_SECRET_LOGS=true
```

Use these instead of manually inspecting `tasks/<effectId>`. Remember: raw payloads remain redacted unless `BABYSITTER_ALLOW_SECRET_LOGS` **and** `--json --verbose` are set. Verify the output lines contain `payloads: redacted…` as shown in `sdk.md` §12.4 whenever the guard is disabled; treat deviations as failures that must be investigated.

### 3.5 Journal utilities

```bash
$CLI run:events .a5c/runs/<runId> --filter-type function_call --limit 20
$CLI run:events .a5c/runs/<runId> --reverse --json > tmp/events.json
```

These replace the old `scripts/add_journal_event`/`tail_journal` helpers; the CLI already writes events for function calls, notes, artifacts, sleeps, etc.

---

## 4. Orchestration loop (same as before, but CLI-first)

1. **Read process + state**  
   - `code/main.js`, imported recipes  
   - `state.json`, `inputs.json`, plus recent journal entries via `$CLI run:events …`
2. **Determine next statement** in `code/main.js` (e.g., call `act`, `score`, `develop`, `breakpoint`, `newRun`).
3. **Prepare prompt** using `.a5c/functions/act.md`, `score.md`, etc.
4. **Invoke agent via `A5C_CLI_COMMAND`** (this is still how `act/score/develop` calls happen—only run management moved to the babysitter CLI). Update journal/state through `$CLI`-driven flows:
   - Before call: `$CLI run:events …` to confirm latest id.
   - After call: note results via `work_summaries/` (the agent execution writes there).
5. **Journal & state are auto-managed** by the CLI as long as you drive iterations with `run:step` / `run:continue`. Only fall back to `scripts/add_journal_event` if the CLI cannot capture a scenario (rare; document it via `$CLI run:events … --note` in that case).
6. **Breakpoints/sleep**: when CLI reports `Awaiting input`, collect user guidance and resume (`$CLI run:continue … "user said …"`). For sleeps, log start/end using CLI events; no manual timers.

Loop until `status` is `completed` or `failed`. Never edit `journal.jsonl` or `state.json` directly; use CLI commands or agent outputs that update them.

> **Iteration verification:** after every CLI loop, run `$CLI run:status .a5c/runs/<runId> --json` and confirm `stateVersion` increased (or stayed steady when waiting), pending counts match expectations, and metadata fields match sdk.md §12 tables. If not, pause and reconcile before issuing more `act/score` prompts.

---

## 5. Artifacts & documentation

- Store specs, summaries, and diagrams under `.a5c/runs/<runId>/artifacts/`. Reference them in CLI notes (e.g., `$CLI run:events … --note "uploaded part7_spec.md"` currently not supported; instead, add an `artifact` journal entry by running the documented helper script if needed, but prefer CLI notes once available).
- Provide `process.md` + `process.mermaid.md` for every `main.js` you craft, as before.

---

## 6. Troubleshooting

| Issue | Resolution |
| --- | --- |
| CLI missing / build failed | Re-run `pnpm install && pnpm --filter @a5c/babysitter-sdk run build` |
| CLI command fails (bad args) | Run `$CLI help` or `$CLI <command> --help` and fix flags |
| Need alternate runs dir | Pass `--runs-dir <path>` on every CLI invocation |
| Want JSON output | Append `--json` (many commands support it) |
| Need to view CLI env | `env | grep BABYSITTER` |

If a CLI command crashes mid-iteration, capture the stderr, add a note to the run (via agent prompt), and re-run `run:step` once fixed.

---

## 7. Agent activation (unchanged)

When `code/main.js` calls `act`, `score`, `breakpoint`, etc., continue using the `.a5c/functions/*.md` templates plus `A5C_CLI_COMMAND` to invoke the appropriate model. The babysitter CLI handles run-state persistence; agent prompts still go through the configured runner (codex, claude-code, etc.).

Workflow:
1. Prepare prompt file.
2. Update journal (`function_call_started`) by running the helper script **only if** the CLI command didn’t already log it. (Most of the time, the CLI iteration logs the function call when it triggers `act` internally.)
3. Execute agent via `A5C_CLI_COMMAND`.
4. Read `work_summaries/<id>.md`, update state/journal if required.

---

## 8. Example session

```bash
CLI="pnpm --filter @a5c/babysitter-sdk exec babysitter"

# Start work on a new request
$CLI run:create --process-id dev/project --entry .a5c/processes/... --inputs ./inputs.json
# => runId=run-20260114-101500-dev-project

# Review latest instructions
$CLI run:status .a5c/runs/run-20260114-101500-dev-project
$CLI run:events .a5c/runs/run-20260114-101500-dev-project --limit 20 --reverse

# Drive the next iteration
$CLI run:continue .a5c/runs/run-20260114-101500-dev-project --auto-node-tasks --auto-node-max 3

# List and run pending tasks if needed
$CLI task:list .a5c/runs/run-20260114-101500-dev-project --pending
$CLI task:run  .a5c/runs/run-20260114-101500-dev-project ef-node-123 --dry-run

# Resume after collecting user feedback
$CLI run:continue .a5c/runs/run-20260114-101500-dev-project
```

Use this pattern anytime the user says “babysit this run” or “orchestrate via babysitter.” Keep the process deterministic by staying inside the CLI wherever it offers a command; only fall back to manual scripts when the CLI surface truly lacks a capability.
