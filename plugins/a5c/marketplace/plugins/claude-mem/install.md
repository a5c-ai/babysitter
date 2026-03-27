# Claude-Mem -- Install Instructions

This plugin installs [claude-mem](https://github.com/thedotmack/claude-mem) -- persistent memory for Claude Code sessions. It automatically captures coding session context via lifecycle hooks, compresses observations with AI, and makes project knowledge available across disconnected sessions via MCP search tools and a web UI.

---

## Step 1: Install the Claude-Mem Plugin

Install via Claude Code's plugin system:

```bash
claude plugin marketplace add thedotmack/claude-mem
claude plugin install claude-mem
```

This installs the full plugin including lifecycle hooks, worker service, and MCP tools.

**Do not use `npm install -g claude-mem`** -- that installs only the SDK library, not the hooks and worker service needed for full functionality.

---

## Step 2: Verify Prerequisites

Claude-mem auto-installs its runtime dependencies, but verify the base requirements:

```bash
node --version  # Must be >= 18.0.0
```

The following are auto-installed if missing:
- **Bun** -- runs the worker service
- **uv** -- Python package manager (for Chroma vector database)
- **SQLite 3** -- bundled

If auto-install fails behind a corporate proxy or restricted network, install them manually:

```bash
# Bun
curl -fsSL https://bun.sh/install | bash

# uv
curl -LsSf https://astral.sh/uv/install.sh | sh
```

---

## Step 3: Restart Claude Code

Restart Claude Code to activate the hooks. After restart, claude-mem begins capturing context automatically via five lifecycle hooks:

| Hook | Event | Purpose |
|------|-------|---------|
| SessionStart | Session begins | Loads previous context, starts worker |
| UserPromptSubmit | User sends message | Records user intent |
| PostToolUse | Tool completes | Captures tool results and observations |
| Stop | Session ending | Compresses and stores observations |
| SessionEnd | Session closed | Final cleanup |

No manual intervention is required -- memory capture is fully automatic.

---

## Step 4: Verify Worker Service

The worker service should start automatically. Verify:

```bash
curl -s http://localhost:37777/health 2>/dev/null && echo "Worker is running" || echo "Worker not running"
```

Open `http://localhost:37777` in a browser to see the real-time memory stream visualization.

If the worker isn't running, it will start automatically on the next Claude Code session.

---

## Step 5: Install the Skill

Create the skill directory and write the skill file:

```bash
mkdir -p .a5c/skills/claude-mem
```

Write `.a5c/skills/claude-mem/SKILL.md`:

```markdown
---
name: claude-mem
description: Persistent memory search across Claude Code sessions. Use when recalling what happened in previous sessions, searching project history, finding past decisions or context, or when the user asks "what did we do", "remember when", "last time", "previous session", or any historical project context query.
---

# Claude-Mem -- Session Memory

Persistent memory that captures and retrieves context across Claude Code sessions.

## MCP Tools (3-Layer Workflow)

Claude-mem exposes three MCP tools that follow a token-efficient progressive disclosure pattern:

### Layer 1: `search` (~50-100 tokens)
Returns a compact index with observation IDs matching your query. Start here.

### Layer 2: `timeline` (~100-300 tokens)
Shows chronological context around search results. Use after search to understand ordering.

### Layer 3: `get_observations` (~500-1000 tokens)
Fetches full observation details by ID. Use only for the specific IDs you need.

**Always start with `search`, then `timeline`, then `get_observations` for specific IDs.** This pattern saves ~10x tokens vs fetching everything upfront.

## Privacy

Wrap sensitive content in `<private>` tags to exclude it from memory storage:

```
<private>API_KEY=sk-abc123</private>
```

## Web UI

View the memory stream at http://localhost:37777

## Tips

- Memory is captured automatically -- no manual action needed
- Previous session context is injected at SessionStart
- Use natural language queries: "what auth changes did we make last week"
- The worker service on port 37777 manages the SQLite + Chroma databases
```

---

## Step 6: Add CLAUDE.md Integration

Append the following to `CLAUDE.md`:

```markdown
## Claude-Mem -- Session Memory

This project uses [claude-mem](https://github.com/thedotmack/claude-mem) for persistent cross-session memory.

### How it works
- Session context is captured automatically via lifecycle hooks
- Previous session summaries are injected at the start of new sessions
- Use the MCP search tools to query project history

### Searching memory
Use the 3-layer MCP workflow for token efficiency:
1. `search` -- find matching observation IDs
2. `timeline` -- see chronological context
3. `get_observations` -- fetch full details for specific IDs

### Privacy
Wrap sensitive content in `<private>` tags to exclude from storage.

### Web viewer
Open http://localhost:37777 for real-time memory visualization.
```

---

## Step 7: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name claude-mem --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

---

## Post-Installation Summary

```
Claude-Mem Plugin -- Installation Complete

Plugin:       claude-mem (installed via claude plugin system)
Worker:       http://localhost:37777
Hooks:        SessionStart, UserPromptSubmit, PostToolUse, Stop, SessionEnd
MCP tools:    search, timeline, get_observations
Skill:        .a5c/skills/claude-mem/SKILL.md
CLAUDE.md:    Claude-Mem section appended
Database:     ~/.claude-mem/ (SQLite + Chroma)

Memory capture is now automatic. Context from this session will be
available in future sessions. Open http://localhost:37777 to view
the memory stream.
```
