#!/bin/bash
# Babysitter SessionStart Hook for Codex CLI
# Initializes babysitter session when Codex starts

PLUGIN_ROOT="${CODEX_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
SDK_VERSION="${BABYSITTER_SDK_VERSION:-0.0.173}"

# Resolve babysitter CLI
if ! command -v babysitter &>/dev/null; then
  if [ -x "$HOME/.local/bin/babysitter" ]; then
    export PATH="$HOME/.local/bin:$PATH"
  else
    babysitter() { npx -y "@a5c-ai/babysitter-sdk@${SDK_VERSION}" "$@"; }
  fi
fi

LOG_DIR="${BABYSITTER_LOG_DIR:-.a5c/logs}"
LOG_FILE="$LOG_DIR/babysitter-session-start.log"
mkdir -p "$LOG_DIR" 2>/dev/null

{
  echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) SessionStart hook invoked"
  echo "[INFO] PLUGIN_ROOT=$PLUGIN_ROOT"
} >> "$LOG_FILE" 2>/dev/null

# Capture stdin
INPUT_FILE=$(mktemp 2>/dev/null || echo "/tmp/session-start-$$.json")
cat > "$INPUT_FILE"

echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) Input received ($(wc -c < "$INPUT_FILE") bytes)" >> "$LOG_FILE" 2>/dev/null

# Run the SDK hook (try codex harness first, then claude-code fallback for older SDK builds)
RESULT=$(babysitter hook:run --hook-type session-start --harness codex --plugin-root "$PLUGIN_ROOT" --json < "$INPUT_FILE" 2>>"$LOG_DIR/babysitter-session-start-stderr.log")
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
  RESULT=$(babysitter hook:run --hook-type session-start --harness claude-code --plugin-root "$PLUGIN_ROOT" --json < "$INPUT_FILE" 2>>"$LOG_DIR/babysitter-session-start-stderr.log")
  EXIT_CODE=$?
fi

echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) CLI exit code=$EXIT_CODE" >> "$LOG_FILE" 2>/dev/null

rm -f "$INPUT_FILE" 2>/dev/null

if [ $EXIT_CODE -ne 0 ]; then
  # Non-fatal: allow session to start even if hook fails
  echo '{}'
  exit 0
fi

printf '%s\n' "$RESULT"
exit 0
