# QMD -- Uninstall Instructions

Removes qmd integration from the project. The global binary and cached models/index are left in place.

---

## Step 1: Remove MCP Server Configuration

Remove the `"qmd"` entry from `mcpServers` in `.claude/settings.json`. Preserve all other MCP servers.

If an HTTP daemon is running, stop it:

```bash
qmd mcp stop 2>/dev/null || true
```

---

## Step 2: Remove Skill

```bash
rm -rf .a5c/skills/qmd/
```

---

## Step 3: Remove CLAUDE.md Section

Remove the `## QMD -- Documentation Search` section from `CLAUDE.md`.

---

## Step 4: Remove Collections (optional)

Ask the user if they want to remove the qmd collections and index data:

> **Remove qmd index and collections?** This deletes the local search index. The source markdown files are not affected.
>
> 1. Yes -- remove everything
> 2. No -- keep the index for CLI use

If yes:

```bash
qmd cleanup
```

---

## Step 5: Remove Plugin from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name qmd --project --json
```

---

## Post-Uninstall Notes

- The `qmd` npm package remains installed globally. To remove: `npm uninstall -g @tobilu/qmd`
- Cached GGUF models remain at `~/.cache/qmd/models/` (~2GB). To remove: `rm -rf ~/.cache/qmd/`
- Index at `~/.cache/qmd/index.sqlite`. Removed by `qmd cleanup` or `rm -rf ~/.cache/qmd/`
- Source markdown files are never modified by qmd.
