# Claude-Mem -- Configure Instructions

## Configuration File

Settings are stored at `~/.claude-mem/settings.json` (auto-created on first run). Edit directly or through the web UI at http://localhost:37777.

---

## Configuration Options

| Setting | Description |
|---------|-------------|
| AI model | Model used for observation compression |
| Worker port | HTTP port for the worker service (default: 37777) |
| Data directory | Where SQLite and Chroma databases are stored |
| Context injection | Control how much previous context is injected at session start |
| Observation limits | Maximum observations per context injection |

---

## Privacy Controls

Exclude sensitive content from memory by wrapping it in `<private>` tags anywhere in your messages or code:

```
<private>
DATABASE_URL=postgres://user:password@host/db
SECRET_KEY=abc123
</private>
```

Content inside these tags is never stored in the database.

---

## Beta Features

Claude-mem has a beta channel with experimental features. Check the settings at `~/.claude-mem/settings.json` for available beta options including:

- **Endless Mode** -- experimental biomimetic memory architecture for extended sessions

---

## Web UI

Access the real-time memory viewer at http://localhost:37777. The UI shows:
- Live observation stream
- Session history
- Memory search interface
- Settings management

---

## Multiple AI Providers

Claude-mem supports multiple AI providers for observation compression:
- Claude (default)
- Gemini via Google API
- OpenRouter (100+ models)

Configure the provider in `~/.claude-mem/settings.json`.

---

## Memory Export/Import

Export memory for backup or sharing:

```bash
# Check the web UI at http://localhost:37777 for export/import options
```

Import supports duplicate prevention -- re-importing the same data won't create duplicates.

---

## Git Worktree Support

Claude-mem automatically unifies context across git worktrees. If you use worktrees for feature branches, memory from all worktrees is accessible in any session for the same repository.

---

## Troubleshooting

- **Worker not starting**: Check if port 37777 is in use: `lsof -i:37777`
- **No context injected**: Verify hooks are active -- restart Claude Code after installation
- **Stale observations**: Use the web UI to inspect and manually clean observations
- **High token usage**: Reduce observation limits in settings to inject less context per session
