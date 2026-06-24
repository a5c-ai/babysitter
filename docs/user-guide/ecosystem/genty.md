---
title: "Component: genty"
description: The unified agent runtime product and the genty CLI.
category: ecosystem
last_updated: 2026-06-23
---

[Docs](../index.md) › [Ecosystem](./overview.md) › genty

# genty — the unified agent runtime

**Packages:** `@a5c-ai/genty` + `@a5c-ai/genty-core` / `@a5c-ai/genty-runtime` / `@a5c-ai/genty-platform` · **CLI:** `genty` · **Version:** 5.1.0 · **Maturity:** GA (actively consolidating)

**Genty is the unified agent product that composes every layer of the Babysitter agent stack into a single distributable binary, `genty`. It is how you run processes headlessly, serve MCP, run the internal harness, and drive the daemon/TUI.**

> **Naming:** genty is the renamed `tula` stack. Older material (the April 2026 `v6-announcement.md`) calls the orchestration CLI `agent-platform` / `babysitter-harness` — that naming is **stale**. The README and package metadata are authoritative: use **genty** and `@a5c-ai/genty-platform`.

---

## On this page

- [What it is](#what-it-is)
- [The layered architecture](#the-layered-architecture)
- [The command surface](#the-command-surface)
- [genty as a harness](#genty-as-a-harness)
- [Surfaces](#surfaces)
- [Examples](#examples)
- [Next steps](#next-steps)

---

## What it is

Genty composes the agent stack into one binary. The `@a5c-ai/genty` package (the `cli/` package) re-exports all layers and owns the single `genty` binary. Install the runtime layer when you need headless orchestration, the internal harness, daemon utilities, MCP serving, or the TUI:

```bash
npm install -g @a5c-ai/genty-platform
```

---

## The layered architecture

| Layer | Package | Responsibility |
|-------|---------|----------------|
| **L4** | `@a5c-ai/genty-core` | "Genty core runtime and tool surface": the agent loop, subagent, context-management strategies, agentic tools (code/exec/fs/web/browser/delegation), synthesis interfaces, and the deferred/extension tool registries. |
| **L5** | `@a5c-ai/genty-runtime` | Daemon, session, cost, observability, telemetry. |
| **L6** | `@a5c-ai/genty-platform` | "Agent Platform layer — harness integration, governance, interaction, storage" (subpaths `./anycli ./api ./cost ./daemon ./governance ./harness ./interaction …`). |
| **CLI** | `@a5c-ai/genty` | Re-exports all layers; owns the `genty` binary. |

---

## The command surface

Verified from `packages/genty/cli/src/cli/dispatch.ts`, the `genty` binary dispatches:

`call`, `yolo`, `plan`, `forever`, `resume`, `resume-run`, `create-run`, `retrospect`, `cleanup`, `assimilate`, `doctor`, `contrib`, `observe`, `tui`, `start-server`, `rpc`, `discover`, `list`, `invoke`, `print`, `session-history`, `session-export`, `anycli`, `user-install`, `project-install`, `help`, `version`.

In an in-session context the same surface is exposed as the babysitter command set (for example `/babysitter:call`, `/babysitter:plan`, `/babysitter:resume`). See [Slash Commands](../reference/slash-commands.md).

---

## genty as a harness

The README surfaces genty both as the runtime CLI and as a "harness" (`genty call --harness internal …`). One thing to be precise about:

> The codecs package does **not** list a standalone `genty` codec. The internal/headless engine is the SDK's built-in **Pi** engine surfaced through `genty call --harness internal`. So the "genty harness" in everyday usage is the **genty CLI running on the internal Pi engine** — not a separate codec.

This is the harness to reach for in CI/CD and headless automation when you want orchestration without a third-party coding harness.

---

## Surfaces

Genty ships UI surfaces under `packages/genty/{ui,webui,tui,desktop-app,mobile-*,tv-*,watch-*,web-app}`, reflecting the v6 ambition of running processes on every surface. The TUI is available via `genty tui`.

---

## Examples

```bash
# Run a process headlessly on the internal (Pi) engine — good for CI
genty call --harness internal "implement the change described in the issue"

# Plan a run without executing it
genty plan "refactor the auth module"

# Serve MCP for a client like Claude Desktop
genty start-server

# Watch a live run
genty observe

# Resume an interrupted run from its journal
genty resume
```

> Subcommand flags are governed by the repository CLI allowlist; run `genty <command> --help` for the version-matched flag surface.

---

## Next steps

- **See where it sits:** [Architecture & How It Fits Together](../architecture.md)
- **The internal harness in context:** [Adapters overview](./adapters.md)
- **Commands:** [Slash Commands](../reference/slash-commands.md) and [CLI Reference](../reference/cli-reference.md)
- **Ecosystem map:** [Ecosystem Overview](./overview.md)
