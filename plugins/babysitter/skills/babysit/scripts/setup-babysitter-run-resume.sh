#!/bin/bash

# Babysitter Resume Run Setup Script
# Resumes an existing babysitter run by reading the run ID from arguments

set -euo pipefail

# Parse arguments (check for --help early before requiring session ID)
RUN_ID=""
MAX_ITERATIONS=256

# Parse options and positional arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      cat << 'HELP_EOF'
Babysitter Resume - Resume an existing babysitter run

USAGE:
  /babysitter-resume <run-id> [OPTIONS]

ARGUMENTS:
  <run-id>     The run ID to resume (e.g., run-20260119-example)

OPTIONS:
  --max-iterations <n>           Override max iterations (default: 256)
  -h, --help                     Show this help message

DESCRIPTION:
  Resumes an existing Babysitter run in your CURRENT session. The run must
  exist in .a5c/runs/<run-id>/ directory.

  The stop hook prevents exit and uses run:iterate to drive orchestration
  until completion or iteration limit.

EXAMPLES:
  /babysitter-resume --claude-session-id "${CLAUDE_SESSION_ID}" --run-id run-20260119-example
  /babysitter-resume --claude-session-id "${CLAUDE_SESSION_ID}" --run-id run-20260119-example --max-iterations 20

STOPPING:
  Only by reaching --max-iterations or completion secret detection
  Set --max-iterations 0 for an infinite run (not recommended)
HELP_EOF
      exit 0
      ;;
    --claude-session-id)
      if [[ -z "${2:-}" ]]; then
        echo "❌ Error: --claude-session-id requires a session ID argument" >&2
        exit 1
      fi
      CLAUDE_SESSION_ID="$2"
      shift 2
      ;;
    --run-id)
      if [[ -z "${2:-}" ]]; then
        echo "❌ Error: --run-id requires a run ID argument" >&2
        exit 1
      fi
      RUN_ID="$2"
      shift 2
      ;;
    --max-iterations)
      if [[ -z "${2:-}" ]]; then
        echo "❌ Error: --max-iterations requires a number argument" >&2
        exit 1
      fi
      if ! [[ "$2" =~ ^[0-9]+$ ]]; then
        echo "❌ Error: --max-iterations must be a positive integer or 0, got: $2" >&2
        exit 1
      fi
      MAX_ITERATIONS="$2"
      shift 2
      ;;
    *)
      # First non-option argument is the run ID
      if [[ -z "$RUN_ID" ]]; then
        RUN_ID="$1"
        shift
      else
        echo "❌ Error: Unexpected argument: $1" >&2
        echo "   Usage: /babysitter-resume <run-id> [OPTIONS]" >&2
        exit 1
      fi
      ;;
  esac
done

# Validate run ID is provided
if [[ -z "$RUN_ID" ]]; then
  echo "❌ Error: No run ID provided" >&2
  echo "" >&2
  echo "   Usage: /babysitter-resume <run-id>" >&2
  echo "" >&2
  echo "   Examples:" >&2
  echo "     /babysitter-resume run-20260119-example" >&2
  echo "     /babysitter-resume run-20260119-example --max-iterations 20" >&2
  echo "" >&2
  echo "   For all options: /babysitter-resume --help" >&2
  exit 1
fi

# Now check for session ID (after --help has been processed)
if [[ -z "${CLAUDE_SESSION_ID:-}" ]]; then
  echo "❌ Error: CLAUDE_SESSION_ID not available" >&2
  echo "   Babysitter requires session isolation to work correctly." >&2
  exit 1
fi

# Determine state directory (plugin-relative for session isolation)
if [[ -n "${CLAUDE_PLUGIN_ROOT:-}" ]]; then
  STATE_DIR="$CLAUDE_PLUGIN_ROOT/state"
else
  # Fallback: derive from script location
  STATE_DIR="$(dirname "$(dirname "$0")")/state"
fi

# Use SDK CLI for resume (handles run validation, state creation)
CLI="${CLI:-npx -y @a5c-ai/babysitter-sdk@latest}"

RESUME_RESULT=$($CLI session:resume \
  --session-id "$CLAUDE_SESSION_ID" \
  --state-dir "$STATE_DIR" \
  --run-id "$RUN_ID" \
  --max-iterations "$MAX_ITERATIONS" \
  --runs-dir ".a5c/runs" \
  --json 2>&1) || {
  # Parse error from JSON output if possible
  if echo "$RESUME_RESULT" | grep -q '"error"'; then
    ERROR_CODE=$(echo "$RESUME_RESULT" | sed -n 's/.*"error":"\([^"]*\)".*/\1/p')
    ERROR_MSG=$(echo "$RESUME_RESULT" | sed -n 's/.*"message":"\([^"]*\)".*/\1/p')

    if [[ "$ERROR_CODE" == "RUN_NOT_FOUND" ]]; then
      echo "❌ Error: Run not found: $RUN_ID" >&2
      echo "   Expected directory: .a5c/runs/$RUN_ID" >&2
      echo "" >&2
      echo "   Available runs:" >&2
      if [[ -d ".a5c/runs" ]]; then
        ls -1 .a5c/runs/ 2>/dev/null | head -10 || echo "   (none)" >&2
      else
        echo "   (no .a5c/runs directory found)" >&2
      fi
    elif [[ "$ERROR_CODE" == "RUN_COMPLETED" ]]; then
      echo "❌ Error: Run is already completed" >&2
      echo "   Run ID: $RUN_ID" >&2
      echo "   Cannot resume a completed run." >&2
    else
      echo "❌ Error: ${ERROR_MSG:-Resume failed}" >&2
    fi
  else
    echo "❌ Error: Resume failed" >&2
    echo "$RESUME_RESULT" >&2
  fi
  exit 1
}

# Extract values from JSON output
STATE_FILE=$(echo "$RESUME_RESULT" | sed -n 's/.*"stateFile":"\([^"]*\)".*/\1/p')
STATE=$(echo "$RESUME_RESULT" | sed -n 's/.*"runState":"\([^"]*\)".*/\1/p')
PROCESS_ID=$(echo "$RESUME_RESULT" | sed -n 's/.*"processId":"\([^"]*\)".*/\1/p')

BABYSITTER_STATE_FILE="${STATE_FILE:-$STATE_DIR/${CLAUDE_SESSION_ID}.md}"
STATE="${STATE:-unknown}"
PROCESS_ID="${PROCESS_ID:-unknown}"

# Create prompt for output
PROMPT="Resume Babysitter run: $RUN_ID

Process: $PROCESS_ID
Current state: $STATE

Continue orchestration using run:iterate, task:post, etc. or fix the run if it's broken/failed/unknown."

# Output setup message
cat <<EOF
🔄 Babysitter run resumed in this session!

Run ID: $RUN_ID
Process: $PROCESS_ID
Current state: $STATE
Iteration: 1
Max iterations: $(if [[ $MAX_ITERATIONS -gt 0 ]]; then echo $MAX_ITERATIONS; else echo "unlimited"; fi)
Completion promise: secret (emitted only when run completes)

The stop hook is now active. When you try to exit, run:iterate will be called
to drive the next orchestration step. You'll see your previous work in journal,
state.json, and task results.

To monitor: head -10 "$BABYSITTER_STATE_FILE"

⚠️  WARNING: This loop cannot be stopped manually! It will run infinitely
    only if you set --max-iterations 0 (not recommended).

🔄
EOF

# Output the resume prompt
echo ""
echo "$PROMPT"

