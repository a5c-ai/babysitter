#!/bin/bash
# Babysitter Stop Hook for Codex CLI
# Drives the orchestration loop - blocks premature exit during active runs

PLUGIN_ROOT="${CODEX_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
SDK_VERSION="${BABYSITTER_SDK_VERSION:-0.0.173}"
SDK_PACKAGE="${BABYSITTER_SDK_PACKAGE:-@a5c-ai/babysitter-sdk@${SDK_VERSION}}"

# Resolve babysitter CLI
if ! command -v babysitter &>/dev/null; then
  if [ -x "$HOME/.local/bin/babysitter" ]; then
    export PATH="$HOME/.local/bin:$PATH"
  else
    babysitter() { npx -y "${SDK_PACKAGE}" "$@"; }
  fi
fi

LOG_DIR="${BABYSITTER_LOG_DIR:-.a5c/logs}"
LOG_FILE="$LOG_DIR/babysitter-stop-hook.log"
mkdir -p "$LOG_DIR" 2>/dev/null

{
  echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) Stop hook invoked"
  echo "[INFO] PLUGIN_ROOT=$PLUGIN_ROOT"
} >> "$LOG_FILE" 2>/dev/null

# Capture stdin (hook input from Codex)
INPUT_FILE=$(mktemp 2>/dev/null || echo "/tmp/stop-hook-$$.json")
cat > "$INPUT_FILE"

echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) Input received ($(wc -c < "$INPUT_FILE") bytes)" >> "$LOG_FILE" 2>/dev/null

# Run the SDK stop hook when available.
# Some SDK versions do not expose hook:run; in that case we rely on local fallback logic.
RESULT=""
EXIT_CODE=1
if babysitter --help 2>/dev/null | grep -q "hook:run"; then
  RESULT=$(babysitter hook:run --hook-type stop --harness codex --plugin-root "$PLUGIN_ROOT" --json < "$INPUT_FILE" 2>>"$LOG_DIR/babysitter-stop-hook-stderr.log")
  EXIT_CODE=$?
  if [ $EXIT_CODE -ne 0 ]; then
    RESULT=$(babysitter hook:run --hook-type stop --harness claude-code --plugin-root "$PLUGIN_ROOT" --json < "$INPUT_FILE" 2>>"$LOG_DIR/babysitter-stop-hook-stderr.log")
    EXIT_CODE=$?
  fi
else
  echo "[WARN] $(date -u +%Y-%m-%dT%H:%M:%SZ) hook:run unsupported by SDK; using fallback decision engine" >> "$LOG_FILE" 2>/dev/null
fi

# Normalize empty SDK stop responses to an explicit approve decision.
emit_sdk_result() {
  if printf '%s' "$RESULT" | grep -q '"decision"'; then
    printf '%s\n' "$RESULT"
  else
    printf '%s\n' '{"decision":"approve","reason":"sdk_pass_through"}'
  fi
}

echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) CLI exit code=$EXIT_CODE" >> "$LOG_FILE" 2>/dev/null

rm -f "$INPUT_FILE" 2>/dev/null

# Resolve node runtime for fallback helper.
NODE_BIN="$(command -v node 2>/dev/null || true)"
if [ -z "$NODE_BIN" ]; then
  NODE_BIN="$(command -v nodejs 2>/dev/null || true)"
fi

# If node runtime is unavailable, prefer SDK decision when present.
if [ -z "$NODE_BIN" ]; then
  echo "[WARN] $(date -u +%Y-%m-%dT%H:%M:%SZ) node runtime unavailable for fallback engine" >> "$LOG_FILE" 2>/dev/null
  if [ $EXIT_CODE -eq 0 ] && [ -n "$RESULT" ]; then
    echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) stop decision=pass-through reason=sdk_no_node" >> "$LOG_FILE" 2>/dev/null
    emit_sdk_result
    exit 0
  fi
  printf '%s\n' '{"decision":"block","reason":"node_runtime_missing"}'
  exit 0
fi

# Always compute conservative fallback decision from run status and pending tasks.
FALLBACK=$("$NODE_BIN" "$PLUGIN_ROOT/hooks/stop-decision.js" 2>>"$LOG_DIR/babysitter-stop-hook-stderr.log" || echo '{"decision":"block","reason":"fallback_script_failed"}')
FALLBACK_DECISION=$(printf '%s' "$FALLBACK" | "$NODE_BIN" -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);process.stdout.write(String(j.decision||''));}catch{process.stdout.write('');}})")

if [ "$FALLBACK_DECISION" = "block" ]; then
  echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) stop decision=block reason=fallback" >> "$LOG_FILE" 2>/dev/null
  printf '%s\n' "$FALLBACK"
  exit 0
fi

# If fallback approved and SDK result exists, pass SDK result through; else use fallback payload.
if [ $EXIT_CODE -eq 0 ] && [ -n "$RESULT" ]; then
  echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) stop decision=approve reason=sdk" >> "$LOG_FILE" 2>/dev/null
  emit_sdk_result
else
  echo "[INFO] $(date -u +%Y-%m-%dT%H:%M:%SZ) stop decision=approve reason=fallback" >> "$LOG_FILE" 2>/dev/null
  printf '%s\n' "$FALLBACK"
fi
exit 0
