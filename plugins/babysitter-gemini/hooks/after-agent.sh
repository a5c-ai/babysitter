#!/bin/bash
# Babysitter AfterAgent Hook for Gemini CLI
#
# This is the CORE orchestration loop driver for Gemini CLI.
# Fires after every agent turn. Checks if a babysitter run is bound to this
# session; if so, blocks the session exit to continue iterating until the run
# completes or the completion proof is detected.
#
# Protocol:
#   Input:  JSON via stdin (contains session_id, prompt_response, etc.)
#   Output: JSON via stdout
#     - {} or {"decision":"allow"} → allow session to exit normally
#     - {"decision":"block","reason":"...","systemMessage":"..."} → continue loop
#   Stderr: debug/log output only
#   Exit 0: success (stdout parsed as JSON)
#   Exit 2: block immediately (stderr used as rejection reason)
#
# Completion detection:
#   The agent must output <promise>COMPLETION_PROOF</promise> in its response.
#   The SDK verifies the proof matches the run's completionProof field.

set -uo pipefail

EXTENSION_PATH="${GEMINI_EXTENSION_PATH:-$(cd "$(dirname "$0")/.." && pwd)}"
LOG_DIR="${BABYSITTER_LOG_DIR:-.a5c/logs}"
LOG_FILE="$LOG_DIR/babysitter-after-agent-hook.log"
mkdir -p "$LOG_DIR" 2>/dev/null

blog() {
  local msg="$1"
  local ts
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "[INFO] $ts $msg" >> "$LOG_FILE" 2>/dev/null
  if command -v babysitter &>/dev/null; then
    babysitter log --type hook --label "hook:after-agent" --message "$msg" --source shell-hook 2>/dev/null || true
  fi
}

blog "AfterAgent hook invoked"

# ---------------------------------------------------------------------------
# Resolve babysitter CLI
# ---------------------------------------------------------------------------

if ! command -v babysitter &>/dev/null; then
  if [ -x "$HOME/.local/bin/babysitter" ]; then
    export PATH="$HOME/.local/bin:$PATH"
  else
    SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${EXTENSION_PATH}/versions.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}" 2>/dev/null || echo "latest")
    babysitter() { npx -y "@a5c-ai/babysitter-sdk@${SDK_VERSION:-latest}" "$@"; }
    export -f babysitter
  fi
fi

blog "babysitter CLI resolved"

# ---------------------------------------------------------------------------
# Capture stdin (prevents keeping event loop alive)
# ---------------------------------------------------------------------------

INPUT_FILE=$(mktemp 2>/dev/null || echo "/tmp/bsitter-after-agent-$$.json")
cat > "$INPUT_FILE"

INPUT_SIZE=$(wc -c < "$INPUT_FILE" 2>/dev/null || echo "?")
blog "Hook input received ($INPUT_SIZE bytes)"

# ---------------------------------------------------------------------------
# Delegate to SDK CLI (hook:run --hook-type stop --harness gemini-cli)
# The gemini-cli adapter reads AfterAgent input format and outputs the
# appropriate block/approve decision.
# ---------------------------------------------------------------------------

RESULT=$(babysitter hook:run \
  --hook-type stop \
  --harness gemini-cli \
  --state-dir ".a5c/state" \
  --json < "$INPUT_FILE" 2>>"$LOG_DIR/babysitter-after-agent-hook-stderr.log")
EXIT_CODE=$?

blog "CLI exit code=$EXIT_CODE result_len=$(echo -n "$RESULT" | wc -c)"

rm -f "$INPUT_FILE" 2>/dev/null

# Output result (must be valid JSON on stdout only)
if [ -n "$RESULT" ]; then
  printf '%s\n' "$RESULT"
else
  printf '{}\n'
fi

exit $EXIT_CODE
