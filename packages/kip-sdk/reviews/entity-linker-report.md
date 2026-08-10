# kip-sdk `entity-linker` — deterministic code↔concept graph unification program report

> Release record for the **entity-linker** program: **Layer 1** of kip's unification story. A kip repo could
> already hold a **code graph** (`code:*` from `kip index`) and one or more **concept graphs**
> (`doc:<blob>#slug` from `kip learn`) in the same substrate, but the two lived side by side as **disconnected
> islands** — nothing joined a learned concept to the real module it describes. This program shipped a
> **deterministic** entity linker (ADR-B11 / B11a / B11b / B11c) that connects them into one queryable memory
> by **asserting signed, reversible link edges** — it **never merges identities**. It is a pure, no-model
> function (`linkResolver`, INV-A1), a `linkResolverDispatch` routed exactly like the code Miner, a minimal
> read-only `Repo.nodeEids` enumeration seam, and a `kip link` CLI — all authored through the existing
> `runAcquisition` path. Built through the project's spec-driven TDD convergence loop — frozen tests → red
> gate → implement → build/test green gate → **four** adversarial critic rounds → post-loop precision fixes →
> acceptance → a real end-to-end **live demo** joining a `kip index` code graph and a `kip learn` concept graph
> into one traversable memory. The headline finding: **the code↔concept union needs ZERO retrieval change** —
> graph-qa's existing depth-3 both-direction traversal already crosses the new `documents` edge. The six
> honest residuals it surfaced are logged in [`docs/DEBTS.md`](../docs/DEBTS.md) as **D-62–D-67**.

## 1. Executive summary

kip could **acquire** a code graph (`kip index`, the code Miner) and a concept graph (`kip learn`, the
text→graph autoencoder), and store both in one repo — but the two graphs did not **touch**. A learned concept
node about "the settlement module" and the real `code:module` node for `src/settle.ts` were separate,
unconnected identities, so `kip query` could never walk from a concept to the code it describes or back. This
program built the first, **deterministic** layer that unifies them:

- **A pure, deterministic, no-model link resolver.** `linkResolver(inventory) → AcquisitionResult` authors
  link edges from an enumerated inventory of node eids and their props — **no model, no network, no
  randomness** (INV-A1). `linkResolverDispatch` is dispatched by the acquisition orchestrator exactly the way
  `codeMinerDispatch` is, so every link edge is authored through the same `runAcquisition` seam that governs
  every other acquisition family — **no new write path**.
- **Three deterministic link rules, all identity-anchored.** A concept whose props contain a **full
  path-qualified relPath** that exactly matches a `code:module` gets a typed, reversible **`documents`** edge;
  a concept whose identity fields name a symbol or package links to `code:symbol` / `code:package`; and two
  concepts in **different documents** that share a **distinctive (strong) name** get a **`same_as`** pair. The
  linker **asserts edges** — it never renames or merges an eid, so every link is reversible.
- **A minimal read-only enumeration seam.** `Repo.nodeEids({prefixes})` enumerates existing node eids by
  namespace prefix (e.g. `code:` and `doc:`) so the resolver can see both graphs — read-only, authoring
  nothing.
- **A `kip link` CLI.** Counts by kind, examples, `--json`, `--dry-run`; an **honest zero-link result is exit
  0**, never a fabricated success.
- **The headline finding — the union is free at retrieval time.** No change to graph-qa was needed: its
  existing **depth-3 both-direction** traversal crosses the `documents` edge, so `kip query --direction both
  --depth 3` walks concept → `documents` → `code:module` → symbols → imports and back **with zero retrieval
  code changed**.

Every item converged: **four adversarial critic rounds** plus several **post-loop precision fixes**,
**acceptance PASSED** (all hard criteria met; only documented deferrals + two minor non-hard gaps remain), and
the **integration gate PASSED** (`build:sdk` + kip build + the full kip test suite **820 passed / 8 skipped**
+ `verify:metadata`, all green) with **zero new dependencies**, `package-lock.json` **untouched**, and
`.gitattributes` LF preserved. The live demo joined a real `kip index` code graph and a real `kip learn`
concept graph into one repo, `kip link` authored **2 `documents` edges** connecting the concept nodes to their
`code:module` nodes, and `kip query --direction both --depth 3` traversed the boundary in **both directions** —
reversibly and idempotently. The program logs **six** honest residuals as **D-62–D-67**.

## 2. What shipped & design

**Surfaces.** A pure `linkResolver(inventory) → AcquisitionResult`; a `linkResolverDispatch:
DispatchMicroagentFn` dispatched like the code Miner; a minimal read-only `Repo.nodeEids({prefixes})`
enumeration seam; and a **`kip link`** CLI verb. All link edges are authored through the existing
`runAcquisition` seam — there is **no new write path**, so **INV-A1 holds structurally**: the resolver is
handed an inventory (enumerated eids + props), never a `Repo` or a write seam; only `runAcquisition` signs and
commits the edges.

**The resolver is deterministic and model-free (INV-A1).** `linkResolver` is a pure function of its inventory:
same inventory in, same link edges out, with no model call, no network, and no randomness. That is the whole
point of **Layer 1** — the union it builds is reproducible and auditable by construction, a floor beneath the
model-assisted fuzzy resolution deferred to Layer 2.

**Links are asserted edges, never identity merges.** The three rules all **assert a signed edge** and never
rename or collapse an eid:

- **Concept → `code:module` (`documents`).** A concept node whose props (from **any** prop) contain a **full
  path-qualified relPath** that **exactly** matches a `code:module`'s path gets a typed, **reversible**
  `documents` edge. The match is on a complete path-qualified relPath — not a bare basename — precisely to
  avoid incidental-mention false links (see §3).
- **Concept → symbol / package.** A concept whose **identity fields** name a symbol or package links to the
  corresponding `code:symbol` / `code:package` node.
- **Concept ↔ concept (`same_as`).** Two concepts **in different documents** that share a **distinctive
  (strong) name** get a `same_as` pair — the cross-graph "these two nodes denote the same thing" channel.

Every edge is authored via `runAcquisition`, so it carries a real signature and is reversible: nothing is
merged, so a mistaken link is undone by retracting the edge (or asserting `not_same_as`), never by un-merging
an identity.

**The union is free at retrieval time.** The program's headline finding is a **negative result that saves
work**: joining the code and concept graphs required **no retrieval change at all**. graph-qa's existing
**depth-3 both-direction** traversal already crosses the `documents` edge, so a `kip query --direction both
--depth 3` seeded at a concept walks across the edge into `code:module`, on to its symbols and imports, and
back — with **zero** graph-qa code modified. The linker adds edges; the existing traversal does the rest.

## 3. TDD convergence — what the adversarial loop caught (that a green suite alone would have shipped)

The program converged over **four adversarial TDD rounds** and then several **post-loop precision fixes**.
Per-round minimums: **R1 = 32 → R2 = 84 → R3 = 85 → R4 = 85**; the R1 minimum of **32** is the signature of a
**CRITICAL** defect caught on the first round. After the loop, the post-loop precision fixes drove the
spec-fidelity critic **89 → 93 → 95** and the code-quality critic to a **final 90**. The adversarial loop
earned its keep: it caught — each with a mutation-proof — and drove root-cause fixes for real defects a green
suite alone would have shipped:

- **(a) A CRITICAL cross-document `same_as` false-merge (R1, min 32).** The `same_as` rule matched two
  concepts on **any shared string prop value** — including generic slugs — so unrelated concepts across
  documents were falsely declared the same entity. **Fixed:** `same_as` now fires only on **distinctive
  identity name props**, with a minimum length and a stopword filter, so an incidental shared string can no
  longer trigger a merge assertion.
- **(b) A "strong-name" rule so generic role nouns don't merge.** Even after (a), a single-token generic role
  noun (`Manager`, `Client`) shared across two documents would still pair. **Fixed:** only **multi-token** or
  **internal-marker** names count as strong/distinctive; a lone common role noun is deterministically
  abstained.
- **(c) Filename-shape false-links, closed in three tightenings.** The `documents` match was fooled by
  filename-shaped strings in stages: first across **dot-count**, then across **extension case**
  (`config.JSON`), closed via a **known-extension allowlist**; then across **all-caps acronyms/extensions**
  (`config.ZIG`, `HTTP`), closed via a principled **camelCase `[A-Z][a-z]` distinctiveness rule** rather than
  an ever-growing denylist.
- **(d) `documents` edges from incidental bare-basename mentions.** A concept that merely mentioned a file's
  bare basename in prose produced a spurious `documents` edge. **Fixed:** the `documents` rule requires a
  **full path-qualified relPath**, not a bare basename.
- **(e) A coverage corridor (leading-capital) closed with a both-PascalCase test.** A leading-capital gap in
  the distinctiveness rule was closed and pinned by a both-PascalCase test.
- **(f) Two frozen tests that encoded loose behavior.** Two frozen tests asserted the pre-tightening (looser)
  behavior; they were **corrected to strictly-stronger contracts** rather than left to certify the weaker
  rule.

All were fixed at root cause and pinned by named, mutation-sensitive tests. The through-line matches the rest
of this project's history: a green suite plus a passing acceptance can still ship a cross-document false-merge
or a filename-shaped false link that only an adversarial critic — and a real end-to-end run — expose.

## 4. Live demo — real model, then a real deterministic link (`kip index` + `kip learn` → `kip link` → `kip query`)

**PASS.** The exact scenario that was **proven broken** now works end-to-end:

1. **`kip index src/learn`** authored **57 code facts** (the code graph), and **`kip learn`** a note was
   **accepted** and committed **55 facts** (the concept graph) — into **one** repo. (The model filed the note's
   file paths under a `path` prop.)
2. **`kip link`** authored **2 `documents` edges**, joining the learned concept nodes to the real
   `code:module` nodes.
3. **`kip query --direction both --depth 3`** traversed the boundary **in both directions**: concept →
   `documents` edge → `code:module` → symbols → imports → and back.
4. **Reversible** — no eid was renamed or merged; every join is an asserted, retractable edge.
5. **Idempotent** — re-running `kip link` authored **0 new edges**.

A **prior** demo run had authored **0 links**: the model had put the file paths in a **non-identity `path`
prop** that the linker ignored, so the learn→link composition silently produced no join. That composition gap
was fixed by matching a **full path-qualified relPath from any prop** (not only the identity fields), then
**re-verified live** — this is exactly the class of "a green suite plus acceptance can still miss what a real
run exposes" defect that recurs across this project. The demo also surfaced and **fixed** a `kip link
--dry-run` **arg-parser bug**.

The union it proves is precisely the negative result from §2: once the 2 `documents` edges exist, the existing
depth-3 both-direction traversal crosses them with no retrieval change — the graph is genuinely one queryable
memory.

## 5. Final suite & integration numbers

- **Integration gate: PASS** — `build:sdk` + kip build + the **full kip test suite (820 passed / 8 skipped)** +
  `verify:metadata`, all green.
- **Dependency hygiene:** **zero new dependencies**; `package-lock.json` **untouched**.
- **Line-ending hygiene:** `.gitattributes` **LF** preserved (the acquisition path is byte-sensitive).

## 6. Acceptance

**PASSED.** All hard acceptance criteria were met — the linker is a pure deterministic no-model function
(INV-A1), it authors reversible `documents` / `same_as` link edges through `runAcquisition` without merging any
identity, `Repo.nodeEids` enumerates both graphs read-only, `kip link` reports counts/examples and exits 0 on
an honest zero-link, and the code↔concept union is traversable via the **unchanged** graph-qa depth-3
both-direction path. Only the documented deferrals below remain, plus **two minor non-hard gaps**: the ADR
lists `--include` / `--exclude` on `kip link` but they are **not wired**, and `Repo.nodeEids` is **not
enumerated in docs/40**.

## 7. Residuals / deferrals (honest — tracked as D-62–D-67)

Shipping a working deterministic entity linker does not mean zero residuals. Each of the following is **safe**
— where the linker cannot decide it **abstains** (never a fabricated link, never an identity merge) and every
authored edge is **reversible** — and each is logged in [`docs/DEBTS.md`](../docs/DEBTS.md):

- **`kip ask` over a linked graph cites the concept side only, not the `code:module` fact.** `ask` names the
  answer **correctly**, but its citation is the concept node, not the `code:module` fact across the `documents`
  edge — the `code:module` node carries content-blob / format / loc props with **no question-relevant text**,
  so graph-qa's **citation selection** does not pick it. The gap is graph-qa citation selection, **not** the
  linker: the graph **is** unified and traversable via `kip query`. A graph-qa follow-on. *(D-62)*
- **Cross-doc `same_as` can still false-merge a genuine homonym.** Two distinct real-world entities that share
  a distinctive name across documents can still be paired. The residual is **narrow** and **reversible**
  (`not_same_as` / retract) and is **deliberately deferred to the model-assisted Layer 2**; single ambiguous
  tokens (bare common nouns, all-caps acronyms, filename-shaped names) are **deterministically abstained**
  (high precision, may miss). *(D-63)*
- **`--include` / `--exclude` not wired on `kip link`.** The ADR lists them; they are not registered. *(D-64)*
- **`Repo.nodeEids` absent from docs/40.** The enumeration seam is not documented in the SDK API surface.
  *(D-65)*
- **`same_as` prop-union in retrieval (ADR-B11c) is a designed follow-on.** The `same_as` edge is authored,
  but retrieval does not yet union the props of `same_as`-linked nodes. *(D-66)*
- **RDF / linked-data `owl:sameAs` ingestion is a designed-but-unbuilt follow-on.** It reuses the same
  `sameAs` channel (IRIs as global eids); designed, not built. *(D-67)*

Two further, related follow-ons are named by this work (carried by the same channel, not net-new numbered
debts): the **model-assisted fuzzy resolver (Layer 2)** — the model-backed successor to this deterministic
Layer 1 — and the entity-resolution use of `same_as` for cross-document conflict surfacing that D-60 already
tracks.

The claim is therefore precise: **kip-sdk now unifies its code graph and its concept graphs into one queryable
memory — a pure deterministic no-model `linkResolver` behind one dispatcher, a read-only `Repo.nodeEids` seam,
and a live `kip link` CLI that authored 2 reversible `documents` edges joining real `code:module` nodes to
learned concepts, INV-A1-preserving and identity-merge-free by construction, traversable in both directions by
the UNCHANGED graph-qa depth-3 path — with these named, tracked residuals** — not an unqualified "done."
