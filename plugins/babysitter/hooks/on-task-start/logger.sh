#!/bin/bash
# on-task-start Logger Hook
# Logs on-task-start events to .a5c/logs/hooks.log

set -euo pipefail

LOGS_DIR=".a5c/logs"
mkdir -p "$LOGS_DIR"
LOG_FILE="$LOGS_DIR/hooks.log"

PAYLOAD=$(cat)

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId // "unknown"')
EFFECT_ID=$(echo "$PAYLOAD" | jq -r '.effectId // "unknown"')
TASK_ID=$(echo "$PAYLOAD" | jq -r '.taskId // "unknown"')
KIND=$(echo "$PAYLOAD" | jq -r '.kind // "unknown"')

LOG_ENTRY=$(cat <<LOGEOF
[$TIMESTAMP] TASK_START
  Hook: on-task-start
  Run ID: $RUN_ID
LOGEOF
)

echo "$LOG_ENTRY" >> "$LOG_FILE"
echo "[on-task-start/logger] Logged on-task-start event to $LOG_FILE" >&2

exit 0
