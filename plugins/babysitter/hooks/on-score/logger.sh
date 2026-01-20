#!/bin/bash
# on-score Logger Hook
# Logs on-score events to .a5c/logs/hooks.log

set -euo pipefail

LOGS_DIR=".a5c/logs"
mkdir -p "$LOGS_DIR"
LOG_FILE="$LOGS_DIR/hooks.log"

PAYLOAD=$(cat)

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId // "unknown"')
TARGET=$(echo "$PAYLOAD" | jq -r '.target // "unknown"')
SCORE=$(echo "$PAYLOAD" | jq -r '.score // "unknown"')

LOG_ENTRY=$(cat <<LOGEOF
[$TIMESTAMP] SCORE
  Hook: on-score
  Run ID: $RUN_ID
LOGEOF
)

echo "$LOG_ENTRY" >> "$LOG_FILE"
echo "[on-score/logger] Logged on-score event to $LOG_FILE" >&2

exit 0
