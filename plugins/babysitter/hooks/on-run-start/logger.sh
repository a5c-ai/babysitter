#!/bin/bash
# on-run-start Logger Hook
# Logs run start events to .a5c/logs/hooks.log

set -euo pipefail

# Create logs directory if it doesn't exist
LOGS_DIR=".a5c/logs"
mkdir -p "$LOGS_DIR"
LOG_FILE="$LOGS_DIR/hooks.log"

# Read payload
PAYLOAD=$(cat)

# Extract key fields
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId // "unknown"')
PROCESS_ID=$(echo "$PAYLOAD" | jq -r '.processId // "unknown"')
ENTRY=$(echo "$PAYLOAD" | jq -r '.entry // "unknown"')

# Log the event
LOG_ENTRY=$(cat <<EOF
[$TIMESTAMP] RUN_START
  Hook: on-run-start
  Run ID: $RUN_ID
  Process: $PROCESS_ID
  Entry: $ENTRY
EOF
)

echo "$LOG_ENTRY" >> "$LOG_FILE"
echo "[on-run-start/logger] Logged run start to $LOG_FILE" >&2

exit 0
