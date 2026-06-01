# Claude-Mem -- Uninstall Instructions

Removes claude-mem from the project.

---

## Step 1: Uninstall the Claude-Mem Plugin

```bash
claude plugin uninstall claude-mem
```

This removes the lifecycle hooks and MCP tools.

---

## Step 2: Stop the Worker Service

```bash
curl -s -X POST http://localhost:37777/shutdown 2>/dev/null || true
```

Or kill the process on port 37777:

```bash
lsof -ti:37777 | xargs kill 2>/dev/null || true
```

---

## Step 3: Remove Skill

```bash
rm -rf .a5c/skills/claude-mem/
```

---

## Step 4: Remove CLAUDE.md Section

Remove the `## Claude-Mem -- Session Memory` section from `CLAUDE.md`.

---

## Step 5: Remove Plugin from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name claude-mem --project --json
```

---

## Step 6: Remove Data (optional)

Ask the user if they want to delete stored memory data:

> **Delete claude-mem data?** This removes all stored session observations and summaries.
>
> 1. Yes -- delete everything
> 2. No -- keep data for potential future use

If yes:

```bash
rm -rf ~/.claude-mem/
```

---

## Post-Uninstall Notes

- Restart Claude Code to fully deactivate hooks.
- The claude-mem marketplace reference remains. To remove: `claude plugin marketplace remove thedotmack/claude-mem`
- Session memory will no longer be captured or injected automatically.
- Stored data at `~/.claude-mem/` is retained unless explicitly deleted in Step 6.
