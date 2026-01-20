#!/bin/bash
# Hook-Driven Orchestration Wrapper
#
# This script demonstrates the hook-driven orchestration architecture where:
# 1. CLI commands invoke hooks
# 2. Hooks contain orchestration logic
# 3. Hooks call back to CLI commands for specific operations
#
# This makes the entire orchestration system fully customizable via hooks.
#
# Usage: ./hook-driven-orchestrate.sh <run-dir> [--max-iterations N]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Parse arguments
RUN_DIR="${1:?Run directory required}"
MAX_ITERATIONS=100
CURRENT_ITERATION=0

shift
while [[ $# -gt 0 ]]; do
  case "$1" in
    --max-iterations)
      MAX_ITERATIONS="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

# Resolve run directory
if [[ ! "$RUN_DIR" = /* ]]; then
  RUN_DIR="$PROJECT_ROOT/$RUN_DIR"
fi

if [ ! -d "$RUN_DIR" ]; then
  echo "Error: Run directory not found: $RUN_DIR" >&2
  exit 1
fi

# Extract run ID from directory
RUN_ID=$(basename "$RUN_DIR")

echo "[hook-orchestrator] Starting hook-driven orchestration for run: $RUN_ID" >&2
echo "[hook-orchestrator] Max iterations: $MAX_ITERATIONS" >&2
echo "[hook-orchestrator] Working directory: $PROJECT_ROOT" >&2

# Use local CLI if available
if [ -f "$PROJECT_ROOT/packages/sdk/dist/cli/main.js" ]; then
  CLI="node $PROJECT_ROOT/packages/sdk/dist/cli/main.js"
else
  CLI="npx -y @a5c-ai/babysitter-sdk"
fi

# Main orchestration loop - driven by hooks
while [ $CURRENT_ITERATION -lt $MAX_ITERATIONS ]; do
  ((CURRENT_ITERATION++))

  echo "" >&2
  echo "[hook-orchestrator] ==================== Iteration $CURRENT_ITERATION ====================" >&2

  # Get current run status
  RUN_STATUS=$($CLI run:status "$RUN_DIR" --json 2>/dev/null || echo '{}')
  STATUS=$(echo "$RUN_STATUS" | jq -r '.status // "unknown"')

  echo "[hook-orchestrator] Current status: $STATUS" >&2

  # Check if run is in terminal state
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    echo "[hook-orchestrator] Run reached terminal state: $STATUS" >&2
    break
  fi

  # === HOOK INVOCATION: on-iteration-start ===
  # Instead of having orchestration logic here, we delegate to hooks
  echo "[hook-orchestrator] Invoking on-iteration-start hooks..." >&2

  ITERATION_START_PAYLOAD=$(cat <<EOF
{
  "runId": "$RUN_ID",
  "iteration": $CURRENT_ITERATION,
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
)

  # Call hook dispatcher - orchestration logic is in the hooks
  cd "$PROJECT_ROOT"
  ORCHESTRATION_RESULT=$(echo "$ITERATION_START_PAYLOAD" | \
    plugins/babysitter/hooks/hook-dispatcher.sh on-iteration-start 2>&1 | \
    tail -1 || echo '{}')

  echo "[hook-orchestrator] Orchestration result: $ORCHESTRATION_RESULT" >&2

  # Parse hook result
  HOOK_ACTION=$(echo "$ORCHESTRATION_RESULT" | jq -r '.action // "none"')
  HOOK_REASON=$(echo "$ORCHESTRATION_RESULT" | jq -r '.reason // "unknown"')

  echo "[hook-orchestrator] Hook action: $HOOK_ACTION, reason: $HOOK_REASON" >&2

  # Handle different actions
  case "$HOOK_ACTION" in
    executed-tasks)
      TASK_COUNT=$(echo "$ORCHESTRATION_RESULT" | jq -r '.count // 0')
      echo "[hook-orchestrator] Hook executed $TASK_COUNT task(s)" >&2
      ;;

    waiting)
      if [ "$HOOK_REASON" = "breakpoint" ]; then
        echo "[hook-orchestrator] Waiting for breakpoint approval" >&2
        echo "[hook-orchestrator] Pausing orchestration loop" >&2
        break
      elif [ "$HOOK_REASON" = "sleep" ]; then
        SLEEP_UNTIL=$(echo "$ORCHESTRATION_RESULT" | jq -r '.until // "unknown"')
        echo "[hook-orchestrator] Sleeping until: $SLEEP_UNTIL" >&2
        break
      else
        echo "[hook-orchestrator] Waiting for: $HOOK_REASON" >&2
        break
      fi
      ;;

    none)
      echo "[hook-orchestrator] No action needed: $HOOK_REASON" >&2
      break
      ;;

    *)
      echo "[hook-orchestrator] Unknown action from hook: $HOOK_ACTION" >&2
      break
      ;;
  esac

  # === HOOK INVOCATION: on-iteration-end ===
  echo "[hook-orchestrator] Invoking on-iteration-end hooks..." >&2

  # Get final status for this iteration
  FINAL_RUN_STATUS=$($CLI run:status "$RUN_DIR" --json 2>/dev/null || echo '{}')
  FINAL_STATUS=$(echo "$FINAL_RUN_STATUS" | jq -r '.status // "unknown"')

  ITERATION_END_PAYLOAD=$(cat <<EOF
{
  "runId": "$RUN_ID",
  "iteration": $CURRENT_ITERATION,
  "status": "$FINAL_STATUS",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
)

  FINALIZATION_RESULT=$(echo "$ITERATION_END_PAYLOAD" | \
    plugins/babysitter/hooks/hook-dispatcher.sh on-iteration-end 2>&1 | \
    tail -1 || echo '{}')

  echo "[hook-orchestrator] Finalization result: $FINALIZATION_RESULT" >&2

  # Check if more iterations needed
  NEEDS_MORE=$(echo "$FINALIZATION_RESULT" | jq -r '.needsMoreIterations // "false"')

  if [ "$NEEDS_MORE" != "true" ]; then
    echo "[hook-orchestrator] No more iterations needed" >&2
    break
  fi

  # Small delay between iterations
  sleep 0.5
done

if [ $CURRENT_ITERATION -ge $MAX_ITERATIONS ]; then
  echo "[hook-orchestrator] WARNING: Reached maximum iterations ($MAX_ITERATIONS)" >&2
  echo "[hook-orchestrator] Run may not be complete" >&2
  exit 1
fi

# Final status
FINAL_RUN_STATUS=$($CLI run:status "$RUN_DIR" --json 2>/dev/null || echo '{}')
FINAL_STATUS=$(echo "$FINAL_RUN_STATUS" | jq -r '.status // "unknown"')

echo "" >&2
echo "[hook-orchestrator] ==================== Orchestration Complete ====================" >&2
echo "[hook-orchestrator] Total iterations: $CURRENT_ITERATION" >&2
echo "[hook-orchestrator] Final status: $FINAL_STATUS" >&2

if [ "$FINAL_STATUS" = "completed" ]; then
  exit 0
elif [ "$FINAL_STATUS" = "failed" ]; then
  exit 1
else
  echo "[hook-orchestrator] Run in non-terminal state: $FINAL_STATUS" >&2
  exit 2
fi
