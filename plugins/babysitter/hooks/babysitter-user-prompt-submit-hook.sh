#!/bin/bash
# Babysitter UserPromptSubmit Hook - applies density-filter compression to long user prompts
# Delegates to SDK CLI: babysitter hook:run --hook-type user-prompt-submit

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"

# Resolve babysitter CLI: installed binary, user-local prefix, or no-op fallback
if ! command -v babysitter &>/dev/null; then
  if [ -x "$HOME/.local/bin/babysitter" ]; then
    export PATH="$HOME/.local/bin:$PATH"
  else
    # SDK not installed — session-start hook is responsible for installation.
    # Pass through unchanged so the prompt is not blocked.
    cat
    exit 0
  fi
fi

LOG_DIR="${BABYSITTER_LOG_DIR:-$PLUGIN_ROOT/.a5c/logs}"
mkdir -p "$LOG_DIR" 2>/dev/null

INPUT_FILE=$(mktemp 2>/dev/null || echo "/tmp/hook-user-prompt-submit-$$.json")
cat > "$INPUT_FILE"

babysitter log --type hook --label "hook:user-prompt-submit" --message "Hook invoked" --source shell-hook 2>/dev/null || true

RESULT=$(babysitter hook:run --hook-type user-prompt-submit --json < "$INPUT_FILE" 2>"$LOG_DIR/babysitter-user-prompt-submit-hook-stderr.log")
EXIT_CODE=$?

babysitter log --type hook --label "hook:user-prompt-submit" --message "CLI exit code=$EXIT_CODE" --source shell-hook 2>/dev/null || true

rm -f "$INPUT_FILE" 2>/dev/null

# Only output if non-empty — empty output means the hook failed; pass through silently
if [ -n "$RESULT" ]; then
  printf '%s\n' "$RESULT"
fi
exit $EXIT_CODE
