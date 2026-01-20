#!/bin/bash
# Native Orchestrator - Decision-Making Only
#
# This hook DECIDES what effects to execute but does NOT execute them.
# It returns effect definitions as JSON for the CLI to emit and the
# orchestrator (skill) to perform.
#
# The hook analyzes run state and returns orchestration decisions:
# - Which tasks to execute
# - Which breakpoints need handling
# - What orchestration actions to take

set -euo pipefail

# Read iteration-start payload
PAYLOAD=$(cat)
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')
ITERATION=$(echo "$PAYLOAD" | jq -r '.iteration')
TIMESTAMP=$(echo "$PAYLOAD" | jq -r '.timestamp')

# Use local CLI if available, otherwise npx
if [ -f "packages/sdk/dist/cli/main.js" ]; then
  CLI=(node packages/sdk/dist/cli/main.js)
else
  CLI=(npx -y @a5c-ai/babysitter-sdk)
fi

echo "[native-orchestrator] Analyzing run state for iteration $ITERATION" >&2

# Get run status (pass run ID, let CLI resolve path)
RUN_STATUS=$("${CLI[@]}" run:status "$RUN_ID" --json 2>/dev/null || echo '{}')
STATE=$(echo "$RUN_STATUS" | jq -r '.state // "unknown"')

# If run is in terminal state, no effects to emit
if [ "$STATE" = "completed" ] || [ "$STATE" = "failed" ]; then
  echo "[native-orchestrator] Run in terminal state: $STATE" >&2
  echo '{"action":"none","reason":"terminal-state","status":"'$STATE'"}'
  exit 0
fi

# Get pending tasks using task:list
PENDING_TASKS=$("${CLI[@]}" task:list "$RUN_ID" --pending --json 2>/dev/null || echo '{"tasks":[]}')
PENDING_EFFECTS=$(echo "$PENDING_TASKS" | jq -r '.tasks // []')
PENDING_COUNT=$(echo "$PENDING_EFFECTS" | jq 'length')

echo "[native-orchestrator] Found $PENDING_COUNT pending effects" >&2

if [ "$PENDING_COUNT" -eq 0 ]; then
  echo "[native-orchestrator] No pending effects" >&2
  echo '{"action":"none","reason":"no-pending-effects"}'
  exit 0
fi

# Identify auto-runnable node tasks (up to 3)
AUTO_RUNNABLE_TASKS=$(echo "$PENDING_EFFECTS" | jq -r '[.[] | select(.kind == "node")] | .[0:3]')
TASK_COUNT=$(echo "$AUTO_RUNNABLE_TASKS" | jq 'length')

if [ "$TASK_COUNT" -gt 0 ]; then
  echo "[native-orchestrator] Executing $TASK_COUNT node task(s)" >&2

  # Execute tasks directly in the hook
  EXECUTED_TASKS=()
  FAILED_TASKS=()

  echo "$AUTO_RUNNABLE_TASKS" | jq -c '.[]' | while read -r task; do
    EFFECT_ID=$(echo "$task" | jq -r '.effectId')
    LABEL=$(echo "$task" | jq -r '.label // "unknown"')

    echo "[native-orchestrator]   Executing: $EFFECT_ID ($LABEL)" >&2

    if "${CLI[@]}" task:run "$RUN_ID" "$EFFECT_ID" 2>&1 >&2; then
      EXECUTED_TASKS+=("$EFFECT_ID")
      echo "[native-orchestrator]   ✓ Success: $EFFECT_ID" >&2
    else
      FAILED_TASKS+=("$EFFECT_ID")
      echo "[native-orchestrator]   ✗ Failed: $EFFECT_ID" >&2
    fi
  done

  # Return execution results
  cat <<EOF
{
  "action": "executed-tasks",
  "count": $TASK_COUNT,
  "reason": "auto-runnable-tasks"
}
EOF
  exit 0
fi

# Check for breakpoints
BREAKPOINTS=$(echo "$PENDING_EFFECTS" | jq '[.[] | select(.kind == "breakpoint")]')
BREAKPOINT_COUNT=$(echo "$BREAKPOINTS" | jq 'length')

if [ "$BREAKPOINT_COUNT" -gt 0 ]; then
  echo "[native-orchestrator] Found breakpoint(s) requiring user input - pausing orchestration" >&2

  cat <<EOF
{
  "action": "waiting",
  "reason": "breakpoint-waiting",
  "count": $BREAKPOINT_COUNT
}
EOF
  exit 0
fi

# Check for sleep effects
SLEEPS=$(echo "$PENDING_EFFECTS" | jq '[.[] | select(.kind == "sleep")]')
SLEEP_COUNT=$(echo "$SLEEPS" | jq 'length')

if [ "$SLEEP_COUNT" -gt 0 ]; then
  SLEEP_UNTIL=$(echo "$SLEEPS" | jq -r '.[0].schedulerHints.sleepUntilEpochMs // "unknown"')
  echo "[native-orchestrator] Found sleep effect until: $SLEEP_UNTIL" >&2

  cat <<EOF
{
  "action": "waiting",
  "reason": "sleep-waiting",
  "until": $SLEEP_UNTIL
}
EOF
  exit 0
fi

# Unknown effect type
FIRST_EFFECT=$(echo "$PENDING_EFFECTS" | jq '.[0]')
EFFECT_KIND=$(echo "$FIRST_EFFECT" | jq -r '.kind // "unknown"')

echo "[native-orchestrator] Unknown effect kind: $EFFECT_KIND" >&2
echo '{"action":"none","reason":"unknown-effect-kind","kind":"'$EFFECT_KIND'"}'

exit 0
