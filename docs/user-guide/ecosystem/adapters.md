---
title: "Component: adapters (the family)"
description: The adapters family — a multiplexer for all agents, not one package.
category: ecosystem
last_updated: 2026-06-23
---

[Docs](../index.md) › [Ecosystem](./overview.md) › adapters

# adapters — a family, not one thing

**Umbrella package:** `@a5c-ai/adapters` · **Source:** `packages/adapters/*` (20 package directories) · **Version:** 5.1.0 · **Maturity:** GA

> **The single most important point on this page:** "Adapters" is a **family of packages**, not one package. There are 20 adapter package directories under `packages/adapters/`, each with a distinct job. When someone says "adapters," ask *which* adapter.

**The adapters family is the multiplexer for *all* agents. It is what turns "Babysitter runs on Claude Code" into "Babysitter runs on any supported harness, in CI, with any of 140+ model providers, with durable human approvals" — by defining each integration surface once and multiplexing it to many targets.**

The family keeps its name precisely because it is **not** genty-specific — it multiplexes for every agent.

---

## On this page

- [Why it is a family](#why-it-is-a-family)
- [The umbrella package](#the-umbrella-package)
- [The big six you will actually touch](#the-big-six-you-will-actually-touch)
- [The full taxonomy](#the-full-taxonomy)
- [Provenance](#provenance)
- [Next steps](#next-steps)

---

## Why it is a family

A harness is integrated by *describing* it — its capabilities, hook model, and command surface — as data in the [Atlas](./atlas.md) catalog, and the runtime adapts. Adding or updating a harness becomes an adapter/data change, not a fork of the orchestration engine. Different concerns (spawning a session, normalizing hooks, bridging providers, parking a breakpoint, compiling a plugin) live in different packages so each can evolve independently.

---

## The umbrella package

`@a5c-ai/adapters` (the `sdk/` directory) is the convenient one-install entry for the family. It re-exports:

- `comm-adapter` (the public Node core runtime), and
- `adapters-codecs` (the per-harness codecs), and
- `adapters-cli` (the `adapters` command).

```bash
npm install -g @a5c-ai/adapters-cli   # the host-side `adapters` CLI
adapters doctor
adapters run claude "explain this codebase"
```

See the [Adapters feature guide](../features/adapters.md) for the runtime story and the [Adapters CLI reference](../reference/adapters-cli.md) for the command surface.

---

## The big six you will actually touch

| Adapter | Package | Why you care |
|---------|---------|--------------|
| **triggers** | `@a5c-ai/triggers-adapter` | The CI / GitHub Action entrypoint — normalizes Git-forge events into one shape and launches a run non-interactively. |
| **extensions** | `@a5c-ai/extensions-adapter` | Compiles a single `plugin.json` manifest into **9** AI-coding-agent plugin formats. |
| **hooks** | `@a5c-ai/hooks-adapter-cli` + `@a5c-ai/hooks-adapter-core` | The cross-harness **mandatory-stop** lifecycle layer — this is what makes obedience work on every harness. |
| **proxy** | `adapters-proxy` (Python) | A LiteLLM bridge to **140+ providers** — frees vendor-locked harnesses from a single backend. |
| **tasks** | `@a5c-ai/tasks-adapter` | The **Breakpoints Adapter** — durable, serverless-ready human-approval breakpoints (e.g. GitHub Issues). |
| **codecs** | `@a5c-ai/adapters-codecs` | The concrete per-harness drivers (claude, codex, gemini, copilot, cursor, opencode, pi, …). |

---

## The full taxonomy

All 20 adapter types — what each is and where each is used — are enumerated in the dedicated reference:

➡️ **[Adapter Types reference](../reference/adapter-types.md)** — the authoritative list of all 20.

---

## Provenance

Several packages (`core/`, `cli/`, `sdk/`, `proxy/`, `tasks/`, `harness-mock/`) were consolidated into this monorepo from a **formerly standalone adapters repository** (the v6 announcement notes "1,363 files, 205K lines"). All adapter-family READMEs point to the canonical docs home `docs/package-and-plugin-map.md` ([Package & Plugin Map](../../package-and-plugin-map.md)).

---

## Next steps

- **The full list:** [Adapter Types reference](../reference/adapter-types.md) — all 20 types
- **The runtime story:** [Adapters feature guide](../features/adapters.md)
- **The command surface:** [Adapters CLI reference](../reference/adapters-cli.md)
- **See where it sits:** [Architecture & How It Fits Together](../architecture.md)
