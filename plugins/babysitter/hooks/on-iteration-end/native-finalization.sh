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

if command -v babysitter &>/dev/null; then
  CLI=(babysitter)
else
  _PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$(dirname "$(dirname "$0")")")" && pwd)}"
  SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$_PLUGIN_ROOT/plugin.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}" 2>/dev/null || echo "latest")
  CLI=(npx -y "@a5c-ai/babysitter-sdk@$SDK_VERSION")
fi

echo "[native-finalization] Iteration $ITERATION ended with status: $STATUS" >&2

# Get updated run status after iteration
RUN_STATUS=$("${CLI[@]}" run:status "$RUN_ID" --json 2>/dev/null || echo '{}')
CURRENT_STATE=$(echo "$RUN_STATUS" | jq -r '.state // "unknown"')
PENDING_COUNT=$(echo "$RUN_STATUS" | jq -r '.pendingEffectsSummary.totalPending // 0')
NEEDS_MORE_ITERATIONS=$(echo "$RUN_STATUS" | jq -r '.needsMoreIterations // false')

echo "[native-finalization] Current run state: $CURRENT_STATE, pending effects: $PENDING_COUNT" >&2

if [ "$NEEDS_MORE_ITERATIONS" = "true" ]; then
  AUTO_RUNNABLE=$(echo "$RUN_STATUS" | jq -r '.pendingEffectsSummary.autoRunnableCount // 0')
  echo "[native-finalization] More iterations needed: $AUTO_RUNNABLE auto-runnable tasks" >&2
elif [ "$CURRENT_STATE" = "completed" ] || [ "$CURRENT_STATE" = "failed" ]; then
  echo "[native-finalization] Run in terminal state: $CURRENT_STATE" >&2
else
  echo "[native-finalization] No auto-runnable tasks - waiting for external action" >&2
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
