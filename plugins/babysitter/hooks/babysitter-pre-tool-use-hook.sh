#!/bin/bash
# Babysitter PreToolUse Hook - rewrites compressible bash commands to pipe through compress-output
# Delegates to SDK CLI: babysitter hook:run --hook-type pre-tool-use

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"

# Resolve babysitter CLI: installed binary, user-local prefix, or npx fallback
if ! command -v babysitter &>/dev/null; then
  if [ -x "$HOME/.local/bin/babysitter" ]; then
    export PATH="$HOME/.local/bin:$PATH"
  else
    SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${PLUGIN_ROOT}/versions.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}" 2>/dev/null || echo "latest")
    if [ -n "$SDK_VERSION" ]; then
      babysitter() { npx -y "@a5c-ai/babysitter-sdk@${SDK_VERSION}" "$@"; }
      export -f babysitter
    else
      # No CLI available — exit 0 (no-op, proceed with original command)
      exit 0
    fi
  fi
fi

LOG_DIR="${BABYSITTER_LOG_DIR:-.a5c/logs}"
mkdir -p "$LOG_DIR" 2>/dev/null

INPUT_FILE=$(mktemp 2>/dev/null || echo "/tmp/hook-pre-tool-use-$$.json")
cat > "$INPUT_FILE"

RESULT=$(babysitter hook:run --hook-type pre-tool-use --json < "$INPUT_FILE" 2>"$LOG_DIR/babysitter-pre-tool-use-hook-stderr.log")
EXIT_CODE=$?

rm -f "$INPUT_FILE" 2>/dev/null

# Only output if non-empty — empty means no rewrite (compression disabled or command not compressible)
if [ -n "$RESULT" ]; then
  printf '%s\n' "$RESULT"
fi
exit $EXIT_CODE
