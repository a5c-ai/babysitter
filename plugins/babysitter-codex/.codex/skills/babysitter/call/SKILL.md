---
name: babysitter:call
description: Start a babysitter orchestration run from Codex.
argument-hint: Specific instructions for the run
---

# babysitter:call

Start a babysitter run with Codex itself owning the chat-turn orchestration
loop, using the packaged turn-state helper to persist `.a5c` state between
turns.

## Workflow

### 1. Interview and research

- Clarify the user goal, constraints, and definition of done
- Inspect the repo and process library before choosing or generating a process
- Prefer existing upstream babysit processes and skills when they already fit

### 2. Prepare process inputs

- Create or select the process entrypoint
- Write the run inputs file
- Ensure the babysitter SDK is available

### 3. Create the run

If a Codex session or thread ID is available, bind it honestly at creation
time:

```bash
babysitter-codex-turn start \
  --process-id <id> \
  --entry <path>#<export> \
  --inputs <inputs-file> \
  --prompt "<operator prompt>"
```

The helper binds `--harness codex --session-id ... --state-dir .a5c` only when
a real session or thread ID exists. It must never fabricate one.

### 4. Advance exactly one Codex turn at a time

Advance the run through the packaged turn helper:

```bash
babysitter-codex-turn continue
```

Interpret the returned `action`:

- `execute_tasks`: Codex should execute the returned task(s) in this turn
- `yield_to_user`: ask the user the returned breakpoint questions, then stop
- `run_completed`: report completion honestly
- `run_failed`: report the failure honestly

Codex should stay in the loop by explicit stateful continuation across turns,
not by handing control to `.codex/orchestrate.js` or any hidden stop hook.

### 5. Post results correctly

```bash
babysitter-codex-turn post \
  --effect-id <effectId> \
  --value-file tasks/<effectId>/output.json
```

Never write `result.json` directly.

For breakpoint answers on a later turn:

```bash
babysitter-codex-turn approve \
  --effect-id <effectId> \
  --approved true \
  --response "<user response>" \
  --answers-file <answers.json>
```

### 6. Finish honestly

- Report the run status from `run:status`
- If a completion proof exists, relay it plainly
- Do not claim a hidden hook or wrapper will re-enter Codex automatically
- If `babysitter-codex-turn` is not on PATH, use the installed skill copy at
  `~/.codex/skills/babysitter-codex/.codex/turn-controller.js`
