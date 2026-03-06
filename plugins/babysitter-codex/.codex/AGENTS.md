# Project-Scoped Agent Instructions — Codex v0.107.0

These instructions supplement the root-level `AGENTS.md` with project-specific conventions
for SDK CLI usage, directory structure, and task result formatting.

---

## 1. SDK CLI Usage Reference

The following babysitter SDK CLI commands are available in this environment:

### Posting a task result

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 task:post <runDir> <effectId> --status ok --value <outputPath> --json
```

### Posting a task error

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 task:post <runDir> <effectId> --status error --error <errorPath> --json
```

### Showing a task definition

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 task:show <runDir> <effectId>
```

### Listing tasks for a run

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 task:list <runDir> --json
```

### Checking run status

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 run:status <runDir> --json
```

### Creating a run

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 run:create --json --process-id <PROCESS_ID>
```

### Iterating a run

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 run:iterate <runDir> --json --iteration <N>
```

### Rebuilding run state

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 run:rebuild-state <runDir> --json
```

### Repairing a run journal

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 run:repair-journal <runDir> --json
```

### Executing pending tasks directly

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 run:execute-tasks <runDir> --json
```

### Initializing a session

```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 session:init --session-id <SESSION_ID> --state-dir .a5c --json
```

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

### Profile commands

```bash
# Read user or project profile
npx -y @a5c-ai/babysitter-sdk@0.0.173 profile:read --user --json
npx -y @a5c-ai/babysitter-sdk@0.0.173 profile:read --project --json

# Write profile
npx -y @a5c-ai/babysitter-sdk@0.0.173 profile:write --user --json < profile-patch.json

# Merge user + project profiles
npx -y @a5c-ai/babysitter-sdk@0.0.173 profile:merge --json

# Render active profile as human-readable text
npx -y @a5c-ai/babysitter-sdk@0.0.173 profile:render
```

### Skill discovery commands

```bash
# Discover skills under the default or custom plugin root
npx -y @a5c-ai/babysitter-sdk@0.0.173 skill:discover --json
npx -y @a5c-ai/babysitter-sdk@0.0.173 skill:discover --plugin-root ./my-plugins --json

# Fetch a remotely hosted skill
npx -y @a5c-ai/babysitter-sdk@0.0.173 skill:fetch-remote <skillUrl> --json
```

### Health and configuration commands

```bash
# Health check
npx -y @a5c-ai/babysitter-sdk@0.0.173 babysitter health
npx -y @a5c-ai/babysitter-sdk@0.0.173 babysitter health --verbose --json

# Configuration inspection
npx -y @a5c-ai/babysitter-sdk@0.0.173 configure show
npx -y @a5c-ai/babysitter-sdk@0.0.173 configure validate
npx -y @a5c-ai/babysitter-sdk@0.0.173 configure paths
```

### Checking agent/SDK version

```bash
codex --version
```

### Environment variables honored by the CLI

| Variable                  | Purpose                                              |
|---------------------------|------------------------------------------------------|
| `CODEX_RUN_ID`            | Active run ID (set by wrapper automatically)         |
| `CODEX_TASK_ID`           | Active task ID (set by wrapper automatically)        |
| `CODEX_ROOT`              | Repo root override (defaults to `$PWD`)              |
| `CODEX_OUTPUT_DIR`        | Override for output directory (rarely needed)        |
| `CODEX_LOG_LEVEL`         | Logging verbosity: `debug`, `info`, `warn`, `error`  |

---

## 2. `.a5c/` Directory Structure Conventions

The `.a5c/` directory is the babysitter orchestration state directory. Follow these rules:

### Do
- Read task definitions from `.a5c/runs/<RUN_ID>/tasks/<TASK_ID>/task.json`.
- Write results to `.a5c/runs/<RUN_ID>/tasks/<TASK_ID>/output.json`.
- Use `.a5c/runs/<RUN_ID>/manifest.json` as a read-only reference for run configuration.

### Do Not
- Modify `manifest.json` — it is owned by the wrapper.
- Delete any file under `.a5c/` — the wrapper uses these for audit and retry logic.
- Create files under `.a5c/` other than `output.json` in the designated task directory.

### Typical `.a5c/` layout

```
.a5c/
  runs/
    01KJXAQWD61XZ5Y3HR38AK5ANV/
      manifest.json
      tasks/
        01KJXC5JM7S937H3TC4FASHWAP/
          task.json
          output.json          <- written by agent after completion
        01KJXC5JM7S937H3TC4FASHWAQ/
          task.json
          output.json
```

File names use **ULID** format for run IDs and task IDs (26-character sortable identifiers).

---

## 3. Project Module Structure

The `.codex/` directory contains the SDK runtime modules for this project:

```
.codex/
  AGENTS.md                  # This file — project-scoped agent instructions
  config.toml                # Project-level SDK configuration
  orchestrate.js             # Main orchestration entry point; drives the run loop
  effect-mapper.js           # Maps effectType strings to handler functions
  hook-dispatcher.js         # Invokes lifecycle hooks from .codex/hooks/<name>/
  profile-manager.js         # Reads, writes, merges, and renders user/project profiles
  discovery.js               # Skill discovery and remote skill fetching
  session-manager.js         # Session lifecycle: associate, resume, check-iteration, update
  health-check.js            # Babysitter health probe and configuration validation
  iteration-guard.js         # Enforces max-iteration limits and loop-control policy
  result-poster.js           # Posts task results via task:post SDK command
  hooks/
    on-run-start/            # Hook handler: fired when a run begins
    on-run-complete/         # Hook handler: fired when a run ends successfully
    on-run-fail/             # Hook handler: fired on unrecoverable run failure
    on-task-start/           # Hook handler: fired before each task is dispatched
    on-task-complete/        # Hook handler: fired after each task completes
    on-step-dispatch/        # Hook handler: fired for each dispatched step
    on-iteration-start/      # Hook handler: fired at the start of each iteration
    on-iteration-end/        # Hook handler: fired at the end of each iteration
    on-breakpoint/           # Hook handler: fired when a breakpoint effect is reached
    pre-commit/              # Hook handler: fired before git commits
    pre-branch/              # Hook handler: fired before git branch creation
    post-planning/           # Hook handler: fired after the planning phase
    on-score/                # Hook handler: fired when a scoring result is produced
    on-turn-complete.js      # Shared utility invoked at end of each agent turn
    loop-control.sh          # Shell helper that signals the wrapper to continue or stop
    build-task-payload.js    # Builds the structured JSON payload for a task dispatch
    iteration-guard.js       # Per-hook iteration limit enforcement helper
    read-json.js             # Reads and parses a JSON file from disk
    write-json.js            # Serializes and writes a JSON object to disk
    session-init.js          # Initializes a new session at hook invocation time
    utils.js                 # Shared utility functions for all hook scripts
```

### Module descriptions

| Module                | Responsibility                                                              |
|-----------------------|-----------------------------------------------------------------------------|
| `orchestrate.js`      | Top-level run loop; reads manifest, dispatches tasks, handles iteration     |
| `effect-mapper.js`    | Resolves an `effectType` string to the correct handler module               |
| `hook-dispatcher.js`  | Discovers and executes lifecycle hook scripts for a given hook name         |
| `profile-manager.js`  | CRUD operations on user and project profiles; merge and render support      |
| `discovery.js`        | Scans plugin roots for skill manifests; fetches remote skill definitions    |
| `session-manager.js`  | Manages session association, resumption, iteration checks, and updates      |
| `health-check.js`     | Probes babysitter process health and validates SDK configuration            |
| `iteration-guard.js`  | Reads and enforces the configured maximum iteration count per run           |
| `result-poster.js`    | Serializes `output.json` and invokes `task:post` to notify the babysitter   |

---

## 4. Task Result Posting Format

Every `output.json` written by this agent must follow this envelope:

```json
{
  "success": true | false,
  "taskId": "<TASK_ID>",
  "completedAt": "<ISO-8601 datetime with timezone, e.g. 2026-03-04T12:00:00Z>",
  "result": { }
}
```

The `result` object must match the `outputSchema` declared in `task.json`. Common schemas:

### File creation result

```json
{
  "success": true,
  "taskId": "01KJXC5JM7S937H3TC4FASHWAP",
  "completedAt": "2026-03-04T12:00:00Z",
  "result": {
    "filesCreated": ["path/to/file1", "path/to/file2"],
    "agentsMdPath": "/absolute/path/to/AGENTS.md"
  }
}
```

### Shell command result

```json
{
  "success": true,
  "taskId": "01KJXC5JM7S937H3TC4FASHWAP",
  "completedAt": "2026-03-04T12:00:00Z",
  "result": {
    "exitCode": 0,
    "stdout": "...",
    "stderr": ""
  }
}
```

### Error result

```json
{
  "success": false,
  "taskId": "01KJXC5JM7S937H3TC4FASHWAP",
  "completedAt": "2026-03-04T12:00:00Z",
  "error": {
    "code": "SHELL_NONZERO_EXIT",
    "message": "Command exited with code 1",
    "detail": "stderr output here",
    "effectType": "shell"
  }
}
```

---

## 5. Notes on This Project

- Repository root: `/data/repos`
- Node modules are present (`node_modules/`, `package.json`); npm scripts may be available.
- The `projects/` subdirectory may contain sub-projects with their own conventions.
- The `test/` directory contains integration and unit tests (`harness.test.js`, `integration.test.js`).
- Always operate from the repository root unless a task explicitly specifies a working directory.
