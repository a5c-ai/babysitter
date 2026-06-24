---
title: Ecosystem Overview
description: What the Babysitter monorepo is, the components it ships, and how to choose among them.
category: ecosystem
last_updated: 2026-06-23
---

[Docs](../index.md) › [Ecosystem](#) › Overview

# Babysitter Ecosystem Overview

**The Babysitter repository is a monorepo: one core orchestration engine plus a family of packages that surround it — a catalog, an agent runtime, adapters, a dashboard, and adjacent products. This page explains what each component is and helps you pick the ones you actually need.**

If you only want to run AI coding work under a deterministic, enforced process, you need very little of this — the core SDK and a harness plugin. Everything else exists to extend that core to more surfaces (CI, Kubernetes, browser), more harnesses, richer observability, and a shared knowledge graph.

> **Positioning reminder:** Babysitter's value proposition is **deterministic process execution + complex agentic workflows + policy/process adherence (obedience)** — "Enforcement, not Assistance." Every component below serves that thesis. Quality convergence is one capability of the engine, not the product.

---

## On this page

- [What the monorepo is](#what-the-monorepo-is)
- [The component map](#the-component-map)
- [How to choose](#how-to-choose)
- [Maturity at a glance](#maturity-at-a-glance)
- [Naming notes](#naming-notes)
- [Next steps](#next-steps)

---

## What the monorepo is

The repository (`a5c-ai/babysitter`) holds the entire stack under `packages/`. At its center is the **event-sourced orchestration engine** (`@a5c-ai/babysitter-sdk`): your workflow is real JavaScript code, the orchestrator can only do what that code permits, every step is recorded in an immutable journal, and a hook-enforced **mandatory stop** after each step decides what the process permits next. That is the obedience mechanism.

Everything else in the monorepo is built around that engine:

- A **knowledge graph / catalog** (atlas) that supplies harness, plugin, and topology metadata as generated data, so adding a harness is a data change rather than a code change.
- An **agent runtime product** (genty) that packages the agent loop, daemon, and platform layers into a single `genty` binary and exposes the headless/internal harness.
- An **adapters family** (20 package directories) that multiplexes a single integration definition out to many harnesses, transports, CI triggers, plugin formats, and lifecycle hooks.
- A **real-time dashboard** (observer-dashboard) that streams the journal over SSE.
- Two **adjacent / forward-looking** components: kradle (a Kubernetes-native Git forge, MVP) and kip-sdk (a memory substrate that is **spec/design only — no shipping code**).

---

## The component map

| Component | Package(s) | What it is | Maturity | Read |
|-----------|-----------|------------|----------|------|
| **babysitter-sdk** | `@a5c-ai/babysitter-sdk` | The core event-sourced orchestration engine: `defineTask`, the effect/journal engine, the built-in Pi execution engine, token compression. Everything else depends on it. | GA | [SDK overview](./babysitter-sdk.md) |
| **babysitter (metapackage)** | `@a5c-ai/babysitter` | Convenience install that pulls in the babysitter npm packages and ships the `babysitter` bin shim. The recommended human-facing install. | GA | [SDK overview](./babysitter-sdk.md) |
| **adapters** | `@a5c-ai/adapters` (+ 19 sibling packages) | A **family** of packages that multiplex one integration definition to many targets: triggers (CI), extensions (plugin compile), hooks (mandatory-stop lifecycle), proxy (140+ providers), tasks (durable breakpoints), and more. | GA | [Adapters overview](./adapters.md) · [Adapter types](../reference/adapter-types.md) |
| **atlas** | `@a5c-ai/atlas` | The unified knowledge graph / catalog: YAML graph → generated TS types → JSON snapshots consumed at runtime. Single source of truth for harness metadata, discovery, plugin targets, and topology. Ships the `atlas` CLI. | GA | [Atlas overview](./atlas.md) |
| **genty** | `@a5c-ai/genty` + `-core` / `-runtime` / `-platform` | The unified agent product (renamed from "tula") that composes the agent stack into the single `genty` binary: agent loop, daemon/session/cost, harness integration and governance. Surfaces the internal/headless harness. | GA | [Genty overview](./genty.md) |
| **observer-dashboard** | `@a5c-ai/babysitter-observer-dashboard` | A Next.js real-time observability dashboard that streams run/journal events over SSE and virtualizes large run histories. | GA | [Observer Dashboard overview](./observer-dashboard.md) |
| **kradle** | `@a5c-ai/kradle` + `@a5c-ai/kradle-cli` | A Kubernetes-native Git forge runtime (Argo CD GitOps + Gitea hosting) with a per-org dispatchable assistant. | MVP | [Kradle overview](./kradle.md) |
| **kip-sdk** | no published package (spec-only); path `packages/kip-sdk` | A **spec/design-only** memory substrate (K/I/P): git-substrate, bitemporal, signed-fact property graph. **No code — Markdown spec only.** | Spec only | [kip-sdk overview](./kip-sdk.md) |

> The canonical machine-readable map of public/internal packages, apps, and harness plugins lives at [Package & Plugin Map](../../package-and-plugin-map.md).

---

## How to choose

Pick by what you are trying to do:

- **"I just want to run AI coding work under an enforced process."**
  Install the metapackage `@a5c-ai/babysitter` and your harness plugin. You get the engine + the `babysitter` CLI. See [Installation](../getting-started/installation.md) and [Quickstart](../getting-started/quickstart.md). You do not need atlas, genty, kradle, or kip directly — the engine pulls in what it needs.

- **"I want to run a process headlessly, in CI, or via the internal harness."**
  Use [genty](./genty.md) (`@a5c-ai/genty-platform`) for `genty call --harness internal`, daemon, MCP serving, and the TUI; and the **triggers adapter** ([adapter types](../reference/adapter-types.md)) as the GitHub Action / CI entrypoint.

- **"I want to run on a harness other than Claude Code."**
  This is the [adapters](./adapters.md) family's job — codecs drive each harness, extensions compile one plugin manifest into per-harness formats, and hooks enforce the mandatory stop across all of them. See the [Install Matrix](../harnesses/install-matrix.md).

- **"I want to free a vendor-locked harness from a single backend."**
  Use the **proxy adapter** (Python LiteLLM bridge, 140+ providers) via `adapters launch --with-proxy-if-needed`. See [adapter types](../reference/adapter-types.md).

- **"I want durable human-approval breakpoints that survive cold starts / serverless."**
  Use the **tasks adapter** (the Breakpoints Adapter) — durable backends including GitHub Issues. See [Breakpoints](../features/breakpoints.md).

- **"I want to watch runs in real time."**
  Use the [observer dashboard](./observer-dashboard.md) (`/babysitter:observe` or `genty observe`).

- **"I want harness/plugin/discovery metadata or a queryable catalog."**
  That is [atlas](./atlas.md) and its `atlas` CLI.

- **"I want a self-hosted, Kubernetes-native Git forge with built-in agent dispatch."**
  Look at [kradle](./kradle.md) — but note it is an **MVP**.

- **"I'm researching the memory/context-management design."**
  Read [kip-sdk](./kip-sdk.md), and understand it is **spec only — there is no implementation to install.**

---

## Maturity at a glance

Be honest about what is shipping versus what is forward-looking:

| Component | Status | What "status" means here |
|-----------|--------|--------------------------|
| babysitter-sdk / babysitter / atlas / genty / observer-dashboard | **GA** (v5.1.0) | Versioned, runtime, generally available. |
| adapters family | **GA** | Versioned and consumed by the runtime. A couple of subdirs are thin (see [adapter types](../reference/adapter-types.md) for the honest per-package notes). |
| kradle | **MVP** | Described by its own README as an "executable MVP runtime and handoff package." Early; expect rough edges. |
| kip-sdk | **Spec only** | Entirely Markdown — `SPEC.md` + numbered design docs. No `package.json`, no `src/`. Treat any kip "feature" as **design, not shipping code.** |

---

## Naming notes

- The agent runtime product is **genty** (binary `genty`), backed by `@a5c-ai/genty-platform`. Some older material (the `docs/v6-announcement.md` dated April 2026) refers to `agent-platform` / `babysitter-harness`; that naming is stale. The README and package metadata are authoritative — standardize on **genty / `@a5c-ai/genty-platform`**.
- "genty harness" in everyday usage means running processes through the **genty CLI on the SDK's internal Pi engine** (`genty call --harness internal`). There is no standalone `genty` codec in the codecs package.
- The **adapters** family keeps its name precisely because it is not genty-specific — it multiplexes for *all* agents.

---

## Next steps

- **Start with the engine:** [babysitter-sdk overview](./babysitter-sdk.md)
- **See how it all fits together:** [Architecture & How It Fits Together](../architecture.md)
- **Understand the adapter family:** [Adapter Types reference](../reference/adapter-types.md)
- **Install and run:** [Installation](../getting-started/installation.md) → [Quickstart](../getting-started/quickstart.md)
