# agentsh -- Uninstall Instructions

This removes the agentsh integration from your project. The agentsh binary itself is left installed system-wide (remove it manually with your package manager if desired).

---

## Step 1: Destroy Active Sessions

Clean up any running agentsh sessions:

```bash
SESSION_FILE=".a5c/agentsh/.session-id"
if [ -f "$SESSION_FILE" ]; then
  AGENTSH_SESSION=$(cat "$SESSION_FILE")
  agentsh session destroy "$AGENTSH_SESSION" 2>/dev/null || true
  echo "Destroyed agentsh session: $AGENTSH_SESSION"
fi
```

---

## Step 2: Remove Hooks

### Claude Code

Remove the agentsh hooks from `.claude/settings.json`:

1. Remove the `PreToolUse` entry with matcher `"Bash"` whose command contains `agentsh-bash-hook.sh`
2. Remove the `SessionStart` entry whose command contains `agentsh-session-start.sh`
3. Remove the `SessionEnd` entry whose command contains `agentsh-session-end.sh`

Preserve all other hooks -- only remove entries referencing agentsh scripts.

### Codex

Remove the agentsh entries from `.codex/hooks.json` (SessionStart and Stop entries referencing agentsh scripts).

If the shell shim was installed, remove it:

```bash
agentsh shim uninstall-shell --bash 2>/dev/null || true
```

Remove the `AGENTSH_SERVER` environment variable from `.codex/config.toml` if it was added.

### Gemini CLI / Other Harnesses

Remove the `## agentsh Shell Enforcement` section from `AGENTS.md`.

---

## Step 3: Remove CLAUDE.md Integration

Remove the `## agentsh Sandbox` section from `CLAUDE.md`.

---

## Step 4: Remove agentsh Project Files

```bash
rm -rf .a5c/agentsh/
```

---

## Step 5: Remove Plugin from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name agentsh --project --json
```

---

## Post-Uninstall Notes

- The agentsh binary remains installed system-wide. To remove it:
  - Debian/Ubuntu: `sudo apt remove agentsh`
  - RPM: `sudo rpm -e agentsh`
  - macOS (from source): `sudo rm /usr/local/bin/agentsh /usr/local/bin/agentsh-shell-shim`
- Bash tool calls will return to direct execution without sandboxing.
- No project data is lost -- agentsh only intercepted commands, it didn't store project state.
