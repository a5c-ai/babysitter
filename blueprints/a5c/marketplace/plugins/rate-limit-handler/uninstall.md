# Rate Limit Handler -- Uninstall Instructions

## Step 1: Remove the Shell Wrapper

```bash
claude-auto-retry uninstall
```

This removes the shell function from rc files (.bashrc / .zshrc). tmux remains installed.

## Step 2: Uninstall the npm Package

```bash
npm uninstall -g claude-auto-retry
```

## Step 3: Remove Configuration (Optional)

```bash
rm -f ~/.claude-auto-retry.json
```

## Step 4: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name rate-limit-handler --project --json
```

## Step 5: Clean Up Old Hook-Based Installation (If Upgrading)

If the previous hook-based version (v1.x) was installed, also clean up its artifacts:

1. Remove hook entries from `.claude/settings.json` -- delete any entries whose command contains `rate-limit-handler` from `PostToolUseFailure`, `StopFailure`, `SessionStart`, and `PostToolUse` hook arrays. If any array becomes empty after removal, remove the empty array key. Preserve all other hooks.

2. Remove old plugin files:
```bash
rm -rf .claude/rate-limit-handler
```

## Notes

- Removing the shell wrapper takes effect in new terminal sessions. Existing sessions continue using the wrapper until the terminal is closed.
- Active tmux sessions with Claude running are not affected -- they continue normally but without auto-retry monitoring for new rate limits.
