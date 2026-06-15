# MemPalace -- Uninstall Instructions

Removes MemPalace from the project.

---

## Step 1: Uninstall the Claude Code Plugin

```bash
claude plugin uninstall mempalace
```

This removes the MCP server, hooks, commands, and skill from Claude Code.

---

## Step 2: Remove CLAUDE.md Section

Remove the `## MemPalace -- AI Memory` section from `CLAUDE.md`.

---

## Step 3: Remove Plugin from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name mempalace --project --json
```

---

## Step 4: Uninstall Python Package (optional)

Ask the user if they want to remove the Python package:

> **Uninstall mempalace Python package?** This removes the CLI and library but not your palace data.
>
> 1. Yes -- uninstall the package
> 2. No -- keep the package installed

If yes:

```bash
pip uninstall mempalace -y
```

---

## Step 5: Remove Palace Data (optional)

Ask the user if they want to delete stored memory data:

> **Delete palace data?** This permanently removes all stored memories, wings, rooms, and ChromaDB collections at `~/.mempalace/`.
>
> 1. Yes -- delete everything
> 2. No -- keep data for potential future use

If yes:

```bash
rm -rf ~/.mempalace/
```

---

## Step 6: Remove Marketplace (optional)

To remove the mempalace marketplace reference:

```bash
claude plugin marketplace remove mempalace
```

---

## Post-Uninstall Notes

- Restart Claude Code to fully deactivate hooks and MCP server.
- Palace data at `~/.mempalace/` is retained unless explicitly deleted in Step 5.
- The Python package is retained unless explicitly removed in Step 4.
- Memory will no longer be auto-saved or searchable via MCP tools.
