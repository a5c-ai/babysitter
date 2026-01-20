#!/bin/bash
# post-planning Logger Hook
# Logs post-planning events to .a5c/logs/hooks.log

set -euo pipefail

LOGS_DIR=".a5c/logs"
mkdir -p "$LOGS_DIR"
LOG_FILE="$LOGS_DIR/hooks.log"

PAYLOAD=$(cat)

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId // "unknown"')
PLAN_FILE=$(echo "$PAYLOAD" | jq -r '.planFile // "unknown"')

LOG_ENTRY=$(cat <<LOGEOF
[$TIMESTAMP] POST_PLANNING
  Hook: post-planning
  Run ID: $RUN_ID
LOGEOF
)

echo "$LOG_ENTRY" >> "$LOG_FILE"
echo "[post-planning/logger] Logged post-planning event to $LOG_FILE" >&2

exit 0
