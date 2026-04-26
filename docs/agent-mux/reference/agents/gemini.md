# Gemini CLI

Adapter for Google's **Gemini CLI**.

## Install

```bash
amux install gemini
```

Minimum CLI version: `1.0.0`. Supported on macOS, Linux and Windows.

## Auth

- **API key** — set `GOOGLE_API_KEY` or `GEMINI_API_KEY`.
- **Browser login** — sign in with a Google account.

Config file: `~/.config/gemini/settings.json`.

## Minimal run

```bash
amux run gemini --prompt "Explain this diff"
```

## Notable flags

- `--model <id>` — default `gemini-2.5-pro`; also `gemini-2.5-flash`.
- `--prompt <text>` — forwarded prompt.
- `--sandbox false` — emitted when `approvalMode: 'yolo'` to disable the sandbox.

## Session files

- Location: `~/.gemini/sessions/*.jsonl`
- JSONL-formatted; standard agent-mux parser.

## Extensions

Extension support: **yes** — Gemini CLI extension format for prompts, MCP servers, commands, themes, and hooks.

### Extension Management
```bash
amux plugin install gemini <extension>
amux plugin list gemini
```

### MCP Servers  
```bash
amux mcp install gemini <mcp-server>
amux mcp list gemini
```

Registry: https://modelcontextprotocol.io for MCP servers.

## Capabilities

1M-token context window, thinking (`low/medium/high`) with streaming, parallel tool calls, JSON mode, structured output, image input, file input.

## Known limitations

- No image output.
- Project-level config is not supported (`supportsProjectConfig: false`).
- `--sandbox false` should only be used in trusted environments — it disables the CLI's built-in safety sandbox.
