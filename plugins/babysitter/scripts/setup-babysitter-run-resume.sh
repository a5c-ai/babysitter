#!/bin/bash

# Babysitter Resume Run Setup Script
# Resumes an existing babysitter run by reading the run ID from arguments

set -euo pipefail

# Parse arguments (check for --help early before requiring session ID)
RUN_ID=""
MAX_ITERATIONS=0
COMPLETION_PROMISE="run_completed"

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
  --max-iterations <n>           Override max iterations (default: keep existing)
  --completion-promise '<text>'  Override completion promise (USE QUOTES)
  -h, --help                     Show this help message

DESCRIPTION:
  Resumes an existing Babysitter run in your CURRENT session. The run must
  exist in .a5c/runs/<run-id>/ directory.

  The stop hook prevents exit and uses run:iterate to drive orchestration
  until completion or iteration limit.

EXAMPLES:
  /babysitter-resume --claude-session-id "${CLAUDE_SESSION_ID}" --run-id run-20260119-example
  /babysitter-resume --claude-session-id "${CLAUDE_SESSION_ID}" --run-id run-20260119-example --max-iterations 20
  /babysitter-resume --claude-session-id "${CLAUDE_SESSION_ID}" --run-id run-20260119-example --completion-promise 'DONE'

STOPPING:
  Only by reaching --max-iterations or detecting --completion-promise
  No manual stop - Babysitter runs infinitely by default!
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
    --completion-promise)
      if [[ -z "${2:-}" ]]; then
        echo "❌ Error: --completion-promise requires a text argument" >&2
        exit 1
      fi
      COMPLETION_PROMISE="$2"
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

# Verify run exists
RUN_DIR=".a5c/runs/$RUN_ID"
if [[ ! -d "$RUN_DIR" ]]; then
  echo "❌ Error: Run not found: $RUN_ID" >&2
  echo "   Expected directory: $RUN_DIR" >&2
  echo "" >&2
  echo "   Available runs:" >&2
  if [[ -d ".a5c/runs" ]]; then
    ls -1 .a5c/runs/ | head -10
  else
    echo "   (no .a5c/runs directory found)" >&2
  fi
  exit 1
fi

# Get run status using CLI
CLI="npx -y @a5c-ai/babysitter-sdk"
if [[ -f "packages/sdk/dist/cli/main.js" ]]; then
  CLI="node packages/sdk/dist/cli/main.js"
fi

RUN_STATUS=$($CLI run:status "$RUN_ID" --json 2>/dev/null || echo '{}')
STATE=$(echo "$RUN_STATUS" | jq -r '.state // "unknown"')
PROCESS_ID=$(echo "$RUN_STATUS" | jq -r '.metadata.processId // "unknown"')

# Check if run is in a resumable state
if [[ "$STATE" == "completed" ]]; then
  echo "❌ Error: Run is already completed" >&2
  echo "   Run ID: $RUN_ID" >&2
  echo "   Cannot resume a completed run." >&2
  exit 1
fi

if [[ "$STATE" == "unknown" ]]; then
  echo "⚠️  Warning: Could not determine run state" >&2
  echo "   Run ID: $RUN_ID" >&2
  echo "   Proceeding anyway..." >&2
fi

# Create prompt from run status
PROMPT="Resume Babysitter run: $RUN_ID

Process: $PROCESS_ID
Current state: $STATE

Continue orchestration using run:iterate loop."

# Create state file for stop hook (markdown with YAML frontmatter)
mkdir -p "$STATE_DIR"
BABYSITTER_STATE_FILE="$STATE_DIR/${CLAUDE_SESSION_ID}.md"

# Quote completion promise for YAML if it contains special chars or is not null
if [[ -n "$COMPLETION_PROMISE" ]] && [[ "$COMPLETION_PROMISE" != "null" ]]; then
  COMPLETION_PROMISE_YAML="\"$COMPLETION_PROMISE\""
else
  COMPLETION_PROMISE_YAML="null"
fi

cat > "$BABYSITTER_STATE_FILE" <<EOF
---
active: true
iteration: 1
max_iterations: $MAX_ITERATIONS
completion_promise: $COMPLETION_PROMISE_YAML
started_at: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
run_id: "$RUN_ID"
---

$PROMPT
EOF

# Output setup message
cat <<EOF
🔄 Babysitter run resumed in this session!

Run ID: $RUN_ID
Process: $PROCESS_ID
Current state: $STATE
Iteration: 1
Max iterations: $(if [[ $MAX_ITERATIONS -gt 0 ]]; then echo $MAX_ITERATIONS; else echo "unlimited"; fi)
Completion promise: $(if [[ "$COMPLETION_PROMISE" != "null" ]]; then echo "${COMPLETION_PROMISE//\"/} (ONLY output when TRUE - do not lie!)"; else echo "none (runs forever)"; fi)

The stop hook is now active. When you try to exit, run:iterate will be called
to drive the next orchestration step. You'll see your previous work in journal,
state.json, and task results.

To monitor: head -10 "$BABYSITTER_STATE_FILE"

⚠️  WARNING: This loop cannot be stopped manually! It will run infinitely
    unless you set --max-iterations or --completion-promise.

🔄
EOF

# Output the resume prompt
echo ""
echo "$PROMPT"

# Display completion promise requirements if set
if [[ "$COMPLETION_PROMISE" != "null" ]]; then
  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "CRITICAL - Babysitter Loop Completion Promise"
  echo "═══════════════════════════════════════════════════════════"
  echo ""
  echo "To complete this loop, output this EXACT text:"
  echo "  <promise>$COMPLETION_PROMISE</promise>"
  echo ""
  echo "STRICT REQUIREMENTS (DO NOT VIOLATE):"
  echo "  ✓ Use <promise> XML tags EXACTLY as shown above"
  echo "  ✓ The statement MUST be completely and unequivocally TRUE"
  echo "  ✓ Do NOT output false statements to exit the loop"
  echo "  ✓ Do NOT lie even if you think you should exit"
  echo ""
  echo "IMPORTANT - Do not circumvent the loop:"
  echo "  Even if you believe you're stuck, the task is impossible,"
  echo "  or you've been running too long - you MUST NOT output a"
  echo "  false promise statement. The loop is designed to continue"
  echo "  until the promise is GENUINELY TRUE. Trust the process."
  echo ""
  echo "  If the loop should stop, the promise statement will become"
  echo "  true naturally. Do not force it by lying."
  echo "═══════════════════════════════════════════════════════════"
fi
