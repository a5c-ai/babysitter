---
name: babysitter:resume
description: Resume orchestrating an existing babysitter run.
argument-hint: "[recent|tag:<tag>|search:<query>|list|name <alias>|tag +/-<tag>|sessionId]"
---

# babysitter:resume

Resume an existing babysitter orchestration run that was paused, interrupted, or left incomplete.

## Workflow

### 1. Find the Run

If a selector is provided, use the session index:
- `recent` -> most recently updated session
- `tag:<tag>` -> latest session tagged with `<tag>`
- `search:<query>` -> latest session matching alias/tag/session id
- `list` -> return indexed sessions
- `name <alias>` -> set alias on most recent session
- `tag +<tag>` / `tag -<tag>` -> add/remove tag on most recent session

If no selector is provided, default to `recent`.

For fallback/manual mode, discover incomplete runs:
```bash
babysitter run:status --runs-dir .a5c/runs --json
```
Look for runs with `status: "waiting"` or `status: "executed"` (not completed/failed). Suggest the most recent incomplete run.

### 2. Resume the Session

```bash
babysitter session:resume \
  --session-id "${CODEX_THREAD_ID:-$CODEX_SESSION_ID}" \
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
