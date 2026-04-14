#!/bin/bash
# Babysitter Stop Hook - delegates to SDK CLI
# All logic is implemented in: babysitter hook:run --hook-type stop

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"

if ! command -v babysitter &>/dev/null; then 
  # No CLI available — exit 0 (no-op, proceed with original command)
  exit 0
fi
LOG_DIR="${BABYSITTER_LOG_DIR:-$HOME/.a5c/logs}"
LOG_FILE="$LOG_DIR/babysitter-stop-hook.log"

mkdir -p "$LOG_DIR" 2>/dev/null

# Structured logging helper — writes to both local log and via CLI
blog() {
  local msg="$1"
  local ts
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "[INFO] $ts $msg" >> "$LOG_FILE" 2>/dev/null
  babysitter log --type hook --label "hook:stop" --message "$msg" --source shell-hook 2>/dev/null || true
}

blog "Hook script invoked"
blog "PLUGIN_ROOT=$PLUGIN_ROOT"

# Capture stdin so we can log size and pass to CLI
INPUT_FILE=$(mktemp 2>/dev/null || echo "/tmp/hook-input-$$.json")
cat > "$INPUT_FILE"

blog "Hook input received ($(wc -c < "$INPUT_FILE") bytes)"

# Run the CLI, capturing stdout; redirect stderr to log
RESULT=$(babysitter hook:run --hook-type stop --harness claude-code --plugin-root "$PLUGIN_ROOT" --json < "$INPUT_FILE" 2>"$LOG_DIR/babysitter-stop-hook-stderr.log")
EXIT_CODE=$?

blog "CLI exit code=$EXIT_CODE"

rm -f "$INPUT_FILE" 2>/dev/null
printf '%s\n' "$RESULT"
exit $EXIT_CODE
