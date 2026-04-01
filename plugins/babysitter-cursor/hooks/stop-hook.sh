#!/usr/bin/env bash
# Babysitter Stop Hook for Cursor IDE/CLI
# Drives the orchestration loop by checking run state on session stop.
#
# Protocol:
#   Input:  JSON via stdin (session context)
#   Output: JSON via stdout (with optional continue/stop signal)
#   Stderr: debug/log output only
#   Exit 0: success

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
STATE_DIR="${BABYSITTER_STATE_DIR:-${PWD}/.a5c}"
LOG_DIR="${BABYSITTER_LOG_DIR:-$PLUGIN_ROOT/.a5c/logs}"
LOG_FILE="$LOG_DIR/babysitter-stop-hook.log"

export CURSOR_PLUGIN_ROOT="${CURSOR_PLUGIN_ROOT:-${PLUGIN_ROOT}}"
export BABYSITTER_STATE_DIR="${STATE_DIR}"

mkdir -p "$LOG_DIR" 2>/dev/null

blog() {
  local msg="$1"
  local ts
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "[INFO] $ts $msg" >> "$LOG_FILE" 2>/dev/null
  babysitter log --type hook --label "hook:stop" --message "$msg" --source shell-hook 2>/dev/null || true
}

blog "Hook script invoked"
blog "PLUGIN_ROOT=$PLUGIN_ROOT"
blog "STATE_DIR=$STATE_DIR"

# Resolve babysitter CLI if not on PATH
if ! command -v babysitter &>/dev/null; then
  if [ -x "$HOME/.local/bin/babysitter" ]; then
    export PATH="$HOME/.local/bin:$PATH"
  else
    SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${PLUGIN_ROOT}/versions.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}" 2>/dev/null || echo "latest")
    babysitter() { npx -y "@a5c-ai/babysitter-sdk@${SDK_VERSION}" "$@"; }
    export -f babysitter
  fi
fi

INPUT_FILE=$(mktemp 2>/dev/null || echo "/tmp/cursor-stop-hook-$$.json")
cat > "$INPUT_FILE"

blog "Hook input received ($(wc -c < "$INPUT_FILE") bytes)"

RESULT=$(babysitter hook:run \
  --hook-type stop \
  --harness cursor \
  --plugin-root "$PLUGIN_ROOT" \
  --state-dir "${BABYSITTER_STATE_DIR}" \
  --json < "$INPUT_FILE" 2>"$LOG_DIR/babysitter-stop-hook-stderr.log")
EXIT_CODE=$?

blog "CLI exit code=$EXIT_CODE"

rm -f "$INPUT_FILE" 2>/dev/null
printf '%s\n' "$RESULT"
exit $EXIT_CODE
