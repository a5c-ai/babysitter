---
name: babysitter:resume
description: Resume an existing babysitter run from Codex.
argument-hint: "[recent|tag:<tag>|search:<query>|list|name <alias>|tag +/-<tag>|sessionId]"
---

# babysitter:resume

Resume an incomplete babysitter run with Codex explicitly re-entering the
stateful loop on the next user turn.

## Workflow

### 1. Select the run

- Use the session index helpers when available
- Otherwise inspect `.a5c/runs/*` and choose the most recent incomplete run

### 2. Resume explicitly from persisted turn state

Inspect the current run or selector:

```bash
babysitter-codex-turn status <selector>
```

Then advance the run:

```bash
babysitter-codex-turn continue <selector>
```

If the prior turn stopped on a breakpoint, post the user response explicitly
with `babysitter-codex-turn approve`, then continue again on the next turn.

### 3. Close out

- Report the new run status
- If the run still needs user input, say so directly
- Do not claim Codex will continue automatically after yielding
