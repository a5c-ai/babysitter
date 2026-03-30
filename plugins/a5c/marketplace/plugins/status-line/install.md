# Status Line Plugin — Installation

Adds a babysitter run indicator to the Claude Code status line. When the current session is associated with a babysitter run, it displays `run:<runId>` in the status bar. When no run is active, nothing is shown.

## Prerequisites

- Claude Code CLI with status line support
- `jq` available on PATH (used to parse status line input JSON)
- `grep` and `sed` available on PATH (standard on all platforms)

## Step 1: Detect Platform and Shell

Detect the user's platform and shell environment:

- **Windows (Git Bash / MSYS2)**: paths use `/c/Users/...` format
- **macOS / Linux**: paths use standard `/home/...` or `/Users/...` format

Set `CLAUDE_CONFIG_DIR` to the user's `.claude` directory:
- Typical: `~/.claude`

## Step 2: Create the Status Line Script

Create file `$CLAUDE_CONFIG_DIR/statusline-command.sh` with the following content:

```bash
#!/bin/bash
# Babysitter status line component.
# Reads the current session's associated run ID (if any) from the babysitter session state file.

input=$(cat)
session_id=$(echo "$input" | jq -r '.session_id // empty')
cwd=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // empty')

if [ -z "$session_id" ]; then
  exit 0
fi

# Determine candidate state directories.
# Primary: $CLAUDE_PLUGIN_ROOT/skills/babysit/state
# Fallback: $cwd/.a5c/state
state_dirs=()

if [ -n "$CLAUDE_PLUGIN_ROOT" ]; then
  state_dirs+=("$CLAUDE_PLUGIN_ROOT/skills/babysit/state")
fi

if [ -n "$cwd" ]; then
  state_dirs+=("$cwd/.a5c/state")
fi

# Also check the globally installed plugin location (common path on Linux/macOS).
state_dirs+=("$HOME/.claude/plugins/babysitter@a5c.ai/skills/babysit/state")

run_id=""

for state_dir in "${state_dirs[@]}"; do
  session_file="$state_dir/$session_id.md"
  if [ -f "$session_file" ]; then
    # Extract run_id from YAML frontmatter (line: "run_id: <value>")
    run_id=$(grep -m1 '^run_id:' "$session_file" 2>/dev/null | sed 's/^run_id:[[:space:]]*//' | tr -d '[:space:]')
    if [ -n "$run_id" ]; then
      break
    fi
  fi
done

if [ -z "$run_id" ]; then
  exit 0
fi

printf 'run:%s' "$run_id"
```

Make the script executable:

```bash
chmod +x "$CLAUDE_CONFIG_DIR/statusline-command.sh"
```

## Step 3: Configure Claude Code Settings

Edit `$CLAUDE_CONFIG_DIR/settings.json` to add or update the `statusLine` key at the root level:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash <CLAUDE_CONFIG_DIR>/statusline-command.sh"
  }
}
```

Replace `<CLAUDE_CONFIG_DIR>` with the actual resolved path (e.g., `/c/Users/tmusk/.claude` or `/home/user/.claude`).

**Important:** If `statusLine` already exists in settings.json, update it in place. Do not duplicate the key. Preserve all other existing settings.

## Step 4: Verify Installation

1. Confirm the script exists and is executable:
   ```bash
   test -x "$CLAUDE_CONFIG_DIR/statusline-command.sh" && echo "OK" || echo "MISSING"
   ```

2. Confirm settings.json contains the `statusLine` configuration:
   ```bash
   jq '.statusLine' "$CLAUDE_CONFIG_DIR/settings.json"
   ```

3. Test the script with mock input (should output nothing when no session state exists):
   ```bash
   echo '{"session_id":"test-123","workspace":{"current_dir":"."}}' | bash "$CLAUDE_CONFIG_DIR/statusline-command.sh"
   ```

## Step 5: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name status-line --plugin-version 1.0.0 --marketplace-name babysitter --global --json
```
