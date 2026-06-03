# Pi

Adapter for the **Pi** agent CLI.

## Install

```bash
adapters install pi
```

Supported on macOS, Linux and Windows.

## Auth

- **Provider API keys** — provider-specific env vars.

Config file: `~/.pi/agent/settings.json`.

## Minimal run

```bash
adapters run pi --prompt "Draft a commit message"
```

## Notable flags

- `--model <id>` — default `default`.
- `--prompt <text>` — forwarded prompt.

## Session files

- Location: `~/.pi/agent/sessions/*.jsonl`
- JSONL; parses `text`, `message`, and `tool_call` events.

## Plugins

Plugin support: **no**. Use MCP servers for extensibility.

### MCP Servers
```bash
adapters mcp install pi <mcp-server>
adapters mcp list pi
```

Registry: https://modelcontextprotocol.io

## Capabilities

Tool calling (not parallel), tool-call streaming, text streaming, 128k context.

## Known limitations

- No parallel tool calls.
- No thinking mode, no JSON mode, no structured output.
- No image, no file input.
- Approval mode is not wired through to CLI flags.
- Global config only.
