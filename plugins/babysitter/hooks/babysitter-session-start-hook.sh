#!/bin/bash
# Babysitter Session Start Hook - delegates to SDK CLI
# Ensures the babysitter CLI is installed (from versions.json sdkVersion),
# then delegates to the TypeScript handler.

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
MARKER_FILE="${PLUGIN_ROOT}/.babysitter-install-attempted"

LOG_DIR="${BABYSITTER_LOG_DIR:-.a5c/logs}"
LOG_FILE="$LOG_DIR/babysitter-session-start-hook.log"
mkdir -p "$LOG_DIR" 2>/dev/null

echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) Hook script invoked" >> "$LOG_FILE" 2>/dev/null
echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) PLUGIN_ROOT=$PLUGIN_ROOT" >> "$LOG_FILE" 2>/dev/null

# Get required SDK version from versions.json
SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${PLUGIN_ROOT}/versions.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}" 2>/dev/null || echo "latest")

# Function to install/upgrade SDK
install_sdk() {
  local target_version="$1"
  # Try global install first, fall back to user-local if permissions fail
  if npm i -g "@a5c-ai/babysitter-sdk@${target_version}" --loglevel=error 2>/dev/null; then
    echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) Installed SDK globally (${target_version})" >> "$LOG_FILE" 2>/dev/null
    return 0
  else
    # Global install failed (permissions) — try user-local prefix
    if npm i -g "@a5c-ai/babysitter-sdk@${target_version}" --prefix "$HOME/.local" --loglevel=error 2>/dev/null; then
      export PATH="$HOME/.local/bin:$PATH"
      echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) Installed SDK to user prefix (${target_version})" >> "$LOG_FILE" 2>/dev/null
      return 0
    fi
  fi
  return 1
}

# Check if babysitter CLI exists and if version matches
NEEDS_INSTALL=false
if command -v babysitter &>/dev/null; then
  CURRENT_VERSION=$(babysitter --version 2>/dev/null || echo "unknown")
  if [ "$CURRENT_VERSION" != "$SDK_VERSION" ]; then
    echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) SDK version mismatch: installed=${CURRENT_VERSION}, required=${SDK_VERSION}" >> "$LOG_FILE" 2>/dev/null
    NEEDS_INSTALL=true
  else
    echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) SDK version OK: ${CURRENT_VERSION}" >> "$LOG_FILE" 2>/dev/null
  fi
else
  echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) SDK CLI not found, will install" >> "$LOG_FILE" 2>/dev/null
  NEEDS_INSTALL=true
fi

# Install/upgrade if needed (only attempt once per plugin version)
if [ "$NEEDS_INSTALL" = true ] && [ ! -f "$MARKER_FILE" ]; then
  install_sdk "$SDK_VERSION"
  echo "$SDK_VERSION" > "$MARKER_FILE" 2>/dev/null
fi

# If still not available after install attempt, try npx as last resort
if ! command -v babysitter &>/dev/null; then
  echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) CLI not found after install, using npx fallback" >> "$LOG_FILE" 2>/dev/null
  babysitter() { npx -y "@a5c-ai/babysitter-sdk@${SDK_VERSION}" "$@"; }
  export -f babysitter
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
