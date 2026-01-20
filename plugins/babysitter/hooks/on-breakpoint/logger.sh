#!/bin/bash
# Breakpoint Logger Hook
# Logs breakpoint events to .a5c/logs/breakpoints.log

set -euo pipefail

# Create logs directory if it doesn't exist
LOGS_DIR=".a5c/logs"
mkdir -p "$LOGS_DIR"

LOG_FILE="$LOGS_DIR/breakpoints.log"

# Read breakpoint payload from stdin
PAYLOAD=$(cat)

# Extract key information
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId // .context.runId // "unknown"')
QUESTION=$(echo "$PAYLOAD" | jq -r '.question // "N/A"')
REASON=$(echo "$PAYLOAD" | jq -r '.reason // "N/A"')

# Log entry
LOG_ENTRY=$(cat <<EOF
[$TIMESTAMP] BREAKPOINT
  Run ID: $RUN_ID
  Reason: $REASON
  Question: $QUESTION
  Payload: $(echo "$PAYLOAD" | jq -c '.')
EOF
)

# Append to log file
echo "$LOG_ENTRY" >> "$LOG_FILE"

echo "[logger] Logged breakpoint to $LOG_FILE" >&2

exit 0
