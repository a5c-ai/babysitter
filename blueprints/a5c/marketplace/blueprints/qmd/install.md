# QMD -- Install Instructions

This plugin installs [qmd](https://github.com/tobi/qmd) -- an on-device hybrid search engine for markdown files. It combines BM25 full-text, vector semantic search, and LLM re-ranking, all running locally via node-llama-cpp with GGUF models. After installation, your project's markdown files are indexed and searchable via MCP tools, CLI, or SDK.

---

## Step 1: Interview the User

Ask the user the following:

> **Which directories should qmd index?**
>
> 1. The current project directory only (`.`)
> 2. Specific subdirectories (e.g., `docs/`, `notes/`, `src/`)
> 3. External directories too (e.g., `~/notes`, `~/Documents`)
>
> **What glob pattern for files?** (default: `**/*.md`)
>
> **Do you want to set up the MCP server for Claude Code integration?** (recommended, yes/no)

Record the user's choices. Default to option 1 with `**/*.md` and MCP enabled if they're unsure.

---

## Step 2: Install qmd

```bash
npm install -g @tobilu/qmd
```

Verify:

```bash
qmd --help
```

Requires Node.js >= 22. If the user's Node version is too old, warn them.

On macOS, qmd needs Homebrew SQLite for extension support:

```bash
brew install sqlite
```

---

## Step 3: Add Collections

Based on the user's selections in Step 1, add collections:

### Option 1: Current project only

```bash
qmd collection add . --name project
```

### Option 2: Specific subdirectories

For each directory the user selected:

```bash
qmd collection add ./docs --name docs
qmd collection add ./notes --name notes
```

### Option 3: External directories

```bash
qmd collection add ~/notes --name personal-notes
qmd collection add ./docs --name project-docs
```

After adding collections, optionally add context descriptions to improve search relevance:

```bash
qmd context add qmd://project "Source code and documentation for [project name]"
```

Ask the user for a brief description of each collection, or infer from the directory contents.

---

## Step 4: Build Index and Embeddings

Index the collections and generate vector embeddings:

```bash
qmd update
qmd embed
```

The first `embed` run downloads three GGUF models (~2GB total) to `~/.cache/qmd/models/`:
- `embeddinggemma-300M-Q8_0` (~300MB) -- vector embeddings
- `qwen3-reranker-0.6b-q8_0` (~640MB) -- re-ranking
- `qmd-query-expansion-1.7B-q4_k_m` (~1.1GB) -- query expansion

Inform the user this one-time download may take a few minutes.

Verify the index:

```bash
qmd status
```

---

## Step 5: Configure MCP Server

If the user chose MCP integration (recommended), add the qmd MCP server to the project's `.claude/settings.json`.

Merge the following into `.claude/settings.json` (preserve existing `mcpServers`):

```json
{
  "mcpServers": {
    "qmd": {
      "command": "qmd",
      "args": ["mcp"]
    }
  }
}
```

The MCP server exposes four tools:
- `query` -- hybrid search (BM25 + vector + LLM re-ranking)
- `get` -- retrieve document by path or docid
- `multi_get` -- batch retrieval via glob or comma-separated list
- `status` -- index health and collection info

For long-running sessions where model reload overhead matters, the user can start an HTTP MCP server instead:

```bash
qmd mcp --http --daemon
```

And configure the MCP server as HTTP transport in settings.

---

## Step 6: Install the Skill

Create the skill directory and write the skill file:

```bash
mkdir -p .a5c/skills/qmd
```

Write `.a5c/skills/qmd/SKILL.md`:

```markdown
---
name: qmd
description: On-device hybrid search for markdown files. Use when looking up project documentation, searching notes, finding relevant code docs, recalling meeting notes, or querying any indexed knowledge base. Trigger phrases include "search docs", "find in notes", "look up", "what do the docs say about", "search for", or any documentation/knowledge retrieval request.
---

# QMD -- Query Markup Documents

On-device search engine combining BM25, vector search, and LLM re-ranking for markdown files.

## MCP Tools (preferred)

If qmd MCP server is configured, use the MCP tools directly:
- **query** -- hybrid search with automatic query expansion and re-ranking
- **get** -- retrieve a specific document by path or ID
- **multi_get** -- batch retrieve documents by glob pattern
- **status** -- check index health

## CLI Usage

### Search Modes

| Command | Description | Best for |
|---------|-------------|----------|
| `qmd search "query"` | BM25 keyword search | Exact terms, fast |
| `qmd vsearch "query"` | Vector semantic search | Meaning-based |
| `qmd query "query"` | Hybrid + re-ranking | Best quality |

### Common Options

```bash
-n <num>              # Number of results (default: 5)
-c <collection>       # Restrict to collection
--min-score <num>     # Minimum relevance score (0-1)
--full                # Show full document content
--json                # JSON output for parsing
--explain             # Show score breakdown
```

### Document Retrieval

```bash
qmd get "docs/api.md"           # By path
qmd get "#abc123"                # By docid
qmd get "docs/api.md:50" -l 100 # Lines 50-150
qmd multi-get "docs/*.md"       # Glob pattern
```

### Index Maintenance

```bash
qmd update        # Re-index collections
qmd update --pull # Git pull then re-index
qmd embed         # Regenerate embeddings
qmd embed -f      # Force full re-embed
qmd status        # Index health
```

## Tips

- Use `qmd query` for best results -- it combines all three search backends.
- Use `qmd search` when you know the exact terms (faster, no model loading).
- Use `--json` output when parsing results programmatically.
- Documents are chunked at ~900 tokens with smart markdown-aware boundaries.
- Score interpretation: >0.8 highly relevant, 0.5-0.8 moderate, <0.5 low.
```

---

## Step 7: Add CLAUDE.md Integration

Append the following to `CLAUDE.md`:

```markdown
## QMD -- Documentation Search

This project uses [qmd](https://github.com/tobi/qmd) for on-device hybrid search across markdown files.

### Available collections
[List the collections added in Step 3, e.g.:]
- `project` -- project source and docs (`.`)

### How to search
- **MCP tools** (preferred): use the `query`, `get`, `multi_get` tools directly
- **CLI**: `qmd query "search terms"` for hybrid search, `qmd search "terms"` for keyword-only

### Index maintenance
- Run `qmd update && qmd embed` after adding or significantly changing markdown files
- Run `qmd status` to check index health

### Key points
- All search runs locally -- no data leaves the machine
- Three GGUF models are cached in `~/.cache/qmd/models/`
- Index stored at `~/.cache/qmd/index.sqlite`
```

Replace the collections list with the actual collections added.

---

## Step 8: Verify Installation

```bash
# 1. Check qmd is available
qmd --version

# 2. Check index status
qmd status

# 3. Run a test search
qmd query "README" -n 3

# 4. Test MCP server (if configured)
qmd mcp --http &
MCP_PID=$!
sleep 2
curl -s http://localhost:8181/health | jq .
kill $MCP_PID 2>/dev/null
```

Present the search results and index status to the user.

---

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name qmd --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

---

## Post-Installation Summary

```
QMD Plugin -- Installation Complete

Binary:       qmd $(qmd --version 2>/dev/null || echo "not found")
Collections:  [list added collections]
Documents:    [count from qmd status]
Embeddings:   [count from qmd status]
MCP server:   [configured / not configured]
Skill:        .a5c/skills/qmd/SKILL.md
CLAUDE.md:    QMD section appended

Search your docs with: qmd query "your question"
Or use the MCP tools directly in conversation.
Run `qmd update && qmd embed` after adding new markdown files.
```
