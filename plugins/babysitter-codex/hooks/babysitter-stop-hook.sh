#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
STATE_DIR="${BABYSITTER_STATE_DIR:-${PWD}/.a5c}"
LOG_DIR="${BABYSITTER_LOG_DIR:-$PLUGIN_ROOT/.a5c/logs}"
LOG_FILE="$LOG_DIR/babysitter-stop-hook.log"

export CODEX_PLUGIN_ROOT="${CODEX_PLUGIN_ROOT:-${PLUGIN_ROOT}}"
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

INPUT_FILE=$(mktemp 2>/dev/null || echo "/tmp/codex-stop-hook-$$.json")
cat > "$INPUT_FILE"

blog "Hook input received ($(wc -c < "$INPUT_FILE") bytes)"

RESULT=$(babysitter hook:run \
  --hook-type stop \
  --harness codex \
  --plugin-root "${CODEX_PLUGIN_ROOT}" \
  --state-dir "${BABYSITTER_STATE_DIR}" \
  < "$INPUT_FILE" 2>"$LOG_DIR/babysitter-stop-hook-stderr.log")
EXIT_CODE=$?

blog "CLI exit code=$EXIT_CODE"

rm -f "$INPUT_FILE" 2>/dev/null
printf '%s\n' "$RESULT"
exit $EXIT_CODE
