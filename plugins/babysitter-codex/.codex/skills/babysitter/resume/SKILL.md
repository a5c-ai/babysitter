---
name: babysitter:resume
description: Resume an existing babysitter run from Codex.
argument-hint: "[recent|tag:<tag>|search:<query>|list|name <alias>|tag +/-<tag>|sessionId]"
---

# babysitter:resume

Resume an incomplete babysitter run with Codex re-entering through the
workspace hook model on the next turn.

## Workflow

### 1. Select the run

- Use the session index helpers when available
- Otherwise inspect `.a5c/runs/*` and choose the most recent incomplete run

### 2. Resume from persisted run state

- Resolve the target run directory or selector
- Check `babysitter run:status <runDir> --json`
- Continue by handling pending tasks and posting outputs
- After each yield, let `Stop` drive re-entry on the next Codex turn

### 3. Close out

- Report the new run status
- If the run still needs user input, say so directly
- Do not claim Codex will continue automatically without hook registration
