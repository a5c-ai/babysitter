# kip-sdk Documentation Debt Register

> Purpose: a verified catalog of **documentation** debt in the kip-sdk doc set — contradictions,
> definitional gaps, faithfulness drift from `SPEC.md`, architectural-view gaps, completeness gaps, and
> redundancy. Every entry below was opened at its cited file:line and confirmed both that the quoted
> text exists and that it actually constitutes the claimed debt.

This register catalogs **documentation** debt (rounds 1-3, D-01–D-26) — contradictions, definitional gaps,
faithfulness drift from `SPEC.md`, architectural-view gaps, completeness gaps, and redundancy in the docs
under `packages/kip-sdk/docs/`. **Round 4** (D-27–D-31, added after the M0-M3 implementation build — see
`reviews/build-final-report.md`) extends the register to **implementation** debt: real, honest gaps between
the shipped `packages/kip-sdk/src/*.ts` and the spec/ADR target state, surfaced during Phase D's TDD rounds
and accepted as non-blocking. **Round 5** (D-32, surfaced by post-closure live-usage testing through the
real on-disk `open()`/keyring API rather than the internal test bypass) adds one further implementation
debt, currently Open. **Round 6** (D-33–D-37, surfaced during the M5/M6 build — see
`reviews/build-m5-m6-report.md`) adds five further implementation debts from M5's acceptance GAPS and M6's
residual atomicity/key-collision limitations, all currently Open. **It both catalogs each debt AND tracks its resolution:** every entry records
the evidence, a suggested fix, and a `Status` line stating whether (and how) the fix was applied — the
register is the resolution record, not merely a backlog.

## Summary

> Counts below are the register-wide rollup across the three **documentation** audit rounds (round 1:
> D-01–D-21; round 2: D-22–D-26; round 3: anchor/link-checking hardening folded into D-13/D-14/D-19, no new
> ids). See the per-round breakdown in "Audit round 2 — new docs (27, 28) + integrity". **Round 4**
> (D-27–D-31, implementation debt, now all Resolved — see the debt-closure run recorded in
> `reviews/debt-closure-report.md`) is tracked separately in its own section below and is not included in
> this docs-only rollup. **Round 5** (D-32, Open) is likewise tracked separately, not included here.

| Severity | Count | Resolved | Partially resolved | Open |
|---|---|---|---|---|
| Critical | 2 | 2 | 0 | 0 |
| Major | 6 | 6 | 0 | 0 |
| Minor | 18 | 17 | 1 (D-12: the 81 split) | 0 |
| **Total kept** | **26** | **25** | **1** | **0** |
| Dropped (unsubstantiated) | 1 | — | — | — |

> **Rollup:** 26 kept · 25 resolved · 1 partially resolved (D-12's `81` monolith split remains open) · 0 untouched.

| Category | Count |
|---|---|
| Definitions | 6 |
| Contradictions | 1 |
| Faithfulness | 4 |
| Architecture | 5 |
| Completeness | 2 |
| Redundancy | 8 |

---

## Critical

### D-01: Schema version `v` is author-signed in the data model + FR-A1 but kip-filled in the API surface

- **Category:** Contradictions
- **Severity:** Critical
- **Locations:** [21-data-model.md](./21-data-model.md) L147-L151 · [10-functional-requirements.md](./10-functional-requirements.md) L31-L36 · [40-sdk-api-surface.md](./40-sdk-api-surface.md) L14-L21
- **Evidence:**
  - `21-data-model.md` L147-L151: canonical signed payload is `[ v, type, target, value?, validFrom, validTo, hlc, ... ]` and "every author/replica/version-distinguishing field (`publicKeyFingerprint`, `replicaId`, the schema version `v`) is **in** the canonical payload. The `signature` field is the **only** field excluded."
  - `10-functional-requirements.md` L34-L35 (FR-A1): "The caller (author) stamps and signs the fact including its author-HLC **and the schema version `v`** (both are in the canonical signed payload, §2.4)."
  - `40-sdk-api-surface.md` L16-L19: "kip fills the derived/receiver fields (`id`/`FactId` = CID of the canonical payload, `v`, and the audit-only `rxFrom` annotation — never authored)." and `type AssertInput = Omit<Fact, "id" | "v" | "type"> & { type: "assert" };`
- **Why it is debt:** The canonical payload is exactly what the Ed25519 signature is computed over, and `id`/`factCID` is the content hash of that payload. If `v` is in the canonical payload then the author must supply it to sign — kip cannot "fill" a field the author has already signed over without invalidating the signature. The data model and FR-A1 say `v` is author-signed; the API surface says `v` is kip-filled and structurally removes it from `AssertInput`/`RetractInput` via `Omit<Fact, "id" | "v" | "type">`. An implementer coding to `40-sdk-api-surface.md` would omit `v` from the signed shape and produce facts that violate the canonical-payload/signature contract. This is a true, build-blocking contradiction encoded structurally in the types.
- **Suggested fix:** Make `40-sdk-api-surface.md` agree with `21-data-model.md` §5.1 and FR-A1: `v` is author-stamped and signed. Change `AssertInput`/`RetractInput` to `Omit<Fact, "id" | "type">` (omit only the kip-derived `id` and the discriminant `type`, NOT `v`), and change the authoring-inputs comment so kip fills only `id`/`FactId` and the audit-only `rxFrom` — never `v`. The same inconsistency exists in `SPEC.md` (L384 vs L2702/L2709) and should be fixed there too, since the spec is the source of truth.
- **Status:** Resolved — changed both `AssertInput`/`RetractInput` to `Omit<Fact, "id" | "type">` and reworded the authoring comment (author signs `v`; kip fills only `id`/`FactId` + audit-only `rxFrom`) in `40-sdk-api-surface.md` and `SPEC.md` §6; §2.4 already correct and untouched, §6 now agrees.

---

## Major

### D-02: Projection trust-state vocabulary is never defined, and `quarantined` is conflated with the `quarantined-ttl` retention class

- **Category:** Definitions
- **Severity:** Major
- **Locations:** [glossary.md](./glossary.md) L82-L88 · [24-synchronization-and-convergence.md](./24-synchronization-and-convergence.md) L67, L160 · [11-non-functional-requirements.md](./11-non-functional-requirements.md) L102, L116, L250
- **Evidence:**
  - `glossary.md` L82: "A demoted fact is `untrusted`/`quarantined`, never dropped"; L86-L87: projects "**trusted**" only over a complete chain "(else **`pending`**); once complete it is demoted `untrusted-anachronistic`" — used inline but never enumerated/defined.
  - `24-synchronization-and-convergence.md` L67: "A fact with a forward (`> child`) or cyclic `causedBy` edge is demoted `untrusted-malformed` (§3.6)." — yet another undefined state.
  - `11-non-functional-requirements.md` L102: "`RetentionClass ∈ {durable, key-chain-durable, quarantined-ttl, evicted}`" (a BYTE-RETENTION class) vs L250: "those facts project `quarantined`" (a PROJECTION/TRUST state) — the same word on two orthogonal axes, neither defined in the glossary.
- **Why it is debt:** The glossary header claims "Authoritative definitions for every load-bearing term," yet the projection trust-state enum (the core output vocabulary of `proj`) is never defined, and `quarantined` is used both as a trust state and as half of a retention-class name with no entry distinguishing the two axes. A reader cannot tell what `quarantined` vs `quarantined-ttl` vs `untrusted` denote.
- **Suggested fix:** Add a glossary entry "Projection trust states" enumerating `trusted | pending | untrusted-anachronistic | untrusted-malformed | quarantined` (what `proj` stamps), and a separate "RetentionClass" entry for `{durable, key-chain-durable, quarantined-ttl, evicted}` (byte-retention), explicitly noting the two axes are orthogonal.
- **Status:** Resolved — added a "Projection trust states" glossary entry (`trusted | pending | untrusted-anachronistic | untrusted-malformed | quarantined`, what `proj` stamps) and a separate "RetentionClass" entry (`{durable, key-chain-durable, quarantined-ttl, evicted}`, byte retention), each noting the two axes are orthogonal and that trust-`quarantined` ≠ retention-`quarantined-ttl`.

### D-03: No consolidated failure / error / conflict model; failure semantics scattered across 5+ docs

- **Category:** Architecture
- **Severity:** Major
- **Locations:** [README.md](./README.md) L33-L97 · [20-architecture-overview.md](./20-architecture-overview.md) L83 · [31-contextual-functionalities.md](./31-contextual-functionalities.md) L173-L181 · [32-knowledge-autoencoding.md](./32-knowledge-autoencoding.md) L109-L119
- **Evidence:**
  - `README.md` L33-L97: the "All documents, by cluster" table enumerates 24 docs across all clusters — there is NO failure-model / error-model / conflict-handling doc in any cluster.
  - `20-architecture-overview.md` L83: "No fallbacks (N5). Ambiguous merges surface as typed `kip:conflict` cells; unverifiable facts are rejected; non-conforming facts are quarantined (never dropped)." — three top-level failure classes in one sentence, no dedicated view.
  - `31-contextual-functionalities.md` L173: "### The five N5-safe step outcomes" — a per-subsystem failure table (success / dispatch failure / constraint-violation / pending guard / upstream stop).
  - `32-knowledge-autoencoding.md` L109: "### Per-iteration failure is treated as infinite loss (N5)" — a separate failure rule local to the autoencoding loop.
- **Why it is debt:** The system's whole correctness story is failure handling (N5 no-fallbacks, `kip:conflict`, quarantine, reject, dispatch-failure, exhausted, pin-incomplete), yet there is no single architectural view enumerating failure classes and their propagation. A reader must reconstruct the failure model from at least five docs.
- **Suggested fix:** Add a `27-failure-and-conflict-model.md` that enumerates the canonical outcome taxonomy once (reject-at-gate, proj-demotion/quarantine, `kip:conflict`, dispatch-failure, pending-guard, exhausted, pin-incomplete), shows how each propagates up the layers, and links each subsystem's local table back to it instead of re-deriving them.
- **Status:** Resolved — created `27-failure-and-conflict-model.md` (9-outcome taxonomy table + per-layer propagation mermaid + "where the per-subsystem tables live"); wired into README's Convergence cluster + reading order; back-linked 20 §3, 24 §6, 31 (five N5-safe step outcomes), 32 (per-iteration failure), 50 §0, and 30 to it instead of re-deriving. (Round-2 follow-up: 31's table was still a near-verbatim re-derivation of outcomes #4-#7; it has since been reduced to summarize-and-link — see D-23.)

### D-04: Layer-count model disagrees — overview says five strict layers, convergence core says two

- **Category:** Architecture
- **Severity:** Major
- **Locations:** [20-architecture-overview.md](./20-architecture-overview.md) L17-L19 · [24-synchronization-and-convergence.md](./24-synchronization-and-convergence.md) L15-L30
- **Evidence:**
  - `20-architecture-overview.md` L17-L19: "## 2. The layering ... kip is a strict stack. Each layer is a **pure consumer** of the layer beneath it" followed by five numbered subgraphs (① Git substrate … ⑤ Context-management layer).
  - `24-synchronization-and-convergence.md` L15: "The architecture is two layers:" followed by a mermaid with exactly two subgraphs SUB ("Substrate (converges by construction)") and PROJ ("Deterministic projection proj(S)").
- **Why it is debt:** The two load-bearing architecture docs present incompatible top-level decompositions (five strict layers vs two) with no reconciling note that the convergence core is a sub-view collapsing layers ①–②. A reader can't tell whether "the architecture" is 2 or 5 layers — exactly the kind of model mismatch that breeds inconsistent downstream reasoning.
- **Suggested fix:** In `24`, relabel the diagram, e.g. "The convergence core is two of the five layers (① substrate + ② deterministic projection from 20-architecture-overview)," so the two-layer view is explicitly a zoom-in on the five-layer stack, not a competing model.
- **Status:** Resolved — added a zoom-in note in `24` §0 (the 2-layer core is layers ①–② of the 5-layer stack in `20-architecture-overview.md#2-the-layering`, layers ③–⑤ sit above and re-enter only via INV-A1) and relabeled both subgraph titles to name their layer-①/② mapping; presented as a sub-view, not a competing model.

### D-05: `LearnOptions` TS interface copied verbatim into two docs — and already drifting

- **Category:** Redundancy
- **Severity:** Major
- **Locations:** [40-sdk-api-surface.md](./40-sdk-api-surface.md) L90-L105 · [32-knowledge-autoencoding.md](./32-knowledge-autoencoding.md) L97-L104
- **Evidence:**
  - `40-sdk-api-surface.md` L90-L105: `interface LearnOptions { threshold; maxIterations; maxWallMs; maxInvocations; asOf?; rawKind; encode; decode; learner; loss }` with a long multi-line JSDoc on `rawKind`/`encode`.
  - `32-knowledge-autoencoding.md` L97-L104: the same `interface LearnOptions { ... }` body but with terse one-line `//` comments.
- **Why it is debt:** The same normative TS interface is maintained in two files, and the two copies already carry DIFFERENT inline doc-comments (40 has a long JSDoc; 32 has terse one-liners), proving the copies are diverging. A field add/rename in one will silently leave the other stale.
- **Suggested fix:** Declare `LearnOptions` canonically in `40-sdk-api-surface.md` (the API-surface home). In `32` replace the duplicated TS block with a one-line link to the SDK API surface, keeping only the autoencoding-specific commentary.
- **Status:** Resolved — added `<a id="learnoptions">` at the canonical `40-sdk-api-surface.md` block; replaced the duplicated `interface LearnOptions` TS block in `32-knowledge-autoencoding.md` with a link to `40-sdk-api-surface.md#learnoptions` plus only the autoencoding-relevant points (`rawKind` threading, explicit `(name,version)` selection).

### D-06: §3.4 per-cell-type conflict-resolution table re-tabled for §5b cells in 32

- **Category:** Redundancy
- **Severity:** Major
- **Locations:** [22-git-substrate.md](./22-git-substrate.md) L182-L192 · [32-knowledge-autoencoding.md](./32-knowledge-autoencoding.md) L129-L135
- **Evidence:**
  - `22-git-substrate.md` L189 (canonical §3.4 row): "`kip:learn` (correction-class, §5b.2) | same accepted set ⇒ no-op (same CID, INV-7) | NON-commutative ⇒ `kip:conflict` for competing accepted sets at the same `(rawRef, ontologyAsOf, encode/decode/learner-manifest)` key. ... NEVER loss-tiebroken." (also owns `kip:learn-exhausted`, `microagent-registration`, `same_as` rows).
  - `32-knowledge-autoencoding.md` L131 (duplicated row): "`kip:learn` | `supersede`/correction-class, keyed on `(rawRef, ontologyAsOf, encode/decode/learner-manifest)` | Same key, different accepted `AssertInput[]` ⇒ `kip:conflict` (NON-commutative), never loss-tiebroken; resolved by a dominating `resolve`-scoped supersede."
- **Why it is debt:** `22` §3.4 is the canonical reducer/conflict-resolution table; `32` reproduces the same normative rows (`kip:learn`, `kip:learn-exhausted`, `microagent-registration`) as its own table. Two normative tables describing identical reducer behavior will drift (e.g. a change to `same_as`/`not_same_as` conflict keying must be edited in both).
- **Suggested fix:** Keep the full reducer/conflict table canonical in `22` §3.4. In `32`, replace the duplicated table (L129-L135) with a one-line summary plus a link to the §3.4 resolution table, retaining only the autoencoding-specific loss-exclusion note.
- **Status:** Resolved — canonical per-cell-type table kept in `22-git-substrate.md` §4.4 (the current home of the §3.4 resolution table, covering `kip:learn`/`kip:learn-exhausted`/`derived_from`/`same_as`/microagent-registration); replaced the duplicated table in `32-knowledge-autoencoding.md` with a one-sentence summary + link to `22-git-substrate.md#44-conflict-surfacing-no-fallback--the-per-cell-type-resolution-table`, retaining only the loss-exclusion note.

---

## Minor

### D-07: Glossary defines "SEC" but never expands the acronym

- **Category:** Definitions
- **Severity:** Minor
- **Locations:** [glossary.md](./glossary.md) L98-L101 · [README.md](./README.md) L26 · [11-non-functional-requirements.md](./11-non-functional-requirements.md) L35 · [24-synchronization-and-convergence.md](./24-synchronization-and-convergence.md) L119
- **Evidence:**
  - `glossary.md` L98: "**SEC** — The convergence guarantee: convergence = **set-convergence** ... **+ projection determinism**" (the three letters are never expanded).
  - `11-non-functional-requirements.md` L35: "**NFR-A4 — Strong Eventual Consistency (SEC).**" — the only place the acronym is spelled out.
- **Why it is debt:** SEC is the headline convergence guarantee referenced in nearly every doc; the glossary is positioned as the authoritative definition source yet defines SEC without telling the reader the acronym means Strong Eventual Consistency. (Downgraded from the auditor's "major": the expansion is one click away in adjacent docs, so it does not mislead an implementer.)
- **Suggested fix:** Change the glossary lemma to "**SEC (Strong Eventual Consistency)** — …" so the acronym is expanded at its authoritative definition site.
- **Status:** Resolved — glossary lemma expanded to "**SEC (Strong Eventual Consistency)**".

### D-08: "RRF" is load-bearing but has no glossary entry; introduced unexpanded in doc #1

- **Category:** Definitions
- **Severity:** Minor
- **Locations:** [glossary.md](./glossary.md) (absent) · [00-vision-and-scope.md](./00-vision-and-scope.md) L41 · [20-architecture-overview.md](./20-architecture-overview.md) L97 · [26-retrieval.md](./26-retrieval.md) L43 · [10-functional-requirements.md](./10-functional-requirements.md) L92
- **Evidence:**
  - `00-vision-and-scope.md` L41 (reading-order doc #1, unexpanded): "vector candidates → graph expansion → **RRF** fusion".
  - `26-retrieval.md` L43 (first expansion): "**Reciprocal Rank Fusion** `score(d) = Σ_r 1/(rrfK + rank_r(d))`".
  - `glossary.md`: no RRF / "Reciprocal Rank" entry exists.
- **Why it is debt:** The glossary promises "Authoritative definitions for every load-bearing term," yet RRF — the fusion step named in the retrieval pipeline across vision/architecture/retrieval/FR docs — is absent and is introduced unexpanded in the very first doc, defining the acronym only several docs later.
- **Suggested fix:** Add a glossary entry "**RRF (Reciprocal Rank Fusion)** — rank-only fusion `score(d) = Σ_r 1/(rrfK + rank_r(d))` over vector / graph-proximity / salience ranks (§5.1)" and expand RRF on first use in `00-vision-and-scope.md`.
- **Status:** Resolved — added an "**RRF (Reciprocal Rank Fusion)**" glossary entry with the `score(d) = Σ_r 1/(rrfK + rank_r(d))` formula, and expanded RRF to "Reciprocal Rank Fusion (RRF)" on its first use in `00-vision-and-scope.md` L41.

### D-09: Synonym/casing drift for the glossary lemma "PROJ-demotion"

- **Category:** Definitions
- **Severity:** Minor
- **Locations:** [glossary.md](./glossary.md) L80 · [20-architecture-overview.md](./20-architecture-overview.md) L94 · [11-non-functional-requirements.md](./11-non-functional-requirements.md) L47 · [10-functional-requirements.md](./10-functional-requirements.md) L59
- **Evidence:**
  - `glossary.md` L80: lemma "**PROJ-demotion**".
  - `20-architecture-overview.md` L94: "Hosts **all** PROJ-demotions" vs `11-non-functional-requirements.md` L47: "Trust as set-pure `proj`-demotion" vs `10-functional-requirements.md` L59: "are NOT gates but proj-time demotions".
- **Why it is debt:** The same defined concept is spelled "PROJ-demotion", "`proj`-demotion", and "proj-time demotion" across docs, so a text search on the glossary lemma misses most occurrences and the canonical term is unclear.
- **Suggested fix:** Pick one canonical spelling (e.g. "`proj`-demotion") in the glossary and normalize body docs to it, or add the variants as parenthetical aliases in the glossary entry.
- **Status:** Resolved — added the spelling variants as parenthetical aliases on the glossary lemma ("**PROJ-demotion** (also written **`proj`-demotion** / **proj-time demotion**)"), so a search on the lemma resolves the `proj`-demotion (11 L47) and proj-time demotion (10 L59) in-body uses.

### D-10: No end-to-end sequence diagram for any key flow

- **Category:** Architecture
- **Severity:** Minor
- **Locations:** [20-architecture-overview.md](./20-architecture-overview.md) L110-L126 · [32-knowledge-autoencoding.md](./32-knowledge-autoencoding.md) L20-L31 · [31-contextual-functionalities.md](./31-contextual-functionalities.md) L153-L167
- **Evidence:**
  - `20-architecture-overview.md` L110: the canonical write→recall path is a `flowchart LR` of boxes, not a sequence across actors.
  - A grep for `sequenceDiagram` across the docs dir returns zero matches — not one sequence diagram in the 24-doc set.
- **Why it is debt:** Every diagram is a flowchart or layer box diagram; none shows temporal ordering of interactions between orchestrator, microagents, the signature gate, `proj`, and the lazy `/heads` rebuild. For a coordinator-free, lazy-projection, INV-A1-orchestrated system the ordering of who-calls-whom-when is a load-bearing detail flowcharts elide. (Downgraded from the auditor's "major": this is a missing-enhancement gap, not debt that contradicts or misleads.)
- **Suggested fix:** Add one `sequenceDiagram` for the canonical write→commit→sync→proj→recall path and one for the active-layer dispatch (orchestrator → microagent → outputSchema validate → assertFact → proj → AnswerGraph read-back), making the INV-A1 "orchestrator is the only author" ordering explicit.
- **Status:** Resolved — added two mermaid `sequenceDiagram`s in `20-architecture-overview.md` §5a (write→commit→sync→lazy proj→recall) and §5b (active-layer dispatch with the INV-A1 orchestrator-only-author ordering); both validated; linked from `24` §0 and `31` execution section.

### D-11: Salience responsibility split across three layers/components without a single owning view

- **Category:** Architecture
- **Severity:** Minor
- **Locations:** [20-architecture-overview.md](./20-architecture-overview.md) L30-L34, L95-L98 · [26-retrieval.md](./26-retrieval.md) L104-L119
- **Evidence:**
  - `20-architecture-overview.md` L30: layer ② "graph adjacency + salience (fixed-weight, exact-algo)" AND L34: layer ③ "salience w/ floating/iterative centrality"; component map rows at L95/L97/L98 list salience three times.
  - `26-retrieval.md` L104: "Salience is a derived projection (never an authored property)" and L113-L119 splits it into deterministic exact-algo vs accelerator floating classes.
- **Why it is debt:** Salience is one concept whose layer membership is conditional (deterministic if exact-algo, accelerator if floating), but the docs scatter that single conditional rule across two layer subgraphs, three component-map rows, and the retrieval doc. A reader assembling "where does salience live" must merge four locations.
- **Suggested fix:** Give salience one owning section (in `26-retrieval`, its natural home) and have the architecture-overview layer diagram and component map reference it with a single cross-link instead of restating the deterministic/accelerator split.
- **Status:** Resolved — added a "Salience ownership (single owning view)" note in `26-retrieval` §5.4 (one concept, conditional layer-②/③ membership, where computed vs consumed); `20-architecture-overview` layer-③ note, the §5 determinism-boundary note, and the Retrieval component-map row now cross-link to `#54-salience-projection` instead of restating the split.

### D-12: Unbalanced doc decomposition — 30 (53 lines) is a stub while 81 (1261 lines) is ~23% of the set

- **Category:** Architecture
- **Severity:** Minor
- **Locations:** [30-active-knowledge-overview.md](./30-active-knowledge-overview.md) L1-L53 · [81-roadmap-epics-and-tasks.md](./81-roadmap-epics-and-tasks.md) L1 · [README.md](./README.md) L96
- **Evidence:**
  - `30-active-knowledge-overview.md` is 53 lines total and largely defers (L32: "The three subsystems are detailed in their own docs").
  - `81-roadmap-epics-and-tasks.md` is 1261 lines — the largest doc by ~4.6x (next largest, `70-decision-records-adr.md`, is 388).
- **Why it is debt:** An architecturally central view (the active-layer overview tying together the three §5b subsystems) is a 53-line stub, while a planning WBS is a 1261-line monolith. The overview under-serves its tie-it-together role and the WBS over-concentrates planning concerns that change at a different cadence than the architecture.
- **Suggested fix:** Expand `30` with the cross-cutting active-layer contracts shared by §5b.1–.3 (orchestrator-authoring lifecycle, asOf-reproducibility residual, typed-choice rule) currently re-explained in each of 31/32/33; and split `81` into per-milestone task files (or move the subtask WBS to a generated appendix).
- **Status:** Resolved — the `30` half: expanded `30-active-knowledge-overview.md` from a stub into a real overview ("How the three subsystems relate" + "Cross-cutting contracts": orchestrator-authoring lifecycle, asOf-reproducibility residual R5, typed-choice rule N5/INV-A7) with links to 31/32/33 and the failure model; faithful to §5b intro, no new claims. **The `81` half is now also done:** `81-roadmap-epics-and-tasks.md` is reduced to a short INDEX (legend, id scheme, full task-level dependency graph, and a per-milestone table of contents); the 76 tasks/193 subtasks are split into 11 per-milestone files kept alongside it in `docs/` (`81a-tasks-m0.md` … `81j-tasks-m9.md`, plus `81k-tasks-cross-cutting.md` for E11/E13), one per row of the [80 milestone → epic map](./80-roadmap-and-milestones.md#milestone--epic-map). Every `T#.#` "Depends on" link was audited: same-file dependencies stayed in-page, cross-file dependencies were rewritten to `./81x-tasks-*.md#T#.#`; the two stale `81-roadmap-epics-and-tasks.md#T12.1`/`#T13.3` references in `80-roadmap-and-milestones.md`, the `28-stack-integration.md` T1.x reference, and the `README.md` doc-map row were all updated to point at the new files. Verified with `node packages/kip-sdk/scripts/check-doc-links.mjs` (the D-14 CI link-checker) — 39 files, all relative links and anchors resolve.

### D-13: WBS legend promises per-id links, but every FR/NFR/INV link points to the file root

- **Category:** Completeness
- **Severity:** Minor
- **Locations:** [81-roadmap-epics-and-tasks.md](./81-roadmap-epics-and-tasks.md) L22-L23, L286, L347 · [10-functional-requirements.md](./10-functional-requirements.md) (no `<a id>` anchors) · [11-non-functional-requirements.md](./11-non-functional-requirements.md) · [60-conformance-and-testability.md](./60-conformance-and-testability.md)
- **Evidence:**
  - `81` L22: "**Implements:** ... **FR-\*** (linked to [./10-functional-requirements.md])".
  - `81` L286 (actual per-task link, no `#anchor`): "**Implements:** [FR-D4](./10-functional-requirements.md#fr-d4) · [NFR-A1](./11-non-functional-requirements.md#nfr-a1)".
  - `10/11/60` contain 0 `<a id=...>` anchors and define FR/NFR/INV ids as bold inline labels, so there is no `#fr-d4` / `#nfr-a1` / `#inv-7` slug to target.
- **Why it is debt:** The legend states each id is "linked to" its requirement, but the hundreds of per-task FR/NFR/INV links resolve only to the top of a long doc — the promised id-level traceability navigation is not delivered.
- **Suggested fix:** Either add explicit `<a id="fr-d4">` anchors (or `### FR-D4` headings) in 10/11/60 and point each `81` link at `...md#fr-d4`, or soften the legend wording from "linked to [the requirement]" to "links to the requirements doc."
- **Status:** Resolved — softened the `81` legend (faithful minimal fix): the Implements/Exit-criteria bullets now state the id text names the exact FR/NFR/INV while the link resolves to the requirements **doc** (10/11/60 carry no per-id `#anchor` slugs; ids are bold inline labels), so no per-id deep link is promised. **Update (round-3 pass) — upgraded to the full fix:** per-id `<a id="fr-a1">`-style anchors were added to every FR/NFR/INV bold label in 10/11/60, all FR/NFR/INV links across the doc set now deep-link to those anchors, the `81` legend was restored to promise (and deliver) id-level traceability, and the links are machine-checked in CI (see D-14 update).

### D-14: All 76 in-page task dependency links rely on hand-authored `<a id="T#.#">` tags

- **Category:** Completeness
- **Severity:** Minor
- **Locations:** [81-roadmap-epics-and-tasks.md](./81-roadmap-epics-and-tasks.md) L24, L282, L300
- **Evidence:**
  - `81` L282 (anchor definition): `### <a id="T1.1"></a>T1.1 Object & ref layout + frozen manifest`.
  - `81` L300 (dependency link): "**Depends on:** [T1.1](#T1.1)".
- **Why it is debt:** Every `[T#.#](#T#.#)` dependency link resolves ONLY through the explicit `<a id="T#.#">` tag — not through the heading's auto-generated slug. Any future edit that drops or mistypes one `<a id>` silently breaks the link with no build-time check. All 76 are currently intact, but the convention is undocumented and brittle.
- **Suggested fix:** Document the `<a id="T#.#">` anchor convention near the legend (L24), and/or add a CI link-check (markdown-link-check / remark-validate-links) over `packages/kip-sdk/docs` so a dropped anchor or mistyped id fails the build.
- **Status:** Resolved — added a maintenance `[!NOTE]` to the `81` legend documenting that `[T#.#](#T#.#)` links resolve through hand-authored `<a id="T#.#">` tags (not heading slugs), that a dropped/mistyped anchor breaks silently with no build error, that contributors MUST verify task-anchor links by hand when editing, and naming a CI link-checker (markdown-link-check / remark-validate-links over `packages/kip-sdk/docs`) as the documented mitigation. **Update (round-3 pass) — the named mitigation is now WIRED:** `.github/workflows/kip-docs-link-check.yml` runs `packages/kip-sdk/scripts/check-doc-links.mjs` over `packages/kip-sdk/{SPEC.md,docs/**}` on every PR/push touching the package, failing the build on any dangling relative link or missing anchor (task anchors and the new per-id FR/NFR/INV anchors included); the `81` note was updated accordingly.

### D-15: `orderKey` field ordering restated in 5+ places instead of linking the canonical definition

- **Category:** Redundancy
- **Severity:** Minor
- **Locations:** [22-git-substrate.md](./22-git-substrate.md) L144-L150 · [24-synchronization-and-convergence.md](./24-synchronization-and-convergence.md) L47-L53 · [80-roadmap-and-milestones.md](./80-roadmap-and-milestones.md) L83 · [81-roadmap-epics-and-tasks.md](./81-roadmap-epics-and-tasks.md) L363 · [glossary.md](./glossary.md) L36-L38
- **Evidence:**
  - `22-git-substrate.md` L144-L149 (CANONICAL type): `type OrderKey = readonly [ validFrom, hlcWall, hlcCounter, replicaId, publicKeyFingerprint, factCID ];`
  - `24-synchronization-and-convergence.md` L50: `validFrom → wall → counter → replicaId → publicKeyFingerprint → factCID` (labelled "invariant, carry this exactly").
  - `80` L83 and `81` L363 re-spell the same tuple.
- **Why it is debt:** The exact field tuple of `orderKey` is re-spelled in 24, 80, 81, and the glossary; if the tuple ever changes, every copy must be hand-updated. 24 even labels its copy "carry this exactly" — a maintenance burden it imposes on itself rather than linking.
- **Suggested fix:** Treat the `OrderKey` type in `22-git-substrate.md` §3.4 as the single source. Elsewhere reference it by link and quote at most the ordered field names with "see [orderKey](./22-git-substrate.md)" rather than re-asserting the full tuple as normative.
- **Status:** Resolved — added `<a id="orderkey">` at the canonical `OrderKey` type in `22-git-substrate.md`; the restatements in `24` §1.1, `80`, and `81` (T2.1) now link to `22-git-substrate.md#orderkey` instead of re-spelling the tuple. (Glossary `orderKey` entry describes but does not re-spell the tuple — left as-is.)

### D-16: The valid-time `retract` split example copied across three docs

- **Category:** Redundancy
- **Severity:** Minor
- **Locations:** [21-data-model.md](./21-data-model.md) L68 · [22-git-substrate.md](./22-git-substrate.md) L175 · [24-synchronization-and-convergence.md](./24-synchronization-and-convergence.md) L175
- **Evidence:**
  - `21-data-model.md` L68: "A `retract` of the middle of `[0,20)` *splits* into `value [0,5)` · `unknown [5,10)` · `value [10,20)` — not a 'partition with a hole' (M-9)."
  - `22-git-substrate.md` L175 and `24-synchronization-and-convergence.md` L175 repeat the same numbers and "partition with a hole" phrasing.
- **Why it is debt:** The same concrete interval-geometry example (same numbers, same phrasing) is the normative illustration of M-9 in three docs. A change to gap semantics would need editing in all three and they can disagree on the exact endpoints.
- **Suggested fix:** Pick one canonical home (`21-data-model.md` §2 owns the cell/segment model). `22` and `24` should state the rule in one sentence and link to the cell+segment model for the worked `[0,20)` example.
- **Status:** Resolved — added `<a id="retract-split-example">` at the canonical worked example in `21-data-model.md` §2; replaced the duplicated `[0,20)` example in `22-git-substrate.md` (M-9) with a one-sentence rule + link to `21-data-model.md#retract-split-example`. (The `24` copy had already been removed by a prior fix; only 21 and 22 remained.)

### D-17: Thesis one-liner duplicated verbatim in 00 and 20, neither linking the other

- **Category:** Redundancy
- **Severity:** Minor
- **Locations:** [00-vision-and-scope.md](./00-vision-and-scope.md) L14-L17 · [20-architecture-overview.md](./20-architecture-overview.md) L11
- **Evidence:**
  - `00-vision-and-scope.md` L14-L17 and `20-architecture-overview.md` L11 contain the identical thesis sentence ("kip is a git-substrate, bitemporal, signed-fact property-graph memory whose unit of synchronization is an append-only signed temporal fact, …"), both citing §1, neither cross-linking.
- **Why it is debt:** Identical normative thesis sentence maintained in two docs; an edit to the thesis wording leaves one copy stale.
- **Suggested fix:** Let `00-vision-and-scope.md` be the canonical home of the thesis. `20-architecture-overview.md` §1 should quote it with an explicit link, or both should simply quote SPEC §1 with a note that SPEC is canonical.
- **Status:** Resolved — added `<a id="thesis">` at the canonical thesis in `00-vision-and-scope.md`; `20-architecture-overview.md` §1 now references it via `00-vision-and-scope.md#thesis` (paraphrased one-liner) instead of repeating the blockquote verbatim.

### D-18: Roadmap docs 80/81 re-prose normative requirement/spec text instead of linking

- **Category:** Redundancy
- **Severity:** Minor
- **Locations:** [80-roadmap-and-milestones.md](./80-roadmap-and-milestones.md) L66, L181 · [81-roadmap-epics-and-tasks.md](./81-roadmap-epics-and-tasks.md) L309, L806 · [10-functional-requirements.md](./10-functional-requirements.md) L261-L264
- **Evidence:**
  - `80` L66: "The INGEST-GATE (§3.2): Ed25519 verify over the canonical payload — the sole membership predicate. No drift / key-registration / namespace / revocation / schema gate." vs canonical `22-git-substrate.md` L88-L93.
  - `81` L309: "admit a fact iff well-formed and its Ed25519 signature verifies over the canonical payload, with no drift/key-registration/namespace/revocation/schema gate." (third restatement of the signature-only-gate sentence).
  - `81` L806 re-states the FR-J1 / §5b.2 disjunctive budget.
- **Why it is debt:** `80`/`81` are explicitly "DERIVED PLANNING VIEW … introduces no new scope," yet they re-state the normative content of the gate (§3.2) and the disjunctive budget (§5b.2/FR-J1) as full sentences. Any spec change forces a triple edit and risks the planning docs asserting a stale guarantee. (Most of 80/81 correctly uses `Implements:` links; this targets only the re-prosed spots.)
- **Suggested fix:** Where `80`/`81` restate a normative sentence, shorten to the capability name + the existing `Implements:`/§ link (e.g. "signature-only ingest gate — see [§3.2](./22-git-substrate.md)") so the canonical doc remains the only place the rule is spelled out.
- **Status:** Resolved — shortened the re-prosed normative text to capability-name + link: the signature-only gate sentence in `80` and `81` (T1.3) now links to `22-git-substrate.md` §3.2 (+ the FR group A admission rule in `10`); the disjunctive-budget sentence in `80` and `81` (T7.2) now links to FR-J1 (`10`) / §5b.2 (`32`) instead of re-spelling it. No timeline introduced.

### D-19: INV invariant glosses expanded inline in 24 §7 and 80, duplicating the canonical INV bodies in 60

- **Category:** Redundancy
- **Severity:** Minor
- **Locations:** [60-conformance-and-testability.md](./60-conformance-and-testability.md) L36, L77, L93 · [24-synchronization-and-convergence.md](./24-synchronization-and-convergence.md) L210-L216 · [80-roadmap-and-milestones.md](./80-roadmap-and-milestones.md) L94, L113, L133, L229
- **Evidence:**
  - `60-conformance-and-testability.md` L36 (CANONICAL INV-1): "INV-1 — proj determinism + replica-local-input independence. Asserts: …"
  - `24-synchronization-and-convergence.md` L210-L216 restates the INV one-liners ("INV-3 — reducer determinism + `orderKey` totality.", etc.).
  - `80-roadmap-and-milestones.md` L94: parenthetical INV glosses duplicating 60's titles.
- **Why it is debt:** `60` is the canonical INV catalog; `24` §7 and `80`'s exit-criteria re-spell each INV's gloss. These short glosses are the part most likely to drift if an invariant's scope is tightened.
- **Suggested fix:** Keep INV titles/bodies canonical in `60`. In `24` §7 and `80`'s exit-criteria, list bare INV ids as links without re-glossing, or quote the 60 title verbatim with a link.
- **Status:** Resolved — INV titles/bodies kept canonical in `60`; `24` §7 now lists the INV ids bare (one sentence, no per-INV gloss) and `80`'s exit-criteria lines (M0/M1/M2/M3/M4/M8) now list bare `[INV-n](./60-conformance-and-testability.md)` links without the duplicated parenthetical glosses. No timeline introduced. **Update (round-3 pass):** the fix originally skipped M5/M6/M7 (their exit lines still re-glossed each INV-A\* body as plain bold text); those three lines are now converted to bare linked ids as well, completing the D-19 treatment across all milestones. (Where `80` now annotates a *sub-invariant scoping* — e.g. "INV-4a … the full INV-4 gates M2" — that is milestone-scope information owned by 80, not a re-gloss of 60's canonical body.)

### D-20: git-substrate §1.2 layout block collapses four named manifest retention caps to a generic "retention caps"

- **Category:** Faithfulness
- **Severity:** Minor
- **Locations:** [22-git-substrate.md](./22-git-substrate.md) L34 · [SPEC.md](../SPEC.md) L435
- **Evidence:**
  - `22-git-substrate.md` L34: "/manifest.json … ε_causal, regenBoundaryRule, retention caps — IMMUTABLE post-genesis (m2-5)".
  - `SPEC.md` L435: "/manifest.json … quarantineTtlMs + quarantineKeyCapBytes + quarantinePoolBytes (per-key + GLOBAL aggregate retention bounds, §3.5a/m5-1) + keyChainDurableCapBytes (per-registered-key chain cap, §3.5a/M6-1) — IMMUTABLE post-genesis (m2-5)".
- **Why it is debt:** The SPEC's manifest layout comment is normative about WHICH genesis-immutable retention parameters exist (the per-key + GLOBAL-aggregate split is exactly the load-bearing m5-1/M6-1 fix). The doc's layout block flattens all four to "retention caps," losing the per-key-vs-aggregate distinction at the point a reader inspects the manifest contract. Mitigated: §6.2 of the same doc names all four individually in prose.
- **Suggested fix:** Expand L34's "retention caps" to the spec's enumerated list (e.g. "+ quarantineTtlMs/quarantineKeyCapBytes/quarantinePoolBytes (per-key + global, m5-1) + keyChainDurableCapBytes (M6-1)") so the layout block matches SPEC §3.1 L435.
- **Status:** Resolved — expanded `22-git-substrate.md` §1.2 layout block from "retention caps" to the four named caps: `quarantineTtlMs + quarantineKeyCapBytes + quarantinePoolBytes` (per-key + GLOBAL-aggregate, m5-1) + `keyChainDurableCapBytes` (per-registered-key chain cap, M6-1), matching SPEC §3.1.

### D-21: convergence §0 intro asserts unconditional byte-identity before the per-shared-subset corollary qualifies it

- **Category:** Faithfulness
- **Severity:** Minor
- **Locations:** [24-synchronization-and-convergence.md](./24-synchronization-and-convergence.md) L13 · [SPEC.md](../SPEC.md) L1526-L1542
- **Evidence:**
  - `24-synchronization-and-convergence.md` L13: "two replicas that have exchanged the same facts compute the **same bytes** … This document states that guarantee exactly and MUST NOT be read as softening it."
  - `SPEC.md` L1526-L1531 (the corollary it precedes): "SEC is then stated **per-shared-subset**: for any two replicas A and B, on the INTERSECTION `S_A ∩ S_B` … AND restricted to cells whose covering keys are chain-complete on both, `proj` agrees".
- **Why it is debt:** Under admission-control/partial replication, "exchanged the same facts" does NOT generally yield "the same bytes" — the SPEC deliberately relaxes full-universe byte-identity to per-shared-subset (M5-1 explicitly retracts the stronger wording). The intro's unconditional "the same bytes" + "MUST NOT be read as softening it" overstates the guarantee relative to the corollary. Mitigated: §4.1–4.3 of the same doc state the per-shared-subset relaxation precisely.
- **Suggested fix:** Qualify the §0 sentence, e.g. "compute the same bytes for the facts they both hold (per-shared-subset under partial replication, §4.2)," so the motivating line does not read as a stronger-than-spec full-universe guarantee.
- **Status:** Resolved — qualified the `24` §0 intro: it now states replicas compute the same bytes "for the facts they both hold," names the per-shared-subset SEC corollary (§4.2) as the actual guarantee under partial replication, and only then says the doc states it exactly / MUST NOT be read as softening — so the qualifier precedes the strong wording.

---

## Verification note

All 22 candidate findings produced by the six auditors were opened at their cited file:line and checked
for (a) quote accuracy and (b) whether they actually constitute the claimed debt. **21 were substantiated
and kept; 1 was dropped.**

- **Dropped — FAIT-3** ("conformance doc header line-range `§8.4 (3119–3449)` overshoots the section"):
  on close read this is not real debt. The cited cross-reference points to the correct section (§8.4) and
  the correct start line (3119); the upper bound (3449) reaches the blank separator line just before §9
  rather than §8.4's last content line (3446). The auditor itself notes "no reader is misdirected to wrong
  content." A line-range whose upper bound lands on the section boundary is not a misquote or a misleading
  reference — it does not constitute documentation debt.

No new findings were invented. Two auditor severities were adjusted downward during prioritization
(DEFI-2/D-07 SEC-expansion and ARCH-2/D-10 sequence-diagram: both are enhancement/polish gaps that do not
mislead an implementer, so they are recorded as Minor rather than the auditors' Major). No cross-dimension
duplicates were found requiring a merge; each kept finding describes a distinct underlying debt.

---

## Audit round 2 — new docs (27, 28) + integrity

> Second pass targeting the two docs added since round 1 — `27-failure-and-conflict-model.md` and
> `28-stack-integration.md` — plus a deterministic link-integrity scan. Each finding was opened at its
> cited file:line (and, for 28, against the real genty-platform source) and confirmed before fixing.

### Summary

| Source | Findings | Substantiated | Dropped |
|---|---|---|---|
| Integrity scan (dangling links/anchors) | 0 | 0 | 0 |
| Faithfulness | 2 | 2 | 0 |
| Definitions / redundancy (defredund) | 3 | 3 | 0 |
| **Total** | **5** | **5** | **0** |

| Severity | Count |
|---|---|
| Critical | 1 |
| Major | 1 |
| Minor | 3 |

The integrity report (`.a5c/tmp-newdocs-audit/integrity.json`) scanned 27 files and found **0 dangling
links/anchors** — the doc package is link-clean, nothing to fix there.

### D-22: 27 §2 over-claims `pending` / `pin-incomplete` is byte-identical-across-replicas (the SEC guarantee)

- **Category:** Faithfulness
- **Severity:** Critical
- **Locations:** [27-failure-and-conflict-model.md](./27-failure-and-conflict-model.md) L66 (claim) · L38 (row #9 trigger) · [24-synchronization-and-convergence.md](./24-synchronization-and-convergence.md) L125 · [SPEC.md](../SPEC.md) §4b.4 (L807)
- **Evidence:**
  - `27` L66 (before): "Layer ② (`proj`) owns the *set-pure* outcomes: proj-demotion/quarantine, `kip:conflict`, and pending/pin-incomplete. **All three are pure functions of the admitted set, so they are byte-identical across replicas (the SEC guarantee)** and re-evaluate monotonically as facts arrive."
  - `27` L38 (its own row #9 trigger): pending/pin-incomplete fires when "a read/pin resolves against a sub-frontier the replica has **not** fully received, **or** a per-key trust chain has a `(wall,counter)` gap (chain-incomplete)" — i.e. a function of *what a given replica holds*, not of the universal admitted set.
  - `24` L125: "wherever a replica's held subset is *not* complete for a covering key, that cell projects **`pending`** on that replica — never a divergent trusted value … **Divergence is surfaced as `pending`, never as two different trusted heads.**"
  - `SPEC.md` §4b.4 (L807): "a replica that has evicted part of `K`'s chain simply reads dependent facts `pending`, never a divergent trusted value."
- **Why it is debt:** `pending`/`pin-incomplete` is precisely the **per-replica divergence-absorber** — one replica reads `pending` while another holding the complete chain reads the trusted value, converging once their admitted sets equalize. Lumping it with proj-demotion/`kip:conflict` and asserting all three are "byte-identical across replicas (the SEC guarantee)" contradicts 27's own row-#9 trigger and the convergence core (24 §4.2/§4.6, SPEC §4b.4), which deliberately relaxes full-universe byte-identity to per-shared-subset. The doc's Source header (L7) says "Synthesis — introduces no new claims," yet this is a new claim contradicting its cited §4b.4 (and is the same over-statement round-1 D-21 fixed in 24 §0).
- **Suggested fix:** Split the L66 sentence: keep proj-demotion/quarantine and `kip:conflict` as "byte-identical for equal admitted sets," and state pending/pin-incomplete separately as the per-shared-subset, chain-completeness outcome — the explicit per-replica divergence-absorber ("surfaced as `pending`, never two different trusted heads"), byte-identical only on the shared complete-durable subset (24 §4.2), NOT attributed to the full-universe SEC guarantee.
- **Status:** Resolved — rewrote `27` §2 L66 into a split bullet: proj-demotion/quarantine and `kip:conflict` are "byte-identical for equal admitted sets"; pending/pin-incomplete is described (per its row-#9 trigger) as the per-replica divergence-absorber that is a function of what a replica currently holds, byte-identical only on the shared complete-durable subset (24 §4.2), surfaced as `pending` and never two divergent trusted heads (§4b.4). The convergence core (§3.2/§3.4/§4b.4) was not edited.

### D-23: 31's "five N5-safe step outcomes" table duplicates 27's failure taxonomy (#4–#7) near-verbatim instead of summarize-and-link

- **Category:** Redundancy
- **Severity:** Major
- **Locations:** [31-contextual-functionalities.md](./31-contextual-functionalities.md) L175-L185 · [27-failure-and-conflict-model.md](./27-failure-and-conflict-model.md) L33-L36 · [DEBTS.md](./DEBTS.md) D-03
- **Evidence:**
  - `27` L33 (#4) and `31` L182 carry the same dispatch-failure triple ("non-zero `exitCode`, `outputSchema`-validation failure, **or** timeout … all three identical → emit no fact, cell stays `Unknown`, fabricated output is the banned fallback N5"); `27` L34 (#5) and `31` L183 carry the same constraint-violation trigger/effect; #6/#7 likewise.
  - `31` L177 added the back-link to 27 but L179-L185 STILL kept the full normative trigger/effect table for outcomes #4-#7.
  - Contrast `32` L102 (the model 31 should follow): a one-line callout + link to 27's canonical taxonomy, not a re-tabling.
- **Why it is debt:** 27 declares itself the single canonical home for the outcome taxonomy (L3-L8, L73-L75). Two normative tables for identical behavior will drift (the dispatch-failure triple or the constraint-violation effect must now be edited in both). This is exactly the re-derivation D-03 intended to remove; D-03 back-linked 31 but did not REDUCE it, so its resolution was partial (unlike 32, which was reduced to a callout).
- **Suggested fix:** Reduce 31's "five N5-safe step outcomes" table to a one-line summary + the existing link to 27's canonical taxonomy (outcomes #4-#7), keeping only genuinely §5b.1-local detail (the "validates the known instance itself" nuance, the provenance-only difference for pending-guard, the intermediates-survive note for upstream-stop, INV-A3/INV-A7), mirroring how 32 was resolved.
- **Status:** Resolved — replaced 31's "five N5-safe step outcomes" table with a blockquote pointing at 27's canonical taxonomy (`#1-the-canonical-outcome-taxonomy`, outcomes #4-#7) plus a single paragraph carrying only the §5b.1-local specifics (constraint-violation validates the known instance itself; pending-guard differs only in provenance; upstream-stop leaves step-`i−1` intermediates committed while `runContextualQuery` returns an empty-`result` `AnswerGraph`; mechanizes INV-A3/INV-A7). No normative trigger/effect rows are re-derived. D-03's partial resolution is now completed.

### D-24: `AnswerGraph` used normatively in 27 but undefined in glossary (defined only in 31, which 27 precedes in reading order)

- **Category:** Definitions
- **Severity:** Minor
- **Locations:** [27-failure-and-conflict-model.md](./27-failure-and-conflict-model.md) L21, L36 · [glossary.md](./glossary.md) (absent) · [31-contextual-functionalities.md](./31-contextual-functionalities.md) (definition) · [README.md](./README.md) L113-L125 (reading order)
- **Evidence:**
  - `27` L21: "A failure is always *observable* — … an empty `AnswerGraph`, or a `pending`/`pin-incomplete` status." and L36 (#7 upstream-stop): "`runContextualQuery` returns an `AnswerGraph` with `result = []`."
  - `31` is where `AnswerGraph` is actually declared (`interface AnswerGraph`) and L187 ("the union of those `derived_from` facts, read back via `proj`, **is** the `AnswerGraph`, INV-A8").
  - `glossary.md` had no `AnswerGraph` entry; README's reading order places 27 (step 8) two steps before 31 (step 10).
- **Why it is debt:** `AnswerGraph` is load-bearing in 27's taxonomy (the surfaced outcome of upstream-stop) yet was undefined on first use there, absent from the glossary, and read before its defining doc per README's own order. (`AcquisitionResult` has the same glossary gap but 28 links it to its home doc 33, so only the 27/`AnswerGraph` case is a genuine first-use-undefined gap.)
- **Suggested fix:** Add an `AnswerGraph` glossary entry (the `derived_from` subgraph read back via `proj`; the result of `runContextualQuery`, empty `result=[]` on upstream-stop; §5b.1/INV-A8) or add an inline link in 27 to its definition in 31.
- **Status:** Resolved — added an `AnswerGraph` entry to the glossary's *Active knowledge (§5b)* section (after "Query graph / Segment match"): defined as the union of `derived_from` facts read back via `proj` (INV-A8), the result of `runContextualQuery`, empty `result=[]` on upstream-stop (links 27's outcome #7), declared in 31 §5b.1.

### D-25: 28's genty `OrchestrationProvider` / `JournalProvider` / `OrchestrationRegistry` seam missing from the glossary cross-stack section

- **Category:** Definitions
- **Severity:** Minor
- **Locations:** [28-stack-integration.md](./28-stack-integration.md) L198-L213, L573 (cross-links) · [glossary.md](./glossary.md) cross-stack section
- **Evidence:**
  - `28` L198-L206 leans on `OrchestrationProvider`/`JournalProvider` as "the **pluggable backend seam** … without importing babysitter-sdk," and L207-L213 on `OrchestrationRegistry` (explicitly compared to N5's no-auto-pick posture) as a GROUNDED-NEW integration surface.
  - `glossary.md` cross-stack section (the `MicroagentManifest (genty-core)` entry) named only `MicroagentDispatcher`/`createMicroagentSystem`; it did NOT mention the provider/registry seam.
  - `28` L573 cross-link advertised the glossary as the home for cross-stack terms but did not list these symbols.
- **Why it is debt:** 28 relies on the provider/registry seam as a normative GROUNDED-NEW integration surface, but the glossary's cross-stack section (the README-advertised home for cross-stack terms) never listed these symbols, so a reader could not resolve them from the glossary.
- **Suggested fix:** Add a glossary cross-stack entry naming `OrchestrationProvider`/`JournalProvider`/`OrchestrationRegistry` (genty-platform pluggable-backend seam) citing `platform/src/orchestration/interfaces.ts` / `registry.ts`.
- **Status:** Resolved — added a sibling cross-stack glossary entry "`OrchestrationProvider` / `JournalProvider` / `OrchestrationRegistry` (genty-platform)" citing `interfaces.ts:89/:137` and `registry.ts:58` with the corrected registry semantics (see D-26), and extended 28's glossary cross-link to enumerate the three symbols.

### D-26: 28 mis-states the `OrchestrationRegistry` duplicate-resolution rule as "first registered wins among duplicates"

- **Category:** Faithfulness
- **Severity:** Minor
- **Locations:** [28-stack-integration.md](./28-stack-integration.md) L207-L213 · [packages/genty/platform/src/orchestration/registry.ts](../../genty/platform/src/orchestration/registry.ts) L91-L93 (register), L95-L116 (get)
- **Evidence:**
  - `28` (before): "`OrchestrationRegistry` … named provider maps where **first registered wins among duplicates** and an unregistered named type throws (no fallback)".
  - `registry.ts` L91-L93: `register(name, provider) { this.providers.set(name, provider); }` — a `Map.set`, so a duplicate **NAME overwrites** (last-write-wins for the same name).
  - `registry.ts` L98-L99: `get(name)` throws when the name is unregistered (no fallback) — the unregistered-throws half is correct.
  - `registry.ts` L107-L108: `get()` with **no name** returns the **first-inserted** provider (`this.providers.values().next()`) — across DISTINCT names, not same-name dedup. (The class JSDoc at L81 calling this "insertion-order first-wins" is itself loose; the `register` body is the ground truth.)
- **Why it is debt:** 28 presents component code as ground truth ("Every type/path below was read in those packages"), so a code-faithfulness error matters. `register` is `Map.set` (last-write-wins on duplicate name) — the opposite of "first registered wins among duplicates." The only first-wins behavior is `get()` with no name returning the first-inserted entry among different names. The mischaracterization also weakened the paragraph's N5-contrast point.
- **Suggested fix:** Reword to match the code: `get(name)` throws for an unregistered name (no fallback, L99); `get()` with no name returns the first-inserted provider among distinct names (L107); a duplicate registration under the SAME name overwrites (last-write-wins, L92). Keep the N5-contrast note.
- **Status:** Resolved — reworded `28` L207-L213 to the code-faithful semantics (throws on unregistered name L99; no-name returns first-inserted among distinct names L107; same-name re-register overwrites via `Map.set`, last-write-wins L92) and adjusted the N5-contrast to reference the no-name first-of-many defaulting. The same corrected semantics are carried in the new glossary entry (D-25).

### Verification note (round 2)

All 5 candidate findings (2 faithfulness + 3 defredund) were opened at their cited file:line — and, for
the genty integration findings, against the real `packages/genty/platform/src/orchestration/registry.ts`
and `interfaces.ts` — and confirmed. **5 substantiated, 0 dropped.** The integrity scan reported 0 dangling
references, so no link/anchor fixes were required. The convergence core (§3.2/§3.4/§4b.4), the timeline-free
roadmap, and INV-A1/N5 were preserved; all fixes are summarize-and-link or faithful corrections to real
package symbols (no invented APIs).

---

## Audit round 3 — m7-1..m7-18 seq-chain hardening, M0-seam/ingest() fixes, and this pass's findings

> Third pass, consolidating what previously lived only as inline "Update (round-3 pass)" notes on
> D-13/D-14/D-19, plus a new adversarial spec/docs convergence sweep across the full doc set (30 items,
> spanning integration citation drift, a security gap in fork-recovery excision, SDK-ergonomics gaps in
> the authoring surface, and a glossary/terminology sweep). The convergence core (§3.2 gate, §3.4 `proj`,
> §4b.4 SEC) was touched only for one narrow, explicitly-scoped disambiguation (the `Repo.ingest()` vs
> the internal §3.2 six-step procedure — one procedure, two entry points, not two things sharing a name).

**What changed in this round, summarized:**

1. **The m7-1..m7-18 seq-chain hardening pass** (reflected inline via the D-13/D-14/D-19 "Update
   (round-3 pass)" notes below): per-id `<a id="fr-a1">`-style anchors added to every FR/NFR/INV bold
   label across 10/11/60 with CI link-checking wired (`.github/workflows/kip-docs-link-check.yml` →
   `scripts/check-doc-links.mjs`); the `(wall,counter)` legacy phrasing was normatively redefined to the
   `seq` per-`(replicaId,key)` chain-contiguity witness (§4b.1/m7-1) and swept across the doc set (this
   round's item 22 continues that sweep into 11/50/70/prior-art/glossary).
2. **M0-seam / `ingest()` fixes:** the gate-observable `Repo.ingest(f)` seam (B-2, INV-6a/INV-13a) was
   added and is now explicitly disambiguated from the §3.2 internal six-step write-through procedure —
   one procedure, two entry points (direct already-signed-fact entry via `ingest()`, or construct+sign
   entry via `assertFact`/`retractFact`).
3. **This round's findings** (30 items; see the parent conversation / commit history for the full list):
   integration-doc citation drift fixes (`28-stack-integration.md`'s stale `../SPEC.md` line numbers and
   the nonexistent `canonical-form.ts` citation), the `rxFrom`-keyed salience contradiction in
   `26-retrieval.md`, a new **excise-evidence** authorization safeguard for fork-recovery excision (R11)
   closing a self-evidence-destruction gap, SDK-ergonomics widening (`assertFact`/`retractFact` echo
   back `id`/`hlc`/`seq`; `supersedeFact`/`reAttestFact` added to `Repo`/`Tx`), and a glossary/terminology
   consolidation pass (`KipError`, `promisor`, `Frontier.chainSeq`, `Fork demotion` entries).

| Area | Status |
|---|---|
| Citation/faithfulness drift (integration docs) | Fixed |
| `rxFrom` salience contradiction (retrieval) | Fixed |
| Fork-recovery excision evidence-destruction gap (security) | Fixed (new `excise-evidence` capability) |
| SDK authoring-surface ergonomics (assertFact/retractFact/supersedeFact/reAttestFact) | Fixed |
| `ingest()` vs §3.2 procedure disambiguation | Fixed (one narrow SPEC.md §3.2 note) |
| Glossary/terminology sweep (`(wall,counter)` → `seq`, new entries) | Fixed |
| Convergence core (§3.2/§3.4/§4b.4) | Untouched beyond the one scoped disambiguation line |

---

## Audit round 4 — implementation-era debt surfaced during Phase D (M0-M3 TDD build)

> This register was originally scoped to **documentation** debt only (see header). Phase D's TDD build of
> M0-M3 (see `reviews/build-final-report.md`) surfaced genuine **implementation** debt — real, honest gaps
> between the shipped `packages/kip-sdk/src/*.ts` and the spec/ADR target state, each accepted rather than
> blocking because it does not compromise a safety guarantee. Logged here (not duplicated from rounds 1-3,
> which cover docs only) so it is tracked alongside its documentation-debt siblings rather than only living
> in code comments. Each entry names the milestone/round that surfaced it and was verified against the
actual current source before being recorded.

### D-27: INV-12 byte-identical regenerated-commit-DAG regeneration is unverified — the substrate git commit/tree/ref layer is a pre-M3 stub

- **Category:** Implementation / substrate
- **Severity:** Major
- **Surfaced:** M3, all 4 formal rounds (carried as an `it.skip` untestable item in every round's acceptance) and confirmed unresolved by the round-5 out-of-band closing pass, which fixed the excision-authorization findings but did not touch this residual.
- **Location:** `packages/kip-sdk/src/substrate.ts` (loose-object writes per ADR-B1's M0 implementation note); `packages/kip-sdk/src/__tests__/conformance/inv-12*.test.ts` (`it.skip`).
- **Evidence:** ADR-B1 records that `substrate.ts` currently hand-rolls loose-object writes (`zlib.deflateSync` + `node:crypto` hashing) INSTEAD OF isomorphic-git, because installing the dependency was blocked by ADR-B6's zero-new-runtime-dependency policy for M0-M3. INV-12 (byte-identical regenerated commit-DAG + cross-OS/TZ byte recipe) has no public `Repo` seam to inspect raw regenerated commit-DAG objects/bytes (`fsck`/`branch` return only summaries), and no CI cross-OS matrix job exists to check it even if the seam existed.
- **Why it is debt:** ADR-006 makes byte-identical regeneration of `/heads`'s commit DAG a core convergence claim (concurrent excision is confluent "by construction," INV-12). The current substrate layer that would need to produce that byte-identical DAG is a hand-rolled stub predating M3, never verified against the isomorphic-git target ADR-B1 actually commits to. M3's own acceptance explicitly carries this forward as out-of-scope rather than closing it.
- **Suggested fix:** Once ADR-B6's Linux/CI-consistent `npm install` procedure is exercised to bring in isomorphic-git (ADR-B1's stated follow-up), add a `PackAdmin`-adjacent inspection seam and a real cross-OS/TZ conformance test for INV-12, replacing the current `it.skip`.
- **Status:** Resolved — owner explicitly chose to build the full multi-commit DAG (author-HLC-contiguous batching + NFR-F5 incremental reuse) rather than defer it further. `KipRepo.regenerateHeads()` implemented in `substrate.ts` using isomorphic-git's low-level plumbing (frozen conformance test in `a96a47078`, implementation in `333b06508`). Took 3 adversarial TDD rounds, each surfacing and fixing a genuine critical bug at root cause: round 1 (min=38) — the regenerated tree included the excision-marker fact itself, whose content is per-replica non-deterministic, defeating INV-12 for concurrent same-fact excision; round 2 (min=60) — fixed that and added the real multi-commit DAG, but introduced a positional blob-path-width bug that diverged incrementally-reused vs. cold-regenerated commits across a power-of-10 fact-count boundary; round 3 (min=89, converged) — fixed by naming tree entries by each fact's content-derived blob oid instead of a positional index (count-invariant), and closed a `regenBoundaryRule` config/behavior disconnect with an explicit mismatch throw instead of a silent fallback. Added the required cross-OS CI matrix job (windows-latest + ubuntu-latest against a committed golden digest) alongside the existing in-process TZ/autocrlf/locale perturbation test, giving INV-12 both required fidelities. Independent recency-anchored acceptance against verbatim INV-12 text: PASS, 92/100 (all 7 clauses PASS; residuals — `regenCache` in-memory-only, blob content is the whole canonicalized fact rather than an isolated payload — honestly documented as non-blocking). tsc clean, 125 passed/10 skipped/0 failed.

### D-28: `selfWitnessedExcisionOids` is in-memory-only — non-durable across process restart, degrading excision audit fidelity

- **Category:** Implementation / durability
- **Severity:** Minor
- **Surfaced:** M3 round 5 (the out-of-band closing round), while verifying `collectExcisions`'s CASE-2(ii) self-witnessed-excision path.
- **Location:** `packages/kip-sdk/src/index.ts:779` — `private readonly selfWitnessedExcisionOids = new Map<string, SelfWitnessedExcisionRecord>();`
- **Evidence:** Unlike `keyRegistry`, which is re-seeded from a durable `KeyRegistryStore` (`kip-key-registry.json`) on construction (`index.ts` ~L877-L901), `selfWitnessedExcisionOids` has no persisted-store counterpart — it is populated only by this replica's own live `excise()` calls during the current process lifetime and is empty again on restart.
- **Why it is debt:** `collectExcisions`'s CASE 2 (target currently absent) honors an excision marker via `selfWitnessedExcisionOids` as one of only two sound bases (the other being an explicit, registered `trustedExciseKeys` entry). After a process restart, a replica that legitimately self-excised content in a prior process run loses that local record, so a re-fold of `proj()` over the same admitted fact set can no longer resolve that cell via CASE-2(ii) — it falls through to `"unknown"` instead of `"excised"` unless a `trustedExciseKeys`-authorized marker also exists. This is SAFE (never a wrong *trusted* value — it degrades to `unknown`, not to un-excising the content) but is an availability/audit-fidelity regression across restarts that the durable `keyRegistry` precedent in the same file does not have.
- **Suggested fix:** Add a `SelfWitnessedExcisionStore` (mirroring `KeyRegistryStore`'s pattern) that durably persists `(oid → SelfWitnessedExcisionRecord)` and re-seeds `selfWitnessedExcisionOids` at construction, the same way `keyRegistry` is re-seeded.
- **Status:** Resolved — added `SelfWitnessedExcisionStore` (`substrate.ts:321`), mirroring `KeyRegistryStore`'s durable-store shape, and wired `selfWitnessedExcisionOids` to re-seed from it at construction (`index.ts:1048-1056`, `getSubstrate()`) and to persist new self-witnessed excisions to it (`index.ts:2071`). Reviewed and closed together with D-29/D-30 in commit `449585e8d`; independent review scored 93/100 — durable store faithfully mirrors `KeyRegistryStore`'s wiring, no scope creep, conformance byte-identical, tsc clean, 120 passed/11 skipped/0 failed. One accepted minor caveat: the re-seed loop (unlike `keyRegistry`'s) has no per-entry try/catch around a corrupt side-file, judged defensible since self-witnessed records are local-only, non-attacker-suppliable state.

### D-29: The static `KipRepo.registry` same-process replica map never deregisters entries — unbounded memory growth in long-lived processes

- **Category:** Implementation / resource management
- **Severity:** Minor
- **Surfaced:** M3/T4.2 (the same-process replica registry added to stand in for real git-remote/network transport in `sync()`), confirmed still present (no `.delete`/`.clear` call anywhere in `index.ts`) during this report's Phase E verification pass.
- **Location:** `packages/kip-sdk/src/index.ts:788` — `private static readonly registry = new Map<ReplicaId, KipRepo>();`; every `new KipRepo(...)` self-registers at `index.ts:862` (`KipRepo.registry.set(this.replicaId, this)`) with no corresponding removal path.
- **Evidence:** A grep of `index.ts` for `registry.delete`/`registry.clear` returns zero matches. `sync()` (`index.ts:1438`) reads `KipRepo.registry.get(remote)` to resolve a same-process stand-in for a real remote peer, but nothing ever removes an entry once a `KipRepo` instance is no longer referenced elsewhere.
- **Why it is debt:** In test conformance (short-lived processes, small instance counts) this is invisible. In a long-lived host process that repeatedly constructs `KipRepo` instances (e.g., per-session or per-tenant instantiation), every instance is held forever by the static map, which is a real memory leak — the `KipRepo` object graph (including its `Substrate`/`keyRegistry`/`selfWitnessedExcisionOids`) is never eligible for GC even after the caller drops its own reference.
- **Suggested fix:** Add an explicit `close()`/`dispose()` method that removes `this.replicaId` from `KipRepo.registry` (and document that failing to call it leaks), or switch to a `WeakMap`-friendly registration keyed differently since `replicaId` (a string) can't itself be a `WeakMap` key without an intermediate object.
- **Status:** Resolved — added `KipRepo.close()` (`index.ts:1009-1010`), which does `KipRepo.registry.delete(this.replicaId)`, giving embedders an explicit deregistration path; the "real network/git-remote transport is out of scope" scoping note remains accurate for M0-M3, but the leak itself is now closeable. Closed together with D-28/D-30 in commit `449585e8d`; independent review scored 93/100 (see D-28's Status line for the shared review summary).

### D-30: `SyncReport.tip` (and `MergeReport.tip`) is typed `CID` but populated with a fact-set digest, not a real commit CID

- **Category:** Implementation / API-faithfulness
- **Severity:** Minor
- **Surfaced:** M3 (the `sync()` implementation), confirmed during this report's Phase E verification pass.
- **Location:** `packages/kip-sdk/src/index.ts:439` (`SyncReport.tip: CID`), `index.ts:432` (`MergeReport.tip: CID`), populated at `index.ts:1480` — `tip: this.computeFactSetDigest(this.currentFacts())`.
- **Evidence:** `CID` (per the type catalog) denotes a git object id (a content hash of an actual git object — blob/tree/commit). `computeFactSetDigest` returns a digest of the *fact set*, not the id of any real git commit object, since `/heads` is a lazily-regenerated projection (ADR-006) and the current substrate layer is the hand-rolled loose-object stub named in D-27/ADR-B1 — there is no regenerated commit object yet whose id `tip` could faithfully report.
- **Why it is debt:** A caller reading `SyncReport.tip: CID` and expecting a git-resolvable commit id (e.g., to `git show`/`git log` against the real repo) gets a value that is not one — it happens to be stable and comparable across calls (useful as an opaque convergence marker) but is not what the type signature promises. This is the same underlying gap as D-27 (no real regenerated commit DAG yet) surfacing at the public API-typing level.
- **Suggested fix:** Either rename the field's documented semantics (e.g. `tip: FactSetDigest` with its own branded type, not `CID`) until ADR-B1's isomorphic-git follow-up produces real regenerated commit objects, or wire `tip` to a genuine regenerated-commit CID once D-27 is closed.
- **Status:** Resolved — introduced a dedicated `FactSetDigest` type (`index.ts:74`, `type FactSetDigest = string`, documented as "a digest of the current admitted fact SET … NOT a resolvable git commit `CID`") and retyped `SyncReport.tip`/`MergeReport.tip` to it (`index.ts:442`, `index.ts:450`), populated unchanged at `index.ts:1632`. Confirmed pure type-level rename: `computeFactSetDigest`'s computation is byte-for-byte unchanged and absent from the diff. Closed together with D-28/D-29 in commit `449585e8d`; independent review scored 93/100 (see D-28's Status line for the shared review summary).

### D-31: Round-by-round narrative comments accumulated in `proj.ts`/`index.ts`/`substrate.ts`'s excision code warrant a maintainability cleanup pass

- **Category:** Implementation / maintainability
- **Severity:** Minor
- **Surfaced:** M3, cumulative across rounds 2-5 (each round's fix left its own "ROUND-N FIX" doc comment in place rather than replacing the prior round's narrative).
- **Location:** `packages/kip-sdk/src/proj.ts` (`isAuthorizedExcisionMarker`, `collectExcisions`, `pickConvergentSelfWitnessedReason` — see the "ROUND-2 CRITICAL-FINDING FIX", "ROUND-3 ROOT-CAUSE FIX", "ROUND-4 FIX", "ROUND-5 FIX" comment blocks stacked around `proj.ts:449-758`); `index.ts` (`selfWitnessedExcisionOids`, `keyRegistry` re-seeding comments referencing the same round history); `substrate.ts` (`KeyRegistryStore` doc comment referencing "the restart-censorship attack this closes").
- **Evidence:** `proj.ts`'s excision-authorization functions carry four stacked rounds of "PRE-FIX (round-N) would have..." / "ROUND-N FIX:" prose directly in the code, each explaining what the prior round got wrong and why the current round's approach is sound — genuinely valuable *history*, but now a multi-hundred-line block a new reader must read in full to understand the current, final behavior of a ~30-line function.
- **Why it is debt:** This is deliberate, honest, and load-bearing during the adversarial-TDD build itself (each comment is real, live-reproduced attacker reasoning, not filler) — but it is process-history-shaped documentation embedded permanently in production source, not a stable maintainability artifact. A future maintainer changing `collectExcisions` has to first read a five-round security narrative before finding the current invariant.
- **Suggested fix:** Once M3 is fully stable (no further excision-authorization rounds expected), extract the round-by-round narrative into `reviews/build-convergence.md`/`reviews/build-final-report.md` (where this kind of history belongs) and replace the in-code comments with a concise, current-state-only invariant description plus a single pointer to the historical record for "why," mirroring how ADR-B5's own M0 implementation note handles a similar deferred-cleanup case.
- **Status:** Resolved — collapsed the stacked round-2/3/4/5 "PRE-FIX would have.../ROUND-N FIX" narrative comments in `proj.ts`/`index.ts`/`substrate.ts` into concise current-state invariant descriptions with a pointer to `reviews/build-final-report.md`, preserving the load-bearing WHY reasoning (commit `d21afb06f`). Independently verified behavior-neutral: frozen conformance directory diff is 0 bytes, `package.json`/`package-lock.json` untouched, `tsc --noEmit` clean, and `vitest run` byte-identical before/after (28 files, 120 passed, 11 skipped, 0 failed); every changed line confirmed via grep to be blank or comment-syntax only, zero logic changed. Score 95/100.

---

## Audit round 5 — implementation-era debt surfaced during post-closure live-usage testing

> After round 4 closed (`reviews/debt-closure-report.md`), the shipped M0-M3 code was exercised through its
> real, on-disk, public happy-path API (`open()` + `assertFact`/`retractFact` + a live two-replica `sync()`
> scenario) rather than the internal `ingest()`/in-memory test-fixture bypass every prior conformance test
> and manual check had used. This surfaced one genuine gap the earlier rounds' testing angle could not have
> reached. Logged per this register's convention: verified against actual current source before recording.

### D-32: No durable signing-identity persistence across `close()`+`open()` — and no public-API path to establish one — silently breaks cross-replica `sync()` for any pre-restart fact

- **Category:** Implementation / durability, security
- **Severity:** Major
- **Surfaced:** post-round-4 live-usage testing (an agent-simulated two-replica session-restart scenario exercising `open()`'s real keyring lifecycle, independently reproduced and verified against source).
- **Location:** `packages/kip-sdk/src/index.ts:1063-1069` (`getOwnKeyPair()` — generates a fresh random Ed25519 keypair whenever `this.ownKeyPair` is unset); `index.ts:2543-2549` (`extractKeyPairFromKeyring()` — returns `undefined` unless the caller's `OpenOptions.keyring` already contains a `privateKeyPem` string); `signing.ts:33` (`generateEd25519KeyPair`) and the rest of `signing.ts`'s exports (`Ed25519KeyPair`, `importEd25519KeyPair`) are not re-exported from `index.ts`, so they are absent from the package's actual public surface (`package.json`'s `exports` map only exposes `"."`).
- **Evidence:** `open({dir, replicaId, keyring: undefined}, )` — the documented fallback for "no explicit keyring supplied" — mints a brand-new random signing identity every call; nothing persists it to `dir`, and nothing in the public API lets a caller retrieve/export that generated identity to persist it themselves for next time. Reproduced live: a repo that `assertFact`'d 7 facts, then `close()`+re-`open()`'d the same `dir`, came back with `fsck().badSignatures` listing all 7 prior facts (the reopened instance can no longer verify signatures made by its own prior-session key). Worse, `sync()`-ing that reopened replica to a peer silently dropped every pre-reopen fact as `signature-invalid` (`ingest()`'s ordinary, correct rejection of an unverifiable signature) with no diagnostic surfaced anywhere in `SyncReport` — `received` simply under-counts. A grep of the roadmap/task-breakdown docs (`80-roadmap-and-milestones.md`, `81*.md`) for "keyring" or identity-persistence returns zero hits — this is not a tracked, intentionally-deferred later-milestone item, it fell through unscoped.
- **Why it is debt:** `docs/40-sdk-api-surface.md` states the keyring is caller-supplied signing key material that "MUST chain to the tenant root" — i.e., the design's intent is that a real embedder brings its own durable identity. But the SDK provides no supported way to either (a) export the auto-generated fallback identity for persistence, or (b) construct a compatible keyring using only the package's public surface (the key-generation/import helpers exist in `signing.ts` but are not part of `index.ts`'s exports). A caller following the documented `keyring: undefined` fallback — which is the only path the current public API actually offers — loses the ability to sync any pre-restart memory to any peer, silently, with no error at the point of failure. This directly undermines the SDK's own stated purpose ("persistent memory across a session").
- **Suggested fix:** Re-export `generateEd25519KeyPair`/`Ed25519KeyPair`/`importEd25519KeyPair` (or an equivalent) from `index.ts`'s public surface so a caller can mint and persist their own keyring PEM up front; and/or add a `KipRepo` accessor (e.g. `exportKeyring()`) that returns the current (possibly auto-generated) identity's PEM so a first-run caller can persist it for the next `open()` call. Additionally, consider having `sync()`/`SyncReport` surface a non-zero `signature-invalid` rejection count distinctly from `received`, so this failure mode is at least observable rather than silent.
- **Status:** Open. **Out of scope for the M5/M6 build (see "Audit round 6" below) — unrelated to contextual functionalities or `learn()`, not touched, not re-marked resolved.**

---

## Audit round 6 — implementation-era debt surfaced during the M5/M6 build (active-knowledge functionalities + autoencoding)

> After D-32 (round 5), the build proceeded to M5 (contextual functionalities) and M6 (autoencoding /
> `learn()`) — see `reviews/build-m5-m6-report.md` for the full run narrative (dependency audit, 4 TDD
> rounds each, acceptance results). M5's acceptance genuinely found GAPS (2 of 7 invariants fail); M6's
> acceptance PASSED all 6 invariants but carries an honestly-disclosed residual. Both milestones' gaps and
> residuals are logged here as new debts rather than left only in code comments. Each entry was verified
> against the actual current `packages/kip-sdk/src/*.ts` source before being recorded. D-32 (round 5) is
> unrelated to this build and was left untouched.

### D-33: M5's INV-A2 violation — `ContextualQuery.asOf.txTime` is not rejected/stripped from the compile-determinism seam

- **Category:** Implementation / active-knowledge correctness
- **Severity:** Major
- **Surfaced:** M5, round 4 acceptance (live-reproduced independently by the acceptance reviewer).
- **Location:** `packages/kip-sdk/src/index.ts:1717-1754` (`selectFactsForAsOf`'s `txTime` branch, which resolves the frontier via `this.rxFromByOid` — this replica's own in-memory receive-tick history); `index.ts:1789-1795` (`selectFactsForContextualAsOf`, which delegates straight through to `selectFactsForAsOf` for the `txTime` axis with no additional guard); `index.ts:2863-2870` (`compileContextualQuery`, which folds via `selectFactsForContextualAsOf(q.asOf)`).
- **Evidence:** `selectFactsForAsOf` (`index.ts:1719-1742`) filters facts by comparing each fact's `rxFromByOid` entry against the caller-supplied `txTime` cutoff — `rxFromByOid` is explicitly documented elsewhere in the same file as "this replica's OWN receive-tick history," i.e. genuinely per-replica, non-convergent state (see the method's own doc comment, `index.ts:1806-1813`: "per-replica AUDIT, explicitly non-convergent"). `compileContextualQuery` routes every `q.asOf` through this same selector with no separate handling or rejection of a supplied `txTime` — so a `ContextualQuery.asOf.txTime` pin is silently accepted and used to select the compiled `Segment`'s input fact set.
- **Why it is debt:** INV-A2 promises byte-identical compiled `Segment` sets for two replicas compiling at a nominally-"same" `asOf` pin. Because `txTime` resolves through each replica's own private `rxFromByOid` map, two replicas that have ingested the same facts in a different order (a normal, expected divergence under eventual consistency) will have different `rxFromByOid` histories and can therefore compile genuinely different `Segment` sets from an `asOf` that names the identical `txTime` value — a real SEC-adjacent divergence in the active-knowledge compile seam, not merely a documentation gap.
- **Suggested fix:** Either reject a `ContextualQuery.asOf.txTime` outright at `compileContextualQuery` (throwing a typed error, e.g. `ERR_ASOF_TXTIME_NOT_SUPPORTED_FOR_COMPILE`, since `txTime` is documented elsewhere as a per-replica belief-audit axis, not a convergent compile-determinism input), or strip `txTime` from the `AsOf` passed to `selectFactsForContextualAsOf` before it reaches `compileContextualQuery`'s fold, keeping only `validTime` as the convergent pinning axis for this seam.
- **Status:** Open.

### D-34: M5's INV-A8 violation — `readAnswerGraph` never threads the resolved/pinned `asOf`

- **Category:** Implementation / active-knowledge correctness
- **Severity:** Major
- **Surfaced:** M5, round 4 acceptance (live-reproduced independently by 2 critics and the acceptance reviewer).
- **Location:** `packages/kip-sdk/src/index.ts:3111-3112` (`readAnswerGraph`, `const facts = this.currentFacts();`); call sites `index.ts:3302` and `index.ts:3450` (inside `executeSegment`).
- **Evidence:** `readAnswerGraph`'s doc comment (`index.ts:3105-3110`) states it "reads the `AnswerGraph` back from the emitted `derived_from` subgraph — a PURE READ over currently-admitted facts" (INV-A8), but its body (`index.ts:3112`) unconditionally calls `this.currentFacts()` — the live, unpinned admitted set — regardless of whether the enclosing `executeSegment`/`runContextualQuery` call was made with a pinned `q.asOf`. `executeSegment` does thread the pinned `asOf` through its own guard evaluations (`resolvedGetNode`/`resolvedContextualView`, `index.ts:3100-3103`), but never passes any frontier into `readAnswerGraph` itself at either call site.
- **Why it is debt:** INV-A8 (and docs/31's own "reproducibility is relative to the recorded `asOf`" promise, quoted in `index.ts:1771`) requires a pinned-`asOf` `AnswerGraph` read-back to be reproducible against unrelated intervening activity — i.e. re-running `runContextualQuery` with the same pinned `asOf` after a third party asserts new unrelated `derived_from` facts should return the identical `AnswerGraph`. Because `readAnswerGraph` always folds the CURRENT live fact set, a later assertion of any new `derived_from` edge reachable from the same seed changes the returned `AnswerGraph`'s `intermediates`/`edges` even for an already-pinned query — a real reproducibility violation, not a cosmetic gap.
- **Suggested fix:** Thread the same resolved fact set `executeSegment` already computes for its pinned-`asOf` guard reads (via `selectFactsForContextualAsOf`) into `readAnswerGraph`, replacing its unconditional `this.currentFacts()` call, so the BFS-reachability fold operates over the identical pinned frontier as the rest of the pinned execution.
- **Status:** Open.

### D-35: M5's `ERR_ILL_TYPED_SEGMENT` only catches a narrow self-loop special case, not general adjacent-pair type-compatibility checking

- **Category:** Implementation / active-knowledge scope narrowing (honestly disclosed)
- **Severity:** Minor
- **Surfaced:** M5, round 2 (named as a known gap at the time, not a later regression); confirmed still the only throw site at round 4 / acceptance.
- **Location:** `packages/kip-sdk/src/index.ts:2846-2861` (doc comment naming the scope narrowing) and `index.ts:3023` (`compileContextualQuery`'s only real `"ERR_ILL_TYPED_SEGMENT"` throw site — the `seedKind === q.target` self-loop heuristic for a `steps.length > 1` chain).
- **Evidence:** The doc comment at `index.ts:2848-2861` states plainly: "`ERR_ILL_TYPED_SEGMENT`'s ONLY real throw site is this self-loop heuristic... It does NOT implement general per-adjacent-pair `steps[i].targetKind` vs `steps[i+1].sourceKind` compatibility checking — because... no `NodeKindDef`/`is_a` schema-registration API exists at M5 from which a REAL per-hop kind signal could be derived." A grep of `index.ts` confirms `"ERR_ILL_TYPED_SEGMENT"` is thrown at exactly one call site (`index.ts:3023`).
- **Why it is debt:** docs/40's Errors table (per `inv-a2.test.ts:15`) documents `ERR_ILL_TYPED_SEGMENT` generically as the error for "an ill-typed chain... MUST NOT be compiled or surfaced," which reads as full adjacent-pair type-checking. The actual implementation only catches the one case where a multi-hop chain loops back to the seed's own kind; a chain with two genuinely incompatible intermediate hops (neither of which happens to loop back to the seed kind) compiles without error. This is root-caused, not curve-fit: no schema/`is_a` API exists at M5 to check real kind compatibility against, so a genuine per-pair check would require inventing an un-spec'd schema API.
- **Suggested fix:** Once a schema/`is_a`/`NodeKindDef` registration API lands (tracked as a pre-existing gap in the M0-M3 register, e.g. the "no ontology/schema-registration API" residual noted in `reviews/build-final-report.md` §6), extend `compileContextualQuery`'s ill-typed-chain check to real per-adjacent-pair `sourceKind`/`targetKind` compatibility using that API, rather than the current self-loop-only heuristic.
- **Status:** Open (honestly disclosed since round 2, not a regression).

### D-36: M6's residual partial-commit/atomicity gap — `isAssertInputArray` omits validation of `AssertInput.v`, and the accept-commit sequence is not atomic

- **Category:** Implementation / durability, atomicity
- **Severity:** Major
- **Surfaced:** M6, round 4 (critics still found this after the round-4 structural fix closed the `target`-shape bug class).
- **Location:** `packages/kip-sdk/src/index.ts:4147-4180` (`isAssertInputArray` — checks `type`, `target` via `isWellFormedTarget`, `validFrom`, `validTo` presence, `replicaId`, and `provenance`, but never checks `item.v`); `index.ts:3794-3936` (the accept-commit `try`/`catch` sequence, ending in the `kip:learn-exhausted` marker + `"ERR_LEARN_COMMIT_FAILED"` throw at `index.ts:3929`); `index.ts:1459-1461` (`KipRepo.txn()` — still an unimplemented throwing stub, `TODO(M0/T1.5)`).
- **Evidence:** Reading `isAssertInputArray`'s full predicate body (`index.ts:4147-4180`) confirms it validates six fields but has no check on `item.v` (the `Fact` envelope's schema-version field, required per `AssertInput = Omit<Fact, "id" | "type">`). The surrounding comments (`index.ts:3794-3800`, `3816`) explicitly name `Repo.txn()`/`Tx` as "still an unimplemented throwing stub in THIS build" and describe the accept-commit loop as "un-transacted" (facts committed "ONE ITEM AT A TIME"). The round-4 defense-in-depth `try`/`catch` (`index.ts:3890-3936`) converts any commit-time failure into an audited `kip:learn-exhausted` marker + typed `ERR_LEARN_COMMIT_FAILED` rather than a silent reject, but does not roll back any facts already committed earlier in the same batch.
- **Why it is debt:** A candidate carrying a malformed/missing `v` field passes `isAssertInputArray`'s gate (since `v` is never checked), reaches `assertFact` for a later item in the same accepted batch, and can crash there after earlier items in the batch are already durably committed — the identical class of mid-batch partial-commit hazard the round-3/round-4 fixes closed for `target` shape, now narrower (limited to the `v` field) but not zero. This is honestly scoped as a general robustness property of the pre-existing `Repo.txn()` stub (tracked nowhere else in this register under a Tx/txn-specific id — no existing debt entry names `Repo.txn()` itself as the open item, so this is not a duplicate), not a violation of any of M6's six named exit-criteria invariants (all of which the acceptance run confirmed genuinely pass).
- **Suggested fix:** Short-term: extend `isAssertInputArray` to also validate `item.v` (matching the same presence/shape rigor already applied to `target`/`provenance`). Root-cause fix: implement `Repo.txn()`/`Tx` (M0/T1.5) so the whole accept-commit sequence can be wrapped in one real transaction, making the entire class of mid-batch partial-commit hazards (not just the `v`-field instance) structurally impossible rather than merely audited after the fact.
- **Status:** Open.

### D-37: M6's `rawRef.blob` is an unverified, caller-declared key component — collision risk for `learn()`'s `kip:learn` key

- **Category:** Implementation / API-faithfulness (honestly disclosed, bounded by tests)
- **Severity:** Minor
- **Surfaced:** M6, round 1 (named as a known limitation); documented + bounded by a dedicated conformance test in round 2.
- **Location:** `packages/kip-sdk/src/index.ts:131-153` (`BlobRef`'s doc comment and type: `export type BlobRef = { blob: CID };`); `index.ts:855-856` (`BlobRefInput`, "Placeholder"); `src/__tests__/m6-round2-critic-fixes.test.ts` ("M6 round-2 finding MAJOR #2: BlobRef identity is advisory-only/caller-declared" describe block).
- **Evidence:** The doc comment at `index.ts:134-148` states plainly: "`blob` is a caller-DECLARED `CID` string, never verified/re-hashed against the referenced content by `learn()` or anything else in this module... `BlobRef` identity here is ADVISORY-ONLY: two `learn()` calls over genuinely DIFFERENT raw artifacts that happen to declare the SAME `rawRef.blob` string collide onto the identical `kip:learn` key... while the converse (the SAME artifact declared under two DIFFERENT `blob` strings) never collides at all." A conformance test in `m6-round2-critic-fixes.test.ts` asserts this collision behavior is bounded and understood (same string twice ⇒ same key by design; two distinct strings ⇒ never collide).
- **Why it is debt:** `learn()`'s `kip:learn`/`kip:learn-exhausted` fact key is built from `rawRef.blob` (via `ontologyRefForLearn`) with no out-of-band content-hash verification — unlike a real `Fact.id`, which `mintFact` derives as an actual content hash. A caller (or malicious/buggy microagent) that declares the wrong `blob` string for genuinely different raw content causes two unrelated `learn()` runs to silently share a `kip:learn` key, which downstream consumers could mistake for "provably the same content" without their own out-of-band check.
- **Suggested fix:** Once a real content-addressed blob store exists (`BlobRefInput`'s own doc comment already marks it "Placeholder" / out of scope for this scaffold), have `learn()` verify `rawRef.blob` against a real hash of the referenced content before using it as a key component, or namespace the `kip:learn` key additionally by a caller-independent verification marker so caller-declared collisions cannot silently merge two runs over different content.
- **Status:** Open (honestly documented + bounded by tests as of round 2).
