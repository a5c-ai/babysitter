#!/bin/bash
# Shared hook base — sourced by per-event hook scripts.
# Expects HOOK_TYPE and ADAPTER_NAME to be set by the caller (hooks.json env or the per-event wrapper).

set -euo pipefail

PLUGIN_ROOT="${PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
SDK_MARKER_FILE="${PLUGIN_ROOT}/.babysitter-install-attempted"
PROXY_MARKER_FILE="${PLUGIN_ROOT}/.hooks-proxy-install-attempted"

GLOBAL_ROOT="${BABYSITTER_GLOBAL_STATE_DIR:-$HOME/.a5c}"
LOG_DIR="${BABYSITTER_LOG_DIR:-${GLOBAL_ROOT}/logs}"
LOG_FILE="$LOG_DIR/hook-${HOOK_TYPE}.log"
mkdir -p "$LOG_DIR" 2>/dev/null

blog() {
  local ts; ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "[INFO] $ts $1" >> "$LOG_FILE" 2>/dev/null
  command -v babysitter &>/dev/null && babysitter log --type hook --label "hook:${HOOK_TYPE}" --message "$1" --source shell-hook 2>/dev/null || true
}

blog "Hook invoked: type=${HOOK_TYPE} adapter=${ADAPTER_NAME}"
blog "PLUGIN_ROOT=$PLUGIN_ROOT"

SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${PLUGIN_ROOT}/versions.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}" 2>/dev/null || echo "latest")

install_pkg() {
  local pkg="$1" ver="$2" marker="$3"
  [ -f "$marker" ] && return 0
  npm i -g "${pkg}@${ver}" --loglevel=error 2>/dev/null && { blog "Installed ${pkg} globally (${ver})"; echo "$ver" > "$marker" 2>/dev/null; return 0; }
  npm i -g "${pkg}@${ver}" --prefix "$HOME/.local" --loglevel=error 2>/dev/null && { export PATH="$HOME/.local/bin:$PATH"; blog "Installed ${pkg} to prefix (${ver})"; echo "$ver" > "$marker" 2>/dev/null; return 0; }
  return 1
}

# SDK
if ! command -v babysitter &>/dev/null || [ "$(babysitter --version 2>/dev/null)" != "$SDK_VERSION" ]; then
  install_pkg "@a5c-ai/babysitter-sdk" "$SDK_VERSION" "$SDK_MARKER_FILE" || true
fi
if ! command -v babysitter &>/dev/null; then
  babysitter() { npx -y "@a5c-ai/babysitter-sdk@${SDK_VERSION}" "$@"; }; export -f babysitter
fi

# hooks-proxy
if ! command -v a5c-hooks-proxy &>/dev/null || [ "$(a5c-hooks-proxy --version 2>/dev/null)" != "$SDK_VERSION" ]; then
  install_pkg "@a5c-ai/hooks-proxy-cli" "$SDK_VERSION" "$PROXY_MARKER_FILE" || true
fi
PROXY=""
command -v a5c-hooks-proxy &>/dev/null && PROXY="a5c-hooks-proxy"
[ -z "$PROXY" ] && [ -f "$HOME/.local/bin/a5c-hooks-proxy" ] && PROXY="$HOME/.local/bin/a5c-hooks-proxy"
[ -z "$PROXY" ] && PROXY="npx -y @a5c-ai/hooks-proxy-cli@${SDK_VERSION} "

# Dispatch
INPUT_FILE=$(mktemp 2>/dev/null || echo "/tmp/hook-${HOOK_TYPE}-$$.json")
cat > "$INPUT_FILE"
STDERR_LOG="$LOG_DIR/hook-${HOOK_TYPE}-stderr.log"
RESULT=$($PROXY invoke --adapter "$ADAPTER_NAME" --handler "babysitter hook:run --harness unified --hook-type ${HOOK_TYPE} --plugin-root ${PLUGIN_ROOT} --verbose --json" --json < "$INPUT_FILE" 2>"$STDERR_LOG")
EXIT_CODE=$?
rm -f "$INPUT_FILE" 2>/dev/null
printf '%s\n' "$RESULT"
exit $EXIT_CODE
