# Rate Limit Handler -- Uninstall Instructions

## Step 1: Remove Hook Entries from Claude Code Settings

Read `.claude/settings.json` and remove the rate-limit-handler hook entries:

1. From `hooks.PostToolUseFailure`: Remove the entry whose command contains `rate-limit-handler`
2. From `hooks.StopFailure`: Remove the entry whose command contains `rate-limit-handler`
3. From `hooks.SessionStart`: Remove the entry whose command contains `rate-limit-handler`
4. From `hooks.PostToolUse`: Remove the entry whose command contains `rate-limit-handler`

If any of those hook arrays become empty after removal, remove the empty array key as well. Preserve all other hooks and settings.

## Step 2: Remove Plugin Files

```bash
rm -rf .claude/rate-limit-handler
```

## Step 3: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name rate-limit-handler --project --json
```

## Notes

- Removing the hooks from settings.json takes effect immediately for new Claude Code sessions.
- Active sessions will continue using the old hooks until restarted.
- The rate limit log at `.claude/rate-limit-handler/rate-limits.log` is removed with the plugin files.
