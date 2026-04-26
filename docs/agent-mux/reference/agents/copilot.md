# GitHub Copilot

Adapter for **GitHub Copilot CLI** (`gh copilot`).

## Install

```bash
amux install copilot
```

Supported on macOS, Linux and Windows. The adapter spawns `gh copilot suggest ...`, so the `gh` CLI must be on `PATH`.

## Auth

- **GitHub token** — set `GITHUB_TOKEN`.
- **OAuth device flow** — `gh auth login` handles this.

Settings: `~/.config/github-copilot/settings.json`.

## Minimal run

```bash
amux run copilot --prompt "How do I rebase onto main?"
```

## Notable flags

The adapter runs:

```
gh copilot suggest "<prompt>"
```

It does not currently forward `--model` or approval modes — Copilot CLI selects the model server-side. Default bundled model is `gpt-4o`.

## Session files

- Location: `~/.config/github-copilot/sessions/*.jsonl`
- Output is parsed line-by-line; non-JSON lines are treated as plain text deltas.

## Plugins

Plugin support: **yes** — GitHub Copilot CLI plugin marketplace with agents/skills/hooks/MCP packages.

### Plugin Management
```bash
amux plugin install copilot <plugin>
amux plugin list copilot
amux plugin update copilot <plugin>
amux plugin uninstall copilot <plugin>
```

### MCP Servers
```bash
amux mcp install copilot <mcp-server>
amux mcp list copilot
```

## Capabilities

Text streaming only. No native tool calling, no parallel tool calls, no JSON mode, no image input.

## Known limitations

- Cannot resume or fork sessions server-side — Copilot CLI is stateless per invocation.
- `--model` is ignored (Copilot picks the model).
- Requires `gh` CLI and an authenticated GitHub user.
- Project-level config not supported.
