# @a5c-ai/hooks-adapter-cli

A universal hooks proxy system that normalizes lifecycle hooks across multiple AI coding harnesses (Claude Code, Codex, Gemini CLI, Cursor, GitHub Copilot, Pi, oh-my-pi, OpenCode, OpenClaw) into a single canonical event model.

<!-- docs-status:start -->
> Status: Public package family.
> Canonical docs home: [Package and Plugin Docs Map](../../docs/package-and-plugin-map.md).
> Use this README as the canonical family entrypoint for hooks-adapter packages and adapters.
<!-- docs-status:end -->

## Packages

| Package | Description |
|---------|-------------|
| `@a5c-ai/hooks-adapter-core` | Canonical schemas, types, session store, and merge engine |
| `@a5c-ai/hooks-adapter-cli` | CLI entrypoint (`a5c-hooks-adapter`) |
| `@a5c-ai/hooks-adapter-antigravity` | Antigravity harness adapter |
| `@a5c-ai/hooks-adapter-claude` | Claude Code harness adapter |
| `@a5c-ai/hooks-adapter-codex` | Codex harness adapter |
| `@a5c-ai/hooks-adapter-copilot` | GitHub Copilot harness adapter |
| `@a5c-ai/hooks-adapter-cursor` | Cursor harness adapter |
| `@a5c-ai/hooks-adapter-gemini` | Gemini CLI harness adapter |
| `@a5c-ai/hooks-adapter-genty` | Genty harness adapter — **not yet on npm**, publishes first in the recovery release (FIX-005) |
| `@a5c-ai/hooks-adapter-hermes` | Hermes harness adapter |
| `@a5c-ai/hooks-adapter-oh-my-pi` | oh-my-pi harness adapter |
| `@a5c-ai/hooks-adapter-openclaw` | OpenClaw harness adapter |
| `@a5c-ai/hooks-adapter-opencode` | OpenCode harness adapter |
| `@a5c-ai/hooks-adapter-pi` | Pi harness adapter |

This table is documentation only. The authoritative list of harness leaves is
derived from the workspace manifests by the `hooks-leaves` release-matrix group
(`node scripts/release-matrix.cjs --group hooks-leaves`), which is what the build
and publish workflows expand; a new leaf directory under
`packages/adapters/hooks/adapter-*` joins those matrices automatically. See
[docs/release-pipeline.md](../../../docs/release-pipeline.md#package-inventory-and-release-matrices).

Every leaf and the CLI declare `@a5c-ai/atlas` as a direct dependency (FIX-006);
none of them rely on transitive hoisting for their Atlas imports, and
`npm run verify:metadata` fails if that regresses.

## Quick Start

```bash
# Install the CLI
npm install -g @a5c-ai/hooks-adapter-cli

# Run diagnostics
a5c-hooks-adapter doctor

# Proxy a hook event through the canonical pipeline
a5c-hooks-adapter proxy --adapter claude --hook-type stop
```

## Documentation

See [docs/](./docs/) for architecture, adapter authoring guides, and the canonical event schema reference.
