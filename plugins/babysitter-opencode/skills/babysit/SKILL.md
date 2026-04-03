---
name: babysit
description: >-
  Orchestrate via @babysitter. Use this skill when asked to babysit a run,
  orchestrate a process or whenever it is called explicitly. (babysit,
  babysitter, orchestrate, orchestrate a run, workflow, etc.)
---

# babysit

Orchestrate `.a5c/runs/<runId>/` through iterative execution.

## Dependencies

### Babysitter SDK and CLI

Read the SDK version from `versions.json` to ensure version compatibility:

```bash
SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${PLUGIN_ROOT}/versions.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}")
```

Then ensure the CLI is installed:

```bash
sudo npm i -g @a5c-ai/babysitter-sdk@$SDK_VERSION
```

Use the CLI alias: `CLI="babysitter"`

**Alternatively:** `CLI="npx -y @a5c-ai/babysitter-sdk@$SDK_VERSION"`

### jq

make sure you have jq installed and available in the path. if not, install it.

## Instructions

Run the following command to get full orchestration instructions:

```bash
babysitter instructions:babysit-skill --harness opencode --json
```

Follow the instructions returned by the command above to orchestrate the run.

## OpenCode -- In-Turn Loop Model

**IMPORTANT**: OpenCode does NOT have a blocking stop hook that can drive the
orchestration loop between turns. The `session.idle` event is fire-and-forget,
unlike Claude Code's stop hook mechanism.

Therefore, you MUST use **in-turn iteration**: run the full orchestration loop
within a single session turn. The pattern is:

1. `babysitter run:iterate --json` -- get pending actions
2. For each pending action: execute it (run tasks, post results via `task:post`)
3. `babysitter run:iterate --json` -- check for more pending actions
4. Repeat steps 2-3 until run completes or reaches a breakpoint requiring user input
5. If a breakpoint requires user input, ask the user and post the response, then continue iterating

All iteration happens within the same turn -- do NOT rely on hooks to re-enter
the orchestration loop. The agent drives the loop directly by calling
`run:iterate` repeatedly until completion.

### Loop Example

```bash
# Initial iterate
RESULT=$(babysitter run:iterate --run-id "$RUN_ID" --json)
STATUS=$(echo "$RESULT" | jq -r '.status')

while [ "$STATUS" != "completed" ] && [ "$STATUS" != "failed" ]; do
  # Process pending actions from RESULT
  # ... execute tasks, post results ...

  # Iterate again
  RESULT=$(babysitter run:iterate --run-id "$RUN_ID" --json)
  STATUS=$(echo "$RESULT" | jq -r '.status')
done
```
