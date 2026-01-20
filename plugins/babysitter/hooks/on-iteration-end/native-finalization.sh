#!/bin/bash
# Native Finalization - Post-Iteration Cleanup and Status Updates
#
# This hook runs after each orchestration iteration to perform
# cleanup, status updates, and determine if more iterations are needed.

set -euo pipefail

# Read iteration-end payload
PAYLOAD=$(cat)
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')
ITERATION=$(echo "$PAYLOAD" | jq -r '.iteration')
STATUS=$(echo "$PAYLOAD" | jq -r '.status')
TIMESTAMP=$(echo "$PAYLOAD" | jq -r '.timestamp')

# Use local CLI if available, otherwise npx
if [ -f "packages/sdk/dist/cli/main.js" ]; then
  CLI=(node packages/sdk/dist/cli/main.js)
else
  CLI=(npx -y @a5c-ai/babysitter-sdk)
fi

echo "[native-finalization] Iteration $ITERATION ended with status: $STATUS" >&2

# Get updated run status after iteration
RUN_STATUS=$("${CLI[@]}" run:status "$RUN_ID" --json 2>/dev/null || echo '{}')
CURRENT_STATE=$(echo "$RUN_STATUS" | jq -r '.state // "unknown"')
PENDING_COUNT=$(echo "$RUN_STATUS" | jq -r '.metadata.pendingEffectsByKind | to_entries | map(.value) | add // 0')

echo "[native-finalization] Current run state: $CURRENT_STATE, pending effects: $PENDING_COUNT" >&2

# Determine if more iterations are needed
NEEDS_MORE_ITERATIONS="false"

if [ "$CURRENT_STATE" = "waiting" ] && [ "$PENDING_COUNT" -gt 0 ]; then
  # Check if any effects are auto-runnable
  PENDING_TASKS=$("${CLI[@]}" task:list "$RUN_ID" --pending --json 2>/dev/null || echo '{"tasks":[]}')
  AUTO_RUNNABLE=$(echo "$PENDING_TASKS" | jq '[.tasks[] | select(.kind == "node")] | length')

  if [ "$AUTO_RUNNABLE" -gt 0 ]; then
    NEEDS_MORE_ITERATIONS="true"
    echo "[native-finalization] More iterations needed: $AUTO_RUNNABLE auto-runnable tasks" >&2
  else
    echo "[native-finalization] No auto-runnable tasks - waiting for external action" >&2
  fi
elif [ "$CURRENT_STATE" = "completed" ] || [ "$CURRENT_STATE" = "failed" ]; then
  echo "[native-finalization] Run in terminal state: $CURRENT_STATE" >&2
fi

# Output finalization result
cat <<EOF
{
  "iteration": $ITERATION,
  "finalState": "$CURRENT_STATE",
  "pendingEffects": $PENDING_COUNT,
  "needsMoreIterations": $NEEDS_MORE_ITERATIONS
}
EOF

exit 0
