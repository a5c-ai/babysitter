#!/bin/bash
# Babysitter PreToolUse Hook - rewrites compressible bash commands to pipe through compress-output
# Delegates to SDK CLI: babysitter hook:run --hook-type pre-tool-use

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"

if ! command -v babysitter &>/dev/null; then 
  # No CLI available — exit 0 (no-op, proceed with original command)
  exit 0
fi

GLOBAL_ROOT="${BABYSITTER_GLOBAL_STATE_DIR:-$HOME/.a5c}"
LOG_DIR="${BABYSITTER_LOG_DIR:-${GLOBAL_ROOT}/logs}"
mkdir -p "$LOG_DIR" 2>/dev/null

INPUT_FILE=$(mktemp 2>/dev/null || echo "/tmp/hook-pre-tool-use-$$.json")
cat > "$INPUT_FILE"

babysitter log --type hook --label "hook:pre-tool-use" --message "Hook invoked" --source shell-hook 2>/dev/null || true

RESULT=$(babysitter hook:run --hook-type pre-tool-use --json < "$INPUT_FILE" 2>"$LOG_DIR/babysitter-pre-tool-use-hook-stderr.log")
EXIT_CODE=$?

babysitter log --type hook --label "hook:pre-tool-use" --message "CLI exit code=$EXIT_CODE" --source shell-hook 2>/dev/null || true

rm -f "$INPUT_FILE" 2>/dev/null

# Only output if non-empty — empty means no rewrite (compression disabled or command not compressible)
if [ -n "$RESULT" ]; then
  printf '%s\n' "$RESULT"
fi
exit $EXIT_CODE
