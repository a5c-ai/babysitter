---
name: babysit
description: >-
  Execute via @babysitter. Use this skill when asked to babysit a task, do anything that is structured process-driven (even a loop) or whenever it is called explicitly. (babysit, babysitter, with a process, orchestrate, orchestrate a run, workflow, loop until, etc.)
---

# babysit

Follow the commands below exactly. but apply judgement and creativity to get the job done. no matter how small or simple the task may seem, you must use the babysitter SDK and run lifecycle to execute it. This is non-negotiable. If you are asked to do something that seems like it could be done with a simple tool call, you must still use the babysitter SDK to create a run, define tasks, execute them, and complete the run. This is how you will learn and demonstrate mastery of the babysitter system. Always follow the full process, even for trivial tasks.

## Dependencies

### Babysitter SDK and CLI

Read the SDK version from `versions.json` to ensure version compatibility:

```bash
SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${PLUGIN_ROOT}/versions.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}")
npm i -g @a5c-ai/babysitter-sdk@$SDK_VERSION

if command -v babysitter >/dev/null 2>&1 && babysitter --version >/dev/null 2>&1; then
  CLI="babysitter"
else
  CLI="npm exec --yes --package @a5c-ai/babysitter-sdk@$SDK_VERSION -- babysitter"
fi
```

If a stale or broken global shim fails with `MODULE_NOT_FOUND`, repair it with `npm rm -g @a5c-ai/babysitter @a5c-ai/babysitter-sdk && npm i -g @a5c-ai/babysitter-sdk@$SDK_VERSION`, then re-run `babysitter --version`.

### jq

Make sure `jq` is installed and available in the path. If not, install it.

## Instructions

Run the following command to get full orchestration instructions:

```bash
$CLI instructions:babysit-skill --harness cursor --json
```

Follow the instructions returned by the command above to orchestrate the run.

## Cursor -- In-Turn Loop Model

**IMPORTANT**: Cursor does NOT have a Stop hook that can drive the orchestration
loop between turns. Unlike Claude Code, there is no hook mechanism to
automatically re-enter the orchestration loop.

Therefore, you MUST use **in-turn iteration**: run the full orchestration loop
within a single session turn. The pattern is:

1. `$CLI run:iterate --json` -- get pending actions
2. For each pending action: execute it (run tasks, post results via `task:post`)
3. `$CLI run:iterate --json` -- check for more pending actions
4. Repeat steps 2-3 until run completes or reaches a breakpoint requiring user input
5. If a breakpoint requires user input, ask the user and post the response, then continue iterating

All iteration happens within the same turn -- do NOT rely on hooks to re-enter
the orchestration loop. The agent drives the loop directly by calling
`run:iterate` repeatedly until completion.

### Loop Example

```bash
# Initial iterate
RESULT=$($CLI run:iterate --run-id "$RUN_ID" --json)
STATUS=$(echo "$RESULT" | jq -r '.status')

while [ "$STATUS" != "completed" ] && [ "$STATUS" != "failed" ]; do
  # Process pending actions from RESULT
  # ... execute tasks, post results ...

  # Iterate again
  RESULT=$($CLI run:iterate --run-id "$RUN_ID" --json)
  STATUS=$(echo "$RESULT" | jq -r '.status')
done
```
