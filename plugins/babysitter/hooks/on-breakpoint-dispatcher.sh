#!/bin/bash
# On-Breakpoint Hook Dispatcher
# Discovers and executes hooks for breakpoint events
# Hooks are executed in order: per-repo -> per-user -> plugin hooks

set -euo pipefail

# Read breakpoint payload from stdin
BREAKPOINT_PAYLOAD=$(cat)

# Export payload for hooks to access
export BREAKPOINT_PAYLOAD

# Temporary file to collect hook results
RESULTS_FILE=$(mktemp)
trap "rm -f $RESULTS_FILE" EXIT

# Function to execute hooks in a directory
execute_hooks() {
  local hooks_dir="$1"
  local hook_type="$2"

  if [[ ! -d "$hooks_dir" ]]; then
    return 0
  fi

  # Find all executable .sh files
  local hooks=$(find "$hooks_dir" -maxdepth 1 -name "*.sh" -type f -executable 2>/dev/null | sort)

  if [[ -z "$hooks" ]]; then
    return 0
  fi

  echo "[$hook_type] Executing hooks from: $hooks_dir" >&2

  for hook in $hooks; do
    local hook_name=$(basename "$hook")
    echo "[$hook_type] Running: $hook_name" >&2

    # Execute hook with payload on stdin
    if echo "$BREAKPOINT_PAYLOAD" | "$hook" 2>&1; then
      echo "[$hook_type] ✓ $hook_name succeeded" >&2
      echo "$hook_type:$hook_name:success" >> "$RESULTS_FILE"
    else
      local exit_code=$?
      echo "[$hook_type] ✗ $hook_name failed (exit code: $exit_code)" >&2
      echo "$hook_type:$hook_name:failed:$exit_code" >> "$RESULTS_FILE"
      # Don't fail dispatcher if a hook fails - continue with other hooks
    fi
  done
}

# 1. Execute per-repo hooks (.a5c/hooks/on-breakpoint/)
if [[ -n "${REPO_ROOT:-}" ]]; then
  execute_hooks "$REPO_ROOT/.a5c/hooks/on-breakpoint" "per-repo"
elif [[ -d ".a5c/hooks/on-breakpoint" ]]; then
  execute_hooks ".a5c/hooks/on-breakpoint" "per-repo"
fi

# 2. Execute per-user hooks (~/.config/babysitter/hooks/on-breakpoint/)
USER_HOOKS_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/babysitter/hooks/on-breakpoint"
execute_hooks "$USER_HOOKS_DIR" "per-user"

# 3. Execute plugin hooks
# Get plugin root directory
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-plugins/babysitter}"
execute_hooks "$PLUGIN_ROOT/hooks/on-breakpoint" "plugin"

# Output results summary
echo "" >&2
echo "Hook execution summary:" >&2
if [[ -s "$RESULTS_FILE" ]]; then
  cat "$RESULTS_FILE" >&2
else
  echo "No hooks executed" >&2
fi

# Exit with success (dispatcher doesn't fail if individual hooks fail)
exit 0
