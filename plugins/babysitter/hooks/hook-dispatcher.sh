#!/bin/bash
# Generic Hook Dispatcher
# Discovers and executes hooks for any hook type
# Hooks are executed in order: per-repo -> per-user -> plugin hooks
#
# Usage:
#   echo '{"key":"value"}' | hook-dispatcher.sh <hook-type>
#
# Examples:
#   echo '{"runId":"..."}' | hook-dispatcher.sh on-run-start
#   echo '{"runId":"..."}' | hook-dispatcher.sh on-task-complete

set -euo pipefail

# Determine plugin root (directory containing this script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$SCRIPT_DIR/.." && pwd)}"

# Source error codes helper for standardized error reporting
# shellcheck source=../scripts/error-codes.sh
if [[ -f "$PLUGIN_ROOT/scripts/error-codes.sh" ]]; then
  source "$PLUGIN_ROOT/scripts/error-codes.sh"
else
  # Fallback if error-codes.sh not available
  bsit_error() { echo "ERROR [BSIT-$1]: ${*:2}" >&2; }
  bsit_warn() { echo "WARNING [BSIT-$1]: ${*:2}" >&2; }
fi

# Get hook type from first argument
HOOK_TYPE="${1:-}"

if [[ -z "$HOOK_TYPE" ]]; then
  bsit_error "5001" "Hook type required as first argument"
  echo "Usage: $0 <hook-type>" >&2
  echo "Examples:" >&2
  echo "  $0 on-run-start" >&2
  echo "  $0 on-task-complete" >&2
  echo "  $0 pre-commit" >&2
  exit 1
fi

# Read payload from stdin
HOOK_PAYLOAD=$(cat)

# Export payload and hook type for hooks to access
export HOOK_PAYLOAD
export HOOK_TYPE

# Determine repository root (look for .git or .a5c)
REPO_ROOT="${REPO_ROOT:-}"
if [[ -z "$REPO_ROOT" ]]; then
  current_dir="$PWD"
  while [[ "$current_dir" != "/" ]]; do
    if [[ -d "$current_dir/.git" ]] || [[ -d "$current_dir/.a5c" ]]; then
      REPO_ROOT="$current_dir"
      break
    fi
    current_dir=$(dirname "$current_dir")
  done
fi

# Determine user hooks directory
USER_HOOKS_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/babysitter/hooks"

# Temporary file to collect hook results
RESULTS_FILE=$(mktemp)
trap "rm -f $RESULTS_FILE" EXIT

# Function to execute hooks in a directory
execute_hooks() {
  local hooks_dir="$1"
  local hook_type_label="$2"

  if [[ ! -d "$hooks_dir" ]]; then
    return 0
  fi

  # Find all executable .sh files
  local hooks=$(find "$hooks_dir" -maxdepth 1 -name "*.sh" -type f -executable 2>/dev/null | sort)

  if [[ -z "$hooks" ]]; then
    return 0
  fi

  echo "[$hook_type_label] Executing hooks from: $hooks_dir" >&2

  for hook in $hooks; do
    local hook_name=$(basename "$hook")
    echo "[$hook_type_label] Running: $hook_name" >&2

    # Execute hook with payload on stdin
    # Keep stderr separate - only stdout is collected for JSON output
    if echo "$HOOK_PAYLOAD" | "$hook"; then
      echo "[$hook_type_label] $hook_name succeeded" >&2
      echo "$hook_type_label:$hook_name:success" >> "$RESULTS_FILE"
    else
      local exit_code=$?
      bsit_warn "5003" "hook=$hook_name" "exit_code=$exit_code" "type=$HOOK_TYPE" "location=$hook_type_label"
      echo "$hook_type_label:$hook_name:failed:$exit_code" >> "$RESULTS_FILE"
      # Don't fail dispatcher if a hook fails - continue with other hooks
    fi
  done
}

# Execute hooks in priority order: per-repo -> per-user -> plugin

# 1. Per-repo hooks (highest priority)
if [[ -n "$REPO_ROOT" ]]; then
  execute_hooks "$REPO_ROOT/.a5c/hooks/$HOOK_TYPE" "per-repo"
fi

# 2. Per-user hooks (medium priority)
execute_hooks "$USER_HOOKS_DIR/$HOOK_TYPE" "per-user"

# 3. Plugin hooks (lowest priority, fallback)
execute_hooks "$PLUGIN_ROOT/hooks/$HOOK_TYPE" "plugin"

# Print summary
echo "" >&2
echo "Hook execution summary for $HOOK_TYPE:" >&2
if [[ -f "$RESULTS_FILE" ]] && [[ -s "$RESULTS_FILE" ]]; then
  cat "$RESULTS_FILE" >&2
  # Count failures and report
  failure_count=$(grep -c ":failed:" "$RESULTS_FILE" 2>/dev/null || echo "0")
  if [[ "$failure_count" -gt 0 ]]; then
    bsit_warn "5003" "$failure_count hook(s) failed for $HOOK_TYPE"
  fi
else
  echo "No hooks found or executed for: $HOOK_TYPE" >&2
fi

# Exit with 0 regardless of individual hook failures
# The dispatcher itself succeeded in discovering and executing hooks
exit 0
