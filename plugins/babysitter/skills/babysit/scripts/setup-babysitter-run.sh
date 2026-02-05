#!/bin/bash

# Babysitter run Setup Script
# Creates state file for in-session Babysitter run

set -euo pipefail

# Parse arguments (check for --help early before requiring session ID)
PROMPT_PARTS=()
MAX_ITERATIONS=256
RUN_ID=""

# Parse options and positional arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      cat << 'HELP_EOF'
Babysitter - self-referential, event-sourced  development orchestration

USAGE:
  /babysitter:babysit [PROMPT...] [OPTIONS]

ARGUMENTS:
  PROMPT...    Initial prompt to start the loop (can be multiple words without quotes)

OPTIONS:
  --max-iterations <n>           Maximum iterations before auto-stop (default: 256)
  --run-id <id>                  Optional run ID to store in state (if already known)
  --claude-session-id <id>      Session ID to use for the run (default: current session)
  -h, --help                     Show this help message

DESCRIPTION:
  Starts a Babysitter run in your CURRENT session. The stop hook prevents
  exit and feeds your output back as input until completion or iteration limit.

  Completion uses a secret emitted by the SDK only when the run is completed.

  Use this for:
  - Interactive iteration where you want to see progress
  - Tasks requiring self-correction and refinement
  - Learning how Babysitter works

EXAMPLES:
  /babysitter:babysit Build a todo API --max-iterations 20
  /babysitter:babysit --max-iterations 10 Fix the auth bug
  /babysitter:babysit Refactor cache layer  (runs forever)
  /babysitter:babysit --run-id run-20260119-example Resume context with known run ID

STOPPING:
  Only by reaching --max-iterations or completion secret detection
  Set --max-iterations 0 for an infinite run (not recommended)

MONITORING:
  State files are stored in the plugin's state/ directory with session ID.
  The exact path is shown when the loop starts.
HELP_EOF
      exit 0
      ;;
    --claude-session-id)
      if [[ -z "${2:-}" ]]; then
        echo "❌ Error: --claude-session-id requires a session ID argument" >&2
        echo "" >&2
        echo "   Valid examples:" >&2
        echo "     --claude-session-id 123e4567-e89b-12d3-a456-426614174000" >&2
        exit 1
      fi
      CLAUDE_SESSION_ID="$2"
      shift 2
      ;;
    --max-iterations)
      if [[ -z "${2:-}" ]]; then
        echo "❌ Error: --max-iterations requires a number argument" >&2
        echo "" >&2
        echo "   Valid examples:" >&2
        echo "     --max-iterations 10" >&2
        echo "     --max-iterations 50" >&2
        echo "     --max-iterations 0  (unlimited)" >&2
        echo "" >&2
        echo "   You provided: --max-iterations (with no number)" >&2
        exit 1
      fi
      if ! [[ "$2" =~ ^[0-9]+$ ]]; then
        echo "❌ Error: --max-iterations must be a positive integer or 0, got: $2" >&2
        echo "" >&2
        echo "   Valid examples:" >&2
        echo "     --max-iterations 10" >&2
        echo "     --max-iterations 50" >&2
        echo "     --max-iterations 0  (unlimited)" >&2
        echo "" >&2
        echo "   Invalid: decimals (10.5), negative numbers (-5), text" >&2
        exit 1
      fi
      MAX_ITERATIONS="$2"
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
    *)
      # Non-option argument - collect all as prompt parts
      PROMPT_PARTS+=("$1")
      shift
      ;;
  esac
done

# Join all prompt parts with spaces (avoid nounset error on empty array)
if ((${#PROMPT_PARTS[@]})); then
  PROMPT="${PROMPT_PARTS[*]}"
else
  PROMPT=""
fi

# Validate prompt is non-empty
if [[ -z "$PROMPT" ]]; then
  echo "❌ Error: No prompt provided" >&2
  echo "" >&2
  echo "   Babysitter needs a task description to work on." >&2
  echo "" >&2
  echo "   Examples:" >&2
  echo "     /babysitter:babysit Build a REST API for todos" >&2
  echo "     /babysitter:babysit Fix the auth bug --max-iterations 20" >&2
  echo "     /babysitter:babysit --run-id run-20260119-example Refactor code" >&2
  echo "" >&2
  echo "   For all options: /babysitter:babysit --help" >&2
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

# Create state file using SDK CLI (handles re-entrant check and atomic writes)
CLI="${CLI:-npx -y @a5c-ai/babysitter-sdk@latest}"

# Build CLI args
CLI_ARGS=(
  "session:init"
  "--session-id" "$CLAUDE_SESSION_ID"
  "--state-dir" "$STATE_DIR"
  "--max-iterations" "$MAX_ITERATIONS"
  "--prompt" "$PROMPT"
  "--json"
)

# Add run-id if provided
if [[ -n "$RUN_ID" ]]; then
  CLI_ARGS+=("--run-id" "$RUN_ID")
fi

# Run the CLI command
INIT_RESULT=$($CLI "${CLI_ARGS[@]}" 2>&1) || {
  # Parse error from JSON output if possible
  if echo "$INIT_RESULT" | grep -q '"error"'; then
    ERROR_MSG=$(echo "$INIT_RESULT" | sed -n 's/.*"message":"\([^"]*\)".*/\1/p')
    echo "❌ Error: ${ERROR_MSG:-Session initialization failed}" >&2
  else
    echo "❌ Error: Session initialization failed" >&2
    echo "$INIT_RESULT" >&2
  fi
  exit 1
}

# Extract state file path from JSON output
BABYSITTER_STATE_FILE=$(echo "$INIT_RESULT" | sed -n 's/.*"stateFile":"\([^"]*\)".*/\1/p')
if [[ -z "$BABYSITTER_STATE_FILE" ]]; then
  BABYSITTER_STATE_FILE="$STATE_DIR/${CLAUDE_SESSION_ID}.md"
fi

# Output setup message
cat <<EOF
🔄 Babysitter run activated in this session!

Iteration: 1
Max iterations: $(if [[ $MAX_ITERATIONS -gt 0 ]]; then echo $MAX_ITERATIONS; else echo "unlimited"; fi)
Run ID: $(if [[ -n "$RUN_ID" ]]; then echo "$RUN_ID"; else echo "unset (will be filled after run:create)"; fi)

The stop hook is now active. When you try to exit, the SAME PROMPT will be
fed back to you.
Before anything else, use the Babysitter Skill. (read "\${CLAUDE_PLUGIN_ROOT}/skills/babysit/SKILL.md" - the babysitter/SKILL.md file)
You must use the skill to iterate (use the cli, execute requested effects, post them back to the cli, and continue the loop until the run is completed).
do not perform any tasks directly, only use the skill to orchestrate the run.
To monitor: head -10 "$BABYSITTER_STATE_FILE"

⚠️  WARNING: This run cannot be stopped manually! It will run infinitely
    only if you set --max-iterations 0 (not recommended).

🔄
EOF

# Output the initial prompt if provided
if [[ -n "$PROMPT" ]]; then
  echo ""
  echo "$PROMPT"
fi
