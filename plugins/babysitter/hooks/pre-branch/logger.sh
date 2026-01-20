#!/bin/bash
# pre-branch Logger Hook
# Logs pre-branch events to .a5c/logs/hooks.log

set -euo pipefail

LOGS_DIR=".a5c/logs"
mkdir -p "$LOGS_DIR"
LOG_FILE="$LOGS_DIR/hooks.log"

PAYLOAD=$(cat)

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId // "unknown"')
BRANCH=$(echo "$PAYLOAD" | jq -r '.branch // "unknown"')
BASE=$(echo "$PAYLOAD" | jq -r '.base // "unknown"')

LOG_ENTRY=$(cat <<LOGEOF
[$TIMESTAMP] PRE_BRANCH
  Hook: pre-branch
  Run ID: $RUN_ID
LOGEOF
)

echo "$LOG_ENTRY" >> "$LOG_FILE"
echo "[pre-branch/logger] Logged pre-branch event to $LOG_FILE" >&2

exit 0
