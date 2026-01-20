#!/bin/bash
# on-run-fail Logger Hook
# Logs run failure events to .a5c/logs/hooks.log

set -euo pipefail

LOGS_DIR=".a5c/logs"
mkdir -p "$LOGS_DIR"
LOG_FILE="$LOGS_DIR/hooks.log"

PAYLOAD=$(cat)

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId // "unknown"')
ERROR=$(echo "$PAYLOAD" | jq -r '.error // "unknown"')
DURATION=$(echo "$PAYLOAD" | jq -r '.duration // "unknown"')

LOG_ENTRY=$(cat <<EOF
[$TIMESTAMP] RUN_FAIL
  Hook: on-run-fail
  Run ID: $RUN_ID
  Error: $ERROR
  Duration: ${DURATION}ms
EOF
)

echo "$LOG_ENTRY" >> "$LOG_FILE"
echo "[on-run-fail/logger] Logged run failure to $LOG_FILE" >&2

exit 0
