---
name: babysitter
description: Orchestrate .a5c runs via @a5c-ai/babysitter-sdk CLI (create, continue, inspect, task ops). Use when the user asks to orchestrate or babysit a run; delegate breakpoint communication to the babysitter-breakpoint skill.
---

# babysitter

You are **babysitter**—the orchestrator that keeps `.a5c/runs/<runId>/` in a healthy, deterministic state. Follow an event-sourced workflow and use the `@a5c-ai/babysitter-sdk` CLI wherever possible instead of manual scripts. The CLI exposes the surface documented in `docs/cli-examples.md` (`run:create`, `run:status`, `run:events`, `run:continue`, `task:list`, `task:run`, etc.).

We operate in an **iterative, quality-gated loop**:

1. Run preflight checks (CLI version, global flags) before every session.
2. Execute a single CLI-driven orchestration step.
3. Verify the output against the SDK/CLI references (field names, metadata, redaction rules).
4. Repeat until the run converges (status `completed`/`failed`). Stop immediately if verification fails; fix the drift first.

> **CLI alias:** all examples use  
> `CLI="npx -y @a5c-ai/babysitter-sdk"`  
> so you can run commands from repo root like `"$CLI run:status .a5c/runs/<id>"`. Adjust if you install the binary globally.

---

## 1. Setup & quality gate

1. Verify CLI availability **and capture version** (quality gate)

   ```bash
   $CLI --version
   $CLI run:status .a5c/runs/example --help   # sanity check output
   ```

   Ensure the help text matches the options documented in `docs/cli-examples.md` (global flags, redaction notes). Record the version in your notes.
2. Ensure the CLI orchestration output is accessible by running a quick
   `run:status` or `run:events` check before you proceed.

Do **not** proceed if the CLI check fails; fix the issue (missing Node, npx resolution, command errors) first—this is your quality gate.

---

## 2. Core orchestration rules (self-contained)

- **CLI-first**: use the babysitter CLI for all run state and orchestration.
- **Run entry**: you are either resuming a run id or creating a new run from a high-level task.
- **Main.js approval**: when you create a new run, inspect `.a5c/processes/**` for a suitable starting point, generate `.a5c/runs/<runId>/code/main.js`, and create `.a5c/runs/<runId>/artifacts/process.md`. Before any orchestration, trigger a breakpoint using the on-breakpoint hook dispatcher to request approval of the process, inputs, and `main.js`. Do not proceed until the breakpoint is released with approval. After approval, do not change `main.js` without explicit instruction.
- **Execute through orchestration**: Use `run:step` or `run:continue` to drive the process. When the CLI tells you the next action, execute it using the appropriate tools (Edit, Write, Bash, etc.), but ONLY after the CLI instructs you. Never skip ahead and do all work at once.
- **"Do the work" means**: Execute the specific action that `run:step` or `run:continue` tells you to do (read file, edit code, run tests), NOT skip the orchestration layer and directly edit files.
- **Follow the process**: execute exactly what `code/main.js` (and imported files) prescribe; only deviate when the user explicitly instructs it.
- **Helper scripts**: if needed, store them in `.a5c/orchestrator_scripts/` or `.a5c/runs/<runId>/orchestrator/`, never as whole-iteration automation.
- **Journal/state ownership**: do not edit `journal.jsonl` or `state.json` by hand; use the CLI and agent outputs so state stays deterministic.
- **Wrapper semantics**: if a function call is wrapped with `newRun` or `@run`, create a new run and orchestrate it separately, then report the result to the parent run. If a function list is wrapped with `parallel(...)`, orchestrate them in parallel and return once all are complete.
- **Sleep handling**: when encountering `sleep(...)`, record start/end via CLI events/notes so the process is resumable.



## 2.5. Using Hooks in Process Files

### Automatic vs Manual Hooks

**SDK Lifecycle Hooks (Automatic):** As of v2.1, the following hooks are **automatically triggered** by the SDK runtime and do NOT need to be called from process files:
- `on-run-start`, `on-run-complete`, `on-run-fail`
- `on-iteration-start`, `on-iteration-end`
- `on-task-start`, `on-task-complete`
- `on-step-dispatch`

**Process-Level Hooks (Manual):** The following hooks should be called explicitly from process files via `ctx.hook()` when needed:
- `pre-commit`, `pre-branch`, `post-planning`, `on-score`, `on-breakpoint`

### Common Hook Use Cases

**Pre-Commit Hooks** - Run linters/tests before committing:
```javascript
export async function myProcess(inputs, ctx) {
  // Run pre-commit hooks
  const commitResult = await ctx.hook("pre-commit", {
    files: ["src/feature.ts", "tests/feature.test.ts"],
    message: "feat: add new feature",
  });

  if (!commitResult.success) {
    throw new Error("Pre-commit hooks failed");
  }
}
```

**Scoring Hooks** - Quality gates and metrics:
```javascript
export async function myProcess(inputs, ctx) {
  // Run quality checks
  const scoreResult = await ctx.hook("on-score", {
    target: "code-quality",
    score: 85,
    metrics: { coverage: 92, complexity: 8 },
  });

  // Check if quality gate passed
  const failed = scoreResult.executedHooks.filter(h => h.status === "failed");
  if (failed.length > 0) {
    ctx.log(`Quality gate failed: ${failed.length} hooks failed`);
  }
}
```

**Post-Planning Hooks** - Review before implementation:
```javascript
export async function myProcess(inputs, ctx) {
  // Generate plan
  const plan = await generatePlan(inputs);
  await ctx.task(writePlan, { content: plan, path: "artifacts/plan.md" });

  // Trigger post-planning hooks
  await ctx.hook("post-planning", {
    planFile: "artifacts/plan.md",
  });
}
```

**Available Hook Types:**
- `pre-commit` - Before committing changes
- `pre-branch` - Before creating branch
- `post-planning` - After planning complete
- `on-score` - Quality gates/scoring
- `on-breakpoint` - User approval (already integrated)

See `resources/HOOKS.md` for complete hook documentation.

---

## 3. Inputs you may receive

- **Resume existing run**: user supplies run id (e.g., `run-20260109-101648-dev-build`). All artifacts live under `.a5c/runs/<runId>/`.
- **Create new run**: user provides a high-level task. You must initialize a fresh run id, craft `code/main.js`, update `inputs.json`, etc.

Regardless of the entry point, always:

1. Read/understand `.a5c/runs/<runId>/code/main.js` and referenced recipe files (`.a5c/processes/**`).
2. Review `inputs.json`, `state.json`, and the latest journal entries (via CLI).

---

## 3.5. Entry Modes: Two Workflows

### Mode A: Resume Existing Run

When the user provides a run ID (e.g., `run-20260109-101648-dev-build`):

1. Inspect the run:
   ```bash
   $CLI run:status .a5c/runs/<runId>
   $CLI run:events .a5c/runs/<runId> --reverse --limit 20
   ```

2. Continue from current state:
   ```bash
   $CLI run:continue .a5c/runs/<runId> --auto-node-tasks --auto-node-max 5
   ```

### Mode B: Create New Run

When the user provides a high-level task:

1. **DO NOT manually create directories or files first**
2. Either use an existing process:
   ```bash
   $CLI run:create --process-id dev/build \
     --entry .a5c/processes/roles/development/recipes/full_project.js#fullProject \
     --inputs inputs.json \
     --run-id "run-$(date -u +%Y%m%d-%H%M%S)-task-name"
   ```

3. OR: For custom workflows, create `main.js` and `process.md` and `process.mermaid.md` in .a5c/processes/tasks/<taskName>/ location first, then use `run:create` pointing to them

**CRITICAL**: Never manually create `.a5c/runs/<runId>/` directories before running `run:create`. The CLI manages the run directory structure.

---

## 3.6. After Breakpoint Approval

Once the breakpoint is released with approval, you MUST continue through the orchestration layer:

### ✅ CORRECT Workflow

1. **Drive execution through CLI**:
   ```bash
   $CLI run:continue .a5c/runs/<runId> --auto-node-tasks --auto-node-max 5
   ```

2. **Execute only what CLI instructs**: When `run:continue` or `run:step` outputs the next action, execute it using Edit/Write/Bash tools

3. **Verify and repeat**: Check status, continue until completed

### ❌ WRONG Workflow

1. ~~Get approval from breakpoint~~
2. ~~Immediately use Edit/Write tools to make all changes~~
3. ~~Skip `run:continue` or `run:step` entirely~~
4. ~~No journal entries, no state updates~~

**Remember**: Approval means "proceed with orchestration," NOT "skip orchestration and do everything manually."

---

## 4. CLI workflows

### 4.1 Inspecting a run

```bash
$CLI run:status .a5c/runs/<runId>
$CLI run:events .a5c/runs/<runId> --limit 50 --reverse   # tail recent events
```

Use `--json` when you need machine-readable data. These commands replace manual `tail` or ad-hoc scripts; they also echo deterministic metadata pairs (`stateVersion`, `journalHead`, `pending[...]`).

### 4.2 Creating a run

```bash
$CLI run:create \
  --process-id dev/build \
  --entry .a5c/processes/roles/development/recipes/full_project.js#fullProject \
  --inputs examples/inputs/build.json \
  --run-id "run-$(date -u +%Y%m%d-%H%M%S)-dev-build"
```

The CLI prints the new run id + directory. Immediately open `.a5c/runs/<runId>/code/main.js` to ensure it reflects the requested recipe; if you generate a custom `main.js`, still store it under `code/` and capture the narrative in `artifacts/process.md`. Mermaid diagrams are no longer required.

### 4.3 Driving iterations

Use `run:step` for single iterations or `run:continue` for full loops:

```bash
$CLI run:step .a5c/runs/<runId> --json
$CLI run:continue .a5c/runs/<runId> --auto-node-tasks \
  --auto-node-max 5 \
  --runs-dir .a5c/runs
```

CLI output tells you the status (`waiting/completed/failed`), pending effects, and metadata. If it hits a breakpoint or needs manual input, use the `babysitter-breakpoint` skill; wait for release before continuing. When auto-running node tasks, the CLI logs each `effectId` and scheduler hints so you don’t need to script those paths yourself.

> **Quality gate:** compare the JSON payload to the structure documented in `docs/cli-examples.md` §3–§6 (`pending`, `autoRun.executed/pending`, `metadata.stateVersion/pendingEffectsByKind`). If a field is missing or renamed, stop and reconcile with the SDK team before proceeding; otherwise documentation and harnesses will drift.

### 4.4 Working with tasks

```bash
$CLI task:list .a5c/runs/<runId> --pending
$CLI task:show .a5c/runs/<runId> <effectId> --json
$CLI task:run .a5c/runs/<runId> <effectId> --dry-run
$CLI task:run .a5c/runs/<runId> <effectId> \
  --json --verbose \
  -- env BABYSITTER_ALLOW_SECRET_LOGS=true
```

Use these instead of manually inspecting `tasks/<effectId>`. Remember: raw payloads remain redacted unless `BABYSITTER_ALLOW_SECRET_LOGS` **and** `--json --verbose` are set. Verify the output includes `payloads: redacted…` whenever the guard is disabled; treat deviations as failures that must be investigated.

### 4.5 Journal utilities

```bash
$CLI run:events .a5c/runs/<runId> --limit 20
$CLI run:events .a5c/runs/<runId> --reverse --json > tmp/events.json
```

The CLI already writes events for actions, notes, artifacts, sleeps, etc.

---

## 5. Orchestration loop (CLI-first)

1. **Read process + state**  
   - `code/main.js`, imported recipes  
   - `state.json`, `inputs.json`, plus recent journal entries via `$CLI run:events …`
2. **Determine next action** from `code/main.js` and/or the CLI orchestration
   output (pending effects, task payloads, or explicit next-step notes).
3. **Execute the next action** directly in the repo, following the CLI
   instructions verbatim and updating artifacts as needed.
4. **Journal & state are auto-managed** by the CLI as long as you drive iterations with `run:step` / `run:continue`. Do not edit `journal.jsonl` or `state.json` directly.
5. **Breakpoints/sleep**: when CLI reports `Awaiting input`, use the `babysitter-breakpoint` skill to collect the missing information and wait for release. For sleeps, log start/end using CLI events; no manual timers.

Loop until `status` is `completed` or `failed`. Never edit `journal.jsonl` or `state.json` directly; use CLI commands or agent outputs that update them.

> **Iteration verification:** after every CLI loop, run `$CLI run:status .a5c/runs/<runId> --json` and confirm `stateVersion` increased (or stayed steady when waiting), pending counts match expectations, and metadata fields are present (for example `stateVersion`, `pendingEffectsByKind`, and `autoRun`). If not, pause and reconcile before issuing more actions.

---

## 6. Artifacts & documentation

- Store specs, summaries, and diagrams under `.a5c/runs/<runId>/artifacts/`. Reference them in CLI notes (e.g., `$CLI run:events … --note "uploaded part7_spec.md"` currently not supported; instead, add an `artifact` journal entry by running the documented helper script if needed, but prefer CLI notes once available).
- Provide an updated `process.md` for every `main.js` you craft (Mermaid diagrams have been retired, so no additional `.mermaid.md` artifact is needed).

---

## 7. Troubleshooting

| Issue | Resolution |
| --- | --- |
| CLI missing / npx fails | Verify Node/npm are on PATH and retry `npx -y @a5c-ai/babysitter-sdk --version` |
| CLI command fails (bad args) | Run `$CLI help` or `$CLI <command> --help` and fix flags |
| Need alternate runs dir | Pass `--runs-dir <path>` on every CLI invocation |
| Want JSON output | Append `--json` (many commands support it) |
| Need to view CLI env | `env | grep BABYSITTER` |

If a CLI command crashes mid-iteration, capture the stderr, add a note to the run, and re-run `run:step` once fixed.

---

## 8. Next-action execution

When `code/main.js` or the CLI orchestration indicates a next action, execute it
immediately and record outputs through the CLI-driven workflow. Avoid any
function-template or agent-runner indirection.

---

## 9. Common Mistakes to Avoid

### ❌ Mistakes That Break Orchestration

1. **Creating run directories manually**
   - Wrong: `mkdir -p .a5c/runs/<runId>/code`
   - Right: `$CLI run:create ...` (CLI creates directories)

2. **Editing files directly after approval**
   - Wrong: Get approval → immediately use Edit/Write tools
   - Right: Get approval → run `$CLI run:continue` → execute what it tells you

3. **Writing main.js but never running it**
   - Wrong: Create main.js → manually edit files based on what you planned
   - Right: Create main.js → use `run:create` → use `run:step`/`run:continue` to execute it

4. **Skipping journal/state management**
   - Wrong: Make changes without running CLI commands
   - Right: Every change flows through `run:step`/`run:continue` which updates journal

5. **Doing all work in one step**
   - Wrong: Get next action → complete entire task → mark done
   - Right: Follow iterative loop: `run:step` → execute one action → `run:step` → execute next action

### ✅ What You SHOULD Do

- Use CLI commands for all orchestration operations
- Execute only what the current step requires
- Record events and state changes through CLI
- Verify state after each step using `run:status`
- Follow the main.js process step-by-step

---

## 10. Quality Gate Checklist

### Before Making ANY File Changes

Ask yourself these questions. If ANY answer is "no", STOP and run the required CLI commands first.

- [ ] Have I run `run:create` (for new runs) or `run:status` (for existing runs)?
- [ ] Have I run `run:step` or `run:continue` to get the next action?
- [ ] Am I executing ONLY what the orchestration output tells me to do?
- [ ] Will my changes be recorded in journal.jsonl via the CLI?
- [ ] Am I following the process defined in main.js?

### Red Flags That Indicate You're Deviating

- You're using Edit/Write tools but haven't run a CLI orchestration command recently
- You're making multiple file changes without checking in with `run:step` between them
- You created a main.js but never executed it through the CLI
- You got approval from a breakpoint and immediately started editing files
- You manually created `.a5c/runs/<runId>/` directories

### Recovery Steps

If you realize you've deviated:

1. STOP making changes immediately
2. Run `$CLI run:status .a5c/runs/<runId>` to check current state
3. Run `$CLI run:events .a5c/runs/<runId> --reverse --limit 20` to see what was recorded
4. Continue properly with `$CLI run:continue` or `$CLI run:step`

---

## 11. Complete Workflow Example

### Scenario: User asks to "improve the breakpoints UI"

```bash
CLI="npx -y @a5c-ai/babysitter-sdk"

# Step 1: Preflight check
$CLI --version

# Step 2: Explore codebase to understand task
# (Use Glob/Grep/Read tools to understand current UI structure)

# Step 3: Create main.js and process.md with implementation plan
# (Create these files with the step-by-step process)

# Step 4: Request approval via breakpoint
# (Use babysitter-breakpoint skill)

# Step 5: After approval, initialize the run
$CLI run:create \
  --process-id ui-improvement \
  --entry .a5c/runs/run-20260118-example/code/main.js#improveBreakpointsUI \
  --inputs .a5c/runs/run-20260118-example/inputs.json \
  --run-id run-20260118-example

# Step 6: Drive orchestration (NOT manual edits!)
$CLI run:continue .a5c/runs/run-20260118-example --auto-node-tasks --auto-node-max 5

# Step 7: Execute what run:continue tells you
# Example output might say: "Next action: Edit styles.css to add responsive breakpoints"
# NOW you use Edit tool to make that specific change

# Step 8: Continue iteration
$CLI run:step .a5c/runs/run-20260118-example

# Step 9: Execute next action from step output
# Output might say: "Next action: Fix notification duplicate listeners in app.js"
# NOW you use Edit tool for that specific change

# Step 10: Continue until completed
$CLI run:status .a5c/runs/run-20260118-example
# Should show status: completed
```

**Key Point**: Notice how CLI commands drive the process, and Edit/Write tools are only used AFTER the CLI tells you what to do.

---

## 12. Original Example Session

```bash
CLI="npx -y @a5c-ai/babysitter-sdk"

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

# Resume after breakpoint release + feedback
$CLI run:continue .a5c/runs/run-20260114-101500-dev-project
```

Use this pattern anytime the user says “babysit this run” or “orchestrate via babysitter.” Keep the process deterministic by staying inside the CLI wherever it offers a command; only fall back to manual scripts when the CLI surface truly lacks a capability.
