#!/bin/bash
# Babysitter Session Start Hook - delegates to SDK CLI
# Ensures the babysitter CLI is installed (from versions.json sdkVersion),
# then delegates to the TypeScript handler.

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
MARKER_FILE="${PLUGIN_ROOT}/.babysitter-install-attempted"

LOG_DIR="${BABYSITTER_LOG_DIR:-$PLUGIN_ROOT/.a5c/logs}"
LOG_FILE="$LOG_DIR/babysitter-session-start-hook.log"
mkdir -p "$LOG_DIR" 2>/dev/null

# Structured logging helper — writes to both local and global log
blog() {
  local msg="$1"
  local ts
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "[INFO] $ts $msg" >> "$LOG_FILE" 2>/dev/null
  # Use CLI structured logging when available; fall back to direct append
  if command -v babysitter &>/dev/null; then
    babysitter log --type hook --label "hook:session-start" --message "$msg" --source shell-hook 2>/dev/null || true
  fi
}

blog "Hook script invoked"
blog "PLUGIN_ROOT=$PLUGIN_ROOT"

# Get required SDK version from versions.json
SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${PLUGIN_ROOT}/versions.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}" 2>/dev/null || echo "latest")

# Function to install/upgrade SDK
install_sdk() {
  local target_version="$1"
  # Try global install first, fall back to user-local if permissions fail
  if npm i -g "@a5c-ai/babysitter-sdk@${target_version}" --loglevel=error 2>/dev/null; then
    blog "Installed SDK globally (${target_version})"
    return 0
  else
    # Global install failed (permissions) — try user-local prefix
    if npm i -g "@a5c-ai/babysitter-sdk@${target_version}" --prefix "$HOME/.local" --loglevel=error 2>/dev/null; then
      export PATH="$HOME/.local/bin:$PATH"
      blog "Installed SDK to user prefix (${target_version})"
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
    blog "SDK version mismatch: installed=${CURRENT_VERSION}, required=${SDK_VERSION}"
    NEEDS_INSTALL=true
  else
    blog "SDK version OK: ${CURRENT_VERSION}"
  fi
else
  blog "SDK CLI not found, will install"
  NEEDS_INSTALL=true
fi

# Install/upgrade if needed (only attempt once per plugin version)
if [ "$NEEDS_INSTALL" = true ] && [ ! -f "$MARKER_FILE" ]; then
  install_sdk "$SDK_VERSION"
  echo "$SDK_VERSION" > "$MARKER_FILE" 2>/dev/null
fi

# If still not available after install attempt, try npx as last resort
if ! command -v babysitter &>/dev/null; then
  blog "CLI not found after install, using npx fallback"
  babysitter() { npx -y "@a5c-ai/babysitter-sdk@${SDK_VERSION}" "$@"; }
  export -f babysitter
fi

# Capture stdin to a temp file so the CLI receives a clean EOF
# (piping /dev/stdin directly can keep the Node.js event loop alive)
INPUT_FILE=$(mktemp 2>/dev/null || echo "/tmp/hook-session-start-$$.json")
cat > "$INPUT_FILE"

blog "Hook input received ($(wc -c < "$INPUT_FILE") bytes)"

RESULT=$(babysitter hook:run --hook-type session-start --harness claude-code --plugin-root "$PLUGIN_ROOT" --verbose --json < "$INPUT_FILE" 2>"$LOG_DIR/babysitter-session-start-hook-stderr.log")
EXIT_CODE=$?

blog "CLI exit code=$EXIT_CODE"

rm -f "$INPUT_FILE" 2>/dev/null
printf '%s\n' "$RESULT"
exit $EXIT_CODE
