#!/usr/bin/env bash
set -euo pipefail
HOOK_INPUT=$(cat)
LOG_FILE="${BABYSITTER_LOG_FILE:-${STATE_DIR:-/tmp}/babysitter.log}"
CLI="${BABYSITTER_CLI:-babysitter}"
echo "$HOOK_INPUT" | "$CLI" hook:log --hook-type "on-run-start" --log-file "$LOG_FILE" 2>/dev/null || true
