# OMP

Adapter for the **OMP** agent CLI.

## Install

```bash
amux install omp
```

Supported on macOS, Linux and Windows.

## Auth

- **Provider API keys** — provider-specific env vars.

Config file: `~/.omp/agent/settings.json`.

## Minimal run

```bash
amux run omp --prompt "Lint this file"
```

## Notable flags

- `--model <id>` — default `default`.
- `--prompt <text>` — forwarded prompt.

## Session files

- Location: `~/.omp/agent/sessions/*.jsonl`
- JSONL; events `text`, `message`, `tool_call` are recognized.

## Plugins

Plugin support: **no**. Use MCP servers for extensibility.

### MCP Servers
```bash
amux mcp install omp <mcp-server>
amux mcp list omp
```

Registry: https://modelcontextprotocol.io

## Capabilities

Tool calling (not parallel), tool-call streaming, text streaming, 128k context.

## Known limitations

- No parallel tool calls.
- No thinking / JSON / structured output.
- No image or file input.
- Approval mode is not forwarded to the CLI.
- Global config only (`supportsProjectConfig: false`).
