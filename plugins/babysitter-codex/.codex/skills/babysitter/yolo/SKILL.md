---
name: babysitter:yolo
description: Start babysitting in non-interactive mode - no user interaction or breakpoints, fully autonomous execution.
argument-hint: Specific instructions for the run
---

# babysitter:yolo

Identical to `babysitter call` but runs in non-interactive mode:

- Skip the interview phase - parse intent directly from the user's prompt
- Auto-approve all breakpoints - never pause for human approval
- No user questions - proceed autonomously through the orchestration loop

## Workflow

1. Parse the initial prompt to extract intent, scope, and requirements
2. Research the repo structure to understand the codebase
3. Search the process library for relevant specializations and methodologies
4. Create the process `.js` file and inputs
5. Create the run:

```bash
babysitter-codex-turn start \
  --process-id <id> \
  --entry <path>#<export> \
  --inputs <inputs-file> \
  --prompt "$PROMPT"
```

6. Advance the run with auto-approved breakpoints:

```bash
babysitter-codex-turn continue --auto-approve
```

Repeat per Codex turn until the helper reports either `execute_tasks` or a
terminal run state. Codex still executes the returned tasks itself; yolo only
removes human breakpoint approvals.

7. When `completionProof` is emitted, report it plainly

## Key Difference from `babysitter call`

The only difference is that breakpoints are auto-approved and no user questions
are asked. The turn-state control model and result posting stay the same.
