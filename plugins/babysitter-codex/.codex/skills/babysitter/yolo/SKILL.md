---
name: babysitter:yolo
description: Start babysitting in non-interactive mode — no user interaction or breakpoints, fully autonomous execution.
argument-hint: Specific instructions for the run
---

# babysitter:yolo

Identical to `/babysitter:call` but runs in **non-interactive mode**:

- **Skip the interview phase** — parse intent directly from the user's prompt
- **Auto-approve all breakpoints** — never pause for human approval
- **No user questions** — proceed autonomously through the entire orchestration loop

## Workflow

1. Parse the initial prompt to extract intent, scope, and requirements
2. Research the repo structure to understand the codebase
3. Search the process library for relevant specializations/methodologies
4. Create the process .js file and inputs
5. Create the run:

```bash
babysitter run:create \
  --process-id <id> \
  --entry <path>#<export> \
  --inputs <inputs-file> \
  --prompt "$PROMPT" \
  --harness codex \
  --session-id "${CODEX_THREAD_ID:-$CODEX_SESSION_ID}" \
  --plugin-root "$CODEX_PLUGIN_ROOT" \
  --json
```

6. Iterate until completion — auto-resolve all breakpoints:

```bash
babysitter run:iterate .a5c/runs/<runId> --json --iteration <n>
```

For breakpoint effects, immediately post approval:
```bash
echo '{"approved":true,"response":"Auto-approved (yolo mode)"}' > tasks/<effectId>/output.json
babysitter task:post .a5c/runs/<runId> <effectId> --status ok --value tasks/<effectId>/output.json --json
```

7. When `completionProof` is emitted, return it wrapped in `<promise>PROOF</promise>`

## Key Difference from /babysitter:call

The ONLY difference is that breakpoints are auto-approved and no user questions are asked. The orchestration loop, effect handling, and result posting are identical.
