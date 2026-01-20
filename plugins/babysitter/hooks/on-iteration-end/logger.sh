#!/bin/bash
# on-iteration-end Logger Hook
# Logs on-iteration-end events to .a5c/logs/hooks.log

set -euo pipefail

LOGS_DIR=".a5c/logs"
mkdir -p "$LOGS_DIR"
LOG_FILE="$LOGS_DIR/hooks.log"

PAYLOAD=$(cat)

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId // "unknown"')
ITERATION=$(echo "$PAYLOAD" | jq -r '.iteration // "unknown"')
STATUS=$(echo "$PAYLOAD" | jq -r '.status // "unknown"')

LOG_ENTRY=$(cat <<LOGEOF
[$TIMESTAMP] ITERATION_END
  Hook: on-iteration-end
  Run ID: $RUN_ID
LOGEOF
)

echo "$LOG_ENTRY" >> "$LOG_FILE"
echo "[on-iteration-end/logger] Logged on-iteration-end event to $LOG_FILE" >&2

exit 0
