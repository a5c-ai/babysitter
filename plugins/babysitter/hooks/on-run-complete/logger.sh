#!/bin/bash
# on-run-complete Logger Hook
# Logs on-run-complete events to .a5c/logs/hooks.log

set -euo pipefail

LOGS_DIR=".a5c/logs"
mkdir -p "$LOGS_DIR"
LOG_FILE="$LOGS_DIR/hooks.log"

PAYLOAD=$(cat)

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId // "unknown"')
STATUS=$(echo "$PAYLOAD" | jq -r '.status // "unknown"')
DURATION=$(echo "$PAYLOAD" | jq -r '.duration // "unknown"')

LOG_ENTRY=$(cat <<LOGEOF
[$TIMESTAMP] RUN_COMPLETE
  Hook: on-run-complete
  Run ID: $RUN_ID
LOGEOF
)

echo "$LOG_ENTRY" >> "$LOG_FILE"
echo "[on-run-complete/logger] Logged on-run-complete event to $LOG_FILE" >&2

exit 0
