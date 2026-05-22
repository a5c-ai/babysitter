# OpenClaw

Adapter for the **OpenClaw** CLI.

## Install

```bash
amux install openclaw
```

Supported on macOS, Linux and Windows.

## Auth

- **Provider API keys** — OpenClaw is provider-agnostic; set provider-specific env vars (e.g. `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`).

Config file: `~/.openclaw/config.json`.

## Minimal run

```bash
amux run openclaw --prompt "Generate a CHANGELOG entry"
```

## Notable flags

- `--model <id>` — default `default`.
- `--prompt <text>` — forwarded prompt.
- `--auto-approve` — emitted when `approvalMode: 'yolo'`.

## Session files

- Location: `~/.openclaw/sessions/*.jsonl`
- JSONL; events `text`, `message`, `tool_call` are parsed.

## Plugins

Plugin support: **no**. Use MCP servers for extensibility.

### MCP Servers
```bash
amux mcp install openclaw <mcp-server>
amux mcp list openclaw
```

Registry: https://modelcontextprotocol.io

## Capabilities

Tool calling with parallel calls, tool-call streaming, text streaming, 128k context.

## Known limitations

- No thinking / reasoning mode.
- No JSON / structured output.
- No image input/output, no file input.
- Only a generic `default` model is bundled — specify provider models explicitly via `--model`.
- Global config only (`supportsProjectConfig: false`).
