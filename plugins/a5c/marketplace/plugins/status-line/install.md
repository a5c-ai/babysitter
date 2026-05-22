# Status Line Plugin — Installation

Adds a babysitter run indicator to the Claude Code status line. When the current session is associated with a babysitter run, it displays `run:<runId>` in the status bar. When no run is active, nothing is shown.

## Prerequisites

- Claude Code CLI with status line support
- `jq` available on PATH (used to parse status line input JSON)
- `grep` and `sed` available on PATH (standard on all platforms)

## Step 1: Create the Status Line Script

Create file `~/.claude/statusline-command.sh` with the following content:

```bash
#!/bin/bash
# Babysitter status line component.
# Reads the current session's associated run ID (if any) from the babysitter session state file.

input=$(cat)
session_id=$(echo "$input" | jq -r '.session_id // empty')

if [ -z "$session_id" ]; then
  exit 0
fi

# Canonical state directory: ~/.a5c/state/ (matches SDK getGlobalStateDir()).
# Override with BABYSITTER_STATE_DIR or BABYSITTER_GLOBAL_STATE_DIR.
if [ -n "$BABYSITTER_STATE_DIR" ]; then
  state_dir="$BABYSITTER_STATE_DIR"
elif [ -n "$BABYSITTER_GLOBAL_STATE_DIR" ]; then
  state_dir="$BABYSITTER_GLOBAL_STATE_DIR/state"
else
  state_dir="$HOME/.a5c/state"
fi

session_file="$state_dir/$session_id.md"

if [ ! -f "$session_file" ]; then
  exit 0
fi

# Extract run_id from YAML frontmatter (line: "run_id: <value>").
# Strip quotes and whitespace; treat empty string or bare "" as no run.
run_id=$(grep -m1 '^run_id:' "$session_file" 2>/dev/null | sed 's/^run_id:[[:space:]]*//' | tr -d '[:space:]"')

if [ -z "$run_id" ]; then
  exit 0
fi

printf 'run:%s' "$run_id"
```

Make the script executable:

```bash
chmod +x ~/.claude/statusline-command.sh
```

## Step 2: Configure Claude Code Settings

Edit `~/.claude/settings.json` (user-level settings) to add or update the `statusLine` key at the root level:

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline-command.sh"
  }
}
```

**Important:**
- Use the `~/` tilde path format. On Windows, Claude Code runs status line commands through Git Bash which resolves `~` correctly. Do NOT use resolved MSYS paths like `/c/Users/...` as they may not resolve when Claude Code spawns the process.
- If `statusLine` already exists in settings.json, update it in place. Do not duplicate the key. Preserve all other existing settings.

## Step 3: Accept Workspace Trust

The status line command requires workspace trust acceptance for the current directory (same as hooks). If trust isn't accepted, the notification `statusline skipped · restart to fix` appears instead of the status line output. Restart Claude Code and accept the trust prompt to enable it.

## Step 4: Verify Installation

1. Confirm the script exists and is executable:
   ```bash
   test -x ~/.claude/statusline-command.sh && echo "OK" || echo "MISSING"
   ```

2. Confirm settings.json contains the `statusLine` configuration:
   ```bash
   jq '.statusLine' ~/.claude/settings.json
   ```

3. Test the script with mock input (should output nothing when no session state exists):
   ```bash
   echo '{"session_id":"test-123","workspace":{"current_dir":"."}}' | bash ~/.claude/statusline-command.sh
   ```

4. If the status line does not appear after restarting Claude Code, run `claude --debug` to log the exit code and stderr from the first status line invocation.

## Step 5: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name status-line --plugin-version 1.1.0 --marketplace-name marketplace --global --json
```
