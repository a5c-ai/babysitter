# kip-sdk architecture (maintainer's tour)

A map of the **real current module layout** of `@a5c-ai/kip-sdk`, written for a maintainer who has to
change code without breaking the invariants. It describes the tree **as it is today** — after the
ADR-B5 "modularize" split and the M2–M9 / `fix-all` build — not the pre-modularize monolith.

**Companion maintainer docs:** [`conformance-guide.md`](./conformance-guide.md) (how the invariant
suite guards itself + how to add an INV) and [`contributing.md`](./contributing.md) (house rules, the
DEBTS workflow, build/test gates, running a live `kip ask`).

For the *user*-facing view (how to call the API), see [`../guide/getting-started.md`](../guide/getting-started.md)
and [`../guide/api.md`](../guide/api.md). For the normative spec, see the numbered docs under `../`
(`20-architecture-overview.md`, `21-data-model.md`, `22-git-substrate.md`, `24-synchronization-and-convergence.md`,
`30-active-knowledge-overview.md`, `60-conformance-and-testability.md`).

---

## 1. The barrel

`src/index.ts` is a **~25-line re-export barrel** (ADR-B5). It re-implements nothing — it only
surfaces the public value + type names, and the `src/__tests__/public-surface.test.ts` guard pins that
this surface never silently changes. In full:

- `export { generateEd25519KeyPair, importEd25519KeyPair } from "./signing"` + `export type { Ed25519KeyPair }`
  — the keyring helpers a caller following the `OpenOptions.keyring` seam needs (surfaced here because
  the `exports` map only exposes `"."`; see D-32).
- `export * from "./types"` — the entire type surface.
- `export { KipError, KipRepo, open } from "./kip-repo"` — the class, the error, and the single entrypoint.

Everything else in `src/` is internal (not on the `exports` map). Internal modules import each other by
relative path; several import their **types** from `./index` (the barrel), which is why the barrel is a
convenient type hub even though it holds no logic.

---

## 2. Where each concern lives

| File | Owns | Notes |
|---|---|---|
| `src/types.ts` | The entire public **type** surface: branded scalars (`EID`, `CID`, `FactId`, `HlcStamp`, `ReplicaId`, `FactSetDigest`, …), the `Fact` envelope + authoring inputs (`AssertInput`/`RetractInput`/…), the cell/segment + view model (`NodeView`/`EdgeView`/`CellSegment`), the API/report types, the active-knowledge (§5b) shapes, `KipErrorCode`, and the **`Repo` working-surface interface**. | Pure declarations, **erased at runtime** — no imports, no runtime bindings. Re-exported verbatim by the barrel. |
| `src/kip-repo.ts` | The `KipError` class, the `KipRepo implements Repo` class (the concrete engine), its many private helpers, and the `open()` entrypoint. | The largest module by far. Wires the substrate + proj + active layer together behind the `Repo` methods. **The one module that imports and uses `isomorphic-git`** (the package's sole runtime dep) — for tree/commit render + the `regenerateHeads()`/`txn()` commit-DAG path (§5). **The class header comment is stale** — see §5. |
| `src/proj.ts` | The deterministic, **set-pure** projection fold `proj(S)` (SPEC §3.4): the T2.1→T2.7 pipeline — `orderKey` → group-by-cell → upcast → cell-reduce → interval geometry → conflict surfacing → the `getNode`/`getEdge`/traversal read surface. | A pure whole-set function, **never** a pairwise/binary merge. Reads no replica-local quantity. |
| `src/signing.ts` | ADR-B2 Ed25519 via `node:crypto` (native, zero-dep): key generation/import, the `publicKeyFingerprint` (SHA-256 of SPKI DER), signing, and `KeyRegistry` (per-repo fingerprint→pubkey map + `verify`). | The **real** crypto path — exercised whenever kip mints/ingests its own facts. |
| `src/substrate.ts` | The git object write-path (docs/22): hand-rolled standard git **loose objects** (`zlib.deflate` of `blob <len>\0…` under `objects/<hh>/<rest>`, hashed via `node:crypto`), the `/facts/…` shard layout, the temp-dir store (`Substrate.createTemp()`), `writeJsonAtomic`, and the durable **side-file stores** (`SeqTipStore`, `CommitTipStore`, `KeyRegistryStore`, `SelfWitnessedExcisionStore`). | "Git is the ONLY durable store." Does **not** import `isomorphic-git` — `substrate.ts` itself writes only loose **blob** objects by hand (ADR-B1/B6, no lockfile edits). Tree/commit DAG assembly is **not** here — it lives in `kip-repo.ts` (`regenerateHeads`/`txn`, see §5), which is the module that actually imports isomorphic-git. |
| `src/hlc.ts` | The Hybrid Logical Clock half of ADR-B4: the `(wall, counter, replicaId)` clock, `tick()` (local/send-advance), `receiveTick()` (receive-advance), and the overflow-carry rule (ADR-003). | Independent of `seq`. |
| `src/chain-sequencer.ts` | The `seq` axis of ADR-B4: a per-`(replicaId, keyFpr)` `ChainSequencer` — `seq=0` at genesis, strictly `previous+1`, durably persisted, **never** advanced by receipt, never reset by wall-clock rollover. | Deliberately shares no state with the HLC. |
| `src/canonical-payload.ts` | ADR-B3 canonical-JSON encoder: `CANONICAL_ENVELOPE_FIELDS` (a hardcoded, version-invariant field list) and the deterministic canonicalizer the signature is computed over. | Must match the fixtures' `CANONICAL_SIGNED_FIELDS` verbatim and in order. |
| `src/well-formed.ts` | The `well-formed()` checklist (docs/22 §2.1 step 1) — the **first half** of the ingest gate. | Does **not** verify the signature (that is a separate step in `kip-repo.ts`), so *malformed* vs *invalid-signature* stay independently distinguishable (INV-6a). |
| `src/cell-reducers.ts` | The `CellReducer` abstraction beyond the default `lww-hlc` sweep: `gsetReducer`, `pncounterReducer`, and the `(cellKey) → CellReducerRef` association seam consumed by `proj.ts`. | Proves the reducer abstraction has more than one real implementation; does not invent a per-ontology-kind registration API. |
| `src/contextual.ts` | M5 active-knowledge (§5b) support: `FunctionalityBinding` encode/decode, `ConditionNode` validation (`ERR_INVALID_WEIGHT`, INV-A7) + pure-proj evaluation (INV-A3), and the topological sort for `Segment.deps` (INV-A2). | `kip-repo.ts`'s `KipRepo` is the only caller. The active-layer **dispatch/execution flow** (`ContextualQuery` → `Segment` DAG → signed-fact execution → answer graph) is normatively specified in [`../31-contextual-functionalities.md`](../31-contextual-functionalities.md) (with [`../32-knowledge-autoencoding.md`](../32-knowledge-autoencoding.md) / [`../33-mining-discovery-ingestion.md`](../33-mining-discovery-ingestion.md) for the autoencoding + mining families). |
| `src/cli/**` | The standalone `kip` CLI: `kip.ts` (the `bin` shim), `index.ts` (`runCli`, `process.exit`-free), `resolve.ts` (flag→env→default precedence, all pre-flight exit-3 gates), `args.ts` (zero-dep parser), `ask.ts` (graph-QA synthesis; spawns the local `claude` CLI, ADR-B8), and `microagents/` (the bundled manifest). | **Scope boundary (AC-1):** links `@a5c-ai/kip-sdk` (self) + the genty layers only — **never** `@a5c-ai/babysitter-sdk`. |
| `src/mcp/**` | The standalone `kip-mcp` server: `index.ts` (`createKipMcpServer`, a hand-rolled stdio JSON-RPC 2.0 core, zero-dep) and `server.ts` (the `bin` bootstrap). | **Hard boundary (N-mcp-1):** consumes self + genty directly; must **not** import or route through `@a5c-ai/babysitter-sdk`'s `src/mcp/` run-effect surface. |
| `src/graph-qa/**` | `index.ts` (`answerQuestion`) — the **read-only** retrieval→synthesis core: NL question → grounded NL answer with per-claim citations to signed `FactId`s, over the read seams only. | Authors nothing (INV-A1); abstains rather than fabricates (N5). The model call is the injected `synthesize` seam (accelerator boundary, §5.3). |

The build (`package.json` `build`) is `tsc && node scripts/bundle-microagents.cjs`; the two `bin`
entries (`kip`, `kip-mcp`) point at `dist/cli/kip.js` and `dist/mcp/server.js`.

---

## 3. The layering

```
                 authoring inputs (AssertInput / RetractInput / edge / active-knowledge)
                                      │  sign (signing.ts, real Ed25519)
                                      ▼
   ┌──────────────────────────  the ingest gate  ──────────────────────────┐
   │   well-formed.ts  (structural checklist)  →  signature verification    │   ← FACTS
   │   admit on signature validity ONLY (INV-6, C3-1); the gate never       │
   │   decides trust — proj does.                                           │
   └───────────────────────────────────────────────────────────────────────┘
                                      │  admitted fact SET
                                      ▼
   substrate.ts  ── content-addressed loose git objects + durable side-files  ← SUBSTRATE
   (hlc.ts / chain-sequencer.ts / canonical-payload.ts stamp + address facts)
                                      │  the whole admitted set
                                      ▼
   proj.ts  ── deterministic, set-pure proj(S): orderKey → cell-reduce →       ← READ MODEL
              interval geometry → conflict surfacing → NodeView / EdgeView
                                      │
                                      ▼
   contextual.ts + graph-qa/  ── the ACTIVE layer (functionalities, learners,  ← ACTIVE LAYER
              graph-QA). Reads through proj; writes ONLY by appending signed
              facts back through the gate (INV-A1).

   cli/**  ·  mcp/**  ── the two standalone product SURFACES over a `Repo`.
```

Facts flow **in** through the gate, land in the substrate, and are materialized **out** by `proj`. The
active layer and the CLI/MCP surfaces sit *on top of* the read model; when they "write" they mint a new
signed fact and send it back through the same gate — there is no side door.

---

## 4. Invariants a maintainer must preserve

These are the load-bearing properties. The conformance suite (`src/__tests__/conformance/`, see
[`conformance-guide.md`](./conformance-guide.md)) pins each; breaking one should turn a named INV red.

- **Signature-only ingest gate (INV-6, C3-1).** The gate admits a fact iff it is well-formed **and** its
  signature verifies. It must **not** make trust/anachronism decisions — those belong to `proj`, which
  demotes (`pending` / `untrusted-*` / `quarantined`) at read time. Keep `well-formed.ts` free of trust
  logic and keep the signature check the only other admission criterion.
- **Set-pure `proj` keyed on author-HLC.** `proj(S)` is a whole-set fold that must read **no**
  replica-local quantity — not `rxFrom`, not ingest/commit order, not the receiver's clock, not local
  key-sync state (INV-1). Ordering is by `orderKey` (ending in `publicKeyFingerprint` then `factCID`),
  and the authority chain is **author-HLC keyed** (INV-10). Any new proj path must stay a pure function
  of the fact set; never introduce a pairwise/binary merge or a wall-clock read.
- **INV-A1 — microagents-are-clients.** No active-layer path (functionalities, learners, graph-QA) may
  mutate state except by appending a **signed fact** through the ordinary gate. The active layer is a
  *client* of the memory, not a privileged writer. This is load-bearing: it is what keeps the active
  layer inside the same convergence/audit guarantees as ordinary writes.
- **The accelerator boundary (§5.3).** Non-deterministic, model-relative computation (encode / decode /
  loss / embedding / search / prose synthesis) runs **outside** `proj`; only the *recorded* fact is
  substrate. In code this is the injected `synthesize` seam in `graph-qa/` — the retrieval half is a
  deterministic function of the as-of fact set, the model call lives outside. Do not pull a model call
  into `proj` or the reducers.
- **"Fallbacks are evil."** No silent defaults, no silent tiebreaks, no fabricated answers. Abstain or
  fail **loud** (N5): unresolved identity → exit-3 pre-flight; no model → exit-5 dispatch failure;
  contradictory `supersede` → a first-class `kip:conflict`, never a hidden hash tiebreak. This is a
  house rule enforced throughout `resolve.ts`, `proj.ts`, and `graph-qa/`.

---

## 5. Honest status — what is NOT yet built

`kip-repo.ts`'s class header comment (near the top of the `KipRepo` class) still reads *"every method a
throwing stub … Every method throws `unimplemented: <methodName>`"*. **That comment is stale** — the
M2–M9 build implemented the great majority of the surface. Do not trust it; grep for the genuine
remaining stubs before telling a contributor a method is done:

```bash
grep -n "unimplemented:" packages/kip-sdk/src/kip-repo.ts
```

As of today the genuine `unimplemented:` throws are:

- **`commit()`** — throws `unimplemented: commit`. This is a deferred **publish point** (the auto-batch
  flush, m-9 / M0-T1.5), *not* evidence that commit-DAG assembly is missing. The tree/commit DAG
  machinery **is** built: `KipRepo.regenerateHeads()` (`kip-repo.ts`) assembles a genuine multi-commit,
  parent-linked DAG (one commit per author-HLC-contiguous batch, docs/23 §5.2 `regenBoundaryRule`, with
  NFR-F5 incremental reuse) via isomorphic-git's low-level plumbing, and `KipRepo.txn()` extends a real,
  durable on-disk commit-DAG. Both are **byte-identically convergent** and pinned by **INV-12**
  (`src/__tests__/conformance/inv-12.test.ts` asserts the regenerated DAG is byte-identical across
  TZ/`core.autocrlf`/locale perturbation and across two replicas after concurrent excision — a passing
  invariant). What is *not* wired is only the public `commit()` method as the flush publish point (see
  D-27, whose **Status is Resolved** — its resolution was precisely building this full multi-commit DAG;
  and `FactSetDigest` in `types.ts`, which exists because `SyncReport.tip` addresses the fact set, not a
  git commit id, per kip's C2-3 "never a commit-CID identity" design).
- **`asOf({ txTime, believer })` for a believer other than this replica's own `replicaId`** — throws;
  cross-replica belief-audit needs M3 sync machinery this replica cannot supply (it cannot observe
  another replica's `rxFrom` ingest order).
- **`pin` with an `asOf` carrying no `validTime`** (a txTime/believer-only belief-audit pin) — throws.

These limitations are tracked as accepted debt in [`DEBTS.md`](../DEBTS.md) (rounds 4–7), which is the
authoritative "what's real vs deferred" record. When you change any of these, update both the stub and
the corresponding DEBTS entry.
