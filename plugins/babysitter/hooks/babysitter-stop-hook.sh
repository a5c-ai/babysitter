#!/bin/bash
# Babysitter Stop Hook - delegates to SDK CLI
# All logic is implemented in: babysitter hook:run --hook-type stop

# If babysitter CLI is not installed yet, allow exit silently.
command -v babysitter &>/dev/null || { echo '{"decision":"allow"}'; exit 0; }

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
LOG_DIR="${BABYSITTER_LOG_DIR:-}"
LOG_FILE="${LOG_DIR:+$LOG_DIR/babysitter-stop-hook.log}"

# Diagnostic logging (when BABYSITTER_LOG_DIR is set)
if [ -n "$LOG_FILE" ]; then
  mkdir -p "$LOG_DIR" 2>/dev/null
  {
    echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) Hook script invoked"
    echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) PLUGIN_ROOT=$PLUGIN_ROOT"
  } >> "$LOG_FILE" 2>/dev/null
fi

# Capture stdin so we can log size and pass to CLI
INPUT_FILE=$(mktemp 2>/dev/null || echo "/tmp/hook-input-$$.json")
cat > "$INPUT_FILE"

if [ -n "$LOG_FILE" ]; then
  echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) Hook input received ($(wc -c < "$INPUT_FILE") bytes)" >> "$LOG_FILE" 2>/dev/null
fi

# Run the CLI, capturing stdout; redirect stderr to log if available
if [ -n "$LOG_DIR" ]; then
  RESULT=$(babysitter hook:run --hook-type stop --plugin-root "$PLUGIN_ROOT" --json < "$INPUT_FILE" 2>"$LOG_DIR/babysitter-stop-hook-stderr.log")
else
  RESULT=$(babysitter hook:run --hook-type stop --plugin-root "$PLUGIN_ROOT" --json < "$INPUT_FILE" 2>/dev/null)
fi
EXIT_CODE=$?

if [ -n "$LOG_FILE" ]; then
  echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) CLI exit code=$EXIT_CODE" >> "$LOG_FILE" 2>/dev/null
fi

rm -f "$INPUT_FILE" 2>/dev/null
printf '%s\n' "$RESULT"
exit $EXIT_CODE
