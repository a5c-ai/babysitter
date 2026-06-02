---
title: Agent Plugins
description: Understand Babysitter agent harness plugins and how they differ from Babysitter blueprints.
last_updated: 2026-06-01
category: landing
---

# Agent Plugins

Agent plugins are the harness integration packages that install Babysitter into tools such as Claude Code, Codex, Cursor, Gemini CLI, OpenCode, and GitHub Actions. They remain plugins.

Babysitter marketplace installables were renamed to [blueprints](blueprints.md). Use this page for harness plugin packages and agent-runtime integration details. Use the blueprints page for marketplace packages, `install.md` instructions, registry operations, and `blueprint:*` CLI commands.

<!-- supported-harness-plugins:start -->
## Supported harness plugin packages

`plugins/babysitter-unified/` is the only maintained source tree in this repo.
Harness-specific bundles are generated from it and published as npm packages or
external plugin repos; they are not maintained as checked-in directories here.

Use this table when you need the canonical entrypoint for a specific Babysitter harness/plugin package rather than the broader blueprint marketplace explanation.

| Surface | Canonical docs home | Status note |
| --- | --- | --- |
| `plugins/babysitter-unified` | [plugins/babysitter-unified/per-harness/claude-code/README.md](../plugins/babysitter-unified/per-harness/claude-code/README.md) | Canonical authoring source plus Claude Code surface. |
| `@a5c-ai/babysitter-codex` | [plugins/babysitter-unified/per-harness/codex/README.md](../plugins/babysitter-unified/per-harness/codex/README.md) | Generated from the unified source; README is the canonical package-level contract. |
| `@a5c-ai/babysitter-cursor` | [plugins/babysitter-unified/per-harness/cursor/README.md](../plugins/babysitter-unified/per-harness/cursor/README.md) | Generated from the unified source; README is the canonical package-level contract. |
| `babysitter-gemini` | [plugins/babysitter-unified/per-harness/gemini/README.md](../plugins/babysitter-unified/per-harness/gemini/README.md) | Generated from the unified source; README is the canonical package-level contract. |
| `babysitter-github` | [plugins/babysitter-unified/per-harness/github/README.md](../plugins/babysitter-unified/per-harness/github/README.md) | Generated from the unified source; README is the canonical package-level contract. |
| `@a5c-ai/babysitter-omp` | [plugins/babysitter-unified/per-harness/omp/README.md](../plugins/babysitter-unified/per-harness/omp/README.md) | Generated from the unified source; README is the canonical package-level contract. |
| `@a5c-ai/babysitter-openclaw` | [plugins/babysitter-unified/per-harness/openclaw/README.md](../plugins/babysitter-unified/per-harness/openclaw/README.md) | Generated from the unified source; README is the canonical package-level contract. |
| `@a5c-ai/babysitter-opencode` | [plugins/babysitter-unified/per-harness/opencode/README.md](../plugins/babysitter-unified/per-harness/opencode/README.md) | Generated from the unified source; README is the canonical package-level contract. |
| `@a5c-ai/babysitter-pi` | [plugins/babysitter-unified/per-harness/pi/README.md](../plugins/babysitter-unified/per-harness/pi/README.md) | Generated from the unified source; README is the canonical package-level contract. |
<!-- supported-harness-plugins:end -->

## Bridge Flags for amux Launch

When launching agents through `amux launch`, two bridge flags control how Babysitter hooks and interactive orchestration integrate with the harness:

- `--bridge-interactive` enables an interactive bridge layer that proxies stdin/stdout through an intermediary capable of injecting Babysitter hook responses and orchestration signals while preserving the harness's native TUI.
- `--bridge-hooks` enables hook bridging. The bridge intercepts hook lifecycle events and forwards them to the Babysitter session-start hook.

The `hookSupport` and `bridgeCapabilities` attributes in the atlas graph agent version nodes describe which harnesses support these flags natively. See the [amux CLI reference](agent-mux/reference/10-cli-reference.md) for the full flag table.

## Plugin Mode And External Responders

When Babysitter runs inside a host agent plugin, most effects are host-resolvable: the host agent can edit files, run approved tools, answer breakpoints, and post task results back to the run.

External agent responder effects are different. A process can mark an agent task with `responderType: "agent"` and an agent-mux `adapter`; tasks-mux then resolves that effect through agent-mux instead of handing it back to the host as ordinary tool work.

This keeps the plugin contract small:

- Host-resolvable effects stay with the current host agent.
- External agent responder effects route through tasks-mux, agent-mux, and the `amuxBridge` integration.
- Fallback to the internal agent path must be explicit, using the current fallback field documented in the agent-reference docs.

For task shape, fallback behavior, and troubleshooting, see [Process Authoring Policy](agent-reference/process-authoring.md#agent-task-responders) and [Command Surfaces](agent-reference/command-surfaces.md#external-agent-dispatch).

## Names That Stay As Plugins

The blueprints rename does not change agent harness plugin concepts. These names remain plugin-specific:

- `CLAUDE_PLUGIN_ROOT`
- `PI_PLUGIN_ROOT`
- `.claude/plugins/`
- `packages/agent-mux/hooks/`
- `packages/extension-mux/`
- Agent plugin `plugin.json` manifests
- Agent plugin `install.md` files

## Built-in Quality Gates

The `babysitter-unified` plugin ships a small set of pre-deploy gates as flat command markdown files under `plugins/babysitter-unified/commands/`. Each command pairs a user-facing slash invocation with reusable process helpers, so the gate can be invoked manually or composed programmatically.

### `babysitter:check-forbidden-markers`

Pre-deploy substring grep for obsolete code paths that must never re-ship after a refactor or restart-from-baseline. Reads a project-local `scripts/forbidden-markers.txt` and scans built assets for forbidden markers.

- Helper: `library/processes/shared/forbidden-markers-scanner.js`
- Slash command: `plugins/babysitter-unified/commands/check-forbidden-markers.md`

## Further Reading

- [Babysitter Blueprints](blueprints.md)
- [Command Surfaces](agent-reference/command-surfaces.md)
- [Process Authoring Policy](agent-reference/process-authoring.md)
