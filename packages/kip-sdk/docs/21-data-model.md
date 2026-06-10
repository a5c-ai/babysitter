# Data model — typed property graph

> Purpose: the conceptual surface of kip — nodes/edges/properties, the cell + segment model, schema/ontology with versioned upcasters, episodic vs. semantic layers, and the provenance envelope.

**Source:** SPEC §2 (lines ~241–412). Reads against the convergence core: cells/segments are produced by [`proj`](./24-synchronization-and-convergence.md), never authored.

---

## 1. The conceptual surface: a typed property graph

A **node** is a typed bag of properties with provenance; an **edge** is a typed, directed, attributed, **bitemporal** relationship. This mirrors `packages/atlas` (`AtlasRecord` / `Edge`), but every field is the **fold of facts**, not an authored file. Nodes and edges are *projected* entities — reconstructed by [`proj`](./24-synchronization-and-convergence.md) over the relevant facts — **not stored directly** (§2.1).

```ts
type EID = string;          // namespaced: "<tenant>/<namespaceId>/<localId>"  (§3.6) — namespaceId is the frozen genesis id (M2-3)
type CID = string;          // git object id (hex)
type NodeKind = string;     // schema-defined, e.g. "person", "episode"
type EdgeKind = string;     // schema-defined, e.g. "works_at", "derived_from"
type PropKey = string;
type BlobRef = { blob: CID };                       // tagged: a reference to a large value blob (m-1)
type PropValue = string | number | boolean | null | BlobRef; // large values → tagged BlobRef, never a bare CID string

interface NodeView {
  eid: EID;
  kind: NodeKind;
  props: Record<PropKey, PropCell>;   // each cell carries its own provenance + temporality
  provenance: Provenance;             // latest asserting fact's provenance
}

interface EdgeView {
  eid: EID;
  kind: EdgeKind;
  from: EID;
  to: EID;
  props: Record<PropKey, PropCell>;
  validFrom: HlcOrTime; validTo: HlcOrTime | null;   // valid-time interval (Graphiti-style)
  provenance: Provenance;
}
```

**Dual identity (EID vs. CID).** Identity is decoupled from content addressing (G4). An **EID** is a namespaced, cryptographically anchored *stable* identity (`<tenant>/<namespaceId>/<localId>`); a **CID** is the git object id of an immutable value. The `namespaceId` is a FROZEN genesis id, stable across key rotation/revocation; equality requires equal namespace. Full identity semantics live in [git substrate](./22-git-substrate.md) §3.6.

---

## 2. The cell + segment model (gaps are first-class)

The **cell** — *one property of one entity, across valid-time* — is the granularity at which `proj` materializes state. It is **not** a merge unit with its own binary join: it is the *output* of the single deterministic fold `proj` (§3.4, §4b.4). A cell projects to a sequence of **non-overlapping** valid-time segments ordered by `validFrom`; **gaps are FIRST-CLASS** (`Unknown`), not errors.

```ts
// A cell projects to a sequence of valid-time segments. Gaps are FIRST-CLASS (Unknown), not errors.
type CellSegment<V = PropValue> =
  | { kind: "value"; value: V; validFrom: HlcOrTime; validTo: HlcOrTime | null; assertedBy: FactId }
  | { kind: "unknown"; validFrom: HlcOrTime; validTo: HlcOrTime | null }   // no covering fact / retracted (M-9)
  | { kind: "conflict"; validFrom: HlcOrTime; validTo: HlcOrTime | null; candidates: FactId[] }; // tied, see §3.4

interface PropCell<V = PropValue> {   // the read unit; produced ONLY by proj, never authored or text-merged
  segments: CellSegment<V>[];         // non-overlapping, ordered by validFrom; gaps appear as `unknown`
}
```

The three segment kinds are normative:

| Segment kind | Meaning |
|---|---|
| **`value`** | A covering, non-retracted assert holds; `assertedBy` names the winning `FactId`. |
| **`unknown`** | No covering non-retracted assert over this valid-time sub-interval (gap, or retracted, M-9). **Distinct from `null`**, which is an *asserted* absence. Reads in a gap return `Unknown`. |
| **`conflict`** | Genuinely contradictory authored decisions that no total-order tiebreak may silently resolve (N5). Surfaces as `kind:"conflict"` with the full `candidates: FactId[]`; callers MUST handle it explicitly (see [convergence](./24-synchronization-and-convergence.md) §3.4 conflict-surfacing). |

<a id="retract-split-example"></a>
A cell's segments are non-overlapping; any valid-time sub-interval with no covering non-retracted assert projects to an explicit `unknown` segment. A `retract` of the middle of `[0,20)` *splits* into `value [0,5)` · `unknown [5,10)` · `value [10,20)` — not a "partition with a hole" (M-9). Cells are **produced ONLY by `proj`**, never authored or text-merged.

---

## 3. Schema / ontology + versioned upcasters

Schema is a **per-tenant, mutable ontology** (cf. kradle `AgentMemoryOntology`), itself versioned and stored **as facts**, so schema history is auditable and as-of-queryable (§2.2).

```ts
interface NodeKindDef {
  kind: NodeKind;
  version: number;                    // schema version → upcaster keying (HP-8)
  props: PropSchema[];
  cellReducer: CellReducerRef;        // per-prop deterministic reducer (§3.4): lww-hlc | max | min | gset | …
  identity: IdentityPolicy;           // how EID namespaces are anchored/validated (§3.6)
}
interface EdgeKindDef {
  kind: EdgeKind; version: number;
  source: NodeKind | NodeKind[]; target: NodeKind | NodeKind[];
  cardinality: "1:1" | "1:N" | "N:1" | "N:M";   // projected/surfaced, NOT a write gate (m-12)
  inverse?: EdgeKind;
  temporal: boolean;                  // bitemporal validity tracked (default true)
  cellReducer: CellReducerRef;
}
```

**Schema is applied in `proj` via versioned upcasters — it is NOT a write-time gate (decision).** Rejecting facts at write would break set-union convergence: rejection is order-dependent and replica-relative (a v1 replica would accept what a v2 replica rejects → divergence, M-8). Therefore (§2.2):

- **Facts are always accepted into the substrate if their *signature* verifies** (the only hard gate, §2.4). *Authority* (key-registration, namespace, revocation) is **not** an ingest gate — it is a set-pure [`proj` demotion](./24-synchronization-and-convergence.md). Schema conformance is **not** a gate either.
- `proj` applies the ontology **as-of each fact's own `validFrom`/version** via declarative upcasters. A conforming fact projects normally; a non-conforming fact is **NOT dropped** — it projects to a typed `kip:schema-violation` / **quarantined** segment (visible, queryable, never silently lost, never inventing data — honoring N5).
- Upcasters **need not be total at write time.** `proj` handles unknown/future fact versions by **passthrough-as-opaque** (carry the raw payload as an opaque quarantined value) rather than throwing — so ontology evolution and the no-fallback rule coexist.

**Cardinality and `inverse` are PROJECTED, not write-gated (m-12).** `cardinality` (e.g. `1:1`) is a multi-cell constraint that cannot be enforced by the cell-local reducer without breaking set-union convergence (two concurrent `1:1` asserts to different targets MUST both be accepted). `proj` **detects** a violation and surfaces a `kip:cardinality-violation` segment/node — visible and queryable — rather than silently dropping one. `inverse` edges are **materialized by `proj`** (an `inverse` declaration causes `proj` to project the reciprocal adjacency), not separately asserted. Neither is a write gate.

> *Rejected alternatives (§2.2):* read-time *rejection* (a silent, order/version-sensitive fallback); the v1 "reject at `assertFact`" gate (the M-8 divergence bug — merge must re-ingest without re-gating to converge).

See [git substrate](./22-git-substrate.md) for the on-disk `/ontology/**` and `/upcasters/**` layout.

---

## 4. Episodic vs. semantic layers

Two **co-resident** layers in one graph, distinguished by node kind and a `memoryClass` facet — **not** by separate stores (the Mem0 pitfall: a bolted-on second store that doesn't earn its keep) (§2.3).

| Layer | Node kinds (examples) | Origin | Lifecycle |
|---|---|---|---|
| **Episodic** | `episode`, `observation`, `run`, `event` | Direct ingestion (e.g. babysitter journal, à la kradle `parseJournalForImport` — summary-only, never raw). | High volume, time-stamped, **decays**, candidate for consolidation. |
| **Semantic** | `entity`, `concept`, `claim`, `relation` | **Consolidated** from episodic via promotion facts; or asserted directly. | Lower volume, durable, **provenance-linked back** to source episodes. |

`derived_from` edges link semantic nodes to the episodes that produced them — so every semantic claim is auditable to its episodic source, and forgetting an episode can cascade (decay; see [temporality](./23-temporality-and-bitemporality.md) §4).

---

## 5. Provenance (first-class on every fact)

Provenance is **signed and verifiable before ingest** — it resolves the trust half of HP-6 (§2.4).

```ts
interface Provenance {
  author: ActorId;                    // who/what asserted it (agent, human, importer)
  signature: Ed25519Sig;              // over the canonical payload (= ALL signed fields EXCEPT signature itself)
  publicKeyFingerprint: string;       // SHA-256 of pubkey DER (the SIGNING key fingerprint) — IN canonical payload (M2-1)
  signedFields: string[];             // explicit ordered field set → verifier rebuilds payload
  source?: { uri: string; cid?: CID }; // upstream artifact (journal, doc, message)
  confidence?: number;                // [0,1] — advisory only; never affects mechanical resolution (m-2)
}

// Annotated AFTER durable recording — NOT a signed field, NOT part of FactId, NOT read by proj/orderKey (m-3, C2-1):
interface FactAnnotation {
  commit: CID;                        // commit that durably recorded the fact (post-hoc, transport-only — M2-2)
  rxFrom: HlcStamp;                   // receiver-assigned transaction time; AUDIT-ONLY (§4.2/§4.3). Excluded from proj, orderKey, and all trust decisions (C2-1).
}
```

### 5.1 Canonical signed-payload field list (NORMATIVE — closes M2-1)

The canonical signed payload of a `Fact` is built deterministically from **exactly** these fields, in this order, and the `factCID` is the content hash of that payload:

```
[ v, type, target, value?, validFrom, validTo, hlc, causedBy?, supersedes?, reAttests?, author,
  publicKeyFingerprint, replicaId ]
```

That is, **every** author/replica/version-distinguishing field (`publicKeyFingerprint`, `replicaId`, the schema version `v`) is **in** the canonical payload. The `signature` field is the **only** field excluded (one cannot sign over one's own signature); `commit` and `rxFrom` are post-hoc annotations and are likewise excluded.

**Consequences (normative):**

- Two facts that differ in *any* author/replica/version field have **distinct `factCID`s**, so `factCID` is a genuine always-unique final tiebreak for `proj`'s `orderKey` (re-stated in INV-3). `replicaId` here is the author's stamped `hlc.replicaId` — signed, not a receiver quantity.
- The INGEST-GATE (§3.2) admits a fact **iff** it is well-formed **and** its Ed25519 signature verifies over this canonical payload. **Signature validity is the SOLE membership predicate.** Key-registration, namespace-authorization, revocation, **and** author-HLC plausibility (anti-backdating) are **NOT ingest gates** — they are set-pure demotions inside [`proj`](./24-synchronization-and-convergence.md), keyed on author-HLC.
- `commit` and `rxFrom` are excluded from `signedFields`, `FactId`, `proj`, and `orderKey`, so there is no forward-reference circularity (m-3) and no replica-local input to `proj`.

### 5.2 `confidence` is advisory only (m-2)

`confidence` feeds the [salience projection](./26-retrieval.md) but is **never** an input to the deterministic cell reducer. A higher-confidence fact does **not** beat a later HLC-max fact under `lww-hlc`. A custom reducer MAY read `confidence` deterministically, but **every reducer's final tiebreak MUST terminate in `orderKey`** (m2-1) — so a confidence tie can never leave the result non-deterministic (enforced by INV-3).

---

## 6. How the data model relates to the rest of the system

- The cell/segment fold, `orderKey`, and reducers (`lww-hlc` / `gset` / `pncounter` / `supersede` / `custom`) are specified in [synchronization & convergence](./24-synchronization-and-convergence.md) §3.4; this doc defines the *shapes* they fold into.
- The **fact envelope** (`Fact`, `FactType`, `Target`, valid/transaction time) is in [temporality & bitemporality](./23-temporality-and-bitemporality.md) §4.1.
- The on-disk `/facts`, `/heads`, `/ontology`, `/upcasters`, dual-id and namespace anchoring live in [git substrate](./22-git-substrate.md) §3.
- Where this data model sits in the layering, and the substrate/projection/client boundaries, is in [architecture overview](./20-architecture-overview.md).
