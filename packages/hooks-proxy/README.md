# @a5c/hooks-proxy

A universal hooks proxy system that normalizes lifecycle hooks across multiple AI coding harnesses (Claude Code, Codex, Gemini CLI, Cursor, GitHub Copilot, Pi, oh-my-pi, OpenCode, OpenClaw) into a single canonical event model.

## Packages

| Package | Description |
|---------|-------------|
| `@a5c/hooks-proxy-core` | Canonical schemas, types, session store, and merge engine |
| `@a5c/hooks-proxy-cli` | CLI entrypoint (`a5c-hooks-proxy`) |
| `@a5c/hooks-proxy-adapter-claude` | Claude Code harness adapter |
| `@a5c/hooks-proxy-adapter-codex` | Codex harness adapter |
| `@a5c/hooks-proxy-adapter-gemini` | Gemini CLI harness adapter |
| `@a5c/hooks-proxy-adapter-copilot` | GitHub Copilot harness adapter |
| `@a5c/hooks-proxy-adapter-cursor` | Cursor harness adapter |
| `@a5c/hooks-proxy-adapter-pi` | Pi harness adapter |
| `@a5c/hooks-proxy-adapter-oh-my-pi` | oh-my-pi harness adapter |
| `@a5c/hooks-proxy-adapter-opencode` | OpenCode harness adapter |
| `@a5c/hooks-proxy-adapter-openclaw` | OpenClaw harness adapter |

## Quick Start

```bash
# Install the CLI
npm install -g @a5c/hooks-proxy-cli

# Run diagnostics
a5c-hooks-proxy doctor

# Proxy a hook event through the canonical pipeline
a5c-hooks-proxy proxy --adapter claude --hook-type stop
```

## Documentation

See [docs/](./docs/) for architecture, adapter authoring guides, and the canonical event schema reference.
