#!/bin/bash
# Post Tool Use Hook — post-execution processing.
# Same pattern as pre-tool-use: conditional output.
#
# Env: ADAPTER_NAME (required), PLUGIN_ROOT (optional, auto-detected)

set -euo pipefail

ADAPTER_NAME="${ADAPTER_NAME:-opencode}"
PLUGIN_ROOT="${PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"

GLOBAL_ROOT="${BABYSITTER_GLOBAL_STATE_DIR:-$HOME/.a5c}"
LOG_DIR="${BABYSITTER_LOG_DIR:-${GLOBAL_ROOT}/logs}"
mkdir -p "$LOG_DIR" 2>/dev/null

SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${PLUGIN_ROOT}/versions.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}" 2>/dev/null || echo "latest")

PROXY=""
command -v a5c-hooks-proxy &>/dev/null && PROXY="a5c-hooks-proxy"
[ -z "$PROXY" ] && [ -f "$HOME/.local/bin/a5c-hooks-proxy" ] && { export PATH="$HOME/.local/bin:$PATH"; PROXY="a5c-hooks-proxy"; }
[ -z "$PROXY" ] && PROXY="npx -y @a5c-ai/hooks-proxy-cli@${SDK_VERSION} "

INPUT_FILE=$(mktemp 2>/dev/null || echo "/tmp/hook-potu-$$.json")
cat > "$INPUT_FILE"

STDERR_LOG="$LOG_DIR/hook-post-tool-use-stderr.log"
RESULT=$($PROXY invoke \
  --adapter "$ADAPTER_NAME" \
  --handler "babysitter hook:run --harness unified --hook-type post-tool-use --json" \
  --json \
  < "$INPUT_FILE" 2>"$STDERR_LOG") || true

rm -f "$INPUT_FILE" 2>/dev/null
[ -n "$RESULT" ] && printf '%s\n' "$RESULT"
exit 0
