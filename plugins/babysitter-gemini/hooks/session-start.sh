#!/bin/bash
# Babysitter SessionStart Hook for Gemini CLI
#
# Fires when a new Gemini CLI session begins.
# Ensures the babysitter SDK CLI is installed, then creates a baseline
# session state file so the AfterAgent hook can track orchestration state.
#
# Protocol:
#   Input:  JSON via stdin (contains session_id, cwd, etc.)
#   Output: JSON via stdout ({} on success)
#   Stderr: debug/log output only
#   Exit 0: success
#   Exit 2: block (fatal error)

set -euo pipefail

EXTENSION_PATH="${GEMINI_EXTENSION_PATH:-$(cd "$(dirname "$0")/.." && pwd)}"
LOG_DIR="${BABYSITTER_LOG_DIR:-.a5c/logs}"
LOG_FILE="$LOG_DIR/babysitter-session-start-hook.log"
mkdir -p "$LOG_DIR" 2>/dev/null

blog() {
  local msg="$1"
  local ts
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "[INFO] $ts $msg" >> "$LOG_FILE" 2>/dev/null
  if command -v babysitter &>/dev/null; then
    babysitter log --type hook --label "hook:session-start" --message "$msg" --source shell-hook 2>/dev/null || true
  fi
}

blog "SessionStart hook invoked"
blog "EXTENSION_PATH=$EXTENSION_PATH"

# ---------------------------------------------------------------------------
# Ensure babysitter CLI is available
# ---------------------------------------------------------------------------

if ! command -v babysitter &>/dev/null; then
  SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${EXTENSION_PATH}/versions.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}" 2>/dev/null || echo "latest")

  blog "babysitter CLI not found, installing SDK@${SDK_VERSION}"

  if npm i -g "@a5c-ai/babysitter-sdk@${SDK_VERSION}" --loglevel=error 2>/dev/null; then
    blog "Installed SDK globally"
  elif npm i -g "@a5c-ai/babysitter-sdk@${SDK_VERSION}" --prefix "$HOME/.local" --loglevel=error 2>/dev/null; then
    export PATH="$HOME/.local/bin:$PATH"
    blog "Installed SDK to user prefix"
  else
    blog "SDK install failed; will use npx"
    # Define npx fallback
    SDK_VERSION_FINAL=${SDK_VERSION:-latest}
    babysitter() { npx -y "@a5c-ai/babysitter-sdk@${SDK_VERSION_FINAL}" "$@"; }
    export -f babysitter
  fi
fi

blog "babysitter CLI resolved"

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
  --state-dir ".a5c/state" \
  --json < "$INPUT_FILE" 2>>"$LOG_DIR/babysitter-session-start-hook-stderr.log")
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
