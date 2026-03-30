# Status Line Plugin — Uninstallation

## Step 1: Remove Status Line Configuration

Edit `~/.claude/settings.json` and remove the `statusLine` key entirely:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash ..."
  }
}
```

Remove that entire block. Preserve all other settings.

## Step 2: Remove the Script

```bash
rm -f ~/.claude/statusline-command.sh
```

## Step 3: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name status-line --global --json
```
