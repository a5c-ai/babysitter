# MemPalace -- Install Instructions

This plugin installs [MemPalace](https://github.com/milla-jovovich/mempalace) -- a persistent AI memory system that stores conversations and project context in a searchable palace structure backed by ChromaDB. 19 MCP tools, auto-save hooks, and 5 guided skills.

---

## Step 1: Install Python Package

MemPalace requires Python 3.9+. Verify:

```bash
python3 --version
```

Install the package:

```bash
pip install mempalace
```

Verify installation:

```bash
python3 -c "import mempalace; print(mempalace.__version__)"
```

---

## Step 2: Install the Claude Code Plugin

Add the MemPalace marketplace and install the plugin:

```bash
claude plugin marketplace add milla-jovovich/mempalace
claude plugin install --scope user mempalace
```

This registers the MCP server, hooks (Stop + PreCompact), commands, and skill with Claude Code.

---

## Step 3: Restart Claude Code

Restart Claude Code to activate the plugin. After restart, verify:

```bash
claude plugin list
```

Confirm `mempalace@mempalace` shows status `enabled`.

---

## Step 4: Initialize the Palace

Run the init command to set up the palace directory structure, configure the MCP server, and create your first wing:

```
/mempalace:init
```

Or manually:

```bash
mempalace init ~/projects
```

This creates the palace at `~/.mempalace/` with the directory hierarchy: wings (people/projects) > halls (memory types) > rooms (specific ideas) > closets > drawers.

---

## Step 5: Verify MCP Server

The MCP server provides 19 tools for storing, searching, and managing memories. Verify it works:

```bash
python3 -m mempalace.mcp_server --help
```

The plugin.json already configures the MCP server command (`python3 -m mempalace.mcp_server`), so no manual MCP configuration is needed.

---

## Step 6: Add CLAUDE.md Integration

Append the following to `CLAUDE.md`:

```markdown
## MemPalace -- AI Memory

This project uses [MemPalace](https://github.com/milla-jovovich/mempalace) for persistent cross-session memory.

### How it works
- Conversations are stored verbatim in ChromaDB -- no summarization
- Palace structure: wings > halls > rooms > closets > drawers
- Auto-save hooks capture context on Stop and PreCompact events
- 19 MCP tools available for searching, saving, mining, and managing memories

### Commands
- `/mempalace:search` -- Search memories
- `/mempalace:mine` -- Mine projects/conversations
- `/mempalace:status` -- Palace overview
- `/mempalace:init` -- Setup and configuration
- `/mempalace:help` -- Full tool and architecture reference

### Mining modes
- **projects** -- Code and documentation files
- **convos** -- Conversation exports (Claude, ChatGPT, Slack)
- **general** -- Auto-classifies into decisions, preferences, milestones, problems

### Environment
- `MEMPAL_DIR` -- Auto-mine this directory on save triggers
- Palace data: `~/.mempalace/`
```

---

## Step 7: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name mempalace --plugin-version 3.0.14 --marketplace-name babysitter --project --json
```

---

## Post-Installation Summary

```
MemPalace Plugin -- Installation Complete

Plugin:       mempalace@mempalace (Claude Code plugin)
Python:       mempalace 3.0.14 (pip)
MCP server:   python3 -m mempalace.mcp_server (19 tools)
Hooks:        Stop (auto-save), PreCompact (memory preservation)
Commands:     /mempalace:init, /mempalace:search, /mempalace:mine, /mempalace:status, /mempalace:help
Skill:        .a5c/skills/mempalace/SKILL.md
CLAUDE.md:    MemPalace section appended
Palace data:  ~/.mempalace/ (ChromaDB, local only)

Run /mempalace:init to complete palace setup if not done already.
```
