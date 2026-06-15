# QMD -- Configure Instructions

## Configuration Options

| Setting | How to change | Description |
|---------|---------------|-------------|
| Collections | `qmd collection add/remove` | Directories to index |
| Context | `qmd context add/rm` | Descriptions improving search relevance |
| Glob pattern | `--mask` flag on `collection add` | File patterns (default: `**/*.md`) |
| Embedding model | `QMD_EMBED_MODEL` env var | Override default model for multilingual support |
| MCP transport | `qmd mcp` flags | stdio vs HTTP, port, daemon mode |

---

## Managing Collections

```bash
# Add a new collection
qmd collection add ./new-docs --name new-docs

# Add context to improve search
qmd context add qmd://new-docs "API reference documentation"

# List collections
qmd collection list

# Remove a collection
qmd collection remove old-docs

# Rename
qmd collection rename old-name new-name

# After changes, re-index
qmd update && qmd embed
```

---

## Changing the Embedding Model

The default model (`embeddinggemma-300M`) is English-optimized. For multilingual support (CJK, etc.):

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
qmd embed -f  # Force re-embed with new model
```

After changing models, all embeddings must be regenerated (`-f` flag).

---

## MCP Server Modes

### stdio (default)

Configured in `.claude/settings.json` as shown in install.md. Launches per session.

### HTTP daemon (shared, persistent)

For long-running setups where model reload overhead matters:

```bash
qmd mcp --http --daemon              # Start on port 8181
qmd mcp --http --daemon --port 8080  # Custom port
qmd mcp stop                         # Stop daemon
```

Models stay loaded in VRAM between requests; idle contexts auto-dispose after 5 minutes.

Update `.claude/settings.json` to use HTTP transport if switching to daemon mode.

---

## Search Tuning

### Minimum score threshold

Filter low-relevance results:

```bash
qmd query "topic" --min-score 0.4
```

### Skip re-ranking for speed

When you need faster results and can accept lower precision:

```bash
qmd search "exact term"  # BM25 only, no model loading
```

### Custom file patterns

Index non-markdown files:

```bash
qmd collection add ./src --name source --mask "**/*.ts"
```

---

## Index Maintenance

```bash
qmd status           # Check health
qmd update           # Re-index changed files
qmd update --pull    # Git pull first, then re-index
qmd embed -f         # Force full re-embed
qmd cleanup          # Remove stale data
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `QMD_EMBED_MODEL` | embeddinggemma-300M | Override embedding model (HuggingFace GGUF URI) |
| `XDG_CACHE_HOME` | `~/.cache` | Cache/index/model storage location |
| `NO_COLOR` | unset | Disable colorized CLI output |
