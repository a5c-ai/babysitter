# @a5c-ai/hooks-mux

A universal hooks proxy system that normalizes lifecycle hooks across multiple AI coding harnesses (Claude Code, Codex, Gemini CLI, Cursor, GitHub Copilot, Pi, oh-my-pi, OpenCode, OpenClaw) into a single canonical event model.

<!-- docs-status:start -->
> Status: Public package family.
> Canonical docs home: [Package and Plugin Docs Map](../../docs/package-and-plugin-map.md).
> Use this README as the canonical family entrypoint for hooks-mux packages and adapters.
<!-- docs-status:end -->

## Packages

| Package | Description |
|---------|-------------|
| `@a5c-ai/hooks-mux-core` | Canonical schemas, types, session store, and merge engine |
| `@a5c-ai/hooks-mux-cli` | CLI entrypoint (`a5c-hooks-mux`) |
| `@a5c-ai/hooks-mux-adapter-claude` | Claude Code harness adapter |
| `@a5c-ai/hooks-mux-adapter-codex` | Codex harness adapter |
| `@a5c-ai/hooks-mux-adapter-gemini` | Gemini CLI harness adapter |
| `@a5c-ai/hooks-mux-adapter-copilot` | GitHub Copilot harness adapter |
| `@a5c-ai/hooks-mux-adapter-cursor` | Cursor harness adapter |
| `@a5c-ai/hooks-mux-adapter-pi` | Pi harness adapter |
| `@a5c-ai/hooks-mux-adapter-oh-my-pi` | oh-my-pi harness adapter |
| `@a5c-ai/hooks-mux-adapter-opencode` | OpenCode harness adapter |
| `@a5c-ai/hooks-mux-adapter-openclaw` | OpenClaw harness adapter |

## Quick Start

```bash
# Install the CLI
npm install -g @a5c-ai/hooks-mux-cli

# Run diagnostics
a5c-hooks-mux doctor

# Proxy a hook event through the canonical pipeline
a5c-hooks-mux proxy --adapter claude --hook-type stop
```

## Documentation

See [docs/](./docs/) for architecture, adapter authoring guides, and the canonical event schema reference.
