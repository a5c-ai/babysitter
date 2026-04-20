#!/bin/bash
# Session Start — installs SDK if needed, then runs hook handler.
set -euo pipefail
PLUGIN_ROOT="${PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${PLUGIN_ROOT}/versions.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}" 2>/dev/null || echo "latest")
if ! command -v babysitter &>/dev/null; then
  npm i -g "@a5c-ai/babysitter-sdk@${SDK_VERSION}" --loglevel=error 2>/dev/null || \
  npm i -g "@a5c-ai/babysitter-sdk@${SDK_VERSION}" --prefix "$HOME/.local" --loglevel=error 2>/dev/null || true
  [ -d "$HOME/.local/bin" ] && export PATH="$HOME/.local/bin:$PATH"
fi
babysitter hook:run --harness unified --hook-type session-start --json
