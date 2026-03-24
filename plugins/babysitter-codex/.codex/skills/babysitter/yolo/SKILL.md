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
babysitter run:create \
  --process-id <id> \
  --entry <path>#<export> \
  --inputs <inputs-file> \
  --prompt "$PROMPT" \
  --harness codex \
  --state-dir .a5c \
  --json
```

6. Continue by handling returned tasks and auto-approving breakpoints

The hook model remains active:

- `SessionStart` initializes state
- `Stop` decides continuation
- yolo only removes human approval pauses

7. When `completionProof` is emitted, report it plainly

## Key Difference from `babysitter call`

The only difference is that breakpoints are auto-approved and no user questions
are asked. The hook-owned continuation and result posting contract stay the
same.
