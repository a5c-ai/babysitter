#!/bin/bash
# Babysitter userPromptSubmitted Hook for GitHub Copilot CLI
# Applies density-filter compression to long user prompts.
# Delegates to SDK CLI: babysitter hook:run --hook-type user-prompt-submitted
#
# NOTE: Output from this hook is IGNORED by Copilot CLI.
# This hook is for logging and side-effects only.

PLUGIN_ROOT="${COPILOT_PLUGIN_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"

if ! command -v babysitter &>/dev/null; then 
  # No CLI available — exit 0 (no-op, proceed with original command)
  exit 0
fi

LOG_DIR="${BABYSITTER_LOG_DIR:-$HOME/.a5c/logs}"
mkdir -p "$LOG_DIR" 2>/dev/null

INPUT_FILE=$(mktemp 2>/dev/null || echo "/tmp/hook-user-prompt-submitted-$$.json")
cat > "$INPUT_FILE"

babysitter log --type hook --label "hook:user-prompt-submitted" --message "Hook invoked" --source shell-hook 2>/dev/null || true

babysitter hook:run --hook-type user-prompt-submitted --harness github-copilot --json < "$INPUT_FILE" 2>"$LOG_DIR/babysitter-user-prompt-submitted-hook-stderr.log" || true

babysitter log --type hook --label "hook:user-prompt-submitted" --message "Hook complete" --source shell-hook 2>/dev/null || true

rm -f "$INPUT_FILE" 2>/dev/null

exit 0
