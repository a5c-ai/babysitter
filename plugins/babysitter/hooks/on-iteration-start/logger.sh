#!/bin/bash
# on-iteration-start Logger Hook
# Logs on-iteration-start events to .a5c/logs/hooks.log

set -euo pipefail

LOGS_DIR=".a5c/logs"
mkdir -p "$LOGS_DIR"
LOG_FILE="$LOGS_DIR/hooks.log"

PAYLOAD=$(cat)

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId // "unknown"')
ITERATION=$(echo "$PAYLOAD" | jq -r '.iteration // "unknown"')

LOG_ENTRY=$(cat <<LOGEOF
[$TIMESTAMP] ITERATION_START
  Hook: on-iteration-start
  Run ID: $RUN_ID
LOGEOF
)

echo "$LOG_ENTRY" >> "$LOG_FILE"
echo "[on-iteration-start/logger] Logged on-iteration-start event to $LOG_FILE" >&2

exit 0
