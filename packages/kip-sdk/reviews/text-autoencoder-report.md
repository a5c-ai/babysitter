# kip-sdk `text-autoencoder` — text→graph autoencoding program report

> Release record for the **text-autoencoder** program: making kip's **text→graph** path real. `Repo.learn()`
> — the knowledge-autoencoding loop — was already implemented but **dead**: none of the four microagent
> bodies it dispatches existed, and a plain document had no way to enter kip at all. This program built the
> missing pieces (ADR-B10 through ADR-B10f) — a content-addressed **blob API**, **four model-backed
> microagent bodies** in `src/learn/`, one `makeLearnDispatch` router with four bundled manifests, a
> **`kip learn <file>`** CLI, and the two retrieval fixes (**D-52** recall lexical seeding + **graph-QA
> edge-prop hydration**) that let `kip ask` answer over a learned graph — and drove it through the project's
> spec-driven TDD convergence loop: frozen tests → red gate → implement → build/test green gate → **four**
> adversarial critic rounds → acceptance → a real end-to-end **live demo** running the shipped `kip learn`
> binary over a real design note. It **resolves D-52** and logs five honest residuals as **D-57–D-61** in
> [`docs/DEBTS.md`](../docs/DEBTS.md).

## 1. Executive summary

kip could describe knowledge but could not **acquire** it from prose. `Repo.learn()` — the
text→graph→text autoencoding loop — was fully wired, but it dispatched four microagents
(`encode`/`decode`/`learner`/`loss`) whose **bodies did not exist**, and there was no way to get a raw
document into the substrate to learn from in the first place. The loop was reachable code with no reachable
behavior. This program closed both gaps at once and made `kip learn` a real verb:

- **A blob API (`putBlob`/`getBlob`).** Content-addressed via the existing `Substrate.writeBlob`, so a
  document can enter kip. A **stored file is content, not knowledge** — `putBlob` authors **no facts** and
  the projection stays byte-identical; only the learn loop turns those bytes into signed facts.
- **Four model-backed microagent bodies** (`src/learn/index.ts`), one per role
  (`encode`/`decode`/`learner`/`loss`), each spawning the already-authenticated `claude` CLI through the same
  Windows-hardened spawn helpers `ask.ts` uses. **One** `makeLearnDispatch` routes by
  `invocation.manifest.name`, backed by **four bundled manifests**
  (`src/cli/microagents/kip-learn-<role>/microagent.json`). The model **never emits `AssertInput` directly**:
  `compileGraphToAssertInputs` (`src/learn/compile.ts`) compiles the narrow `{nodes,edges}` JSON the model
  returns into well-formed, **namespaced** (`doc:<blob-oid>#<slug>`) signed facts.
- **A `kip learn <file>` CLI** behind an opt-in `KIP_LEARN_LIVE` gate, with honest exit codes (0/5/2/1/7).
- **Two enabling retrieval fixes** so `kip ask` can answer over what was learned: **D-52** (recall now does
  deterministic **lexical seeding** over a searchable surface — eid + kind + prop keys + structured values +
  incident edge kinds — with a local relevance bar and a shared tokenizer `src/text-terms.ts`, replacing the
  old exact-`content`-equality path) and **graph-QA edge-prop hydration** (graph-QA bound edge *existence*
  only; it now hydrates and **cites** edge props).

Every item converged: **four adversarial critic rounds**, **acceptance PASSED** (all hard criteria met, only
documented deferrals remain), the **integration gate PASSED** (`build:sdk` + kip build + full kip test
**771 passed / 8 skipped** + `verify:metadata`, all green), and the program landed with **zero new runtime
dependencies** — `package-lock.json` **untouched**, plus a new `.gitattributes` enforcing LF. The live demo
ran the shipped `kip learn` over a real design note, accepted on **iteration 1** (loss **0.22 < 0.25**),
committed **60 signed facts** as a faithful **13-node/17-edge** concept graph, and answered all four factual
questions correctly via `kip ask` — while the round-4 fabrication guard **held live** on two absent-subject
controls. The program **resolved D-52** and logged **five** honest residuals as **D-57–D-61**.

## 2. What shipped & design

**Surfaces.** A content-addressed **blob API** (`putBlob`/`getBlob`), **four microagent bodies** in
`src/learn/index.ts`, **one** `makeLearnDispatch` router, **four bundled manifests** under
`src/cli/microagents/kip-learn-<role>/`, and a **`kip learn <file>`** CLI verb. `Repo.learn()` itself was
already implemented (the autoencoding loop, ADR-B10) — this program supplied the bodies it dispatches and the
document ingress it needs.

**Blobs are content, not knowledge.** `putBlob` is content-addressed on top of the existing
`Substrate.writeBlob`, so a raw document has a home in kip. Storing a file authors **no facts** and leaves
the projection **byte-identical** — the INV-A1 story is preserved by construction, because a blob is inert
bytes until the learn loop compiles it into signed facts through the orchestrator. Structurally, the learn
dispatch is handed only a `Pick<Repo, "getBlob" | "putBlob">`, never the authoring seam — the sole write any
role performs is `decode`'s `putBlob` of the reconstructed document, which is again content, not a fact.

**The model never authors facts directly.** Each role prompts the authenticated `claude` CLI and returns a
constrained shape; the model is never allowed to emit `AssertInput`. `compileGraphToAssertInputs` takes the
model's narrow `{nodes,edges}` JSON and compiles it into well-formed, **namespaced** facts
(`doc:<blob-oid>#<slug>` eids), so every learned fact is traceable to the document that produced it and two
documents can never collide on a shared eid. The decode manifest's `outputSchema` is strict
(`required:["reconstructed"]`) — the manifest schema **is** the guard (ADR-B10d).

**The `kip learn` CLI is opt-in and honest about failure.** The live path spawns a **paid** model, so it is
gated behind `KIP_LEARN_LIVE`: unset, the gate returns `{enabled:false}` **without** spawning anything. Exit
codes are meaningful — `0` accepted, `5` gate/model unusable, `2` bad input, `1` loop did not converge, `7`
compile/validation failure — never a fabricated success.

**Two retrieval fixes make the learned graph answerable.** `kip learn` writes signed facts, but `kip ask`
could not find them: recall's text path was exact-`content` equality (D-52), and graph-QA bound edge
existence without reading edge props. This program shipped **D-52's lexical seeding** (a searchable surface
per node — eid with the `doc:<blob>#` namespace stripped, node `kind`, every prop key, every structured prop
value covering the gate instant, and every as-of-valid incident edge kind — tokenized identically to the
query by the shared `src/text-terms.ts`) and **graph-QA edge-prop hydration** (edge props are now hydrated
and citable), so a `kip learn`-produced graph with no `content` prop is discoverable and `kip ask` composes
to a cited answer.

## 3. TDD convergence — what the adversarial loop caught (that a green suite alone would have shipped)

The program converged over **four adversarial critic rounds**, per-round minimums **R1 = 62 → R2 = 70 →
R3 = 84 → R4 = 87/68/67**. The round-4 surface **widening** (see the D-52 edge-prop/structured-value
anchoring work) itself introduced a **fabrication regression**, which was caught within the round and fixed
immediately after — the loop policing its own last move.

The adversarial loop caught, and drove root-cause fixes for, real defects a green suite alone would have
shipped:

- **(a) Prompting the model with a NULL document (N5).** On an unresolvable `rawRef`, `encode`/`learner`
  handed the model a null document instead of failing loud — a fabrication-inviting fallback. Fixed to an
  honest failed iteration (ADR-B10b: a missing document is a loud failure, never a null prompt).
- **(b) Missing eid namespacing → cross-document cell contamination.** Without the `doc:<blob>#` namespace,
  two documents' facts about the same real-world entity landed in the **same cell under a real signed
  `FactId`** — so `kip ask` could answer about document A with document B's value while citing a genuinely
  valid signature. Closed by `namespaceEid` in `compile.ts`.
- **(c) A dead `KIP_LEARN_LIVE` gate.** The opt-in gate was wired such that it spawned the **paid** model
  with **no opt-in** actually required. Fixed so the gate is a pure predicate that spawns nothing until
  `KIP_LEARN_LIVE` is set.
- **(d) Two flagship D-52 tests that did not test D-52 (mutation-proven),** plus a §8.4 question-rewrite that
  weakened a fabrication guard. The critic mutation-proved that the "D-52" tests still passed against a
  broken recall; they were replaced with mutation-sensitive assertions, and the §8.4 rewrite was reverted.
- **(e) A graph-global recall relevance floor causing silent false-negative abstention.** A `bestMatched>=2`
  graph-GLOBAL bar meant `recall("Where does Zara work?")` returned `[]` on a graph that plainly held Zara —
  adding true, relevant query terms **destroyed** retrieval. Replaced with a **candidate-local** bar
  (retrieval locality), so whether a node is a seed never depends on any other node. A silent false-negative
  abstention is itself a "surfaced, never silent" violation (docs/27 §0).
- **(f) An absent-subject fabrication.** Over a **Tal-only** graph, "What is Zara's role?" returned "Zara's
  role is Engineer" **citing Tal's fact** — a wrong answer wearing a real signature. Closed by graph-QA's
  subject-anchoring relevance check on the retrieved evidence (kip-graph-qa.md §6.1b).

All six were fixed at root cause and **pinned by named, mutation-sensitive tests**. The through-line matches
the rest of this project's history: a green suite plus a passing acceptance can still ship a fabrication, a
silent abstention, or a cross-document contamination that only an adversarial critic — and a real end-to-end
run — expose.

## 4. Live demo — real model, hardened code (`kip learn ./note.md`)

**PASS.** Running the shipped `kip learn` binary over a real design note:

1. **Accepted on iteration 1** — loss **0.22 < 0.25** (the convergence threshold), committing **60 signed
   facts**.
2. **A faithful 13-node / 17-edge concept graph** — services, teams, ownership, the **event-driven data
   flow** (Orchid → OrderPlaced → Kafka → Settler → Ledger), the ADR structure, and the RPC-facade
   **rejection reason** — all reconstructed from prose.
3. **All four factual questions answered correctly** via `kip ask`, each citation bound to a **real signed
   `factId`**.
4. **The round-4 fabrication guard held live** — "What is Alice's role?" (Alice **absent** from the graph)
   **abstained**, and the vacation-policy **negative control abstained** — cite-or-abstain, never a guess.
5. **Latency ~259s** for the full accept-on-first-iteration loop.

The loss value is a **search signal only** — it drives the autoencoding loop's accept/iterate decision and
**never** touches `orderKey`, reducers, or trust. The demo is the honest proof that the four bodies, the
compile step, the namespacing, and the two retrieval fixes compose end-to-end against a real model.

## 5. Final suite & integration numbers

- **Integration gate: PASS** — `build:sdk` + kip build + the **full kip test suite (771 passed / 8
  skipped)** + `verify:metadata`, all green.
- **Dependency hygiene:** **zero new runtime dependencies**; `package-lock.json` **untouched**.
- **Line-ending hygiene:** a new **`.gitattributes`** enforcing LF was added (the learn/blob path is
  byte-sensitive; CRLF drift would perturb content-addressing).

## 6. Acceptance

**PASSED.** All hard acceptance criteria were met — the four microagent bodies exist and dispatch, a document
enters kip and compiles to namespaced signed facts, `kip learn` gates and exits honestly, and `kip ask`
answers over a learned graph with real citations. Only the documented deferrals below remain.

## 7. Residuals / deferrals (honest — D-52 resolved; D-57–D-61 new)

Shipping a working text→graph path does not mean zero residuals. Each of the following is **safe** — where a
capability is absent the code **fails loud**, **skips with a recorded reason**, or **abstains**, never
fabricating — and each is logged in [`docs/DEBTS.md`](../docs/DEBTS.md):

- **Recall is KEYWORD lexical, not semantic.** No embedding/synonym/paraphrase/morphology match — a question
  sharing no lexical term with the graph retrieves nothing and `ask` abstains. *(D-57)*
- **The learner's encoding is non-deterministic.** The same document can split into a different node/edge set
  across runs (the live model path is opt-in and accelerator-class). *(D-58)*
- **A free-text-only subject is retrieved-then-abstained.** A subject a graph names ONLY inside a free-text
  prop value (`content`/`description`/`summary`) is lexically retrieved by `recall` but abstained on by
  graph-QA, because the anchoring surface deliberately excludes free-text values to keep the §8.4 fabrication
  guard holding. *(D-59)*
- **Cross-document contradictions no longer surface as `kip:conflict`.** The `doc:<blob>#` namespace that
  makes retrieval local also makes two documents' facts about the same entity disjoint cells, so a genuine
  A-vs-B disagreement is stored as two non-conflicting facts. A namespacing trade-off. *(D-60)*
- **Temporal invalidation is not modeled.** The live demo retained a pre-decision "Orchid writes Ledger" edge
  as `status:"current"`, slightly overstating present tense — a decision that supersedes an earlier design
  choice does not invalidate the stale edge. *(D-61)*

One further narrow residual is carried by this work (not a net-new numbered debt): with **multiple subject
terms** the graph-QA anchor requires only **one** to be present in the anchoring surface.

**Resolved by this program (recorded here for the release trail):**

- **D-52 — Resolved.** `recall`'s text path is now deterministic lexical seeding over a searchable surface
  (commit **`55afa73be`**), and graph-QA hydrates and cites edge props (commit **`af45ed046`**), so `kip ask`
  answers over a `kip learn`-produced graph rather than abstaining by construction. The still-open
  **semantic** half and the **free-text-only-subject** / **cross-document-conflict** trade-offs are promoted
  to their own tracked entries (**D-57 / D-59 / D-60**) rather than left as an inline "partially closed"
  residual.

The claim is therefore precise: **kip-sdk now has a real text→graph path — a blob API, four model-backed
microagent bodies behind one dispatcher, a live `kip learn` CLI that turned a real design note into 60 signed
facts a faithful 13-node/17-edge graph accepted on iteration 1, and a `kip ask` that answers over it with
real citations while abstaining on absent subjects — with these named, tracked residuals** — not an
unqualified "done."
