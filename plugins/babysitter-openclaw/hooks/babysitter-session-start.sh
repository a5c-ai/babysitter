#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
STATE_DIR="${BABYSITTER_STATE_DIR:-${PWD}/.a5c}"
LOG_DIR="${BABYSITTER_LOG_DIR:-$HOME/.a5c/logs}"
LOG_FILE="$LOG_DIR/babysitter-session-start-hook.log"

export OPENCLAW_PLUGIN_ROOT="${OPENCLAW_PLUGIN_ROOT:-${PLUGIN_ROOT}}"
export BABYSITTER_STATE_DIR="${STATE_DIR}"

mkdir -p "$LOG_DIR" 2>/dev/null

blog() {
  local msg="$1"
  local ts
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "[INFO] $ts $msg" >> "$LOG_FILE" 2>/dev/null
  babysitter log --type hook --label "hook:session-start" --message "$msg" --source shell-hook 2>/dev/null || true
}

blog "Hook script invoked"
blog "PLUGIN_ROOT=$PLUGIN_ROOT"
blog "STATE_DIR=$STATE_DIR"

# Get required SDK version from versions.json
SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${PLUGIN_ROOT}/versions.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}" 2>/dev/null || echo "latest")

# Ensure babysitter CLI is available
if ! command -v babysitter &>/dev/null; then
  if [ -x "$HOME/.local/bin/babysitter" ]; then
    export PATH="$HOME/.local/bin:$PATH"
  else
    if npm i -g "@a5c-ai/babysitter-sdk@${SDK_VERSION}" --loglevel=error 2>/dev/null; then
      blog "Installed SDK globally (${SDK_VERSION})"
    elif npm i -g "@a5c-ai/babysitter-sdk@${SDK_VERSION}" --prefix "$HOME/.local" --loglevel=error 2>/dev/null; then
      export PATH="$HOME/.local/bin:$PATH"
      blog "Installed SDK to user prefix (${SDK_VERSION})"
    fi
  fi
fi

INPUT_FILE=$(mktemp 2>/dev/null || echo "/tmp/openclaw-session-start-hook-$$.json")
cat > "$INPUT_FILE"

blog "Hook input received ($(wc -c < "$INPUT_FILE") bytes)"

RESULT=$(babysitter hook:run \
  --hook-type session-start \
  --harness openclaw \
  --plugin-root "${OPENCLAW_PLUGIN_ROOT}" \
  --state-dir "${BABYSITTER_STATE_DIR}" \
  < "$INPUT_FILE" 2>"$LOG_DIR/babysitter-session-start-hook-stderr.log")
EXIT_CODE=$?

blog "CLI exit code=$EXIT_CODE"

rm -f "$INPUT_FILE" 2>/dev/null
printf '%s\n' "$RESULT"
exit $EXIT_CODE
