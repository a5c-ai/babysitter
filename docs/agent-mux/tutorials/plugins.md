# Plugins (MCP)

agent-mux normalizes plugin management across adapters that support the **Model Context Protocol**. Under the hood it writes to each agent's MCP config file.

## Which adapters support plugins?

| Adapter            | `supportsPlugins` |
| ------------------ | ----------------- |
| `claude`           | yes               |
| `cursor`           | yes               |
| `gemini`           | yes               |
| `opencode`         | yes               |
| `openclaw`         | yes               |
| `codex`, `copilot`, `hermes`, `pi`, `omp`, `agent-mux-remote` | no |

## Install

```bash
amux plugin install claude @modelcontextprotocol/server-filesystem \
  --arg /workspace
```

Programmatic:

```ts
await client.installPlugin({
  agent: 'claude',
  name: 'filesystem',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/workspace'],
  env: {},
});
```

## List

```bash
amux plugin list claude
```

Returns `InstalledPlugin[]` with the name, command, args, and env currently configured.

## Uninstall

```bash
amux plugin uninstall claude filesystem
```

## Where it writes

Each adapter points at its native MCP location — e.g. `~/.claude/settings.json` for Claude Code, `~/.config/gemini/settings.json` for Gemini. See the per-agent page for the exact file.

## Registry

Plugin discovery uses the MCP registry at https://modelcontextprotocol.io. The registry is not currently searchable from the CLI (`searchable: false`), so you install by name.
