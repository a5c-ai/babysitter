---
name: babysitter:resume
description: Resume an existing babysitter run from Codex.
argument-hint: "[recent|tag:<tag>|search:<query>|list|name <alias>|tag +/-<tag>|sessionId]"
---

# babysitter:resume

Resume an incomplete babysitter run without pretending Codex will auto-reenter
through a hidden stop hook.

## Workflow

### 1. Select the run

- Use the session index helpers when available
- Otherwise inspect `.a5c/runs/*` and choose the most recent incomplete run

### 2. Rebind or resume explicitly

If you have a stable Codex session/thread ID:

```bash
babysitter session:resume \
  --session-id <codex-session-id> \
  --state-dir .a5c \
  --run-id <runId> \
  --runs-dir .a5c/runs \
  --json
```

If you do not, resume the run operationally through the external supervisor and
report that the session binding is supervisor-managed.

### 3. Continue iterating

```bash
babysitter run:iterate .a5c/runs/<runId> --json --iteration <n>
```

Post task results with `task:post` and keep user approvals inside the explicit
supervisor/chat flow.

### 4. Close out

- Report the new run status
- If the run still needs user input, say so directly
- Do not claim Codex will continue automatically after yielding
