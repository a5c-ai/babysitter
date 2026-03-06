---
name: babysitter:call
description: Start a babysitter orchestration run. Use this command to start babysitting a complex workflow.
argument-hint: Specific instructions for the run
---

# babysitter:call

Orchestrate `.a5c/runs/<runId>/` through iterative execution. Use the babysitter SDK CLI to drive the orchestration loop inside Codex CLI.

## Dependencies

Ensure babysitter CLI is available:
```bash
npx -y @a5c-ai/babysitter-sdk@0.0.173 version --json
```

## Workflow

### 1. Interview Phase (Interactive)

Gather user intent, requirements, goals, and scope. Research the repo structure, search the process library for relevant specializations and methodologies.

### 2. Process Creation

Create the process .js file with task definitions. Install `@a5c-ai/babysitter-sdk` in `.a5c/package.json` if not present.

### 3. Create Run

```bash
babysitter run:create \
  --process-id <id> \
  --entry <path>#<export> \
  --inputs <inputs-file> \
  --prompt "$PROMPT" \
  --harness codex \
  --session-id "$CODEX_SESSION_ID" \
  --plugin-root "$CODEX_PLUGIN_ROOT" \
  --json
```

### 4. Iteration Loop

```bash
babysitter run:iterate .a5c/runs/<runId> --json --iteration <n> --plugin-root "$CODEX_PLUGIN_ROOT"
```

For each pending task:
- **agent** — Build prompt from role/task/instructions, execute via Codex tools
- **node** — Execute Node.js script via shell
- **shell** — Run shell command directly
- **breakpoint** — Pause for user approval (interactive) or auto-resolve (yolo)
- **sleep** — Wait until timestamp
- **skill** — Load and follow SKILL.md instructions
- **hook** — Fire named lifecycle hook
- **parallel** — Execute sub-effects concurrently
- **orchestrator_task** — Delegate sub-orchestration

### 5. Post Results

Write result value to a separate file, then post via CLI:
```bash
babysitter task:post .a5c/runs/<runId> <effectId> \
  --status ok \
  --value tasks/<effectId>/output.json \
  --json
```

### 6. Check Completion

When `run:iterate` returns `status: "completed"` with a `completionProof`, the run is done. Return the proof wrapped in `<promise>PROOF</promise>` to signal completion.

## Profile Integration

Read user profile for personalization:
```bash
babysitter profile:read --user --json
babysitter profile:read --project --json
```

## Quick Reference

| Command | Description |
|---------|-------------|
| `run:create` | Create and bind a new run |
| `run:iterate` | Get next pending tasks |
| `run:status` | Check run state |
| `task:list --pending` | List pending effects |
| `task:post` | Post task result |
| `session:resume` | Resume existing session |
| `skill:discover` | Find available skills/agents |
| `health --json` | SDK health check |
