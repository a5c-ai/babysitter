# Agent Instructions — Babysitter Orchestration Plugin for Codex CLI

This file governs the behavior of the Codex agent when operating with the babysitter
orchestration plugin. It supports **slash commands** for all babysitter operations.

---

## 0. Slash Command Recognition

**IMPORTANT**: When the user types a message starting with `/babysitter:` or `/babysitter`,
this is a **slash command**. You MUST:

1. Parse the command: extract the command name and arguments
2. Load the corresponding SKILL.md from `.codex/skills/babysitter/<command>/SKILL.md`
3. Follow the instructions in the SKILL.md to execute the command

### Available Commands

| Command | Description |
|---------|-------------|
| `/babysitter:call` | Start an orchestration run (interactive) |
| `/babysitter:yolo` | Start a run (non-interactive, no breakpoints) |
| `/babysitter:resume` | Resume an existing run |
| `/babysitter:plan` | Plan a workflow without executing |
| `/babysitter:forever` | Start a never-ending periodic run |
| `/babysitter:doctor` | Diagnose run health (10 checks) |
| `/babysitter:observe` | Launch observer dashboard |
| `/babysitter:help` | Help and documentation |
| `/babysitter:project-install` | Onboard a project |
| `/babysitter:user-install` | Set up user profile |
| `/babysitter:assimilate` | Assimilate external methodology |

### Aliases

- `/babysitter` = `/babysitter:call`
- `/babysitter:babysit` = `/babysitter:call`

### Command Resolution

Use the skill-loader module to resolve commands:
```javascript
const { resolveCommand, getSkillContent } = require('./.codex/skill-loader');
const cmd = resolveCommand(userInput);
if (cmd) {
  const instructions = getSkillContent(cmd.command);
  // Follow the instructions
}
```

### Plugin System

The plugin manifest at `.codex/plugin.json` registers all commands, hooks, and skills.
The SessionStart hook initializes the babysitter session.
The Stop hook drives the orchestration loop (prevents premature exit during active runs).

---

## 1. Session Start — Context Check

On every session start, before taking any other action:

1. Check if the user input is a `/babysitter:*` slash command. If so, dispatch it.
2. Check for an active babysitter run context by inspecting the `.a5c/` directory:
   - Look for a current run manifest at `.a5c/runs/<RUN_ID>/manifest.json`.
   - Look for pending task definitions under `.a5c/runs/<RUN_ID>/tasks/`.
   - A task is **pending** if it has no `output.json` file yet.
3. If a run context is found, load the task queue and resume from the first pending task.
4. If no run context is found, proceed with normal session behavior.

> The stop-hook controls iteration flow. Do NOT loop independently —
> complete one task, emit results, then the hook triggers the next iteration.

---

## 2. Executing Pending Task Effects

For each pending task loaded from the run context:

1. Read the task definition file: `.a5c/runs/<RUN_ID>/tasks/<TASK_ID>/task.json`
2. Identify the `effectType` and `payload` fields in the task definition.
3. Dispatch the effect using the appropriate tool:

| effectType           | Tool / Action                                                        |
|----------------------|----------------------------------------------------------------------|
| `agent`              | Build a prompt from the agent definition and run via Codex exec      |
| `node`               | Execute the specified Node.js script                                 |
| `shell`              | Execute the command via the shell tool                               |
| `breakpoint`         | Pause and wait for user input (handled by runtime)                   |
| `sleep`              | Wait for the specified duration (handled by runtime)                 |
| `skill`              | Invoke a named skill with parameters via Codex exec                  |
| `hook`               | Invoke a named lifecycle hook handler (see Section 8)                |
| `parallel`           | Execute multiple sub-effects concurrently and collect all results    |
| `orchestrator_task`  | Dispatch a sub-task to a nested orchestrator instance                |

4. Capture all outputs (stdout, stderr, return codes, file contents) for use in the result.

---

## 3. Structuring Task Output

After completing each task effect, write the result to:

```
.a5c/runs/<RUN_ID>/tasks/<TASK_ID>/output.json
```

The output **must** be a valid JSON object conforming to the task's `outputSchema`. General
structure:

```json
{
  "success": true,
  "taskId": "<TASK_ID>",
  "completedAt": "<ISO-8601 timestamp>",
  "result": { /* task-specific fields matching outputSchema */ }
}
```

Rules:
- Every field declared in `outputSchema` must be present.
- Do not include fields not declared in `outputSchema` inside `result`.
- Top-level envelope fields (`success`, `taskId`, `completedAt`) are always required.

---

## 4. Error Handling

If a task effect fails (non-zero exit code, exception, file not found, etc.):

1. Do NOT retry automatically unless the task definition specifies `"retryable": true`.
2. Write a structured error result to `output.json`:

```json
{
  "success": false,
  "taskId": "<TASK_ID>",
  "completedAt": "<ISO-8601 timestamp>",
  "error": {
    "code": "<SHORT_ERROR_CODE>",
    "message": "<human-readable description>",
    "detail": "<stack trace, stderr, or other diagnostic text>",
    "effectType": "<the effectType that failed>"
  }
}
```

3. Do not abort the entire run — write the error output and let the wrapper decide whether
   to continue or halt based on the task's `onError` policy.

---

## 5. Quality Gate — Self-Assessment Before Returning Results

Before writing `output.json` for any task, perform a self-assessment:

- [ ] All required `outputSchema` fields are populated with correct types.
- [ ] Shell commands exited with expected codes (task may specify `expectedExitCode`).
- [ ] File writes were verified readable after writing.
- [ ] No sensitive data (secrets, tokens, credentials) was captured in outputs.
- [ ] The result accurately reflects what was executed, not what was intended.

If any check fails, attempt to remediate. If remediation is not possible, report the failure
via the error format in Section 4 rather than returning a passing-but-incorrect result.

---

## 6. Wrapper Loop Coordination

The **wrapper script** (not this agent) controls the iteration loop:

- The wrapper invokes the agent once per task (or once per batch, as configured).
- After the agent writes `output.json`, the wrapper reads it and decides the next action.
- The agent must **not** re-invoke itself, spawn sub-agents, or poll for new tasks.
- Signal task completion by writing `output.json` and exiting cleanly.
- After writing `output.json`, post the result to the babysitter via the SDK CLI:
  ```bash
  npx -y @a5c-ai/babysitter-sdk@0.0.173 task:post <runDir> <effectId> --status ok --value <outputPath> --json
  ```
- For error results, use `--status error --error <errorPath>` instead.

Communication contract:

| Agent writes              | Wrapper reads             | CLI command                |
|---------------------------|---------------------------|----------------------------|
| `output.json` (success)   | Advances to next task     | `task:post --status ok`    |
| `output.json` (failure)   | Applies `onError` policy  | `task:post --status error` |
| No `output.json`          | Wrapper times out / retries | (none)                   |

---

## 7. Directory Conventions

```
.a5c/
  runs/
    <RUN_ID>/
      manifest.json          # Run-level metadata (created by wrapper)
      tasks/
        <TASK_ID>/
          task.json          # Task definition (created by wrapper)
          output.json        # Task result    (created by this agent)
```

All paths above are relative to the repository root.

---

## 8. Hook Types

The SDK supports 13 lifecycle hook types that are invoked at specific points in the
orchestration flow. Hook handlers live under `.codex/hooks/<hook-name>/` and are executed
as shell scripts or Node.js scripts.

| Hook Name            | Trigger Point                                                       |
|----------------------|---------------------------------------------------------------------|
| `on-run-start`       | Fired once when a new run is created and about to begin             |
| `on-run-complete`    | Fired once when all tasks in a run finish successfully              |
| `on-run-fail`        | Fired once when a run terminates due to an unrecoverable error      |
| `on-task-start`      | Fired before each individual task effect is dispatched              |
| `on-task-complete`   | Fired after each task effect completes (success or handled failure) |
| `on-step-dispatch`   | Fired each time a single step (sub-unit of a task) is dispatched   |
| `on-iteration-start` | Fired at the start of every wrapper iteration loop                  |
| `on-iteration-end`   | Fired at the end of every wrapper iteration loop                    |
| `on-breakpoint`      | Fired when execution pauses at a `breakpoint` effect                |
| `pre-commit`         | Fired before any git commit is created during task execution        |
| `pre-branch`         | Fired before a new git branch is created during task execution      |
| `post-planning`      | Fired after the orchestrator finishes its planning phase            |
| `on-score`           | Fired when a scoring / evaluation result is produced                |

Hook payloads are passed as JSON via stdin. Hooks must exit with code `0` to allow
execution to continue; a non-zero exit code causes the run to fail with `on-run-fail`.

---

## 9. Profile System

Profiles store persistent per-user or per-project configuration that the SDK CLI can read,
write, merge, and render.

### Reading a profile

```bash
# Read user-level profile
npx -y @a5c-ai/babysitter-sdk@0.0.173 profile:read --user --json

# Read project-level profile (relative to repo root)
npx -y @a5c-ai/babysitter-sdk@0.0.173 profile:read --project --json
```

### Writing a profile

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 profile:write --user --json < profile-patch.json
npx -y @a5c-ai/babysitter-sdk@0.0.173 profile:write --project --json < profile-patch.json
```

### Merging profiles

Merge user and project profiles into a single resolved profile object:

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 profile:merge --json
```

### Rendering a profile

Render the active profile as human-readable text (useful for debugging):

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 profile:render
```

---

## 10. Skill Discovery

### Discovering local skills

```bash
# Discover skills under the default plugin root
npx -y @a5c-ai/babysitter-sdk@0.0.173 skill:discover --json

# Discover skills under a custom plugin root directory
npx -y @a5c-ai/babysitter-sdk@0.0.173 skill:discover --plugin-root ./my-plugins --json
```

`skill:discover` scans the plugin root for skill manifests and returns a JSON array of
available skill definitions including name, description, and parameter schema.

### Fetching a remote skill

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 skill:fetch-remote <skillUrl> --json
```

Downloads and registers a remotely hosted skill definition so it can be invoked locally.

---

## 11. Session Management

Session commands manage the lifecycle of agent sessions within a run.

### Associating a session with a run

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 session:associate --session-id <SESSION_ID> --state-dir .a5c --run-id <RUN_ID> --json
```

### Resuming a session

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 session:resume --session-id <SESSION_ID> --state-dir .a5c --run-id <RUN_ID> --json
```

### Checking iteration state

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 session:check-iteration --session-id <SESSION_ID> --state-dir .a5c --json
```

Returns whether the current iteration should continue or halt, based on run state.

### Posting an iteration message

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 session:iteration-message --iteration <N> --run-id <RUN_ID> --json
```

### Reading the last session message

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 session:last-message --transcript-path <path/to/transcript.jsonl> --json
```

### Updating session metadata

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 session:update --session-id <SESSION_ID> --state-dir .a5c --iteration <N> --last-iteration-at <ISO8601> --json
```

---

## 12. Health and Configuration

### Babysitter health check

```bash
# Basic health check
npx -y @a5c-ai/babysitter-sdk@0.0.173 babysitter health

# Verbose output (shows individual component status)
npx -y @a5c-ai/babysitter-sdk@0.0.173 babysitter health --verbose

# Machine-readable JSON output
npx -y @a5c-ai/babysitter-sdk@0.0.173 babysitter health --verbose --json
```

### Configuration commands

```bash
# Show the resolved active configuration
npx -y @a5c-ai/babysitter-sdk@0.0.173 configure show

# Validate the configuration for errors or missing required fields
npx -y @a5c-ai/babysitter-sdk@0.0.173 configure validate

# Show all configuration file paths that are being loaded
npx -y @a5c-ai/babysitter-sdk@0.0.173 configure paths
```

---

## 13. Run Commands

### Rebuilding run state from journal

If run state becomes inconsistent, rebuild it from the append-only journal:

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 run:rebuild-state --run-id <RUN_ID> --json
```

### Repairing a corrupted journal

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 run:repair-journal --run-id <RUN_ID> --json
```

Attempts to detect and remove corrupted entries from the run journal so the run can
continue.

### Executing tasks directly

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 run:execute-tasks --run-id <RUN_ID> --json
```

Forces immediate execution of all pending tasks in the specified run, bypassing normal
iteration scheduling.

---

## 14. Task Commands

### Inspecting a task

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 task:show <runDir> <effectId>
```

Displays the full task definition and current status for the given effect ID within the
specified run directory.

### Posting a task result (full format)

```bash
# Success
npx -y @a5c-ai/babysitter-sdk@0.0.173 task:post <runDir> <effectId> --status ok --value <file> --json

# Failure
npx -y @a5c-ai/babysitter-sdk@0.0.173 task:post <runDir> <effectId> --status error --error <file> --json
```

| Argument / Flag   | Description                                                        |
|-------------------|--------------------------------------------------------------------|
| `<runDir>`        | Path to the run directory, e.g. `.a5c/runs/01KJXM7MAC90ZTG885NDHJJSWB` |
| `<effectId>`      | The ULID of the task/effect being completed                        |
| `--status ok`     | Mark the task as successfully completed                            |
| `--status error`  | Mark the task as failed                                            |
| `--value <file>`  | Path to the `output.json` file (used with `--status ok`)           |
| `--error <file>`  | Path to the error JSON file (used with `--status error`)           |
| `--json`          | Emit the response as machine-readable JSON                         |
