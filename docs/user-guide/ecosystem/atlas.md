---
title: "Component: atlas"
description: The unified catalog / knowledge graph and atlas CLI.
category: ecosystem
last_updated: 2026-06-23
---

[Docs](../index.md) › [Ecosystem](./overview.md) › atlas

# atlas — the catalog & knowledge graph

**Package:** `@a5c-ai/atlas` · **CLI:** `atlas` (alias `a5c-atlas`) · **Version:** 5.1.0 · **Maturity:** GA

**Atlas is the unified knowledge graph and catalog for the ecosystem. It is the single source of truth for harness metadata, discovery snapshots, plugin targets, host detection, and package/process topology — and it is what lets you add a harness as a *data change* rather than a code change.**

---

## On this page

- [What it is](#what-it-is)
- [How it works](#how-it-works)
- [Why it matters for obedience](#why-it-matters-for-obedience)
- [Entrypoints](#entrypoints)
- [Who uses it](#who-uses-it)
- [Next steps](#next-steps)

---

## What it is

Atlas is described in its own package as the "Atlas catalog graph data, SDK, and CLI." It is the unified knowledge graph / ontology / catalog that the rest of the stack reads from. Rather than hand-wiring harness facts into the runtime, those facts live in Atlas as data and are generated into types and snapshots.

---

## How it works

The pipeline is data-first:

```
YAML graph definitions  →  generated TypeScript types  →  JSON snapshots consumed at runtime
```

- **YAML graph definitions** describe the catalog (harnesses, plugin targets, topology).
- Those compile to **generated TS types** so consumers get type safety.
- And to **JSON snapshots** that the runtime reads directly.

The catalog runtime surface is exposed at `@a5c-ai/atlas/catalog`, with additional subpaths `./indexer` and `./graph-index`. An MCP endpoint is exposed through the Atlas WebUI (`/api/mcp`, Streamable HTTP).

---

## Why it matters for obedience

A core v6 design principle is that "every integration surface is defined once in a central catalog and multiplexed to N adapters or targets through generated code." Atlas *is* that central catalog. Because harness/plugin/discovery metadata is generated data, the [adapters](./adapters.md) family and the hooks lifecycle don't have to be re-coded per harness — they read Atlas. That keeps the enforcement layer consistent across every supported harness.

---

## Entrypoints

| Surface | Detail |
|---------|--------|
| Bins | `atlas`, `a5c-atlas` |
| Subpaths | `./catalog`, `./indexer`, `./graph-index` |
| MCP | Exposed via the Atlas WebUI at `/api/mcp` (Streamable HTTP) |

A quick taste of the CLI:

```bash
# Inspect the catalog the runtime will read
atlas --help
```

> Atlas CLI subcommands and flags are governed by the repository's CLI allowlist; consult `atlas --help` on your installed version for the authoritative, version-matched surface.

---

## Who uses it

The SDK, the adapters family, the hooks lifecycle, plugin tooling, and the Atlas WebUI all consume the catalog. In the [architecture](../architecture.md), Atlas sits beside the SDK and feeds the adapters/hooks/plugins layer with the metadata they need.

---

## Next steps

- **See where it sits:** [Architecture & How It Fits Together](../architecture.md)
- **See what it feeds:** [Adapters overview](./adapters.md) and the [Adapter Types reference](../reference/adapter-types.md)
- **Ecosystem map:** [Ecosystem Overview](./overview.md)
