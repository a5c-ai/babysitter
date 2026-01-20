#!/bin/bash
# Default Breakpoint CLI Hook
# Uses the breakpoints CLI to create, wait for, and fetch feedback

set -euo pipefail

# Read breakpoint payload from stdin
PAYLOAD=$(cat)

# Extract key fields from payload
QUESTION=$(echo "$PAYLOAD" | jq -r '.question // "Breakpoint reached"')
RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId // .context.runId // "unknown"')
TITLE=$(echo "$PAYLOAD" | jq -r '.title // "Breakpoint"')

# Extract context files if present
CONTEXT_FILES=$(echo "$PAYLOAD" | jq -r '.context.files // [] | @json')

# Build breakpoints CLI command
CMD="breakpoints breakpoint create --question \"$QUESTION\" --title \"$TITLE\""

# Add run ID if available
if [[ "$RUN_ID" != "unknown" && "$RUN_ID" != "null" ]]; then
  CMD="$CMD --run-id \"$RUN_ID\""
fi

# Add context files
if [[ "$CONTEXT_FILES" != "[]" && "$CONTEXT_FILES" != "null" ]]; then
  # Parse files array and add each as --file argument
  FILES_ARRAY=$(echo "$CONTEXT_FILES" | jq -r '.[] | "\(.path),\(.format // "markdown"),\(.language // "")"')
  while IFS= read -r file_spec; do
    if [[ -n "$file_spec" ]]; then
      CMD="$CMD --file \"$file_spec\""
    fi
  done <<< "$FILES_ARRAY"
fi

echo "[breakpoint-cli] Creating breakpoint with: $CMD" >&2

# Execute command to create breakpoint
BREAKPOINT_RESULT=$(eval "$CMD")
BREAKPOINT_ID=$(echo "$BREAKPOINT_RESULT" | jq -r '.breakpointId')

if [[ -z "$BREAKPOINT_ID" || "$BREAKPOINT_ID" == "null" ]]; then
  echo "[breakpoint-cli] Failed to create breakpoint" >&2
  echo "$BREAKPOINT_RESULT" >&2
  exit 1
fi

echo "[breakpoint-cli] Created breakpoint: $BREAKPOINT_ID" >&2

# Wait for breakpoint to be released
echo "[breakpoint-cli] Waiting for breakpoint to be released..." >&2
WAIT_RESULT=$(breakpoints breakpoint wait "$BREAKPOINT_ID" --interval 3)

echo "[breakpoint-cli] Breakpoint released!" >&2

# Output the result (includes feedback)
echo "$WAIT_RESULT"

exit 0
