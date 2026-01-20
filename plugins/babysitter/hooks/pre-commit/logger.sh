#!/bin/bash
# pre-commit Logger Hook
# Logs pre-commit events to .a5c/logs/hooks.log

set -euo pipefail

LOGS_DIR=".a5c/logs"
mkdir -p "$LOGS_DIR"
LOG_FILE="$LOGS_DIR/hooks.log"

PAYLOAD=$(cat)

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId // "unknown"')
FILES=$(echo "$PAYLOAD" | jq -r '.files | length' 2>/dev/null || echo "unknown")
MESSAGE=$(echo "$PAYLOAD" | jq -r '.message // "unknown"')

LOG_ENTRY=$(cat <<LOGEOF
[$TIMESTAMP] PRE_COMMIT
  Hook: pre-commit
  Run ID: $RUN_ID
LOGEOF
)

echo "$LOG_ENTRY" >> "$LOG_FILE"
echo "[pre-commit/logger] Logged pre-commit event to $LOG_FILE" >&2

exit 0
