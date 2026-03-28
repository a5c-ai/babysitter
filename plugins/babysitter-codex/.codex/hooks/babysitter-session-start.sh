#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
STATE_DIR="${BABYSITTER_STATE_DIR:-${PWD}/.a5c}"
LOG_DIR="${BABYSITTER_LOG_DIR:-$PLUGIN_ROOT/.a5c/logs}"
LOG_FILE="$LOG_DIR/babysitter-session-start-hook.log"

export CODEX_PLUGIN_ROOT="${CODEX_PLUGIN_ROOT:-${PLUGIN_ROOT}}"
export BABYSITTER_STATE_DIR="${STATE_DIR}"

mkdir -p "$LOG_DIR" 2>/dev/null
{
  echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) Hook script invoked"
  echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) PLUGIN_ROOT=$PLUGIN_ROOT"
  echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) STATE_DIR=$STATE_DIR"
} >> "$LOG_FILE" 2>/dev/null

INPUT_FILE=$(mktemp 2>/dev/null || echo "/tmp/codex-session-start-hook-$$.json")
cat > "$INPUT_FILE"

echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) Hook input received ($(wc -c < "$INPUT_FILE") bytes)" >> "$LOG_FILE" 2>/dev/null

RESULT=$(babysitter hook:run \
  --hook-type session-start \
  --harness codex \
  --plugin-root "${CODEX_PLUGIN_ROOT}" \
  --state-dir "${BABYSITTER_STATE_DIR}" \
  < "$INPUT_FILE" 2>"$LOG_DIR/babysitter-session-start-hook-stderr.log")
EXIT_CODE=$?

echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) CLI exit code=$EXIT_CODE" >> "$LOG_FILE" 2>/dev/null

rm -f "$INPUT_FILE" 2>/dev/null
printf '%s\n' "$RESULT"
exit $EXIT_CODE
