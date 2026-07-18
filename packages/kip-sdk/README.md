# @a5c-ai/kip-sdk

**kip** (**K**nowledge / **I**nference / **P**rovenance) is a **signed, git-substrate,
bitemporal, typed property-graph memory SDK** — a durable memory layer for agents and
applications where every fact is a signed, append-only record and reads are a deterministic
projection over the fact set.

> **Status: pre-release.** This package is `private: true` at version `0.0.1` and is **not yet
> published to npm**. There is no `npm install @a5c-ai/kip-sdk` yet — use it from inside this
> monorepo (workspace import) or by building it and running the `dist/` output directly. See
> [Install](#install).

---

## The 60-second pitch

Most agent "memory" is a pile of rows in a vector store: no history, no provenance, no way to
know *who* wrote a fact or *when it was true*. kip is different:

- **Every write is a signed fact.** A node, edge, or property value enters the store only as an
  append-only, Ed25519-signed fact. Set membership is decided by signature alone, so any two
  replicas that received the same facts compute the same graph — no coordinator, no locks.
- **Reads are a pure projection.** The graph you read (`getNode`, `getEdge`, `query`, `recall`)
  is `proj(factSet)` — a deterministic, order-independent fold. Nothing is guessed; a contradiction
  surfaces as a typed `conflict` cell rather than a silent last-writer-wins.
- **Bitemporal by construction.** Facts carry both *valid time* (when the fact is true in the
  world) and *transaction time* (when the replica learned it), so you can ask "what did we believe
  about X as of last Tuesday" with `asOf(...)`.
- **Forgetting is first-class.** `retract` bounds a fact's validity; `tombstone` marks an entity
  gone; `excise` physically erases bytes — all as further signed facts, never a destructive `UPDATE`.
- **The substrate is git.** Facts are content-addressed git objects; sync is `git fetch` + a
  set-union merge. Your memory is versioned, diffable, and replicable with the tooling you already
  have.

kip is a **library, not a runtime**. It ships two thin binaries over the same core — a `kip` CLI
and a `kip-mcp` server — so a human at a terminal and an MCP-speaking agent read and write the same
signed graph.

---

## Install

The package is unpublished, so pull it in one of two ways.

### 1. Workspace import (inside this monorepo)

`@a5c-ai/kip-sdk` is a workspace package. From any other package in the monorepo, add it as a
dependency and import it by name:

```ts
import { open } from "@a5c-ai/kip-sdk";
```

Build it once so `dist/` exists:

```bash
npm run build --workspace=@a5c-ai/kip-sdk
```

### 2. Build and run the binaries directly

The package declares two `bin` entries, `kip` and `kip-mcp`. After building, run them from `dist/`:

```bash
npm run build --workspace=@a5c-ai/kip-sdk

# CLI
node packages/kip-sdk/dist/cli/kip.js --help

# MCP server (stdio)
node packages/kip-sdk/dist/mcp/server.js --dir ./my-memory --replica-id laptop-1
```

The only runtime dependency is [`isomorphic-git`](https://www.npmjs.com/package/isomorphic-git);
kip needs no system `git` binary.

---

## Quickstart (SDK)

This script opens (creating) a repo, asserts two people and an edge between them, reads one back,
and verifies integrity. Every call below is part of the real public surface.

```js
import { open } from "@a5c-ai/kip-sdk";

// Open a memory repo, creating it if the directory is empty.
const repo = await open({
  dir: "./my-memory",
  replicaId: "laptop-1",  // stable author id for this replica (required)
  keyring: {},            // an empty keyring mints a fresh Ed25519 signing key
  createIfMissing: true,
});

// Assert facts. putNode/putEdge are sugar that compile to signed `assert` facts.
await repo.putNode({ eid: "ada", kind: "Person", props: { name: "Ada Lovelace", born: 1815 } });
await repo.putNode({ eid: "babbage", kind: "Person", props: { name: "Charles Babbage" } });
await repo.putEdge({ kind: "knows", from: "ada", to: "babbage", validFrom: "2020-01-01" });

// Read a node back. Values live in versioned prop cells (segments).
const ada = await repo.getNode("ada");
console.log(ada.kind, "=>", ada.props.name.segments[0].value); // Person => Ada Lovelace

// Bounded, typed, as-of traversal.
const visited = [];
for await (const v of repo.query({ seed: "ada", direction: "out", depth: 1, maxFanout: 8 })) {
  visited.push(v.eid);
}
console.log(visited); // [ 'ada', 'knows:ada->babbage', 'babbage' ]

// Verify the repo: heads match proj(facts), all signatures check out.
const report = await repo.fsck();
console.log("healthy:", report.ok); // healthy: true
```

The same flow at the terminal. One extra step versus the SDK: CLI **writes** need a keyring **file**
(`assert` signs facts), and the CLI does not create one — so mint a `keyring.json` once with a tiny
SDK script before the first write. The `make-keyring.mjs` used below is the small recipe from
[Getting started → Create a `keyring.json` for the CLI / MCP](./docs/guide/getting-started.md#create-a-keyringjson-for-the-cli--mcp)
(`kip keygen` is a known ergonomic gap, tracked as
[D-51](./docs/DEBTS.md#d-51-cli-has-no-keygenidentity-bootstrap-command--writing-from-the-cli-requires-hand-creating-keyringjson-via-the-sdk)):

```bash
export KIP_DIR=./my-memory KIP_REPLICA_ID=laptop-1
node packages/kip-sdk/dist/cli/kip.js init --create
node make-keyring.mjs   # writes ./my-memory/keyring.json — see the getting-started recipe
node packages/kip-sdk/dist/cli/kip.js assert node --eid ada --kind Person --prop 'name="Ada Lovelace"'
node packages/kip-sdk/dist/cli/kip.js get ada --json
node packages/kip-sdk/dist/cli/kip.js fsck
```

---

## Guides

- [Getting started](./docs/guide/getting-started.md) — a hands-on SDK walkthrough: open/init, assert
  (nodes, edges, props, raw facts), read back, query, recall, `asOf`, and `fsck`.
- [CLI reference](./docs/guide/cli.md) — every `kip` command, its flags, stdout shapes, and exit codes.
- [MCP server](./docs/guide/mcp.md) — launching `kip-mcp`, registering it with an MCP client, and the
  ten tools it exposes.
- [API reference](./docs/guide/api.md) — the exported `open()` / `Repo` surface, key types, and an
  honest map of what is implemented vs. still a stub.

---

## Honest limitations (M0–M4 scaffold)

kip is early. Where a reader could be misled, the docs say so plainly:

- **Not published.** `private: true`, `0.0.1`. Use it via the workspace or the built `dist/`.
- **`recall` is an exact cosine scan, not ANN.** The vector half is a brute-force per-call cosine
  scan (recall-equal to exact kNN); there is no HNSW/IVF index or embedding cache yet. Embeddings
  are **caller-supplied** — kip never embeds text for you. The `text` field is an exact/keyword
  graph seed matched against a node's `content` cell, not a semantic search.
- **`kip ask` / `kip_ask` need a host model.** Graph-QA synthesis spawns your already-authenticated
  local `claude` CLI by default; there is no bundled model. Without one it **fails loudly** (exit 5)
  rather than fabricating an answer, and a live ask costs roughly **$0.02–0.045**.
- **Some `Repo` methods are still stubs.** Notably `commit()` throws `unimplemented`; `sync()` is
  pull-only (no push); and a few bitemporal/active-layer paths reject unsupported selectors rather
  than guess. The [API reference](./docs/guide/api.md) lists them.

## Design docs

The pre-development spec set lives in [`docs/`](./docs/README.md) (36 documents decomposing
[`SPEC.md`](./SPEC.md)). This README and the guides under `docs/guide/` are the consumer-facing
entry point; the numbered `docs/*.md` files are the internal design record.

## License

MIT.
