#!/bin/bash

# Associate Session with Babysitter Run
# Updates the in-session loop state file with a run ID

set -euo pipefail

RUN_ID=""
CLAUDE_SESSION_ID_ARG=""

while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      cat << 'HELP_EOF'
Associate Session with Babysitter Run

USAGE:
  associate-session-with-run.sh --run-id <id> --claude-session-id <id>

REQUIRED:
  --run-id <id>             Run ID to associate with session
  --claude-session-id <id>  Session ID

DESCRIPTION:
  Updates the in-session loop state file to associate it with a babysitter run.
  This allows the stop hook to query run status and detect completion.

  Typical workflow:
  1. Call 'babysitter run:create ...' to create run (get runId)
  2. Call this script to associate session with the run
  3. Continue with 'babysitter run:iterate' loop

EXAMPLES:
  associate-session-with-run.sh \
    --run-id run-20260121-abc123 \
    --claude-session-id "${CLAUDE_SESSION_ID}"
HELP_EOF
      exit 0
      ;;
    --run-id)
      RUN_ID="$2"
      shift 2
      ;;
    --claude-session-id)
      CLAUDE_SESSION_ID_ARG="$2"
      shift 2
      ;;
    *)
      echo "❌ Error: Unknown argument: $1" >&2
      echo "   Use --help for usage information" >&2
      exit 1
      ;;
  esac
done

# Validate required arguments
if [[ -z "$RUN_ID" ]]; then
  echo "❌ Error: --run-id is required" >&2
  exit 1
fi

if [[ -z "$CLAUDE_SESSION_ID_ARG" ]]; then
  echo "❌ Error: --claude-session-id is required" >&2
  exit 1
fi

# Determine state directory
if [[ -n "${CLAUDE_PLUGIN_ROOT:-}" ]]; then
  STATE_DIR="$CLAUDE_PLUGIN_ROOT/skills/babysit/state"
else
  # Fallback: derive from script location
  STATE_DIR="$(dirname "$(dirname "$0")")/state"
fi

STATE_FILE="$STATE_DIR/${CLAUDE_SESSION_ID_ARG}.md"

# Use SDK CLI for association (handles validation and atomic writes)
CLI="${CLI:-npx -y @a5c-ai/babysitter-sdk@latest}"

ASSOC_RESULT=$($CLI session:associate \
  --session-id "$CLAUDE_SESSION_ID_ARG" \
  --state-dir "$STATE_DIR" \
  --run-id "$RUN_ID" \
  --json 2>&1) || {
  # Parse error from JSON output if possible
  if echo "$ASSOC_RESULT" | grep -q '"error"'; then
    ERROR_MSG=$(echo "$ASSOC_RESULT" | sed -n 's/.*"message":"\([^"]*\)".*/\1/p')
    echo "❌ Error: ${ERROR_MSG:-Association failed}" >&2
    # Check for specific error types
    if echo "$ASSOC_RESULT" | grep -q "SESSION_NOT_FOUND"; then
      echo "   Expected state file: $STATE_FILE" >&2
      echo "" >&2
      echo "   You must first call setup-babysitter-run.sh to initialize the session." >&2
    fi
  else
    echo "❌ Error: Association failed" >&2
    echo "$ASSOC_RESULT" >&2
  fi
  exit 1
}

echo "✅ Associated session with run: $RUN_ID"
echo "   State file: $STATE_FILE"
