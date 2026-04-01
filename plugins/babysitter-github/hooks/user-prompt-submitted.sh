#!/bin/bash
# Babysitter userPromptSubmitted Hook for GitHub Copilot CLI
# Applies density-filter compression to long user prompts.
# Delegates to SDK CLI: babysitter hook:run --hook-type user-prompt-submitted
#
# NOTE: Output from this hook is IGNORED by Copilot CLI.
# This hook is for logging and side-effects only.

PLUGIN_ROOT="${COPILOT_PLUGIN_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"

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
      # No CLI available -- exit silently
      exit 0
    fi
  fi
fi

LOG_DIR="${BABYSITTER_LOG_DIR:-$PLUGIN_ROOT/.a5c/logs}"
mkdir -p "$LOG_DIR" 2>/dev/null

INPUT_FILE=$(mktemp 2>/dev/null || echo "/tmp/hook-user-prompt-submitted-$$.json")
cat > "$INPUT_FILE"

babysitter log --type hook --label "hook:user-prompt-submitted" --message "Hook invoked" --source shell-hook 2>/dev/null || true

babysitter hook:run --hook-type user-prompt-submitted --harness github-copilot --json < "$INPUT_FILE" 2>"$LOG_DIR/babysitter-user-prompt-submitted-hook-stderr.log" || true

babysitter log --type hook --label "hook:user-prompt-submitted" --message "Hook complete" --source shell-hook 2>/dev/null || true

rm -f "$INPUT_FILE" 2>/dev/null

exit 0
