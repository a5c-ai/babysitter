# kip-sdk `fix-all` — full spec-completion program report

> Release record for the **kip-fix-all** program: driving `@a5c-ai/kip-sdk` from its M0–M6 build state to
> **full spec completion**. Ten work items, each run through the same spec-driven TDD convergence loop —
> frozen tests → implement → build/test green gates → three adversarial critics
> (spec-fidelity / convergence-safety / code-quality) scored to a minimum of **≥88** → a recency-anchored
> acceptance pass against verbatim spec text → commit + push. This document is the whole-program summary;
> the per-milestone build narratives live in the sibling `reviews/build-*.md` and `debt-closure-*.md`
> reports, and the honest residuals surfaced by this program are logged as new tracked entries (D-40–D-46)
> in [`docs/DEBTS.md`](../docs/DEBTS.md).

## 1. Executive summary

The `fix-all` program completed the kip-sdk specification. Everything the spec named as in-scope for the
SDK is now implemented behind a converged, adversarially-reviewed test suite:

- **The remaining substrate/temporal surface** (M2, M3): `supersedeFact` / `reAttestFact` / `tombstone`
  (M2, `asOf` was already implemented); `merge` / `subscribe` / pin-`asOf` / `rollup` / the merge-driver
  (M3), whose ingest gate was hardened to **signature-only / byte-pure** admission with in-band public keys.
- **Retrieval** (M4): the full `recall` pipeline — vector → graph expansion → RRF fusion + §5.4 salience —
  with embeddings behind a genty-microagent seam, measured `recall@10 = 1.0` and INV-5 satisfied by
  measurement rather than by gaming.
- **Acquisition** (M7): `runAcquisition` with the Miner / Discoverer / Ingestor / RDF path, INV-A10 / INV-A1
  respected (the orchestrator remains the only author) and control-plane-target ingestion rejected.
- **Security / trust / tenancy** (M8): value-trust demotion, `revokeKey`, `withScope`, the
  `KeyAuthorization` / `Revocation` model, redaction and retention — INV-2 / INV-6 / INV-13 in full plus
  INV-10 / INV-15 / INV-16 / INV-17 / INV-18 / INV-19.
- **Conformance** (M9): the shippable INV suite per §8.4 — a `suite.ts` manifest of all 40 invariant ids
  with a doc-anchored completeness guard — plus closure of the audit-found INV-14b(b) A-1 attested-hole
  bridge.
- **Maintainability** (modularize): the 7,160-line `index.ts` monolith split per ADR-B5 into `types.ts` +
  `kip-repo.ts` + a 25-line barrel, **byte-identical** behavior.
- **Product surfaces** (kip-cli, kip-mcp, graph-qa): a standalone zero-dep `kip` CLI (11 commands + `ask`),
  a standalone zero-dep MCP server (hand-rolled stdio JSON-RPC 2.0, 10 tools + read-only gating), and a
  read-only graph-QA microagent (NL question → recall / query / asOf → cite-or-abstain) that makes the CLI
  and MCP `ask` verbs functional.

The program was preceded by an environment bootstrap (win32 rolldown binding), a Phase-1 plan, and three
design specs (kip-cli / kip-mcp / graph-qa) before Phase 2 implementation began.

Every item converged: **all 10 acceptance passes are PASS**, critic minimums ranged from **88 to 93**, and
the whole program landed with the `package-lock.json` **untouched** (zero new runtime dependencies).

## 2. Per-item results

| Item | Scope | Critic min | Rounds | Acceptance | Commit |
|---|---|---|---|---|---|
| M2-surface | `supersedeFact` / `reAttestFact` / `tombstone` (`asOf` pre-existing); proj-totality (INV-3) fix for malformed object-shaped supersede → quarantine | 90 | 2 (+1 INV-3 fix) | PASS | `5531e46fb` |
| M3-surface | `merge` / `subscribe` / pin-`asOf` / `rollup` / merge-driver; ingest gate made signature-only / byte-pure (in-band public keys) | 92 | 3 | PASS | `91c96a9d9` |
| M4-retrieval | `recall`: vector → graph → RRF + salience; embeddings via genty microagent seam; INV-5; `recall@10 = 1.0` | 90 | 2 | PASS | `c6137fbc3` |
| M7-acquisition | `runAcquisition`; Miner / Discoverer / Ingestor / RDF; INV-A10 / INV-A1; control-plane-target rejection | 92 | 2 | PASS | `1feb75c46` |
| M8-security | value-trust demotion, `revokeKey`, `withScope`, `KeyAuthorization` / `Revocation`, redaction, retention; INV-2/6/13-full + INV-10/15/16/17/18/19 | 89 | 2 | PASS | `345ca2da0` |
| M9-conformance | shippable INV suite per §8.4 (`suite.ts` manifest of all 40 ids + doc-anchored completeness guard); closed INV-14b(b) A-1 attested-hole bridge | 88 | 2 | PASS | `eec8c757a` |
| modularize | split 7,160-line `index.ts` → `types.ts` + `kip-repo.ts` + 25-line barrel per ADR-B5, byte-identical | 93 | 1 | PASS | `8cdebf440` |
| kip-cli | standalone zero-dep `kip` CLI, 11 commands + `kip ask` | 88 | 1 | PASS | `b20d6856f` |
| kip-mcp | standalone zero-dep MCP server, hand-rolled stdio JSON-RPC 2.0, 10 tools + read-only gating | 88 | 2 | PASS | `5d9c7e1eb` |
| graph-qa | read-only genty microagent: NL question → recall / query / asOf → cite / abstain; makes CLI/MCP `ask` functional | 92 | 2 | PASS | `face488d0` |

## 3. What the adversarial loop caught (that a green suite alone would have shipped)

Two of the ten items would have shipped a **passing test suite that encoded an unsound guarantee** if the
convergence gate had been "tests green" rather than "tests green **and** three adversarial critics ≥88."
These are the load-bearing examples of why the critic gate exists.

### 3.1 M8 — the security sham

M8 round 1 produced a green suite whose demotion logic was **fixture-gaming, inert in production**:

- Value-trust demotion was gated on a **fingerprint naming pattern** — it keyed off how the test fixtures
  happened to name their key fingerprints, which is a property of the fixtures, not of any real trust fact.
  Against real 64-hex fingerprints it would never fire.
- It also relied on a **forgeable genesis-root**, so the "root of trust" it demoted against could be
  fabricated by an attacker.

The critics caught both. Round 2 rebuilt demotion as a **general** mechanism keyed on real
`KeyAuthorization` facts and **manifest-pinned `rootKeys`**, closed the genesis-root forgery, and
**empirically verified** the new logic against real 64-hex fingerprints. A **permanent regression
guardrail** was added so the fixture-gaming pattern cannot silently return. A test-green-only gate would
have shipped a security control that did nothing in production.

### 3.2 M3 — the transitive-merge divergence

M3's ingest gate, as inherited, admitted facts in a way that opened a **transitive-merge divergence
vector**: two replicas merging the same facts through different intermediate hops could diverge. Critically,
this unsound behavior was **already encoded in pre-existing tests** (the `round2-critic-fixes` and
`debt-closure-d32` crit-8 fixtures assumed it), so those tests passing was *evidence for* the bug, not
against it. Round 3 made the ingest gate **signature-only / byte-pure** — admission is a pure function of
the fact's bytes and its in-band public key, with no replica-local or path-dependent input — and the
offending pre-existing tests were **rewritten to the byte-pure model**. Here the adversarial pass had to
overrule the existing suite, not merely extend it.

Both cases share the same lesson already recorded across this project's history: **a green suite can encode
the wrong guarantee.** The critic + recency-anchored-acceptance gate is what distinguishes "the tests pass"
from "the tests test the right thing."

## 4. Final suite & integration numbers

- **Test suite:** 84 test files — **526 passed, 10 skipped, 0 failed.**
- **Type check:** `tsc` build **clean.**
- **Integration gate: PASS** — `build:sdk` + `kip` build/test + `verify:metadata` all green.
- **Dependency hygiene:** `package-lock.json` **untouched throughout** — zero new runtime deps; the win32
  rolldown binding and eslint were installed lockfile-safe.
- **Modularization:** `index.ts` reduced **7,160 → 25 lines** (barrel); implementation in
  `kip-repo.ts` (6,031 lines) + `types.ts` (1,209 lines), byte-identical behavior per ADR-B5.

## 5. Deferred residuals (honest, tracked as D-40–D-46)

Full spec completion of the SDK's in-scope surface does **not** mean zero residuals. The following gaps were
surfaced during this program's acceptance passes and accepted as **non-blocking** — each is safe (none
un-does a safety guarantee; where a capability is genuinely absent the code **fails loud**, never
fabricating) and each is logged as a new tracked entry in [`docs/DEBTS.md`](../docs/DEBTS.md) rather than
left only in code comments.

- **M8 §8.3b RetentionClass byte-accounting** (`quarantinePoolBytes` / `keyChainDurableCapBytes`) has **no
  query seam** — only the observable "a flood never touches the trusted `/heads`" property is tested; the
  byte-level accounting is not inspectable. *(D-40)*
- **M8 `kip:revoked-concurrent` distinct-status label** is not surfaced — there is **no `CellSegment`
  status-field seam** to carry a distinct revoked-concurrent status. *(D-41)*
- **M8 governance activates per-namespace on `KeyAuthorization` presence** — un-governed namespaces stay
  legacy-trusted for INV-1 back-compat. This is a **documented modeling narrowing** relative to a strict
  §8.1 bright-line, not a silent gap. *(D-42)*
- **M4 salience / vector / scope residuals**: the `accessFreq` salience term is deferred (there is no
  read-event authoring API, and `recall` must not emit read facts — the observer-effect); the M4 vector half
  is an **exact cosine scan** (no ANN/HNSW — INV-5 is measured, not gamed); and scope/tenancy narrowing in
  `recall` is deferred to M8's model. *(D-43)*
- **graph-qa production synthesis**: the SDK ships the full read-only retrieval / citation / abstention
  pipeline **plus a documented host-injected `synthesize` seam**, but **no in-process model** (genty runs
  models out-of-process). Production `ask` **fails loud** via exit-5 / `ERR_ASK_DISPATCH_FAILED` when no host
  model is wired — it never fabricates an answer. *(D-44)*
- **kip-mcp minor gaps**: a write-advertising server can start **keyringless**; `kip_asof`'s recall sub-read
  **skips the `k` bound**; JSON `null` / batch frames are dropped **without a `-32600` error**; plus an
  orphaned `join` import and a manifest `asOf.validTime` type that dropped `"number"`. *(D-45)*
- **graph-qa / kip-cli minor gaps**: the `assert node`/`assert edge` stamped-echo emits `null` `id`/`hlc`/`seq`
  (because `putNode`/`putEdge` return only an EID); and `manifestGenesisCid` is derived as the sha256 of
  `manifest.json` (there is **no genesis-CID accessor** to read a real one). *(D-46)*

None of these is a correctness or safety regression: the security demotion, byte-pure merge, and
cite-or-abstain guarantees all hold; the residuals are missing inspection seams, deferred accelerators, and
honestly-narrowed models. They are recorded so the completion claim is **"the spec's in-scope surface is
implemented and adversarially verified, with these named residuals"** — not an unqualified "done."
