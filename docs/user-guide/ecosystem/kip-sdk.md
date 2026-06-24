---
title: "Component: kip-sdk (spec only)"
description: A spec/design-stage memory substrate — no shipping code.
category: ecosystem
last_updated: 2026-06-23
---

[Docs](../index.md) › [Ecosystem](./overview.md) › kip-sdk

# kip-sdk — memory substrate (SPEC / DESIGN ONLY)

**Package:** no published package (spec-only) · **Path:** `packages/kip-sdk` · **Maturity:** Spec only — **not implemented**

> **This is the most important thing to know about kip-sdk:** it is **spec/design only**. The package is **entirely Markdown** — there is **no `package.json`, no `src/`, and no shipping code**. You cannot install or run it. Treat every kip "feature" described below as **design intent, not a capability you have today**.

**kip-sdk is the design for the *ideal core* beneath a future context-management product: a memory substrate that the rest of the ecosystem would consume. It is published as a specification so the design can be reviewed and grounded before any implementation exists.**

---

## On this page

- [Status: spec only](#status-spec-only)
- [What it designs](#what-it-designs)
- [Stack role](#stack-role)
- [What is actually in the package](#what-is-actually-in-the-package)
- [Next steps](#next-steps)

---

## Status: spec only

The package's own status banner reads: "Ship-quality v6 … Spec-only. Illustrative TypeScript interfaces are normative for *shape*, not implementation." There is no runtime. Any TypeScript you see in the spec describes the intended *shape* of interfaces — it is not code that runs.

---

## What it designs

"KIP" stands for **K**(nowledge) / **I**(nference) / **P**(rovenance). The design describes:

- A **git-substrate, bitemporal, signed-fact property-graph memory** whose unit of synchronization is an append-only, signed temporal fact.
- **Git as the sole source of truth** — the graph is a deterministic, rebuildable *projection* of a grow-only, Ed25519-signed fact set (a CRDT under union), giving coordinator-free convergence.
- **Hybrid retrieval:** vector search → graph expansion → reciprocal-rank fusion (RRF).
- **Episodic / semantic memory** with salience and decay.

A guiding principle from the design: "memory is a substrate, agents are clients (the Letta pitfall)." kip is positioned as a **library, not a runtime**.

---

## Stack role

The design (`docs/28-stack-integration.md`) positions kip as the **memory substrate** for the ecosystem: babysitter-sdk, genty, the adapters family, atlas, and kradle would all be producers/consumers/clients of its seams. Integration points are explicitly tagged in the spec as `ALREADY-IN-SPEC`, `GROUNDED-NEW`, or `SPECULATIVE` — a reminder that this is forward-looking design, not delivered integration.

---

## What is actually in the package

The package contains only Markdown:

- `SPEC.md`, `PRIOR-ART.md`, `SCORECARD.md`
- numbered design docs `docs/00..90`
- adversarial design reviews under `reviews/iter-*-adversarial.md`

No `package.json`. No `src/`. Nothing to build or install.

---

## Next steps

- **See where it would sit:** [Architecture & How It Fits Together](../architecture.md) (kip is shown as design-stage)
- **Ecosystem map:** [Ecosystem Overview](./overview.md)
- **What ships today instead:** [babysitter-sdk overview](./babysitter-sdk.md) and [Journal System](../features/journal-system.md)
