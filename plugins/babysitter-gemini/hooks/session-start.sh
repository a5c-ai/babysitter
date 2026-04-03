#!/bin/bash
# Babysitter SessionStart Hook for Gemini CLI
#
# Fires when a new Gemini CLI session begins.
# Ensures the babysitter SDK CLI is installed (from versions.json sdkVersion),
# then delegates to the TypeScript handler via babysitter hook:run.
#
# Protocol:
#   Input:  JSON via stdin (contains session_id, cwd, etc.)
#   Output: JSON via stdout ({} on success)
#   Stderr: debug/log output only
#   Exit 0: success
#   Exit 2: block (fatal error)

set -euo pipefail

EXTENSION_PATH="${GEMINI_EXTENSION_PATH:-$(cd "$(dirname "$0")/.." && pwd)}"
MARKER_FILE="${EXTENSION_PATH}/.babysitter-install-attempted"

LOG_DIR="${BABYSITTER_LOG_DIR:-${EXTENSION_PATH}/.a5c/logs}"
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

blog "SessionStart hook invoked"
blog "EXTENSION_PATH=$EXTENSION_PATH"

# ---------------------------------------------------------------------------
# Get required SDK version from versions.json
# ---------------------------------------------------------------------------

SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${EXTENSION_PATH}/versions.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}" 2>/dev/null || echo "latest")

# ---------------------------------------------------------------------------
# Function to install/upgrade SDK
# ---------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------
# Check if babysitter CLI exists and if version matches
# ---------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------
# Capture stdin to temp file (prevents stdin from keeping event loop alive)
# ---------------------------------------------------------------------------

INPUT_FILE=$(mktemp 2>/dev/null || echo "/tmp/bsitter-session-start-$$.json")
cat > "$INPUT_FILE"

blog "Hook input received ($(wc -c < "$INPUT_FILE") bytes)"

# ---------------------------------------------------------------------------
# Delegate to SDK CLI
# ---------------------------------------------------------------------------

RESULT=$(babysitter hook:run \
  --hook-type session-start \
  --harness gemini-cli \
  --plugin-root "$EXTENSION_PATH" \
  --state-dir ".a5c/state" \
  --verbose --json < "$INPUT_FILE" 2>"$LOG_DIR/babysitter-session-start-hook-stderr.log")
EXIT_CODE=$?

blog "CLI exit code=$EXIT_CODE"

rm -f "$INPUT_FILE" 2>/dev/null

# Output result (must be valid JSON on stdout)
if [ -n "$RESULT" ]; then
  printf '%s\n' "$RESULT"
else
  printf '{}\n'
fi

exit $EXIT_CODE
