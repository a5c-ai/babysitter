---
title: "Component: kradle"
description: A Kubernetes-native Git forge runtime with a per-org dispatchable assistant (MVP).
category: ecosystem
last_updated: 2026-06-23
---

[Docs](../index.md) › [Ecosystem](./overview.md) › kradle

# kradle — Kubernetes-native Git forge (MVP)

**Packages:** `@a5c-ai/kradle` (core) + `@a5c-ai/kradle-cli` · **Version:** 5.1.0 · **Maturity:** MVP

> **Maturity warning — read this first.** Kradle's own README describes it as an "executable MVP runtime and handoff package." Treat it as **early / MVP**: APIs, charts, and CRDs may change, and rough edges are expected. It is included here for completeness and forward planning, not as a hardened production system.

**Kradle is a Kubernetes-native Git forge runtime — Argo CD GitOps and Gitea-backed Git hosting — with a per-org dispatchable assistant. It lets you run a self-hosted forge where repositories, PRs, CI, and policy flow through Kubernetes-style custom resources.**

---

## On this page

- [What it is](#what-it-is)
- [How it models a forge](#how-it-models-a-forge)
- [The per-org assistant](#the-per-org-assistant)
- [Entrypoints](#entrypoints)
- [How it fits the stack](#how-it-fits-the-stack)
- [Example](#example)
- [Next steps](#next-steps)

---

## What it is

Per its package description, kradle is a "Kubernetes-native Git forge runtime with Argo CD GitOps and Gitea-backed Git hosting." It ships:

- A Node runtime and an HTTP API server.
- Helm charts and CRDs (`packages/kradle/charts/`).
- A Next.js console (`apps/web`).
- A controller container.

---

## How it models a forge

Repositories, PRs, CI, webhooks, policy, and UI flows execute through Kubernetes-style **custom resources**, reconciled by Argo CD and hosted on Gitea. The resource kinds include:

`Repository`, `PullRequest`, `Issue`, `Review`, `Pipeline`, `Job`, `RunnerPool`, `WebhookSubscription`, `RefPolicy`, `BranchProtection`, and more.

Because everything is a custom resource reconciled via GitOps, the forge's state is declarative and auditable.

---

## The per-org assistant

The "built-in assistant, dispatchable in org namespaces" maps to a concrete API and chart set:

- **API:** `POST /api/orgs/:org/agents/dispatch` (kradle-cli README).
- **Charts:** `assistant-stack.yaml`, `assistant-identity.yaml`, `assistant-org-secret.yaml`, `org-namespace.yaml` (`packages/kradle/charts/templates/`).

In other words, each org namespace gets its own dispatchable agent/assistant stack.

---

## Entrypoints

| Surface | Detail |
|---------|--------|
| Core bins | `kradle-demo`, `kradle-server` |
| CLI (`@a5c-ai/kradle-cli`) | `kradle serve` (HTTP API, default port 3080) and `kradle mcp` (stdio MCP server) |
| Watch streams | SSE at `/api/watch/orgs/:org/:resource` |
| Product home | `https://a5c.ai/kradle`; deploy lanes develop/staging/main → `kradle-*.a5c.ai` |

---

## How it fits the stack

Kradle is an **adjacent product**: a hosting/forge plus agent-dispatch substrate. It integrates with the rest of the ecosystem as a place for repositories and CI to live with built-in agent dispatch, and exposes MCP (`kradle mcp`) so MCP clients (such as Claude Desktop) can drive it. See where it sits in the [architecture](../architecture.md).

---

## Example

```bash
# Run the HTTP API locally (default port 3080)
kradle serve

# Expose kradle to an MCP client over stdio
kradle mcp
```

Dispatching the per-org assistant is an HTTP call:

```
POST /api/orgs/:org/agents/dispatch
```

> Subcommand flags are governed by the repository CLI allowlist; run `kradle <command> --help` on your installed version for the authoritative surface.

---

## Next steps

- **See where it sits:** [Architecture & How It Fits Together](../architecture.md)
- **Ecosystem map:** [Ecosystem Overview](./overview.md)
- **Related agent runtime:** [genty overview](./genty.md)
