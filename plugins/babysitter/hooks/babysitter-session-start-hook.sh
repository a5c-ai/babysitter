#!/bin/bash
# Babysitter Session Start Hook - delegates to SDK CLI
# Ensures the babysitter CLI is installed (from plugin.json sdkVersion),
# then delegates to the TypeScript handler.

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"

# Install babysitter CLI if not available
if ! command -v babysitter &>/dev/null; then
  SDK_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${PLUGIN_ROOT}/plugin.json','utf8')).sdkVersion||'latest')}catch{console.log('latest')}" 2>/dev/null || echo "latest")
  npm i -g "@a5c-ai/babysitter-sdk@${SDK_VERSION}" --loglevel=error 2>/dev/null
  # If install failed, succeed silently — the skill will handle it later
  if ! command -v babysitter &>/dev/null; then
    echo "{}"
    exit 0
  fi
fi

exec babysitter hook:run --hook-type session-start --json < /dev/stdin
