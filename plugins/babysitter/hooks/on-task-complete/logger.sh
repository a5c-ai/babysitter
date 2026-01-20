#!/bin/bash
# on-task-complete Logger Hook
# Logs on-task-complete events to .a5c/logs/hooks.log

set -euo pipefail

LOGS_DIR=".a5c/logs"
mkdir -p "$LOGS_DIR"
LOG_FILE="$LOGS_DIR/hooks.log"

PAYLOAD=$(cat)

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId // "unknown"')
EFFECT_ID=$(echo "$PAYLOAD" | jq -r '.effectId // "unknown"')
TASK_ID=$(echo "$PAYLOAD" | jq -r '.taskId // "unknown"')
STATUS=$(echo "$PAYLOAD" | jq -r '.status // "unknown"')
DURATION=$(echo "$PAYLOAD" | jq -r '.duration // "unknown"')

LOG_ENTRY=$(cat <<LOGEOF
[$TIMESTAMP] TASK_COMPLETE
  Hook: on-task-complete
  Run ID: $RUN_ID
LOGEOF
)

echo "$LOG_ENTRY" >> "$LOG_FILE"
echo "[on-task-complete/logger] Logged on-task-complete event to $LOG_FILE" >&2

exit 0
