#!/bin/bash
# Babysitter Session Start Hook - delegates to SDK CLI
# Ensures the babysitter CLI is installed (from plugin.json sdkVersion),
# then delegates to the TypeScript handler.

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
MARKER_FILE="${PLUGIN_ROOT}/.babysitter-install-attempted"

LOG_DIR="${BABYSITTER_LOG_DIR:-.a5c/logs}"
LOG_FILE="$LOG_DIR/babysitter-session-start-hook.log"
mkdir -p "$LOG_DIR" 2>/dev/null

echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) Hook script invoked" >> "$LOG_FILE" 2>/dev/null
echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) PLUGIN_ROOT=$PLUGIN_ROOT" >> "$LOG_FILE" 2>/dev/null

# Install babysitter CLI if not available (only attempt once per plugin install)
if ! command -v babysitter &>/dev/null; then
  if [ ! -f "$MARKER_FILE" ]; then
    SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${PLUGIN_ROOT}/plugin.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}" 2>/dev/null || echo "latest")
    # Try global install first, fall back to user-local if permissions fail
    if npm i -g "@a5c-ai/babysitter-sdk@${SDK_VERSION}" --loglevel=error 2>/dev/null; then
      echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) Installed SDK globally (${SDK_VERSION})" >> "$LOG_FILE" 2>/dev/null
    else
      # Global install failed (permissions) — try user-local prefix
      npm i -g "@a5c-ai/babysitter-sdk@${SDK_VERSION}" --prefix "$HOME/.local" --loglevel=error 2>/dev/null && \
        export PATH="$HOME/.local/bin:$PATH"
      echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) Installed SDK to user prefix (${SDK_VERSION})" >> "$LOG_FILE" 2>/dev/null
    fi
    echo "$SDK_VERSION" > "$MARKER_FILE" 2>/dev/null
  fi
  # If still not available after install attempt, try npx as last resort
  if ! command -v babysitter &>/dev/null; then
    SDK_VERSION=${SDK_VERSION:-$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${PLUGIN_ROOT}/plugin.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}" 2>/dev/null || echo "latest")}
    echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) CLI not found after install, using npx fallback" >> "$LOG_FILE" 2>/dev/null
    babysitter() { npx -y "@a5c-ai/babysitter-sdk@${SDK_VERSION}" "$@"; }
    export -f babysitter
  fi
fi

# Capture stdin to a temp file so the CLI receives a clean EOF
# (piping /dev/stdin directly can keep the Node.js event loop alive)
INPUT_FILE=$(mktemp 2>/dev/null || echo "/tmp/hook-session-start-$$.json")
cat > "$INPUT_FILE"

echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) Hook input received ($(wc -c < "$INPUT_FILE") bytes)" >> "$LOG_FILE" 2>/dev/null

RESULT=$(babysitter hook:run --hook-type session-start --harness claude-code --plugin-root "$PLUGIN_ROOT" --json < "$INPUT_FILE" 2>"$LOG_DIR/babysitter-session-start-hook-stderr.log")
EXIT_CODE=$?

echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) CLI exit code=$EXIT_CODE" >> "$LOG_FILE" 2>/dev/null

rm -f "$INPUT_FILE" 2>/dev/null
printf '%s\n' "$RESULT"
exit $EXIT_CODE
