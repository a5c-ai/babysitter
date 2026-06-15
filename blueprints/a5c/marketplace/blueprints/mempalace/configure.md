# MemPalace -- Configure Instructions

## Palace Location

The default palace directory is `~/.mempalace/`. All ChromaDB collections and metadata are stored here.

---

## Configuration Options

| Setting | Description | Default |
|---------|-------------|---------|
| Palace directory | Where all memory data is stored | `~/.mempalace/` |
| Mining mode | `projects`, `convos`, or `general` | `projects` |
| Auto-mine directory | Directory to auto-mine on save triggers | (none) |
| Extraction mode | For convos: `general` auto-classifies entries | (none) |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MEMPAL_DIR` | Set to a directory path to auto-mine on each save hook trigger |

To enable auto-mining, set the environment variable in your shell profile:

```bash
export MEMPAL_DIR=~/projects/myapp
```

---

## Hook Configuration

MemPalace registers two hooks via the Claude Code plugin:

- **Stop** -- Saves conversation context. Runs `mempalace hook run --hook stop --harness claude-code`.
- **PreCompact** -- Preserves memories before context compaction. Runs `mempalace hook run --hook precompact --harness claude-code`.

These hooks are managed by the Claude Code plugin system and activate automatically. No manual configuration is needed.

---

## MCP Server

The MCP server runs as `python3 -m mempalace.mcp_server` and is configured in the Claude Code plugin manifest. It provides 19 tools including:

- `mempalace_search` -- Semantic search
- `mempalace_save` -- Store a memory
- `mempalace_status` -- Palace overview
- `mempalace_mine` -- Mine directories
- `mempalace_wake_up` -- Load world context
- `mempalace_create_wing` -- Create a new wing
- `mempalace_list_wings` -- List existing wings
- `mempalace_create_room` -- Create a room in a wing

To manually add the MCP server (if not using the plugin):

```bash
claude mcp add mempalace -- python3 -m mempalace.mcp_server
```

---

## Palace Structure

Organize memories by creating wings for people and projects:

```bash
mempalace init ~/projects/myapp          # Initialize for a project
mempalace init ~/projects/another-app    # Add another project wing
```

Each wing contains halls (memory types), rooms (topics), closets, and drawers (individual entries).

---

## Mining Configuration

### Project mining
```bash
mempalace mine ~/projects/myapp                    # Default project mode
```

### Conversation mining
```bash
mempalace mine ~/chats/ --mode convos              # Conversation exports
mempalace mine ~/chats/ --mode convos --extract general  # With auto-classification
```

Auto-classification extracts: decisions, preferences, milestones, problems, and emotional context.

---

## Troubleshooting

- **MCP server not responding**: Verify Python can import mempalace: `python3 -c "import mempalace"`
- **Hooks not firing**: Restart Claude Code after plugin installation
- **Search returning no results**: Verify palace has data: `mempalace status`
- **ChromaDB errors**: Check Python version (3.9+ required) and ChromaDB installation: `python3 -c "import chromadb"`
- **Windows path issues**: Use forward slashes in `MEMPAL_DIR` or double backslashes
