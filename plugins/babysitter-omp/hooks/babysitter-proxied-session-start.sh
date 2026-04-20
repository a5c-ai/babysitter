#!/bin/bash
# Session Start Hook — installs SDK + hooks-proxy, initializes session.
# This is the ONLY hook that performs SDK/proxy installation.
#
# Env: ADAPTER_NAME (required), PLUGIN_ROOT (optional, auto-detected)

set -euo pipefail

ADAPTER_NAME="${ADAPTER_NAME:-oh-my-pi}"
PLUGIN_ROOT="${PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
SDK_MARKER_FILE="${PLUGIN_ROOT}/.babysitter-install-attempted"
PROXY_MARKER_FILE="${PLUGIN_ROOT}/.hooks-proxy-install-attempted"

GLOBAL_ROOT="${BABYSITTER_GLOBAL_STATE_DIR:-$HOME/.a5c}"
LOG_DIR="${BABYSITTER_LOG_DIR:-${GLOBAL_ROOT}/logs}"
LOG_FILE="$LOG_DIR/hook-session-start.log"
mkdir -p "$LOG_DIR" 2>/dev/null

blog() {
  local ts; ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "[INFO] $ts $1" >> "$LOG_FILE" 2>/dev/null
  command -v babysitter &>/dev/null && babysitter log --type hook --label "hook:session-start" --message "$1" --source shell-hook 2>/dev/null || true
}

blog "Session start hook invoked (adapter=$ADAPTER_NAME)"
blog "PLUGIN_ROOT=$PLUGIN_ROOT"

SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${PLUGIN_ROOT}/versions.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}" 2>/dev/null || echo "latest")

# --- SDK install/upgrade ---
install_pkg() {
  local pkg="$1" ver="$2" marker="$3"
  [ -f "$marker" ] && return 0
  if npm i -g "${pkg}@${ver}" --loglevel=error 2>/dev/null; then
    blog "Installed ${pkg} globally (${ver})"; echo "$ver" > "$marker" 2>/dev/null; return 0
  fi
  if npm i -g "${pkg}@${ver}" --prefix "$HOME/.local" --loglevel=error 2>/dev/null; then
    export PATH="$HOME/.local/bin:$PATH"
    blog "Installed ${pkg} to user prefix (${ver})"; echo "$ver" > "$marker" 2>/dev/null; return 0
  fi
  return 1
}

NEEDS_SDK=false
if command -v babysitter &>/dev/null; then
  CUR=$(babysitter --version 2>/dev/null || echo "unknown")
  [ "$CUR" != "$SDK_VERSION" ] && NEEDS_SDK=true
else
  NEEDS_SDK=true
fi
if [ "$NEEDS_SDK" = true ] && [ ! -f "$SDK_MARKER_FILE" ]; then
  install_pkg "@a5c-ai/babysitter-sdk" "$SDK_VERSION" "$SDK_MARKER_FILE" || true
fi
if ! command -v babysitter &>/dev/null; then
  babysitter() { npx -y "@a5c-ai/babysitter-sdk@${SDK_VERSION}" "$@"; }; export -f babysitter
fi

# --- hooks-proxy install/upgrade ---
NEEDS_PROXY=false
if command -v a5c-hooks-proxy &>/dev/null; then
  PV=$(a5c-hooks-proxy --version 2>/dev/null || echo "unknown")
  [ "$PV" != "$SDK_VERSION" ] && NEEDS_PROXY=true
elif [ -f "$HOME/.local/bin/a5c-hooks-proxy" ]; then
  export PATH="$HOME/.local/bin:$PATH"
  PV=$(a5c-hooks-proxy --version 2>/dev/null || echo "unknown")
  [ "$PV" != "$SDK_VERSION" ] && NEEDS_PROXY=true
else
  NEEDS_PROXY=true
fi
if [ "$NEEDS_PROXY" = true ] && [ ! -f "$PROXY_MARKER_FILE" ]; then
  install_pkg "@a5c-ai/hooks-proxy-cli" "$SDK_VERSION" "$PROXY_MARKER_FILE" || true
fi

# Resolve proxy binary
PROXY=""
command -v a5c-hooks-proxy &>/dev/null && PROXY="a5c-hooks-proxy"
[ -z "$PROXY" ] && [ -f "$HOME/.local/bin/a5c-hooks-proxy" ] && PROXY="$HOME/.local/bin/a5c-hooks-proxy"
[ -z "$PROXY" ] && PROXY="npx -y @a5c-ai/hooks-proxy-cli@${SDK_VERSION} "

# --- Dispatch ---
INPUT_FILE=$(mktemp 2>/dev/null || echo "/tmp/hook-session-start-$$.json")
cat > "$INPUT_FILE"
blog "Hook input received ($(wc -c < "$INPUT_FILE") bytes)"

STDERR_LOG="$LOG_DIR/hook-session-start-stderr.log"
blog "Using proxy: $PROXY"
RESULT=$($PROXY invoke \
  --adapter "$ADAPTER_NAME" \
  --handler "babysitter hook:run --harness unified --hook-type session-start --verbose --json" \
  --json \
  < "$INPUT_FILE" 2>"$STDERR_LOG")
EXIT_CODE=$?

blog "exit=$EXIT_CODE"
rm -f "$INPUT_FILE" 2>/dev/null
printf '%s\n' "$RESULT"
exit $EXIT_CODE
