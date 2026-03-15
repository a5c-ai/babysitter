#!/bin/bash
# Babysitter Stop Hook for Codex CLI
# Drives the orchestration loop — blocks premature exit during active runs

PLUGIN_ROOT="${CODEX_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
SDK_VERSION="${BABYSITTER_SDK_VERSION:-0.0.173}"
SDK_PACKAGE="${BABYSITTER_SDK_PACKAGE:-@a5c-ai/babysitter-sdk@${SDK_VERSION}}"

# Resolve babysitter CLI
if ! command -v babysitter &>/dev/null; then
  if [ -x "$HOME/.local/bin/babysitter" ]; then
    export PATH="$HOME/.local/bin:$PATH"
  else
    babysitter() { npx -y "${SDK_PACKAGE}" "$@"; }
  fi
fi

LOG_DIR="${BABYSITTER_LOG_DIR:-.a5c/logs}"
LOG_FILE="$LOG_DIR/babysitter-stop-hook.log"
mkdir -p "$LOG_DIR" 2>/dev/null

{
  echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) Stop hook invoked"
  echo "[INFO] PLUGIN_ROOT=$PLUGIN_ROOT"
} >> "$LOG_FILE" 2>/dev/null

# Capture stdin (hook input from Codex)
INPUT_FILE=$(mktemp 2>/dev/null || echo "/tmp/stop-hook-$$.json")
cat > "$INPUT_FILE"

echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) Input received ($(wc -c < "$INPUT_FILE") bytes)" >> "$LOG_FILE" 2>/dev/null

# Run the SDK stop hook — it decides whether to block exit or allow it
RESULT=$(babysitter hook:run --hook-type stop --harness codex --plugin-root "$PLUGIN_ROOT" --json < "$INPUT_FILE" 2>>"$LOG_DIR/babysitter-stop-hook-stderr.log")
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
  RESULT=$(babysitter hook:run --hook-type stop --harness claude-code --plugin-root "$PLUGIN_ROOT" --json < "$INPUT_FILE" 2>>"$LOG_DIR/babysitter-stop-hook-stderr.log")
  EXIT_CODE=$?
fi

echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) CLI exit code=$EXIT_CODE" >> "$LOG_FILE" 2>/dev/null

rm -f "$INPUT_FILE" 2>/dev/null

if [ $EXIT_CODE -ne 0 ]; then
  # On error, allow exit (fail-safe)
  echo '{}'
  exit 0
fi

printf '%s\n' "$RESULT"
exit $EXIT_CODE
