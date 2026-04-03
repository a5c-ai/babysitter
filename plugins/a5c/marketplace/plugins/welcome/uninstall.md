# Welcome Screen -- Uninstall Instructions

Remove the welcome screen plugin and all associated files from the project.

---

## Step 1: Remove Session-Start Hook

Read `.claude/settings.json` and remove the welcome hook entry from the `SessionStart` array.

Remove the entry where `command` contains `welcome/scripts/welcome.sh`:

```json
{
  "matcher": "",
  "hooks": [
    {
      "type": "command",
      "command": "bash .a5c/welcome/scripts/welcome.sh"
    }
  ]
}
```

If the `SessionStart` array becomes empty after removal, remove the `SessionStart` key entirely. If the `hooks` object becomes empty, remove it too.

Preserve all other hooks and settings.

---

## Step 2: Remove Welcome Files

Delete all welcome plugin directories and files:

```bash
# Remove skill definition
rm -rf .a5c/skills/welcome/

# Remove welcome scripts and config
rm -rf .a5c/welcome/

# Clean up empty parent directories if nothing else is in them
rmdir .a5c/skills/ 2>/dev/null || true
```

---

## Step 3: Unregister Plugin

```bash
babysitter plugin:remove-from-registry --plugin-name welcome --project --json
```

---

## Step 4: Verify

Confirm removal:

```bash
# These should not exist
ls .a5c/skills/welcome/ 2>/dev/null && echo "WARN: skill directory still exists" || echo "OK: skill removed"
ls .a5c/welcome/ 2>/dev/null && echo "WARN: welcome directory still exists" || echo "OK: welcome dir removed"

# Hook should be gone
grep -q "welcome" .claude/settings.json 2>/dev/null && echo "WARN: hook still in settings.json" || echo "OK: hook removed"
```
