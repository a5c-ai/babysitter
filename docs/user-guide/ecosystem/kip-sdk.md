---
title: "Component: kip-sdk"
description: A signed, git-substrate, bitemporal, typed property-graph memory SDK — built and runnable (private/unpublished).
category: ecosystem
last_updated: 2026-07-19
---

[Docs](../index.md) › [Ecosystem](./overview.md) › kip-sdk

# kip-sdk — memory substrate (built, private/unpublished)

**Package:** `@a5c-ai/kip-sdk` (`private: true`, `0.0.1` — unpublished) · **Path:** `packages/kip-sdk` · **Maturity:** Implemented / pre-release

**kip is a signed, git-substrate, bitemporal, typed property-graph memory SDK — a durable memory layer for agents and applications where every fact is a signed, append-only record and every read is a deterministic projection over the fact set.** "KIP" stands for **K**(nowledge) / **I**(nference) / **P**(rovenance).

> **This doc was previously wrong.** It used to say kip was "spec/design only … no `package.json`, no `src/`, no shipping code, you cannot install or run it." That is **no longer true.** `packages/kip-sdk` now ships thousands of lines of TypeScript under `src/`, a real `package.json` with two `bin` entries, a working `open()`/`KipRepo` SDK, a `kip` CLI, a `kip-mcp` server, a graph-QA microagent behind `kip ask`, and a self-guarding conformance suite. It is **built and runnable today** — it is simply **not yet published to npm** (`private: true`, `0.0.1`). Use it from inside this monorepo (workspace import) or by building it and running the `dist/` output; there is no `npm install @a5c-ai/kip-sdk` yet.

---

## On this page

- [Status: built, private, unpublished](#status-built-private-unpublished)
- [What it is](#what-it-is)
- [Surfaces you can run](#surfaces-you-can-run)
- [Stack role](#stack-role)
- [Honest limitations](#honest-limitations)
- [Documentation](#documentation)
- [Next steps](#next-steps)

---

## Status: built, private, unpublished

kip is implemented, not a spec. The package declares a real build (`tsc` + a microagent-bundling step), a `vitest` test suite, and two binaries:

```json
// packages/kip-sdk/package.json (excerpt)
"private": true,
"version": "0.0.1",
"bin": { "kip": "dist/cli/kip.js", "kip-mcp": "dist/mcp/server.js" }
```

Because it is `private: true` at `0.0.1`, there is **no npm release**. You consume it in one of two ways — a workspace import inside this monorepo, or by building it and running the built `dist/` binaries directly. The only runtime dependency is [`isomorphic-git`](https://www.npmjs.com/package/isomorphic-git), so kip needs no system `git` binary. Full instructions are in the package [README](../../../packages/kip-sdk/README.md#install) and the [Getting started](../../../packages/kip-sdk/docs/guide/getting-started.md) guide.

---

## What it is

Most agent "memory" is a pile of rows in a vector store: no history, no provenance, no way to know *who* wrote a fact or *when it was true*. kip is different:

- **Every write is a signed fact.** A node, edge, or property value enters the store only as an append-only, Ed25519-signed fact. Set membership is decided by signature alone, so any two replicas that received the same facts compute the same graph — no coordinator, no locks (Strong Eventual Consistency).
- **Reads are a pure projection.** The graph you read (`getNode`, `getEdge`, `query`, `recall`) is `proj(factSet)` — a deterministic, order-independent fold. A contradiction surfaces as a typed `conflict` cell rather than a silent last-writer-wins.
- **Bitemporal by construction.** Facts carry both *valid time* (when the fact is true in the world) and *transaction time* (when the replica learned it), so you can ask "what did we believe about X as of last Tuesday" with `asOf(...)`.
- **Forgetting is first-class.** `retract` bounds a fact's validity; `tombstone` marks an entity gone; `excise` physically erases bytes — all as further signed facts, never a destructive `UPDATE`.
- **The substrate is git.** Facts are content-addressed git objects; sync is `git fetch` + a set-union merge. Memory is versioned, diffable, and replicable with tooling you already have.
- **Retrieval + an active layer.** `recall` combines an exact/keyword graph seed with a caller-supplied embedding vector (exact-cosine); an active-knowledge layer compiles typed contextual queries and can run acquisition/learning microagents that author new signed facts under a single-author invariant.

kip is a **library, not a runtime** ("memory is a substrate, agents are clients"). It ships two thin binaries over the same core so a human at a terminal and an MCP-speaking agent read and write the same signed graph.

---

## Surfaces you can run

| Surface | What it is |
|---------|-----------|
| **SDK** (`open()` → `KipRepo`) | The exported barrel (`@a5c-ai/kip-sdk`) surfaces `open`, the `Repo` interface + view/type shapes, `KipError`, and the Ed25519 key helpers. `open()` creates/opens an on-disk repo; the returned `KipRepo` implements the full read/write/verify surface. See the [API reference](../../../packages/kip-sdk/docs/guide/api.md). |
| **`kip` CLI** | `dist/cli/kip.js`. Commands include `init`, `assert` (forms: `node` / `edge` / `fact`, with `--prop` to set properties), `get`, `query`, `recall`, `asof`, `sync`, `fsck`, `rollup`, and `ask`. See the [CLI reference](../../../packages/kip-sdk/docs/guide/cli.md). |
| **`kip-mcp` server** | `dist/mcp/server.js`, a stdio MCP server exposing **ten** tools: `kip_assert`, `kip_retract`, `kip_get_node`, `kip_get_edge`, `kip_query`, `kip_recall`, `kip_asof`, `kip_sync`, `kip_fsck`, and `kip_ask`. See the [MCP guide](../../../packages/kip-sdk/docs/guide/mcp.md). |
| **Graph-QA (`kip ask` / `kip_ask`)** | A read-only graph-QA microagent that answers natural-language questions over the graph. It retrieves facts, then synthesizes prose by spawning your already-authenticated local `claude` CLI. On dispatch failure it exits non-zero rather than fabricating an answer. |
| **Conformance suite** | A self-guarding, shippable invariant suite: **40** `INV-*` invariants (`INV-1..INV-19` plus milestone sub-invariants and the active-knowledge set `INV-A1..INV-A14`), each with a per-invariant test, plus a completeness guard that fails CI if an invariant goes missing. See the [conformance guide](../../../packages/kip-sdk/docs/maintainer/conformance-guide.md). |

The 60-second SDK flow (every call is part of the real public surface):

```js
import { open } from "@a5c-ai/kip-sdk";

// Open a memory repo, creating it if the directory is empty.
const repo = await open({
  dir: "./my-memory",
  replicaId: "laptop-1",   // stable author id for this replica (required)
  keyring: {},             // an empty keyring mints a fresh Ed25519 signing key
  createIfMissing: true,
});

await repo.putNode({ eid: "ada", kind: "Person", props: { name: "Ada Lovelace", born: 1815 } });
await repo.putNode({ eid: "babbage", kind: "Person", props: { name: "Charles Babbage" } });
await repo.putEdge({ kind: "knows", from: "ada", to: "babbage", validFrom: "2020-01-01" });

const ada = await repo.getNode("ada");
console.log(ada.kind, "=>", ada.props.name.segments[0].value); // Person => Ada Lovelace

const report = await repo.fsck(); // heads match proj(facts), all signatures verify
console.log("healthy:", report.ok);
```

---

## Stack role

kip is designed as the **memory substrate** for the ecosystem: babysitter-sdk, genty, the adapters family, atlas, and kradle are all potential producers/consumers/clients of its seams. The substrate and its SDK/CLI/MCP surfaces are built today; the *cross-package wiring* into the rest of the ecosystem is not yet delivered — treat kip's integration points as designed-and-available-to-consume, not as shipped end-to-end integrations. This is why the [ecosystem overview](./overview.md) and [architecture](../architecture.md) place kip alongside the runtime as an implemented-but-unwired memory layer rather than a GA product.

---

## Honest limitations

kip is early. Where a reader could be misled, the docs say so plainly (the package tracks these in [`DEBTS.md`](../../../packages/kip-sdk/docs/DEBTS.md)):

- **Not published.** `private: true`, `0.0.1`. Use it via the workspace or the built `dist/` — not `npm install`.
- **`recall` is an exact cosine scan, not ANN.** The vector half is a brute-force per-call cosine scan (recall-equal to exact kNN); there is no HNSW/IVF index or embedding cache yet. Embeddings are **caller-supplied** — kip never embeds text for you. The `text` field is an exact/keyword graph seed, not a semantic search.
- **`kip ask` needs a host model and costs money.** Graph-QA synthesis spawns your already-authenticated local `claude` CLI; there is no bundled model. Without one it **fails loudly** (dispatch-failure exit code) rather than fabricating, and a live ask costs roughly **$0.02–0.045**.
- **Some `Repo` methods are still stubs.** Notably `commit()` throws `unimplemented` (use `txn()` for a commit boundary); `sync()` is pull-only (no push); and cross-replica / transaction-time selectors (`asOf`/`pin` with a foreign-replica `txTime`/`believer` lens) throw `unimplemented` rather than guessing. The [API reference](../../../packages/kip-sdk/docs/guide/api.md) marks each method ✅ / ⚠️ / 🚧.

---

## Documentation

**Consumer-facing** (start here to use kip):

- [Package README](../../../packages/kip-sdk/README.md) — the pitch, install, and quickstart.
- [Getting started](../../../packages/kip-sdk/docs/guide/getting-started.md) — a hands-on SDK walkthrough (open/init, assert, read, query, recall, `asOf`, `fsck`).
- [CLI reference](../../../packages/kip-sdk/docs/guide/cli.md) — every `kip` command, its flags, stdout shapes, and exit codes.
- [MCP server](../../../packages/kip-sdk/docs/guide/mcp.md) — launching `kip-mcp`, registering it, and its ten tools.
- [API reference](../../../packages/kip-sdk/docs/guide/api.md) — the exported `open()` / `Repo` surface and an honest implemented-vs-stub map.

**Maintainer-facing** (changing kip's code):

- [Architecture](../../../packages/kip-sdk/docs/maintainer/architecture.md) — the real current module layout and load-bearing invariants.
- [Conformance guide](../../../packages/kip-sdk/docs/maintainer/conformance-guide.md) — how the self-guarding invariant suite works and how to add an `INV-*` test.
- [Contributing](../../../packages/kip-sdk/docs/maintainer/contributing.md) — house rules, the `DEBTS.md` convention, and the TDD/adversarial-review workflow.

The pre-development design record — `SPEC.md` and the numbered `docs/00..90` design docs — lives under [`packages/kip-sdk/docs/`](../../../packages/kip-sdk/docs/README.md); it is now the internal design history behind the shipped code, not a substitute for it.

---

## Next steps

- **Use it:** [Package README](../../../packages/kip-sdk/README.md) → [Getting started](../../../packages/kip-sdk/docs/guide/getting-started.md)
- **See where it sits:** [Architecture & How It Fits Together](../architecture.md)
- **Ecosystem map:** [Ecosystem Overview](./overview.md)
