# Claude Code

Adapter for Anthropic's **Claude Code** CLI.

## Install

```bash
amux install claude
```

Minimum CLI version: `1.0.0`. Supported on macOS, Linux and Windows.

## Auth

Two auth methods are supported:

- **API key** — set `ANTHROPIC_API_KEY` in your environment.
- **Browser login** — run `claude` once interactively to complete OAuth.

Credentials live in `~/.claude/settings.json`.

## Minimal run

```bash
amux run claude --prompt "Summarize README.md"
```

Programmatic:

```ts
import { createClient } from '@a5c-ai/agent-mux';
const client = createClient();
const handle = await client.run({ agent: 'claude', prompt: 'Hello' });
for await (const ev of handle.events()) console.log(ev);
```

## Notable flags

The adapter forwards these `RunOptions` to the CLI:

- `--output-format jsonl` (always, for streaming parse)
- `--model <id>` — e.g. `claude-sonnet-4-20250514` or `claude-opus-4-20250514`
- `--resume <sessionId>` — resume a prior session
- Thinking effort: `low | medium | high | max`
- Approval modes: `yolo`, `prompt`, `deny`

## Session files

- Location: `~/.claude/projects/<project-hash>/*.jsonl`
- Format: JSONL, one event per line
- Resume and fork are both supported (`canResume`, `canFork`).

## Plugins

Plugin support: **yes**. Claude Code has a full plugin ecosystem with marketplace.

### Native Plugin Management
```bash
amux plugin install claude <plugin>
amux plugin list claude
amux plugin marketplace claude
```

### MCP Servers
```bash
amux mcp install claude <mcp-server>
amux mcp list claude
```

Registry: https://modelcontextprotocol.io for MCP servers.
Plugin marketplace: Available through `claude plugins marketplace`.

## Capabilities

Streaming text, tool calls and thinking; parallel tool calls; image input; file attachments; subagent dispatch (up to 10 parallel). Supports Skills and `AGENTS.md`.

## Known limitations

- Image **output** is not supported.
- Tool approval is required by default — use `approvalMode: 'yolo'` to auto-approve in trusted environments.
- Session file paths are keyed by a hash of the project directory; moving a repo invalidates resume.
