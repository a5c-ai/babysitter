#!/bin/bash
# on-step-dispatch Logger Hook
# Logs on-step-dispatch events to .a5c/logs/hooks.log

set -euo pipefail

LOGS_DIR=".a5c/logs"
mkdir -p "$LOGS_DIR"
LOG_FILE="$LOGS_DIR/hooks.log"

PAYLOAD=$(cat)

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId // "unknown"')
STEP_ID=$(echo "$PAYLOAD" | jq -r '.stepId // "unknown"')
ACTION=$(echo "$PAYLOAD" | jq -r '.action // "unknown"')

LOG_ENTRY=$(cat <<LOGEOF
[$TIMESTAMP] STEP_DISPATCH
  Hook: on-step-dispatch
  Run ID: $RUN_ID
LOGEOF
)

echo "$LOG_ENTRY" >> "$LOG_FILE"
echo "[on-step-dispatch/logger] Logged on-step-dispatch event to $LOG_FILE" >&2

exit 0
