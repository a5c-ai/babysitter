#!/bin/bash
# Babysitter Stop Hook - delegates to SDK CLI
# All logic is implemented in: babysitter hook:run --hook-type stop

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"

# Resolve babysitter CLI: installed binary, user-local prefix, or npx fallback
if ! command -v babysitter &>/dev/null; then
  # Try user-local prefix (set by session-start hook)
  if [ -x "$HOME/.local/bin/babysitter" ]; then
    export PATH="$HOME/.local/bin:$PATH"
  else
    # Last resort: npx fallback
    SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${PLUGIN_ROOT}/plugin.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}" 2>/dev/null || echo "latest")
    if [ -n "$SDK_VERSION" ]; then
      babysitter() { npx -y "@a5c-ai/babysitter-sdk@${SDK_VERSION}" "$@"; }
    else
      # No CLI available at all — allow exit silently
      echo '{}'
      exit 0
    fi
  fi
fi
LOG_DIR="${BABYSITTER_LOG_DIR:-.a5c/logs}"
LOG_FILE="$LOG_DIR/babysitter-stop-hook.log"

mkdir -p "$LOG_DIR" 2>/dev/null
{
  echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) Hook script invoked"
  echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) PLUGIN_ROOT=$PLUGIN_ROOT"
} >> "$LOG_FILE" 2>/dev/null

# Capture stdin so we can log size and pass to CLI
INPUT_FILE=$(mktemp 2>/dev/null || echo "/tmp/hook-input-$$.json")
cat > "$INPUT_FILE"

echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) Hook input received ($(wc -c < "$INPUT_FILE") bytes)" >> "$LOG_FILE" 2>/dev/null

# Run the CLI, capturing stdout; redirect stderr to log
RESULT=$(babysitter hook:run --hook-type stop --harness claude-code --plugin-root "$PLUGIN_ROOT" --json < "$INPUT_FILE" 2>"$LOG_DIR/babysitter-stop-hook-stderr.log")
EXIT_CODE=$?

echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) CLI exit code=$EXIT_CODE" >> "$LOG_FILE" 2>/dev/null

rm -f "$INPUT_FILE" 2>/dev/null
printf '%s\n' "$RESULT"
exit $EXIT_CODE
