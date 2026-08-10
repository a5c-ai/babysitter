# API reference

The public surface of `@a5c-ai/kip-sdk` — the values and types re-exported from the package barrel
(`src/index.ts`). This page documents what is actually exported and, crucially, **which methods are
implemented vs. still stubs** in this M0–M4 scaffold.

> Source of truth: `src/index.ts` (barrel), `src/types.ts` (types + the `Repo` interface), and
> `src/kip-repo.ts` (the `KipRepo` implementation and `open()`). Where a method throws
> `unimplemented`, it is called out below — do not treat it as working.

---

## Exports

The barrel re-exports:

- **`open`** — the entrypoint (`function open(options: OpenOptions): Promise<KipRepo>`).
- **`KipRepo`** — the concrete `Repo` implementation (the class `open()` returns).
- **`KipError`** — the typed error class (`{ code: KipErrorCode, message, context? }`).
- **`generateEd25519KeyPair`**, **`importEd25519KeyPair`**, and the **`Ed25519KeyPair`** type — key
  helpers for building a keyring.
- **All types** from `src/types.ts` (interfaces and type aliases; erased at runtime): `Repo`,
  `OpenOptions`, `NodeView`, `EdgeView`, `PropCell`, `CellSegment`, `AsOf`, `NodePut`, `EdgePut`,
  `TraversalSpec`, `RecallQuery`, `RecallResult`, `ReadView`, `FsckReport`, `SyncReport`, `Provenance`,
  `KipErrorCode`, and more.

```ts
import {
  open,
  KipRepo,
  KipError,
  generateEd25519KeyPair,
} from "@a5c-ai/kip-sdk";
import type { Repo, NodeView, RecallResult } from "@a5c-ai/kip-sdk";
```

The package only exposes the `"."` entry; there are no deep subpath imports.

---

## `open(options)`

```ts
function open(options: OpenOptions): Promise<KipRepo>;

interface OpenOptions {
  dir: string;              // the on-disk substrate directory
  replicaId: ReplicaId;     // stable per-replica author id (string)
  keyring: unknown;         // signing key material; {} mints a fresh Ed25519 key
  createIfMissing?: boolean; // create genesis if the dir is empty
  genesis?: {               // genesis params (only read when creating)
    hashAlgo: "sha1" | "sha256";
    shardDepth: number;
    clockEpoch: number;
    epsilonCausalMs: number;
    regenBoundaryRule: string;
    rootKeys: string[];
    quarantineTtlMs: number;
    quarantineKeyCapBytes: number;
    quarantinePoolBytes: number;
    keyChainDurableCapBytes: number;
    headsCommitted?: boolean;
  };
}
```

Opens (or, with `createIfMissing`, creates) a repo and returns a `KipRepo`. `dir` and `replicaId`
are required; `keyring: {}` is valid and mints a fresh key.

---

## Core types

```ts
type EID = string;          // entity id
type CID = string;          // content id
type FactId = CID;
type PropKey = string;
type PropValue = string | number | boolean | null | { blob: CID };
type HlcOrTime = HlcStamp | string /* ISO-8601 */ | number /* epoch ms */;

interface HlcStamp { wall: number; counter: number; replicaId: string; }
interface AsOf { validTime?: HlcOrTime; txTime?: HlcStamp; believer?: ReplicaId; }
interface ScopeRef { tenant: string; namespace?: string; snapshot?: SnapshotRef; }

interface NodePut { eid: EID; kind: NodeKind; props?: Record<PropKey, PropValue>;
                    validFrom?: HlcOrTime; validTo?: HlcOrTime | null; }
interface EdgePut { eid?: EID; kind: EdgeKind; from: EID; to: EID;
                    props?: Record<PropKey, PropValue>;
                    validFrom: HlcOrTime; validTo?: HlcOrTime | null; }
```

### Views and cells

A read returns a **view**; property values live in versioned **cells** made of typed **segments**.

```ts
interface NodeView { eid: EID; kind: NodeKind; props: Record<PropKey, PropCell>; provenance: Provenance; }
interface EdgeView { eid: EID; kind: EdgeKind; from: EID; to: EID;
                     props: Record<PropKey, PropCell>;
                     validFrom: HlcOrTime; validTo: HlcOrTime | null; provenance: Provenance; }

interface PropCell<V = PropValue> { segments: CellSegment<V>[]; }

type CellSegment<V = PropValue> =
  | { kind: "value"; value: V; validFrom; validTo; assertedBy: FactId }
  | { kind: "unknown"; validFrom; validTo }
  | { kind: "conflict"; validFrom; validTo; candidates: FactId[] }
  | { kind: "quarantine"; validFrom; validTo; assertedBy: FactId; v: number; reason: "unknown-version" | "malformed-supersede" }
  | { kind: "excised"; validFrom; validTo; excisedFactId: FactId; excisedReason?: string };
```

Read a plain value at `view.props[key].segments[0].value` (guarding for the non-`value` variants). A
contradiction surfaces as a `"conflict"` segment carrying its `candidates` — never a silent pick.

---

## The `Repo` interface

`open()` returns a `KipRepo implements Repo`. Below, every method is tagged with its status in this
build. **✅ implemented**, **⚠️ partial** (works for the common path, throws on an unsupported
selector), **🚧 stub** (throws `unimplemented`).

### Lifecycle & scope

| Method | Status | Notes |
|---|---|---|
| `branch(): string` | ✅ | e.g. `refs/kip/replicas/<replicaId>`. |
| `withScope(scope: ScopeRef): Repo` | ⚠️ | Returns a scoped `Repo`; tenant/namespace *narrowing* is deferred to M8 (not yet enforced on reads). |
| `txn<T>(fn): Promise<{ result, commit }>` | ✅ | Batches writes into one content-addressed commit; nesting throws `ERR_TXN_ALREADY_ACTIVE`. |
| `commit(message?): Promise<CID>` | 🚧 | Throws `unimplemented: commit`. Use `txn()` for a commit boundary; `putNode`/`putEdge`/`assertFact` write outside a txn and report `status: "pending"`. |
| `exportKeyring(): { privateKeyPem, publicKeyPem }` | ✅ | Serializes this repo's current signing identity to PEM — the shape `OpenOptions.keyring` and the CLI/MCP `keyring.json` accept back. **`KipRepo`-only accessor — not part of the `Repo` interface.** See [below](#exportkeyring). |

<a id="exportkeyring"></a>

#### `exportKeyring()` — persist a signing identity

```ts
exportKeyring(): { privateKeyPem: string; publicKeyPem: string };
```

Returns this repo's **current signing identity**, PEM-serialized — `privateKeyPem` as PKCS#8,
`publicKeyPem` as SPKI. This is the single supported bridge for making an identity durable: the
returned object is byte-for-byte the `{ privateKeyPem, publicKeyPem }` shape that both
`OpenOptions.keyring` and the CLI/MCP `keyring.json` file accept, so you can persist it and pass it
back into a later `open()` to restore the *identical* identity.

- It returns whatever `getOwnKeyPair()` resolves to — the caller-supplied identity if `open()` was
  given a PEM keyring, or the auto-generated one otherwise. On a first-run repo opened with
  `keyring: {}`, it **mints then returns** that identity (so a first-run caller still gets a real,
  persistable key back rather than "nothing").
- Passing `generateEd25519KeyPair()`'s return value to `open({ keyring })` does **not** work — that
  object carries `KeyObject`s, not `privateKeyPem`, so it is ignored and a fresh key is minted.
  `exportKeyring()` (or serializing `generateEd25519KeyPair()` to PEM yourself) is the correct path.
- **Secret material:** `privateKeyPem` is a raw private key — persist it as a secret, never in a log
  or telemetry sink.

See the runnable recipes in
[Getting started → Signing keys and a stable identity](./getting-started.md#signing-keys-and-a-stable-identity).

### Authoring facts

| Method | Status | Returns |
|---|---|---|
| `putNode(node: NodePut): Promise<EID>` | ✅ | the node `EID` (sugar → signed `assert` facts) |
| `putEdge(edge: EdgePut): Promise<EID>` | ✅ | the edge `EID` |
| `assertFact(input: AssertInput)` | ✅ | `{ id, hlc, seq, status }` |
| `retractFact(input: RetractInput)` | ✅ | `{ id, hlc, seq, status }` |
| `supersedeFact(input: SupersedeInput)` | ✅ | `{ id, hlc, seq, status }` |
| `reAttestFact(input: ReAttestInput)` | ✅ | `{ id, hlc, seq, status }` |
| `ingest(f: Fact)` | ✅ | `{ admitted, reason? }` (the signature/well-formedness gate) |

> `AssertInput` / `RetractInput` etc. are `Omit<Fact, "id"|"hlc"|"seq"|...> & { type: "assert" }` —
> you must include the literal `type` (`"assert"`, `"retract"`, …); kip stamps `id`/`hlc`/`seq`/
> `signature`. See the [getting-started guide](./getting-started.md#3-assert-facts--the-raw-path-assertfact).

### Reading

| Method | Status | Notes |
|---|---|---|
| `getNode(eid, asOf?): Promise<NodeView \| null>` | ✅ | `null` for an unknown EID (data, not an error). |
| `getEdge(eid, asOf?): Promise<EdgeView \| null>` | ✅ | |
| `query(spec: TraversalSpec): AsyncIterable<NodeView \| EdgeView>` | ✅ | `depth`/`maxFanout` mandatory. |
| `recall(q: RecallQuery): Promise<RecallResult[]>` | ✅ | Exact cosine scan, not ANN (see below). |
| `asOf(asOf): Promise<ReadView>` | ⚠️ | `validTime` fully supported; a `txTime`/`believer` lens for a *foreign* replica throws `unimplemented`. |

```ts
interface TraversalSpec { seed: EID | EID[]; direction: "out" | "in" | "both";
                          edgeKinds?: EdgeKind[]; depth: number; maxFanout: number;
                          kinds?: NodeKind[]; asOf?: AsOf; }

interface RecallResult { eid: EID; view: NodeView; score: number;
                         ranks: { vector?: number; graph?: number; salience?: number };
                         conflicted: boolean; provenance: Provenance; }

interface ReadView {  // returned by asOf() — same reads, minus the (fixed) asOf
  getNode(eid): Promise<NodeView | null>;
  getEdge(eid): Promise<EdgeView | null>;
  query(spec: Omit<TraversalSpec, "asOf">): AsyncIterable<NodeView | EdgeView>;
  recall(q: Omit<RecallQuery, "asOf">): Promise<RecallResult[]>;
}
```

**`recall` honesty.** `RecallQuery.text` is an **exact/keyword graph seed** matched against a
candidate's `content` cell — kip never embeds it. The vector half runs only when the caller supplies
`embedding: number[]` (kip consumes embeddings, never produces them) and additionally needs a
corpus-embedding dispatcher wired; it is an **exact brute-force cosine scan** — there is no HNSW/IVF
ANN index or embedding cache yet. `filters` (kind/props/edgeKinds) and `expand` are honored;
`scope`, and the `accessFreq` salience term, are deferred (not applied).

### Distribution & ops

| Method | Status | Notes |
|---|---|---|
| `sync(remote, opts?): Promise<SyncReport>` | ⚠️ | **Pull-only**: `sent` is always 0, `push` is not implemented, and `tip` is a fact-set digest (not a resolvable git commit CID). |
| `merge(from, opts?): Promise<MergeReport>` | ✅ | Set-union pull of a named local peer branch; unresolvable ref = empty-union identity (not an error). |
| `subscribe(scope, since?): AsyncIterable<FactDelta>` | ✅ | Frontier-cursor delta stream. |
| `pin(scope, asOf?): Promise<SnapshotRef>` | ⚠️ | A `validTime` pin works; an `asOf` with only `txTime`/`believer` (no `validTime`) throws `unimplemented`. |
| `resolvePin(ref): Promise<...>` | ✅ | `pin-incomplete` / `pin-complete` status. |
| `provenanceOf(ref: EID \| FactId): Promise<Provenance[]>` | ✅ | |
| `edgeExistenceFactId(eid, asOf?): Promise<FactId \| null>` | ✅ | The signed edge-existence fact backing an edge (for citations). |
| `rollup(opts: RollupOptions): Promise<CID>` | ✅ | Read-latency snapshot through an author-HLC. |
| `tombstone(eid, reason): Promise<FactId>` | ✅ | Logical, signature-preserving node tombstone. |
| `excise(factId, reason): Promise<ExcisionMarker>` | ✅ | Physical byte erasure (requires an `excise`-scoped key). |
| `revokeKey(keyFpr, effectiveFrom, reason, mode?): Promise<FactId>` | ✅ | |
| `fsck(): Promise<FsckReport>` | ✅ | Never throws; `ok` is the verdict. |

```ts
interface SyncReport { received: number; sent: number; merged: number;
                       conflicts: Conflict[]; tip: FactSetDigest;
                       signatureInvalid?: number; malformed?: number; }

interface FsckReport { ok: boolean; headsMatch: boolean; mergeDriverInstalled: boolean;
                       manifestGenesisCidMatch: boolean;
                       badSignatures: FactId[]; authorityViolations: FactId[];
                       excisionResidue: EID[]; missingDurable: FactId[];
                       missingNonDurable: FactId[]; promisorMissingDurable: FactId[]; }
```

### Active-knowledge layer

These author or execute over the graph via microagents. They are implemented, but several reject an
`asOf.txTime` selector (compile-determinism guard, INV-A2) rather than silently ignoring it.

| Method | Status | Notes |
|---|---|---|
| `registerFunctionality(edgeKind, manifest, binding?): Promise<FactId>` | ✅ | Bind a microagent to an `EdgeKind`. |
| `compileContextualQuery(q): Promise<Segment>` | ⚠️ | Rejects `asOf.txTime`; some multi-hop typing checks are heuristic (documented scope narrowing). |
| `executeSegment(segment, opts?): Promise<AnswerGraph>` | ⚠️ | Rejects `asOf.txTime`; multi-input joins throw `ERR_MULTI_INPUT_JOIN_UNSUPPORTED`. |
| `runContextualQuery(q): Promise<AnswerGraph \| { kind: "choice"; segments }>` | ✅ | |
| `runAcquisition(manifest, input, opts?): Promise<{ facts: FactId[] }>` | ⚠️ | Rejects `asOf.txTime`; refuses authority-plane targets (`ERR_ACQUISITION_TARGET_FORBIDDEN`). |
| `learn(rawRef, opts): Promise<{ facts, loss, status }>` | ⚠️ | Rejects `asOf.txTime`. |

> **Graph-QA (`kip ask` / `kip_ask`) is not a `Repo` method.** It is a read-only microagent surfaced
> only through the CLI and MCP binaries (see their guides). It authors nothing and needs a host model.

---

## Errors — `KipError`

Caller-input rejections throw a typed `KipError` (`{ code: KipErrorCode, message, context? }`);
domain outcomes (a `null` read, an empty result, a `conflict`) are returned as data, never thrown.

`KipErrorCode` is a string-literal union. Common members:

`ERR_MALFORMED_INPUT`, `ERR_SIGNATURE_INVALID`, `ERR_SCOPE_DENIED`, `ERR_UNAUTHORIZED_EXCISION`,
`ERR_COMPILE_CYCLIC_DEPS`, `ERR_ILL_TYPED_SEGMENT`, `ERR_UNREGISTERED_MANIFEST`,
`ERR_HASH_ALGO_MISMATCH`, `ERR_MANIFEST_FORK`, `ERR_NO_PROMISOR_PEER`, `ERR_TXN_ALREADY_ACTIVE`,
`ERR_MULTI_INPUT_JOIN_UNSUPPORTED`, `ERR_ACQUISITION_TARGET_FORBIDDEN`, `ERR_CONFLICTED_REGISTRATION`.
See `src/types.ts` for the full list.

```ts
import { KipError } from "@a5c-ai/kip-sdk";

try {
  await repo.assertFact(badInput);
} catch (e) {
  if (e instanceof KipError && e.code === "ERR_MALFORMED_INPUT") {
    // handle the caller-input rejection
  }
}
```

## See also

- [Getting started](./getting-started.md) — these methods in a runnable walkthrough.
- [CLI reference](./cli.md) / [MCP server](./mcp.md) — the two binaries over this surface.
- [`docs/40-sdk-api-surface.md`](../40-sdk-api-surface.md) — the fuller design-level API narrative.
