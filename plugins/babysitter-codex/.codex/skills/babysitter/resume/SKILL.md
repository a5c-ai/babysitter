---
name: babysitter:resume
description: Resume orchestrating an existing babysitter run.
argument-hint: "[run-id] Optional run ID to resume. If omitted, discovers incomplete runs."
---

# babysitter:resume

Resume an existing babysitter orchestration run that was paused, interrupted, or left incomplete.

## Workflow

### 1. Find the Run

If a run ID is provided as argument, use it directly.

If no run ID is provided, discover incomplete runs:
```bash
babysitter run:status --runs-dir .a5c/runs --json
```
Look for runs with `status: "waiting"` or `status: "executed"` (not completed/failed). Suggest the most recent incomplete run.

### 2. Resume the Session

```bash
babysitter session:resume \
  --session-id "$CODEX_SESSION_ID" \
  --state-dir "$CODEX_PLUGIN_ROOT/skills/babysitter/state" \
  --run-id <runId> \
  --runs-dir .a5c/runs \
  --json
```

### 3. Continue the Iteration Loop

Resume iterating from the current state:
```bash
babysitter run:iterate .a5c/runs/<runId> --json --iteration <n> --plugin-root "$CODEX_PLUGIN_ROOT"
```

Handle pending effects as in `/babysitter:call`:
- Execute agent/node/shell/skill tasks
- Handle breakpoints (interactive or auto-approve)
- Post results via `task:post`

### 4. Completion

When `completionProof` is emitted, return it wrapped in `<promise>PROOF</promise>`.
