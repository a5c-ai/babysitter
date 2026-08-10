# Getting started with kip

A hands-on walkthrough of the kip SDK: open (or create) a repo, assert facts, read them back,
traverse the graph, recall by content, travel in time with `asOf`, and verify integrity with `fsck`.
Every snippet here runs against the real built API.

> **Prerequisite.** Build the package once so `dist/` exists:
> ```bash
> npm run build --workspace=@a5c-ai/kip-sdk
> ```
> The examples import `@a5c-ai/kip-sdk` (the workspace name). If you are running a standalone script
> outside the monorepo, point your `require`/`import` at the built `dist/index.js`.

---

## 1. Open or create a repo

`open(options)` is the single entrypoint. It returns a `Repo` bound to one on-disk directory and one
stable `replicaId` (the author identity for everything this process writes).

```js
import { open } from "@a5c-ai/kip-sdk";

const repo = await open({
  dir: "./demo-memory",   // where the git-substrate lives
  replicaId: "laptop-1",  // stable per-replica author id (required — never invented)
  keyring: {},            // key material; {} mints a fresh Ed25519 signing key for this replica
  createIfMissing: true,  // create genesis if the dir is empty
});

console.log(repo.branch()); // refs/kip/replicas/laptop-1
```

- `dir` is a normal directory; kip writes a genesis `manifest.json` and content-addressed objects
  there. It needs no system `git` binary (it uses `isomorphic-git`).
- `replicaId` is **required** and must be stable across runs — it keys the per-author fact chain.
- `keyring` is the signing key material. An empty object `{}` is valid, but it mints a **fresh**
  Ed25519 key pair **on every `open()` call** — a new author identity per run, persisted nowhere.
  For a durable identity (and for the `kip` CLI / `kip-mcp`, which need a keyring **file**), create
  one once and pass it back — see [Signing keys and a stable identity](#signing-keys-and-a-stable-identity).
- Omit `createIfMissing` (or set it `false`) to open an existing repo and throw if it is absent.

---

## 2. Assert facts — the sugar path (`putNode` / `putEdge`)

The ergonomic way to write is `putNode` and `putEdge`. Each is **sugar that compiles to one or more
signed `assert` facts** (a node/edge existence fact plus one fact per property) and returns the
entity's `EID`.

```js
// A node: an entity id, a kind, and typed props.
const ada = await repo.putNode({
  eid: "ada",
  kind: "Person",
  props: { name: "Ada Lovelace", born: 1815 },
});
console.log(ada); // "ada"

await repo.putNode({ eid: "babbage", kind: "Person", props: { name: "Charles Babbage" } });

// An edge: a kind, endpoints, and a REQUIRED validFrom (when the relationship starts being true).
const edgeId = await repo.putEdge({
  kind: "knows",
  from: "ada",
  to: "babbage",
  validFrom: "2020-01-01",
});
console.log(edgeId); // "knows:ada->babbage"
```

Notes:

- Prop values are `string | number | boolean | null | { blob: CID }`.
- `putEdge` **requires** `validFrom`; `putNode`'s `validFrom` defaults to the genesis frontier (`0`).
- Both accept an optional `validTo` to bound the fact's valid-time interval up front.
- An edge `eid` is optional; kip derives a stable one (`<kind>:<from>-><to>`) when you omit it.

---

## 3. Assert facts — the raw path (`assertFact`)

When you need the full signed envelope — for example to echo the minted `id`/`hlc`/`seq` — author a
single fact with `assertFact`. You supply only the *intent* fields; kip stamps `id`, `hlc`, `seq`,
and the signature.

```js
const stamped = await repo.assertFact({
  v: 1,
  type: "assert",              // required literal on AssertInput
  target: { kind: "node-prop", eid: "ada", prop: "field" },
  value: "mathematics",
  validFrom: 0,
  validTo: null,
  replicaId: "laptop-1",
  provenance: {
    author: "kip:laptop-1",
    signature: "",              // rebuilt by kip from the replica key
    publicKeyFingerprint: "",
    signedFields: [],
  },
});
console.log(stamped); // { id: "<factId>", hlc: {...}, seq: <n>, status: "pending" }
```

`assertFact` returns `{ id, hlc, seq, status }`. `putNode`/`putEdge` do **not** — they compile to
multiple facts, so there is no single stamped identity to return; they return the `EID` instead.
(The `status` is `"pending"` until a commit boundary flips it to `"durable"`.)

---

## 4. Read facts back (`getNode` / `getEdge`)

Reads return a **view** whose property values live in versioned *cells*. Each cell holds an ordered
list of `segments`; a plain value is a `{ kind: "value", value, validFrom, validTo, assertedBy }`
segment. Unknown/contradicted sub-intervals surface as `"unknown"` / `"conflict"` segments rather
than a fabricated value.

```js
const node = await repo.getNode("ada");
console.log(node.kind);                          // "Person"
console.log(node.props.name.segments[0].value);  // "Ada Lovelace"
console.log(node.props.born.segments[0].value);  // 1815
console.log(node.provenance.author);             // the winning fact's author, e.g. "kip:putNode:laptop-1"

// An unknown eid is DATA, not an error — you get null.
console.log(await repo.getNode("nobody")); // null

// Read an edge with getEdge.
const edge = await repo.getEdge("knows:ada->babbage");
console.log(edge.from, edge.kind, edge.to); // "ada" "knows" "babbage"
```

Both take an optional `asOf` selector as the second argument (see [§7](#7-time-travel-with-asof)).

---

## 5. Traverse the graph (`query`)

`query` is a typed, bounded, as-of traversal. It returns an **async iterable** of `NodeView |
EdgeView` in traversal order. `depth` and `maxFanout` are **mandatory** — there is no unbounded
default.

```js
const out = [];
for await (const v of repo.query({
  seed: "ada",           // one EID or an array of EIDs
  direction: "out",      // "out" | "in" | "both"
  depth: 2,              // required
  maxFanout: 8,          // required
  // edgeKinds: ["knows"],  // optional: restrict to named edge kinds
  // kinds: ["Person"],     // optional: filter visited node kinds
})) {
  out.push(v.eid);
}
console.log(out); // [ 'ada', 'knows:ada->babbage', 'babbage' ]
```

---

## 6. Recall by content (`recall`)

`recall` is kip's hybrid retrieval seam (vector + graph + salience, fused with Reciprocal Rank
Fusion). It returns a `RecallResult[]`, each `{ eid, view, score, ranks, conflicted, provenance }`,
truncated to `k`.

Two honest caveats up front:

- **`text` is an exact/keyword graph seed, not semantic search.** It matches a candidate's `content`
  cell exactly and seeds the graph half; it does **not** embed your query.
- **The vector half needs a caller-supplied `embedding`.** kip never produces embeddings itself
  (supplying an `embedding` additionally requires a corpus-embedding dispatcher to be wired, so the
  pure-`text` path below is the one that runs out of the box). The vector scan, when enabled, is an
  exact brute-force cosine scan — there is no ANN index yet.

To get a hit from the `text` seed, store a node with a `content` prop:

```js
await repo.putNode({
  eid: "note-1",
  kind: "Note",
  props: { content: "the analytical engine" },
});

const hits = await repo.recall({ text: "the analytical engine", k: 5 });
console.log(hits.length);            // 1
console.log(hits[0].eid);            // "note-1"
console.log(hits[0].ranks);          // { graph: 1 }
console.log(hits[0].conflicted);     // false
```

A query with no matching content returns `[]` — an empty result is valid data, not an error.

---

## 7. Time travel with `asOf`

Every fact carries valid time and transaction time, so you can read the graph as it was believed at
a past instant. `asOf(selector)` returns a `ReadView` curried at that frontier; its `getNode` /
`getEdge` / `query` / `recall` take the same arguments minus the (already-fixed) `asOf`.

```js
// A validTime BEFORE ada was asserted: the node did not exist yet → null.
const past = await repo.asOf({ validTime: "1900-01-01" });
console.log(await past.getNode("ada")); // null

// "now" (omit validTime, or read live): the node is present.
const node = await repo.getNode("ada");
console.log(node.props.name.segments[0].value); // "Ada Lovelace"
```

The `asOf` selector is `{ validTime?, txTime?, believer? }`. `validTime` is fully supported. The
transaction-time belief-audit lens (`txTime`/`believer`) is supported for **this replica's own**
history; a `txTime`/`believer` naming a *different* replica currently throws `unimplemented` rather
than returning a wrong answer.

---

## 8. Forgetting (`retractFact` / `tombstone`)

kip never deletes in place. To stop a fact from being true after some instant, author a `retract`
that bounds its valid-time upper edge:

```js
const r = await repo.retractFact({
  v: 1,
  type: "retract",           // required literal on RetractInput
  target: { kind: "node-prop", eid: "ada", prop: "born" },
  validFrom: 0,
  validTo: "2021-01-01",     // born is no longer asserted as of this instant
  replicaId: "laptop-1",
  provenance: { author: "kip:laptop-1", signature: "", publicKeyFingerprint: "", signedFields: [] },
});
console.log(r.status); // "pending"
```

After this, a live `getNode("ada")` shows `born` split into a covered segment and an `"unknown"`
segment past the retract instant — the history is preserved, not erased. To mark an entire entity
gone, use `repo.tombstone(eid, reason)`; to physically erase bytes (GDPR-style), the operator-only
`repo.excise(factId, reason)` exists (requires an `excise`-scoped key).

---

## 9. Verify the repo (`fsck`)

`fsck` re-derives the graph from the fact set and checks that heads match, all fact signatures are
valid, and the author-authority chain holds. It returns a report (never throws); `ok` is the verdict.

```js
const report = await repo.fsck();
console.log(report.ok);            // true
console.log(report.badSignatures); // []
// Full shape: { ok, headsMatch, mergeDriverInstalled, manifestGenesisCidMatch,
//               badSignatures, authorityViolations, excisionResidue,
//               missingDurable, missingNonDurable, promisorMissingDurable }
```

---

<a id="signing-keys-and-a-stable-identity"></a>

## Signing keys and a stable identity

`open({ keyring: {} })` mints a **fresh** Ed25519 signing key **every time you call `open()`** —
fine for a throwaway demo, but it means a new author identity on each run, recorded nowhere on disk,
so a later `open()` on the same `dir` can never reproduce it. A durable memory wants **one** stable
identity across runs (and across replicas that `sync`). This section shows the supported way to
establish one — for the SDK, and as the `keyring.json` **file** the CLI and MCP server load.

> **Known rough edge — tracked as [D-51](../DEBTS.md#d-51-cli-has-no-keygenidentity-bootstrap-command--writing-from-the-cli-requires-hand-creating-keyringjson-via-the-sdk).**
> There is no `kip keygen` command and `kip init` does **not** emit a key. Establishing a stable
> identity — or a CLI/MCP-loadable `keyring.json` — is a small hand-rolled SDK step today, shown
> below. A `kip keygen` / `kip init --with-keyring` command is the proposed ergonomic fix.

### A stable SDK identity across runs

Do **not** pass `generateEd25519KeyPair()`'s return value straight to `open({ keyring })`. That
object holds `node:crypto` `KeyObject`s, **not** the `{ privateKeyPem, publicKeyPem }` shape the
`keyring` accepts, so `open()` silently ignores it and mints a fresh random key — the *opposite* of
a stable identity, with no error to signal the miss. The supported bridge is `repo.exportKeyring()`,
which returns exactly that PEM shape:

```js
import { open } from "@a5c-ai/kip-sdk";
import { writeFileSync, readFileSync } from "node:fs";

// First run: open mints an identity; persist it as PEM.
const first = await open({ dir: "./demo-memory", replicaId: "laptop-1", keyring: {}, createIfMissing: true });
writeFileSync("./demo-memory/keyring.json", JSON.stringify(first.exportKeyring()));
await first.putNode({ eid: "ada", kind: "Person", props: { name: "Ada Lovelace" } });

// Any later run: pass the SAME PEM back to reuse the identical signing identity.
const keyring = JSON.parse(readFileSync("./demo-memory/keyring.json", "utf8"));
const again = await open({ dir: "./demo-memory", replicaId: "laptop-1", keyring });

const report = await again.fsck();
console.log(report.ok, report.badSignatures); // true []
```

`exportKeyring(): { privateKeyPem, publicKeyPem }` works on any open repo — it returns the
caller-supplied identity if you passed one, or mints-then-returns the auto identity on first use, so
even a first-run caller gets a real, persistable key back (see [api.md](./api.md#exportkeyring)).

> **Secret material.** `privateKeyPem` is a raw Ed25519 private key. Persist it as a **secret** (an
> OS keychain, a secrets manager, or an encrypted-at-rest store) — never a shared log, plain
> world-readable file, or telemetry sink.

<a id="create-a-keyringjson-for-the-cli--mcp"></a>

### Create a `keyring.json` for the CLI / MCP

The `kip` CLI and `kip-mcp` **write** commands need a keyring **file** — the same
`{ privateKeyPem, publicKeyPem }` JSON — resolved from `--keyring <path>` → `KIP_KEYRING` →
`<dir>/keyring.json` (only if that default file already exists). Neither binary creates it, so write
it once with a tiny SDK script. Generate a key directly and serialize its PEM (or reuse
`exportKeyring()` from an open repo, above):

```js
// make-keyring.mjs — writes ./my-memory/keyring.json
import { generateEd25519KeyPair } from "@a5c-ai/kip-sdk";
import { mkdirSync, writeFileSync } from "node:fs";

const kp = generateEd25519KeyPair();
mkdirSync("./my-memory", { recursive: true });
writeFileSync(
  "./my-memory/keyring.json",
  JSON.stringify(
    {
      privateKeyPem: kp.privateKey.export({ type: "pkcs8", format: "pem" }),
      publicKeyPem: kp.publicKey.export({ type: "spki", format: "pem" }),
    },
    null,
    2,
  ),
);
console.log("wrote ./my-memory/keyring.json");
```

Because the file lands at `<dir>/keyring.json`, the CLI resolves it as the default keyring and the
write path authors facts (exit 0). Verified end-to-end against the built binary:

```console
$ export KIP_DIR=./my-memory KIP_REPLICA_ID=laptop-1
$ node packages/kip-sdk/dist/cli/kip.js init --create
initialized kip repo at .../my-memory (genesis sha256:68ea..., branch refs/kip/replicas/laptop-1)
$ node make-keyring.mjs
wrote ./my-memory/keyring.json
$ node packages/kip-sdk/dist/cli/kip.js assert node --eid ada --kind Person --prop 'name="Ada Lovelace"'
asserted ada (pending)
$ node packages/kip-sdk/dist/cli/kip.js get ada --json
{"eid":"ada","kind":"Person","props":{"name":{"segments":[{"kind":"value","value":"Ada Lovelace","validFrom":0,"validTo":null,"assertedBy":"6e87..."}]}},"provenance":{...}}
```

Point `kip-mcp` at the same file with `--keyring ./my-memory/keyring.json` (or `KIP_KEYRING`); see
the [CLI](./cli.md#creating-a-keyring) and [MCP](./mcp.md#creating-a-keyring) guides.

---

## Where to go next

- [CLI reference](./cli.md) — drive all of the above from a terminal.
- [MCP server](./mcp.md) — expose this graph to any MCP-speaking agent.
- [API reference](./api.md) — the full `Repo` surface and which methods are implemented vs. stubbed.
