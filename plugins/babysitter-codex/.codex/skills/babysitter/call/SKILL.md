---
name: babysitter:call
description: Start a babysitter orchestration run from Codex.
argument-hint: Specific instructions for the run
---

# babysitter:call

Start a babysitter run using the external supervisor and keep Codex aligned
with the current `.a5c` run state.

## Workflow

### 1. Interview and research

- Clarify the user goal, constraints, and definition of done
- Inspect the repo and process library before choosing or generating a process
- Prefer existing upstream babysit processes/skills when they already fit

### 2. Prepare process inputs

- Create or select the process entrypoint
- Write the run inputs file
- Ensure the babysitter SDK is available

### 3. Create the run

If a Codex session/thread ID is available, bind it at creation time:

```bash
babysitter run:create \
  --process-id <id> \
  --entry <path>#<export> \
  --inputs <inputs-file> \
  --prompt "<operator prompt>" \
  --harness codex \
  --session-id <codex-session-id> \
  --state-dir .a5c \
  --json
```

If no session ID is available, create the run without harness binding and let
the supervisor own resume behavior explicitly.

### 4. Run the orchestration loop

Use the external supervisor or wrapper to iterate the run:

```bash
babysitter run:iterate .a5c/runs/<runId> --json --iteration <n>
```

Supported runtime expectations:

- `agent` tasks are executed by Codex
- breakpoint handling is mediated by the supervisor or the user chat flow
- `notify` may observe turn completion but does not control continuation

### 5. Post results correctly

```bash
babysitter task:post .a5c/runs/<runId> <effectId> \
  --status ok \
  --value tasks/<effectId>/output.json \
  --json
```

Never write `result.json` directly.

### 6. Finish honestly

- Report the run status from `run:status`
- If a completion proof exists, relay it plainly
- Do not claim a hidden hook will re-enter Codex automatically
