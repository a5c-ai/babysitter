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
residual atomicity/key-collision limitations (D-33, D-34, D-36 Open; D-35, D-37 Resolved via
documentation-accuracy passes, no code behavior changed). **It both catalogs each debt AND tracks its resolution:** every entry records
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
- **Status:** Resolved (documentation-accuracy fix only — no code behavior changed, and no new schema/`is_a` API was built, per this pass's explicit scope decision). `docs/40-sdk-api-surface.md`'s `KipErrorCode` union entry for `ERR_ILL_TYPED_SEGMENT` no longer reads as general adjacent-pair type-checking; it now states the INTENDED full §5b.1 semantics separately from the ACTUAL M5 scope (the self-loop-only heuristic), and cross-references `reviews/build-final-report.md` §6's pre-existing "no ontology/schema-registration API" residual as the tracked prerequisite for closing the real gap. Also corrected `inv-a2.test.ts`'s "an ill-typed chain (steps[i].targetKind incompatible with steps[i+1].sourceKind)" test name/comment, which inaccurately implied general adjacent-pair checking was under test when the fixture (`target: "person"` == seed's own kind) only exercises the self-loop case — assertion unchanged, name/comment only. Independently verified: `check-doc-links.mjs` passes, `tsc`/build clean, and `vitest run` unchanged pass/fail counts (no assertions altered).

### D-36: M6's residual partial-commit/atomicity gap — `isAssertInputArray` omits validation of `AssertInput.v`, and the accept-commit sequence is not atomic

- **Category:** Implementation / durability, atomicity
- **Severity:** Major
- **Surfaced:** M6, round 4 (critics still found this after the round-4 structural fix closed the `target`-shape bug class).
- **Location:** `packages/kip-sdk/src/index.ts:4147-4180` (`isAssertInputArray` — checks `type`, `target` via `isWellFormedTarget`, `validFrom`, `validTo` presence, `replicaId`, and `provenance`, but never checks `item.v`); `index.ts:3794-3936` (the accept-commit `try`/`catch` sequence, ending in the `kip:learn-exhausted` marker + `"ERR_LEARN_COMMIT_FAILED"` throw at `index.ts:3929`); `index.ts:1459-1461` (`KipRepo.txn()` — still an unimplemented throwing stub, `TODO(M0/T1.5)`).
- **Evidence:** Reading `isAssertInputArray`'s full predicate body (`index.ts:4147-4180`) confirms it validates six fields but has no check on `item.v` (the `Fact` envelope's schema-version field, required per `AssertInput = Omit<Fact, "id" | "type">`). The surrounding comments (`index.ts:3794-3800`, `3816`) explicitly name `Repo.txn()`/`Tx` as "still an unimplemented throwing stub in THIS build" and describe the accept-commit loop as "un-transacted" (facts committed "ONE ITEM AT A TIME"). The round-4 defense-in-depth `try`/`catch` (`index.ts:3890-3936`) converts any commit-time failure into an audited `kip:learn-exhausted` marker + typed `ERR_LEARN_COMMIT_FAILED` rather than a silent reject, but does not roll back any facts already committed earlier in the same batch.
- **Why it is debt:** A candidate carrying a malformed/missing `v` field passes `isAssertInputArray`'s gate (since `v` is never checked), reaches `assertFact` for a later item in the same accepted batch, and can crash there after earlier items in the batch are already durably committed — the identical class of mid-batch partial-commit hazard the round-3/round-4 fixes closed for `target` shape, now narrower (limited to the `v` field) but not zero. This is honestly scoped as a general robustness property of the pre-existing `Repo.txn()` stub (tracked nowhere else in this register under a Tx/txn-specific id — no existing debt entry names `Repo.txn()` itself as the open item, so this is not a duplicate), not a violation of any of M6's six named exit-criteria invariants (all of which the acceptance run confirmed genuinely pass).
- **Suggested fix:** Short-term: extend `isAssertInputArray` to also validate `item.v` (matching the same presence/shape rigor already applied to `target`/`provenance`). Root-cause fix: implement `Repo.txn()`/`Tx` (M0/T1.5) so the whole accept-commit sequence can be wrapped in one real transaction, making the entire class of mid-batch partial-commit hazards (not just the `v`-field instance) structurally impossible rather than merely audited after the fact.
- **Status:** Resolved (see the Round-6 closing addendum below — the recurring `txn()` instance-poisoning bug class was closed structurally via a single outer `try/finally`, verified by a final independent 3-critic pass at correctness 96 / convergence-safety 97 / code-quality 93 and a recency-anchored acceptance pass confirming all five acceptance criteria against the current source).
- **Round-2 addendum (post-implementation, not yet closed):** `Repo.txn()`/`Tx` are now a REAL implementation (`KipRepo.txn()`, index.ts) and `learn()`'s accept-commit sequence runs inside one real `this.txn(...)` call — the root-cause fix above has landed in code. This entry is intentionally left `Open` (not `Resolved`) here: round-1 adversarial critics found 3 MAJOR gaps in that implementation (commit-write/durable-ingest not sharing one failure domain; `mintFact`'s `seq`/`hlc`/`SeqTipStore` advance not rolled back on abort, which could poison `pin()`/`resolvePin()`'s seq-contiguity invariant; and `Tx.assertFact`/`retractFact`'s ambient instance-flag design letting an unrelated direct caller's write get silently absorbed into another in-flight `txn()`), all three since fixed and covered by regression tests in `m6-round4-critic-fixes.test.ts`. Two scope boundaries remain honestly disclosed rather than closed: (1) the commit-DAG `txn()`/`regenerateHeads()` maintain reflects ONLY facts admitted via those two call sites — a direct (non-txn) `assertFact`/`retractFact`/`supersedeFact`/`reAttestFact` call durably admits its fact to the substrate exactly as before but does not itself extend the commit-DAG (only a later `txn()` or an explicit `regenerateHeads()` sweeps it in); (2) two `KipRepo` INSTANCES concurrently racing `txn()` against the SAME `substrate.dir` is unsupported/undefined — there is no file-locking around the commit-write critical section in this build. Final `Resolved` status is left to the orchestrating process's own acceptance pass, not asserted here.
- **Round-3 addendum (stale round-tally correction — brings this entry current through 5 total adversarial rounds against `KipRepo.txn()`):** After the round-2 addendum above (round-1 critics' 3 MAJOR gaps), THREE further adversarial rounds ran against `txn()`/`learn()`, each with its own regression coverage in `m6-round4-critic-fixes.test.ts` (round-2/round-3 critic-fix describe blocks) and `m6-round3-critic-fixes.test.ts`:
  - **Round-2 critics** (min score 70): found `isAssertInputArray`'s round-1 `target`-presence check let `target: null`/`{kind:"nonsense"}` sail through — fixed by calling `well-formed.ts`'s own `isWellFormedTarget` directly at the SAME earlier gate (this is the round labeled "round-3" inside the test files' own naming, since the test-file round counter and this doc's addendum counter track independently).
  - **Round-3 critics** (code-quality 68, convergence-safety 80): found (a) `txn()`'s rollback-erase loop itself called an unguarded `Substrate.erase()` that could throw mid-loop, potentially masking the original commit error or skipping `resetTxnState()` — fixed via a per-oid try/catch inside the rollback loop that always attempts every oid, always resets txn state, and throws one `ERR_TXN_ROLLBACK_FAILED` naming both the original failure and any erase failures; and (b) two concurrent `learn()` calls racing `txn()` on one instance needed the second call's own `txn()` rejection (`ERR_TXN_ALREADY_ACTIVE`) to propagate verbatim rather than being swallowed into a spurious `ERR_LEARN_COMMIT_FAILED`/exhausted-marker — fixed by an explicit short-circuit in `learn()`'s own catch block.
  - **Round-4 critics**: found `isAssertInputArray`'s round-3 fix still didn't validate `v`'s presence/type — closed (this IS the fix this debt entry's own "Suggested fix" originally asked for; see `M6 round-4 part (a)` in `m6-round4-critic-fixes.test.ts`).
  - **Round-5 (this addendum, a FRESH round of 3 independent critics — conformance auditor, hostile distributed-systems+security, staff engineer — run AFTER convergence to correctness 97 / code-quality 90 / convergence-safety 96)** found 2 further CRITICAL bugs ALL/2-of-3 critics independently reproduced, plus one MAJOR test-coverage gap, all now closed:
    1. **Critical (all 3 critics):** `txn()`'s post-commit-success tail (folding the shadow seq/hlc clone into the real `chainSequencer`/`localHlc` and the final `SeqTipStore.save()` call) ran completely UNGUARDED — a failure there (after the commit object, every staged fact, and the commit tip were ALREADY durably written) left `txnActive` stuck `true` FOREVER (permanently poisoning the instance — every subsequent `txn()`/direct `assertFact`/`retractFact` call rejected forever) while ALSO misreporting that nothing had been committed. Fixed: the whole tail now runs inside `try { ... } finally { resetTxnState(); }`, and a `SeqTipStore.save()` failure specifically is caught and re-thrown as a new, distinctly-coded `ERR_TXN_TIP_PERSIST_FAILED` naming the commit (`context.commitOid`) that DID durably succeed — never the generic path that would imply otherwise. Regression: `m6-round4-critic-fixes.test.ts` "ROUND-5 CRITIC FIX ... Critical #1".
    2. **Critical (2 of 3 critics):** the round-2-fix's ambient `inTxDelegatedCall` boolean (set around `await this.assertFact(input)` inside `Tx.assertFact`/`retractFact`) only NARROWED the silent-absorption race window, never closed it — an `await` on an already-resolved promise still yields a microtask tick before the `finally` resets the flag, so an unrelated direct `assertFact`/`retractFact` call landing in that SAME tick (no explicit gate needed) still got silently absorbed. Fixed: replaced the ambient boolean with an `AsyncLocalStorage`-scoped per-txn `Symbol()` token (`txnDelegationStore`/`txnToken`, index.ts) — `Tx`'s delegation to the SAME public, overridable `this.assertFact`/`this.retractFact` (unchanged, still lets a subclass override observe every tx-routed write) now runs inside `txnDelegationStore.run(txnToken, ...)`; an unrelated call (never itself wrapped in a matching `.run()`) sees no matching token regardless of timing, since `AsyncLocalStorage` context is bound to the causal call chain, not wall-clock/microtask ordering. Regression: `m6-round4-critic-fixes.test.ts` "ROUND-5 CRITIC FIX ... Critical #2" (a literal unawaited-`tx.assertFact`-vs-direct-call same-synchronous-tick race, no gate).
    3. **Major (staff engineer critic):** `isAssertInputArray`'s own `v`-field check (this debt entry's own namesake fix, closed in the round-4 bullet above) had ZERO dedicated test coverage. Fixed: added dedicated tests for `v` deleted and `v` given as a wrong type (a string), mirroring the existing missing-`validTo`/`replicaId` coverage pattern (`m6-round3-critic-fixes.test.ts`). Regression: `m6-round4-critic-fixes.test.ts` "MAJOR (staff engineer critic, round-5)".

  All 3 round-5 findings are verified fixed via direct reproduction of the critics' own scenarios (temporarily reverting each fix and confirming its new regression test fails against the reverted code, then confirming it passes against the real fix) — see this round's own closure notes. The two scope-boundary disclosures from the round-2 addendum (no cross-`txn()`-call commit-DAG sweep for direct writes; no cross-instance file-locking) remain unchanged and still honestly open, not silently resolved by this round.
- **Round-6 closing addendum (final resolution — brings this entry current through the full convergence and marks it Resolved):** After round-5, a fresh independent 3-critic pass surfaced a *recurring bug class* that had been patched reactively one call site at a time: an unguarded fallible call inside `KipRepo.txn()` (any call throwing before the method's cleanup ran) left `txnActive` stuck `true`, permanently poisoning the instance so every future `txn()`/`assertFact`/`retractFact` rejected with `ERR_TXN_ALREADY_ACTIVE` forever. This same class was found and locally patched at **six** successive call sites across further rounds (the early `getSubstrate()`, `tipStore.load()`, `writeFactsTreeAndCommit`, the ingest loop, the final `SeqTipStore.save()` tail, and finally `this.currentFacts()`/`.sort()`), plus two adjacent tip-persistence criticals were closed in the same span: (a) `getSubstrate()` published `this.substrate` *before* its load-and-reseed sequence completed, so a single `CorruptTipFileError` silently and permanently disabled all future reseeding (a real, silent seq-collision) — fixed by building all state in locals and publishing only after the full sequence succeeds; and (b) tip side-files (`SeqTipStore`/`CommitTipStore`) wrote via a bare non-atomic `fs.writeFileSync` and parsed via an unguarded `JSON.parse` — fixed with `writeJsonAtomic` (temp-file + atomic rename), a typed `CorruptTipFileError` on load, and a `getSubstrate()` reseed that cross-validates the persisted tip against the max `seq` actually observed in `currentFacts()` per chain (self-healing against a stale tip). **The bug class itself was then closed STRUCTURALLY, not with a seventh point-patch:** `txn()`'s entire post-`txnActive` body is now wrapped in one bare `try { ... } finally { resetTxnState(); }`, making the cleanup guarantee independent of *where or what* throws — a new fallible step added anywhere in the method is automatically covered, which is precisely the property the six prior point-patches lacked (each required first *noticing* a specific missed call site). Two inner `try/catch`es are preserved for substantive work (the rollback-erase loop; the `SeqTipStore.save()` → `ERR_TXN_TIP_PERSIST_FAILED` re-coding); both always rethrow, never swallow, so the outer `finally` still runs and the original error propagates unmodified. Regression: `m6-round4-critic-fixes.test.ts` "D-36 STRUCTURAL FIX" describe block injects a failure at all six known fallible points and confirms, for each, that the original error propagates unmodified AND a subsequent `txn()` succeeds; `round6-tip-persistence-crash-safety.test.ts` covers the atomic-write/corrupt-load/self-healing-reseed cases. The final independent 3-critic pass scored correctness **96** / convergence-safety **97** / code-quality **93**, all judging this a genuine structural closure of the bug class (the correctness critic additionally ran four fresh throw-injection probes — `mintFact` throwing, a bare-string throw, an `undefined` throw, a top-of-`try` throw — all propagating cleanly with the instance surviving). A recency-anchored acceptance pass confirmed all five acceptance criteria (v-validation; real `txn()`; atomic accept-commit; no permanent poisoning; no regression) against the current source, with the full suite green. **Residuals explicitly deferred to [[D-38]]** (not part of this entry's acceptance): `KeyRegistryStore`/`SelfWitnessedExcisionStore` still use the pre-hardening bare-write/unguarded-parse pattern; `writeJsonAtomic` does not clean up its temp file if the rename itself fails; `getSubstrate()`'s per-chain max-seq fold duplicates `computeChainFrontier`; a ~1.4% flaky assertion in `round6-tip-persistence-crash-safety.test.ts`; and the `Substrate.createTemp()`/`close()` temp-dir cleanup gap. The two scope boundaries from the round-2 addendum (no cross-`txn()` commit-DAG sweep for direct writes; no cross-instance file-locking) remain honestly disclosed.

### D-37: M6's `rawRef.blob` is an unverified, caller-declared key component — collision risk for `learn()`'s `kip:learn` key

- **Category:** Implementation / API-faithfulness (honestly disclosed, bounded by tests)
- **Severity:** Minor
- **Surfaced:** M6, round 1 (named as a known limitation); documented + bounded by a dedicated conformance test in round 2.
- **Location:** `packages/kip-sdk/src/index.ts:131-153` (`BlobRef`'s doc comment and type: `export type BlobRef = { blob: CID };`); `index.ts:855-856` (`BlobRefInput`, "Placeholder"); `src/__tests__/m6-round2-critic-fixes.test.ts` ("M6 round-2 finding MAJOR #2: BlobRef identity is advisory-only/caller-declared" describe block).
- **Evidence:** The doc comment at `index.ts:134-148` states plainly: "`blob` is a caller-DECLARED `CID` string, never verified/re-hashed against the referenced content by `learn()` or anything else in this module... `BlobRef` identity here is ADVISORY-ONLY: two `learn()` calls over genuinely DIFFERENT raw artifacts that happen to declare the SAME `rawRef.blob` string collide onto the identical `kip:learn` key... while the converse (the SAME artifact declared under two DIFFERENT `blob` strings) never collides at all." A conformance test in `m6-round2-critic-fixes.test.ts` asserts this collision behavior is bounded and understood (same string twice ⇒ same key by design; two distinct strings ⇒ never collide).
- **Why it is debt:** `learn()`'s `kip:learn`/`kip:learn-exhausted` fact key is built from `rawRef.blob` (via `ontologyRefForLearn`) with no out-of-band content-hash verification — unlike a real `Fact.id`, which `mintFact` derives as an actual content hash. A caller (or malicious/buggy microagent) that declares the wrong `blob` string for genuinely different raw content causes two unrelated `learn()` runs to silently share a `kip:learn` key, which downstream consumers could mistake for "provably the same content" without their own out-of-band check.
- **Suggested fix:** Once a real content-addressed blob store exists (`BlobRefInput`'s own doc comment already marks it "Placeholder" / out of scope for this scaffold), have `learn()` verify `rawRef.blob` against a real hash of the referenced content before using it as a key component, or namespace the `kip:learn` key additionally by a caller-independent verification marker so caller-declared collisions cannot silently merge two runs over different content.
- **Status:** Resolved (documentation-accuracy fix only — no code behavior changed; no content-addressed blob store was built, per this pass's explicit scope decision, since none exists to verify `rawRef.blob` against and inventing one is a substantial separate feature). Confirmed `BlobRef`/`BlobRefInput` carry no raw bytes anywhere in this scaffold — only the bare caller-declared `{ blob: CID }` reference — so the suggested fix's first option (verify `rawRef.blob` against a real content hash) is not feasible without that store, and its second option (a caller-independent verification marker) does not actually close the gap either: a caller that can misdeclare `blob` can equally misdeclare any other caller-supplied marker. Given that, this pass added a new "`rawRef` identity is caller-declared, not content-verified" residual paragraph to `docs/32-knowledge-autoencoding.md`'s "Reversibility, audit & residuals" section (previously only the model-relative-loss residual was stated there; the "provenance names the artifact ... reviewer can re-examine ... out-of-band" sentence read as if the recorded `rawRef` were a reliable content identity, with no caveat) and reworded that sentence to say the provenance names the *declared* `rawRef` and a reviewer re-examines "against the same declared reference," cross-referencing this debt entry, `index.ts`'s existing `BlobRef` doc comment, and the bounding tests in `m6-round2-critic-fixes.test.ts`. No test assertions were touched or weakened. Independently verified: `check-doc-links.mjs` passes, `tsc`/build clean, `vitest run` unchanged pass/fail counts.

### D-38: Substrate side-file durability hardening + `txn()`/`getSubstrate()` cleanup residuals (deferred from [[D-36]]'s closure)

- **Category:** Implementation / durability, robustness, maintainability
- **Severity:** Minor
- **Surfaced:** During [[D-36]]'s extended convergence (the `Repo.txn()` structural-fix rounds). Grouped here as one tracked follow-up rather than blocking D-36's closure, per an explicit scope decision.
- **Location:** `packages/kip-sdk/src/substrate.ts` (`KeyRegistryStore.save()`/`load()`, `SelfWitnessedExcisionStore.save()`/`load()`, `writeJsonAtomic()`, `Substrate.createTemp()`); `packages/kip-sdk/src/index.ts` (`KipRepo.getSubstrate()` seq cross-validation loop, `KipRepo.close()`); `packages/kip-sdk/src/__tests__/round6-tip-persistence-crash-safety.test.ts`.
- **Evidence & scope (each item independently confirmed during D-36's review):**
  1. **`KeyRegistryStore`/`SelfWitnessedExcisionStore` are not crash-safe.** Both still `save()` via a bare `fs.writeFileSync` (non-atomic) and `load()` via an unguarded `JSON.parse(fs.readFileSync(...))` — the exact pre-hardening pattern that D-36 fixed for `SeqTipStore`/`CommitTipStore` (via `writeJsonAtomic` + typed `CorruptTipFileError`). Both are read from inside `getSubstrate()`'s same load sequence, so a torn/corrupt file in either throws a raw `SyntaxError`. (D-36's `getSubstrate()` "build-in-locals, publish-at-the-end" fix means such a throw no longer *silently* poisons reseeding — it fails loudly and retries — so this is now a diagnostics/consistency gap, not a silent-corruption hazard.)
  2. **`writeJsonAtomic()` leaks its temp file if the rename itself fails.** The write-temp-then-`fs.renameSync` sequence has no `try/finally` cleanup around the rename; a `renameSync` failure (e.g. Windows EPERM) leaves an orphaned `.tmp-*` file. The core crash-safety guarantee (original file never torn) still holds.
  3. **`getSubstrate()`'s per-chain max-seq cross-validation duplicates `computeChainFrontier`.** The reseed loop reimplements the same "max `seq` per chain over `currentFacts()`" fold that `computeChainFrontier` already computes — two independent implementations that can drift on a future edit.
  4. **`round6-tip-persistence-crash-safety.test.ts` has a ~1.4% flaky assertion.** The "corrupt file re-throws on the second read" case failed once in ~69 stress runs on Windows; passes reliably in isolation and under `--no-file-parallelism`. Looks like a parallel-worker/OS-fs-timing artifact, not a deterministic logic defect, but not fully root-caused.
  5. **`Substrate.createTemp()`/`KipRepo.close()` never delete the temp directory.** `createTemp()` `mkdtempSync`s a real OS temp dir per bare `new KipRepo()`; `close()` only unregisters from the in-process static registry. Across the test suite this leaks unboundedly — during D-36's review it accumulated tens of thousands of `kip-sdk-*` dirs and exhausted the host's `C:` drive (0 bytes free), causing spurious `ENOSPC` test failures. **This is the highest-impact item** — it actively breaks local/CI runs over time.
- **Why it is debt:** Items 1/2/4/5 are real robustness/operational gaps (item 5 already caused live disk-exhaustion incidents); item 3 is a maintainability/drift risk. None violates a named invariant and none blocked D-36's core atomicity guarantee, so they were deferred rather than expanding D-36's already-exceptional convergence further.
- **Suggested fix:** (1) Route `KeyRegistryStore`/`SelfWitnessedExcisionStore` through `writeJsonAtomic` + a guarded typed-error load. (2) Wrap `writeJsonAtomic`'s write+rename in `try/catch` that best-effort `fs.rmSync`s the temp file before rethrowing. (3) Replace `getSubstrate()`'s inline fold with a call to `computeChainFrontier` (or a shared helper). (4) Re-run the flaky test under CI-representative parallelism to establish a real base rate; add fs-read/write-ordering tracing if it recurs. (5) Have `close()` (or a test-teardown helper) `rmSync` the temp dir when it was `createTemp()`-created, and/or add a suite-level `afterAll` sweep of its own `kip-sdk-*` dirs.
- **Status:** Resolved (work item `suite-hardening`; all five items closed by real fixes, verified by the frozen guard suites `src/__tests__/temp-dir-hygiene.test.ts`, `test-timeout-config.test.ts`, `no-silent-skips.test.ts`, and the cross-OS CI guard — full kip-sdk suite green: 90 files / 679 passed / 11 skipped / 0 failed, stable across repeated runs).
  - **Item 5 (highest-impact temp-dir leak) — CLOSED.** `KipRepo.close()` now `rmSync(dir, {recursive, force})`s its substrate dir when it was `Substrate.createTemp()`-provisioned (a bare `new KipRepo()`, no explicit `dir`); an explicit-`dir` substrate is caller-owned and untouched. `close()` is idempotent (`this.substrate` is cleared; `force: true` makes an already-gone dir a no-op). Because most conformance tests use the bare `new KipRepo()` path and never `close()`, this is paired with the D-38-named **suite-level sweep**: `Substrate.createTemp()` records each dir in a `globalThis`-backed registry, and a vitest `afterEach` (`src/__tests__/setup/temp-dir-sweep.ts`, wired via `test.setupFiles`) `rmSync`s any still-present tracked dir after every test, keeping the shared `os.tmpdir()` population bounded under parallel load. **Verified:** 25 bare `new KipRepo(); assertFact(); close()` cycles now leave **0** net-new `kip-sdk-*` dirs (pre-fix: +25); a full suite run leaves ~7 (self-cleaning test dirs) rather than accumulating hundreds/thousands (~730 orphans were present before the fix).
  - **Items 1-2 (crash-safety) — CLOSED.** `KeyRegistryStore`/`SelfWitnessedExcisionStore` now `save()` via `writeJsonAtomic` (temp-file + atomic rename) and `load()` through a guarded parse throwing a typed `CorruptSideFileError` (`.code === "ERR_CORRUPT_SIDE_FILE"`, the `CorruptTipFileError` pattern D-36 established) instead of a raw `SyntaxError`. `writeJsonAtomic`'s rename is now wrapped in `try/catch` that best-effort `fs.rmSync`s the temp file before rethrowing the original error (no orphaned `.tmp-*` on a rename failure). No corrupt side-file is ever silently defaulted (N5).
  - **Item 3 (DRY) — CLOSED.** `getSubstrate()`'s per-chain max-seq reseed fold is now a call to the shared `computeChainFrontier(facts)` (both key by `chainIdFor(replicaId, publicKeyFingerprint)` and take the per-chain max `seq`), so the two implementations can no longer drift. Behavior-preserving.
  - **Item 4 (flake + timeout) — CLOSED.** `vitest.config.ts` now sets `testTimeout: 20000` (guarded to stay `>= 15000`), pinning the git-heavy conformance files (inv-12, m2-surface, rotating others) above the flaky implicit-5000 default. The named ~1.4% flake lived in `round6-tip-persistence-crash-safety.test.ts`; its root cause was the item-5 disk exhaustion producing spurious `ENOSPC`/timeout pressure — with the leak fixed and the timeout raised, `round6` + the full `conformance` dir are green across repeated stress runs (4/4). No test was weakened to achieve this.
  - Residual honestly noted: the intermittent `e2e-cli`/`e2e-mcp` subprocess-IPC flakes (a missing/late stdout JSON-RPC frame under heavy parallel load) are a SEPARATE pre-existing class — unrelated to the substrate side-files or temp-dir handling (those e2e tests drive a subprocess against an explicit `--dir`) — and are not part of D-38's scope; tracked separately if it recurs.

### D-39: `learn()` blanks `NodeView.kind` when a node's existence and its props are learned in one batch

- **Category:** Correctness / projection fidelity (active-knowledge `learn()` path)
- **Severity:** Minor (cosmetic-but-real: the node exists, keeps all props/edges, and is fully traversable — only its projected `kind` label is lost)
- **Surfaced:** During high-level manual testing of the text/markdown → graph (`learn()`) offering. A learned `person` node carrying learned props (`name`/`role`/`location`) projected `kind === ""`, while a sibling `company` node (no learned props) projected `kind === "company"` correctly. Reproduced ONLY through `learn()`'s accept path — a direct `assertFact` of the identical 6-fact set projects both `kind`s correctly.
- **Location:** `packages/kip-sdk/src/index.ts` — `KipRepo.learn()` accept-commit loop and `ensureExistenceFor()`.
- **Root cause:** `learn()`'s accept loop mints an explicit `{kind:"node", eid, nodeKind}` existence candidate directly, but `ensureExistenceFor` — invoked for a same-eid `node-prop` candidate in the SAME batch — could not observe that staged-but-not-yet-durable existence fact: its liveness probe (`getNode`/`getEdge`) only reads durably-admitted facts, and `stagedExistenceEids` tracked only eids it had itself synthesized. It therefore minted a SECOND, `nodeKind`-less `{kind:"node", eid}` existence fact that folds over the explicit one and blanks the projected `NodeView.kind`. The `company` node had no learned props, so no synthesized duplicate, so its `kind` survived.
- **Fix (applied):** Pre-seed `stagedExistenceEids` with every eid that has an explicit `node`/`edge` existence candidate in the batch, so `ensureExistenceFor` never mints a kind-less duplicate. Order-independent (covers a prop candidate appearing before OR after its explicit existence candidate). Does not affect the [[D-36]] test-(4) dedup path (two `node-prop` candidates for one fresh eid with no explicit existence candidate → the set stays empty for that eid and `ensureExistenceFor`'s own staging dedup still applies).
- **Coverage:** `packages/kip-sdk/src/__tests__/debt-closure-d39.test.ts` (3 cases: existence-before-props, props-before-existence, and a sibling-node-not-blanked case). Full kip-sdk suite green after the fix (52 files / 260 passed / 0 failed).
- **Status:** Resolved.

---

## Audit round 7 — implementation-era debt surfaced during the `fix-all` spec-completion program (M2–M9 + kip-cli / kip-mcp / graph-qa)

> After the M0–M6 build (rounds 4–6), the **`fix-all`** program drove kip-sdk to full spec completion —
> M2/M3 substrate+temporal surface, M4 retrieval, M7 acquisition, M8 security/trust/tenancy, M9 conformance,
> the ADR-B5 modularize split, and the three product surfaces (standalone `kip` CLI, standalone MCP server,
> read-only graph-QA microagent). See [`reviews/fix-all-report.md`](../reviews/fix-all-report.md) for the
> whole-program narrative (per-item convergence, critic minimums 88–93, all 10 acceptance passes PASS, final
> suite 84 files / 526 passed / 10 skipped / 0 failed, integration gate green, `package-lock.json` untouched).
> Every item's acceptance was PASS; the entries below are the honest, **non-blocking residuals** disclosed by
> those acceptance passes — accepted rather than blocking because none un-does a safety guarantee (where a
> capability is genuinely absent, the code fails loud, never fabricating). Each was verified against the
> actual current `packages/kip-sdk/src/*.ts` source before being recorded. The file layout reflects the
> modularize split: the SDK implementation now lives in `src/kip-repo.ts` (with types in `src/types.ts`),
> `src/index.ts` is a 25-line barrel, the CLI in `src/cli/`, the MCP server in `src/mcp/`, and the graph-QA
> microagent in `src/graph-qa/`.

### D-40: M8 §8.3b RetentionClass byte-accounting (`quarantinePoolBytes` / `keyChainDurableCapBytes`) has no query/inspection seam

- **Category:** Implementation / security-retention observability (honestly disclosed)
- **Severity:** Minor
- **Surfaced:** M8 (security/trust/tenancy), acceptance.
- **Location:** `packages/kip-sdk/src/kip-repo.ts` (the M8 retention/demotion path implementing the manifest's `quarantinePoolBytes` / `keyChainDurableCapBytes` caps).
- **Evidence:** The §8.3b RetentionClass byte-accounting caps (`quarantinePoolBytes`, the GLOBAL quarantine-pool aggregate bound, and `keyChainDurableCapBytes`, the per-registered-key chain cap) are honored behaviorally, but there is **no public query seam** that returns the current per-class byte accounting — only the *observable* end-to-end property "a flood never touches the trusted `/heads`" is exercised by the conformance tests. A caller cannot ask "how many bytes is the quarantine pool currently holding against its cap."
- **Why it is debt:** The retention caps are a normative part of the §8.3b byte-retention contract (they are among the four genesis-immutable manifest caps — see D-20). Without a query seam the caps are only *indirectly* testable via the flood-doesn't-reach-trusted-heads observable, so an operator cannot monitor headroom, and a future regression in the accounting (as opposed to the observable outcome) would be harder to catch. This is an observability/inspection gap, not a correctness gap — the caps themselves enforce.
- **Suggested fix:** Add a read-only accessor (e.g. a `retentionStats()` / `PackAdmin`-adjacent inspection seam) returning the current per-class byte totals against their manifest caps, and add a conformance test that asserts the accounting directly rather than only via the flood observable.
- **Status:** Open.

### D-41: M8 `kip:revoked-concurrent` has no distinct-status label — no `CellSegment` status-field seam to carry it

- **Category:** Implementation / active-knowledge status fidelity (honestly disclosed)
- **Severity:** Minor
- **Surfaced:** M8 (security/trust/tenancy), acceptance.
- **Location:** `packages/kip-sdk/src/kip-repo.ts` (the revocation/demotion projection path); `packages/kip-sdk/src/types.ts` (`CellSegment`).
- **Evidence:** The revoked-concurrent case (a value whose signing key was revoked concurrently with the value's own validity window) is handled behaviorally by demotion, but it is **not surfaced with its own distinct status label** — there is no `CellSegment` status-field seam into which a `kip:revoked-concurrent` distinct status could be written, so the case is folded into the existing demotion/untrusted vocabulary rather than being independently observable.
- **Why it is debt:** A consumer that wants to distinguish "demoted because concurrently revoked" from other demotion reasons cannot, because the projected `CellSegment` carries no field to name that reason. This is safe (the value is correctly demoted, never left trusted) but loses audit granularity that the §8 revocation model conceptually distinguishes.
- **Suggested fix:** Add a status/reason field to `CellSegment` (or an adjacent projected-status seam) that can carry a distinct `kip:revoked-concurrent` label, and thread the revocation path's reason into it, so the case is independently observable rather than merged into generic demotion.
- **Status:** Open.

### D-42: M8 governance activates per-namespace on `KeyAuthorization` presence — a documented modeling narrowing vs a strict §8.1 bright line

- **Category:** Implementation / security modeling narrowing (honestly disclosed, by design)
- **Severity:** Minor
- **Surfaced:** M8 (security/trust/tenancy), acceptance.
- **Location:** `packages/kip-sdk/src/kip-repo.ts` (the M8 governance-activation predicate keyed on `KeyAuthorization`-fact presence per namespace).
- **Evidence:** Value-trust governance (the M8 demotion / key-authorization regime) **activates per-namespace on the presence of `KeyAuthorization` facts**: a namespace that carries `KeyAuthorization` facts is governed, while a namespace with none stays **legacy-trusted** for INV-1 back-compatibility (so pre-M8 facts in an un-governed namespace continue to project as before rather than being retroactively demoted for lacking authorization).
- **Why it is debt:** §8.1 reads as a strict bright line (all value-trust flows through the key-authorization model). The implemented model **narrows** that to "governed once a namespace opts in by carrying `KeyAuthorization` facts," which is a deliberate, documented back-compat concession — but it means an un-governed namespace is trusted under the legacy rule, not the §8.1 rule, so the two are not identical. Recorded as an honest modeling narrowing, not a silent divergence.
- **Suggested fix:** Either tighten to the strict §8.1 bright line (all namespaces governed, with an explicit migration/authorization path for legacy facts) if/when back-compat can be dropped, or amend §8.1's normative text to state the per-namespace opt-in-on-`KeyAuthorization`-presence activation as the intended model so the spec and implementation agree.
- **Status:** Open.

### D-43: M4 retrieval residuals — `accessFreq` salience deferred (observer-effect), exact-cosine vector scan (no ANN), scope/tenancy narrowing deferred to M8

- **Category:** Implementation / retrieval scope narrowing (honestly disclosed)
- **Severity:** Minor
- **Surfaced:** M4 (retrieval), acceptance.
- **Location:** `packages/kip-sdk/src/kip-repo.ts` (`recall` — the vector → graph → RRF + §5.4 salience pipeline).
- **Evidence:** Three distinct, honestly-disclosed M4 narrowings: (1) the `accessFreq` salience term of §5.4 is **deferred** — there is no read-event authoring API, and `recall` must NOT emit read facts (doing so would be an **observer-effect**: reads mutating the graph they read), so the frequency-of-access salience input has no sound source yet; (2) the vector half of `recall` is an **exact cosine scan** over the candidate set (no ANN / HNSW acceleration index) — INV-5 (recall quality, measured `recall@10 = 1.0`) is satisfied by **measurement, not gamed**, but the scan does not scale like an approximate index; (3) scope / tenancy narrowing inside `recall` is **deferred to M8**'s trust/tenancy model rather than enforced at the M4 retrieval layer.
- **Why it is debt:** Each narrows the shipped `recall` relative to the full §5.4 salience formula and a production-scale retrieval target. All three are safe: the missing `accessFreq` term only omits a ranking signal (never returns wrong results), the exact scan is correct-but-unscaled, and scope/tenancy is enforced at M8 rather than skipped. But `recall` as shipped is the exact-and-small-corpus version, not the accelerated, full-salience, tenancy-narrowed one.
- **Suggested fix:** (1) Once a read-event authoring seam exists that does not induce the observer-effect (e.g. an out-of-band, non-fact access log), wire `accessFreq` into §5.4 salience. (2) Add an ANN/HNSW index behind the vector seam for corpus scale, keeping the exact scan as the conformance oracle. (3) Fold M8's scope/tenancy narrowing into `recall` so retrieval respects tenancy at the retrieval layer.
- **Status:** Open.

### D-44: graph-qa production `ask` has no in-process synthesis model — ships a host-injected `synthesize` seam and fails loud when unwired

- **Category:** Implementation / active-knowledge capability boundary (honestly disclosed, by design)
- **Severity:** Minor
- **Surfaced:** graph-qa (read-only NL question → recall/query/asOf → cite/abstain), acceptance.
- **Location:** `packages/kip-sdk/src/graph-qa/index.ts` (the read-only retrieval / citation / abstention pipeline + the host-injected `synthesize` seam); `packages/kip-sdk/src/cli/ask.ts` and the MCP `kip_ask` tool (the `ask` entry points).
- **Evidence:** graph-qa ships the **full read-only retrieval / citation / abstention pipeline** and a **documented host-injected `synthesize` seam**, but **no in-process model** — genty runs models out-of-process, so the SDK itself does not embed one. When no host synthesis model is wired, production `ask` **fails loud** via **exit-5 / `ERR_ASK_DISPATCH_FAILED`**; it never fabricates an answer to fill the gap.
- **Why it is debt:** A caller invoking `kip ask` / `kip_ask` in a process with no host-injected model gets a hard, typed failure rather than an answer — the `ask` verb is only end-to-end functional when the embedder supplies the synthesis seam. This is a deliberate capability boundary (fail-loud over fabricate, consistent with N5 no-fallbacks), not a defect, but it means "`ask` works out of the box" is false without host wiring.
- **Suggested fix:** Document the host-injected `synthesize` seam prominently at both `ask` entry points (CLI help + MCP tool description) so embedders know the seam is required, and/or provide an optional adapter that wires a genty out-of-process model to the seam so `ask` is functional in the reference deployment without bespoke host code.
- **Status:** Resolved — **ADR-B8**: the production default is now `harnessCliSynthesize` (`src/cli/ask.ts`), which spawns the already-authenticated local `claude` CLI via `node:child_process` (a Node **builtin** — the dep set stays exactly `{isomorphic-git}`, the lockfile is untouched, and no babysitter-sdk/genty/adapters module is imported, so the AC-1 boundary holds). It takes the stack's model-access **contract, not its dependency**: `claude -p --output-format json --json-schema '{answer,citations[{factId}]}' --model <resolved> --disallowedTools '…' --max-turns 3`, prompt on **STDIN** (never argv — the fact context is unbounded and Windows caps argv at ~32k), `cwd = os.tmpdir()`. Verified live end-to-end (2026-07-17): a seeded graph answered `"Tal works at a5c."` with both citations bound to real signed `factId`s and the fact-set digest byte-identical before/after. Injection remains the primary override seam, so the change is strictly additive; safety is structural, not promised (synthesis receives only `{question, facts}` and never a `Repo` — INV-A1 by construction; empty retrieval never calls the model — zero spend on a silent graph; every citation is filtered against `usedFacts`). **The debt is not "gone", it MOVED from package coupling to environment coupling** (honestly disclosed, ADR-B8 "Consequences"): `ask` now needs a `claude` binary on PATH *and* authenticated — invisible to `package.json` and CI. It degrades to the SAME loud failure it always had (`AskSynthesisUnavailableError` → exit 5 / `ERR_ASK_DISPATCH_FAILED`), never to a guess (N5): a model that returns prose instead of the `--json-schema` payload, an `is_error` envelope, or an unparseable body all FAIL rather than fabricate. Round-2 review closed the residual (D-49, both items) and hardened the seam: the QA manifest is now bundled into `dist` by a dependency-free build step — so "`kip ask` works from a build" is true, re-verified live against a CLEAN `rm -rf dist && npm run build` rather than the hand-staged `dist` the first verification used — the dispatch-failure REASON reaches the operator, citation provenance is rebound from retrieval (a real signed `factId` can no longer be bound to an invented `eid`), the abstention sentinel is not forgeable by model output, the binary is resolved explicitly (PATHEXT-aware, `.cmd`-shim-safe without `shell: true`), the child gets an allowlisted `env` and no MCP servers, and the echoed `model` names the model that actually spoke.

### D-45: kip-mcp minor gaps — keyringless write-advertising start, `kip_asof` skips the `k` bound, unhandled JSON `null`/batch frames, an orphaned import, and a manifest `asOf.validTime` type gap

- **Category:** Implementation / MCP surface robustness & protocol conformance (honestly disclosed)
- **Severity:** Minor
- **Surfaced:** kip-mcp (standalone zero-dep stdio JSON-RPC 2.0 MCP server), acceptance.
- **Location:** `packages/kip-sdk/src/mcp/server.ts` and `packages/kip-sdk/src/mcp/index.ts` (server lifecycle, tool dispatch, JSON-RPC frame handling); the `kip_asof` tool's recall sub-read; the manifest `asOf.validTime` type.
- **Evidence:** A cluster of small, independently-confirmed gaps: (1) a **write-advertising server can start keyringless** — the server can come up advertising write tools without a keyring present, so a write attempt would only fail later rather than being refused at start; (2) `kip_asof`'s recall sub-read **skips the `k` bound** — the `k` result-count limit passed for a normal recall is not threaded into the asOf-scoped recall sub-read; (3) JSON `null` frames and JSON-RPC **batch frames are dropped without emitting a `-32600` (Invalid Request)** error, so a malformed/batch frame is silently ignored rather than rejected per JSON-RPC 2.0; (4) an **orphaned `join` import** remains after refactoring; (5) a manifest `asOf.validTime` type **dropped the `"number"` member**, narrowing the accepted type below what callers may supply.
- **Why it is debt:** Items 1–3 are correctness/protocol-conformance gaps at the MCP surface: the keyringless start defers a write refusal that should happen at startup, the missing `k` bound lets an asOf recall return more than the caller asked for, and the dropped-frame handling is a JSON-RPC 2.0 conformance miss (a compliant server must answer a malformed request with `-32600`). Item 4 is dead code; item 5 is a type-surface narrowing that could reject a valid `number` `validTime`. None crashes the server, but each is a small faithfulness/robustness gap in a surface advertised as JSON-RPC 2.0.
- **Suggested fix:** (1) Refuse to start (or refuse to advertise write tools) when write tools are enabled but no keyring is present. (2) Thread the `k` bound into `kip_asof`'s recall sub-read. (3) Emit `-32600` for `null` / batch / otherwise-malformed frames instead of dropping them. (4) Remove the orphaned `join` import. (5) Restore `"number"` to the manifest `asOf.validTime` type.
- **Status:** Open.

### D-46: graph-qa / kip-cli minor gaps — `assert node`/`assert edge` stamped-echo emits `null` `id`/`hlc`/`seq`; `manifestGenesisCid` is a sha256 of `manifest.json` (no genesis-CID accessor)

- **Category:** Implementation / CLI echo faithfulness & manifest identity (honestly disclosed)
- **Severity:** Minor
- **Surfaced:** kip-cli / graph-qa, acceptance.
- **Location:** `packages/kip-sdk/src/cli/kip.ts` (the `assert node` / `assert edge` command echo path); `packages/kip-sdk/src/kip-repo.ts` (`putNode` / `putEdge` return shape; `manifestGenesisCid` derivation).
- **Evidence:** Two small faithfulness gaps: (1) the CLI's `assert node` / `assert edge` **stamped-echo emits `null` for `id` / `hlc` / `seq`** — because `putNode` / `putEdge` return **only an EID** (not the full stamped `id` / `hlc` / `seq` triple that `assertFact` / `retractFact` echo back per the round-3 SDK-ergonomics widening), so the CLI has nothing to print for those fields and prints `null`; (2) `manifestGenesisCid` is derived as the **sha256 of `manifest.json`**, because there is **no genesis-CID accessor** exposing a real genesis commit CID — the same underlying "no real regenerated commit object to name" gap family as D-27/D-30, here surfacing at the manifest-identity level.
- **Why it is debt:** (1) A user running `kip assert node`/`assert edge` sees `id: null, hlc: null, seq: null` in the echo, which reads as "the write didn't get stamped" when in fact the node/edge WAS admitted (only its EID is returned) — a misleading echo, not a failed write. (2) `manifestGenesisCid` presents a hash-of-the-manifest-file as if it were a genesis commit CID; it is stable and comparable but is not a git-resolvable genesis object id (mirrors D-30's `tip` semantics gap).
- **Suggested fix:** (1) Either have `putNode`/`putEdge` return the full stamped `id`/`hlc`/`seq` (matching `assertFact`/`retractFact`'s echo) so the CLI can print real values, or have the CLI omit those fields for node/edge asserts rather than printing `null`. (2) Add a genesis-CID accessor that returns a real genesis commit id once ADR-B1's isomorphic-git regeneration produces one (see D-27), or document `manifestGenesisCid`'s semantics as a manifest-file digest (not a commit CID), the way D-30 renamed `tip`'s semantics.
- **Status:** Open.

### D-49: the ADR-B8 live `ask` path was undiagnosable in the built CLI — the QA manifest was never bundled into `dist`, and the dispatch-failure REASON was dropped on the floor

- **Category:** Implementation / packaging + failure diagnosability (surfaced while verifying ADR-B8 live)
- **Severity:** Major — **reclassified from Minor by the round-2 review, and the reclassification is the point.** Neither item can produce a wrong answer (both are loud failures), so "costs diagnosis time, not correctness" is true as far as it goes. But item (1) meant the **shipped artifact did not do the thing this work exists to do**: the BUILT `kip ask` died at `ERR_UNREGISTERED_MANIFEST` for every consumer, so ADR-B8's headline consequence ("`kip ask` genuinely answers") and D-44's `Resolved` were false outside a hand-staged `dist` — while the fix was ~5 dependency-free lines, cheaper than this register entry documenting it. Self-rating that Minor under-classified it. Filing a hand-staged demo asset as debt is the pattern review exists to catch; recording the correction here rather than quietly re-rating it is the honest form.
- **Surfaced:** graph-qa-live (D-44 closure), the real end-to-end `kip ask` sanity check.
- **Location:** `packages/kip-sdk/package.json` (`"build": "tsc"`); `packages/kip-sdk/src/cli/ask.ts` (`resolveQaManifest`, `defaultDispatchMicroagent`'s catch); `packages/kip-sdk/src/types.ts` (`MicroagentResult`).
- **Evidence:** Both hit for real while running the ADR-B8 live sanity check against the BUILT CLI. (1) **The manifest is not bundled.** `resolveQaManifest` reads `join(__dirname, "microagents", "graph-qa", "microagent.json")` — i.e. `dist/cli/microagents/graph-qa/microagent.json` — but `npm run build` is bare `tsc`, which copies no JSON, and there is no bundling step (`scripts/` holds only `check-doc-links.mjs`). A built `kip ask` therefore dies at `ERR_UNREGISTERED_MANIFEST` ("the kip CLI bundle is incomplete") **before any retrieval or model call**. The frozen suites never catch it: `graph-qa-live.test.ts` / `graph-qa.test.ts` read the manifest from the **`src`** path, and every `kip-cli` / `kip-mcp` ask test injects its own manifest. The live verification only proceeded after manually staging the JSON into `dist`. (2) **The reason is dropped.** `harnessCliSynthesize` throws a precisely-worded `AskSynthesisUnavailableError` (e.g. "the claude CLI did not return a usable answer — its `result` is not the JSON payload the --json-schema requires"), but `defaultDispatchMicroagent`'s catch maps EVERY non-`ERR_MALFORMED_INPUT` throw to a bare `{ exitCode: 1, output: {…empty} }`, and that reason was dropped on the floor. **Round-2 correction — this entry's original framing was wrong:** it blamed "the `MicroagentResult` contract" for having "no field to carry it", but `MicroagentResult.output` is typed `unknown` (`src/types.ts`) — entirely free-form — and the graph-QA `outputSchema` is **kip's own**. Carrying the reason on `output.error` invents no genty field and needed no contract change; the deferral rested on a constraint that did not exist. The operator sees only `kip: graph-QA dispatch failed (exitCode 1)`; recovering the actual cause required a bespoke script calling `answerQuestion` + `harnessCliSynthesize` directly.
- **Why it is debt:** Together they make the one failure mode ADR-B8 knowingly accepts (environment coupling: `claude` must be on PATH **and** authenticated **and** honor `--json-schema`) maximally expensive to diagnose. (1) means "`kip ask` works from a build" is false without a bundling step; (2) means every distinct cause — no binary, expired token, prose instead of structured output, envelope quirk, timeout — collapses into the single opaque string `exitCode 1`. Real instance: on the verification machine two `claude` installs sit on PATH, and node's extensionless PATH search resolves `~/.local/bin/claude.exe` (2.1.186 — ignores `--json-schema`, returns prose) rather than the npm build (2.1.195 — honors it, and is what ADR-B8 verified against); the seam correctly refused the prose (N5, exit 5) but reported nothing an operator could act on. The exit-5 channel and the no-fabrication guarantee are CORRECT throughout — only the diagnosis is missing.
- **Suggested fix:** (1) Add a dependency-free bundling step (`node scripts/bundle-microagents.mjs` using `fs.cpSync`, chained after `tsc`) that copies `src/cli/microagents/**` into `dist/cli/microagents/**`, and assert the built artifact resolves (a test over the `dist` path, or a `resolveQaManifest` test that does not read from `src`); confirm the monorepo's `tsc -b` build orchestration also runs it. (2) Give the dispatch-failure channel a REASON without inventing genty fields: either surface it in the graph-QA `output` (the `outputSchema` is kip's own), or have the CLI/MCP `ask` path call `answerQuestion` such that the typed `AskSynthesisUnavailableError.message` survives to `AskOutcome.message` (`runAsk` already propagates a thrown dispatch error's message verbatim — only the in-process default dispatcher swallows it by converting the throw into an `exitCode`). Also consider having `probeHarnessCli` report the resolved binary + version, so a PATH-shadowed/stale `claude` names itself.
- **Status:** Resolved (round-2 review, both items — neither was legitimately deferrable). **(1) The manifest is now bundled.** `scripts/bundle-microagents.cjs` (dependency-free, `node:fs` `cpSync` only — ADR-B6 holds, the lockfile is untouched) copies `src/cli/microagents/**` → `dist/cli/microagents/**`, chained as `"build": "tsc && node scripts/bundle-microagents.cjs"`, mirroring babysitter-sdk's `scripts/copy-template-assets.cjs`, which solves the identical problem. The root `build:kip` runs the package `build` script, so the monorepo path picks it up; there is no separate `tsc -b` orchestration for this package to miss it. Verified against a genuinely clean build (`rm -rf dist && npm run build`), not a hand-staged `dist`: the manifest lands in `dist/cli/microagents/graph-qa/` and the BUILT `kip ask` answers live. Three frozen tests now read through the **DIST** path (the src-reading suites structurally could not): they run the real bundler, assert the dist manifest equals the src artifact, assert the named `runtime.entrypoint` is bundled beside it, and pin that `package.json`'s `build` script actually CHAINS the bundler — a bundler that exists but never runs is precisely the shipped defect. **(2) The reason now reaches the operator.** `defaultDispatchMicroagent`'s catch returns `{ exitCode: 1, output: { …, error: e.message } }` and `runAsk`'s `exitCode !== 0` branch appends it, so "no binary / expired token / prose instead of structured output / envelope quirk / timeout" are distinguishable instead of collapsing into `graph-QA dispatch failed (exitCode 1)`. It stays strictly a DIAGNOSTIC on the failure channel — that branch returns no answer at all, so an error string can never become prose (N5). **Also closed here:** the PATH-shadowing note in this entry's own Evidence. Binary resolution is now explicit and PATHEXT-aware (`resolveHarnessBinary`), so on the verification machine the resolved binary is the npm shim `~/.nvm/.../claude.cmd` (2.1.195 — honours `--json-schema`) rather than the stale `~/.local/bin/claude.exe` (2.1.186 — ignores it, returns prose) that a bare-name CreateProcess search silently preferred; the probe's reason names the resolved path, and `KIP_CLAUDE_BIN` overrides it explicitly. See round-2 finding #4. **Round-3 follow-up (`e2e-binaries`, D-49(2) MCP tail):** item (2)'s original fix wired the reason through the CLI `runAsk` path only — the MCP `kip_ask` handler (`src/mcp/index.ts`) still threw `AskDispatchError(\`graph-QA dispatch failed (exitCode ${result.exitCode})\`)` on its `result.exitCode !== 0` branch, discarding the same `output.error` reason `runAsk` reads. It now runs the identical `askDispatchFailureReason(result.output)` read and appends the reason to the `ERR_ASK_DISPATCH_FAILED` message, so an MCP consumer sees the real cause too (covered by a new `kip-mcp.test.ts` criterion-18 case). Both surfaces are now symmetric; D-49(2) is fully closed.

### D-50: conformance suite — 3 previously-skipped markers UN-SKIPPED (now passing); 7 remain genuinely-untestable-as-scaffolded (missing public inspection / schema-registration / perturbation seams)

- **Category:** Test coverage / conformance-scaffolding gap (honestly disclosed, tracked by inline `// SKIP-REASON:` tags)
- **Severity:** Minor
- **Surfaced:** work item `suite-hardening` (the `no-silent-skips.test.ts` guard), triaging the pre-existing `it.skip` markers so no skip is silent.
- **Round-2 re-audit (each of the original 10 skips was re-run with `.skip` removed against the CURRENT source, not the frozen pre-implementation text):** the frozen skip reasons had drifted for THREE markers whose enabling seam had since landed. Those three are now **un-skipped and passing** through the public surface:
  - **inv-8 (`inv-8.test.ts`) — quarantine variant.** The `CellSegment` union now has a `kind:"quarantine"` variant (`reason:"unknown-version"`) produced by `proj.ts`'s `reduceRawCell` for any winner whose `v` exceeds `knownMaxVersion` (default 1), reachable from a bare `new KipRepo()` via `getNode`. The test now asserts the typed quarantine segment directly. (The frozen reason falsely claimed "no fourth `quarantine` variant exists".)
  - **inv-7 (`inv-7.test.ts`) — `pncounter` selection.** `KipRepo`'s public constructor exposes a `cellReducers` `(cellKey) -> CellReducerRef` map threaded through every proj fold by `reduceCellByRef`; a test now SELECTS `pncounter` for a cell and asserts the summed total is N not 2N (a value the default `lww-hlc` fold cannot produce). (The frozen reason falsely claimed "a reducer cannot be SELECTED from the public surface".)
  - **inv-3 (`inv-3.test.ts`) — non-default reducer selection.** Same `cellReducers` seam; a test now SELECTS `gset` and asserts its union folds deterministically (byte-identical across opposite ingest orders on two replicas).
- **Location (remaining 7 skips):** `packages/kip-sdk/src/__tests__/conformance/inv-{1,2a,3,4,7a,8,9}.test.ts` — 7 static `it.skip(...)` markers, each carrying an inline `// SKIP-REASON:` tag referencing this entry (and, for inv-9, the roadmap task that owns its deferral).
- **Evidence & scope (remaining 7):** Each remaining skip documents an invariant sub-clause that is **genuinely unreachable through the current public `Repo`/`KipRepo`/`OpenOptions` surface** (verified by re-running with `.skip` removed — no real body can be written), and inventing the missing seam is out of scope for this hardening work. The gaps cluster into three families: (a) **no rxFrom-stamp / simulated-receiver-clock / key-registration-arrival injection seam** — inv-1, inv-2a, inv-4 (INV-1/INV-2/INV-4 also name receiver-side perturbation axes the tests cannot construct; the reachable ingest/delivery-order axis IS exercised); (b) **no ontology/schema-registration (per-KIND) seam** (`NodeKindDef`/`EdgeKindDef`/`PropSchema`/`defineNodeKind`) — inv-8's SECOND skip only (a later schema version adding a REQUIRED prop an older fact omits cannot be constructed; there is no declared-required field to test "never invents missing required data" against — note the per-CELL-KEY `cellReducers` seam does NOT close this, it selects a reducer, it does not declare a schema); (c) **no public store-inspection / `orderKey(fact)` seam** — inv-7a ("exactly one `/facts` blob per distinct CID"), inv-3's remaining skip (orderKey totality) — only the observable consequence is checked. inv-9's deferral is different in kind: **only its gc/repack half remains** — carried by roadmap task T13.4 (Packing & GC of unreachable objects, post-M3 E13 tooling, `docs/81-roadmap-epics-and-tasks.md`), with no gc/repack/pack method on the public surface. Its ROLLUP half is NO LONGER deferred: `rollup()` is now implemented and its result-stability is covered by the sibling `inv-9-m3-surface.test.ts` (the frozen reason's "rollup() still throws `unimplemented`" was stale).
- **Why it is debt:** these are real conformance-coverage gaps (a sub-clause of each named invariant is not independently pinned), but none is a logic defect and none can be closed without adding public API surface the milestone does not scope. Recording them as tagged, tracked skips converts a set of silent `it.skip`s into an auditable gap register; the `no-silent-skips.test.ts` guard pins the property so a future silent skip cannot creep back in.
- **Suggested fix:** close each remaining family when its enabling seam lands: a test-only rxFrom/receiver-clock injection seam (family a); a per-KIND ontology/schema-registration API with required-prop declarations (family b); a read-only store-inspection accessor and/or an exported `orderKey(fact)` (family c); and T13.4's gc/repack machinery (inv-9's gc/repack half). Un-skip each marker as its seam becomes available and delete its `// SKIP-REASON:` tag.
- **Status:** Open (tracked). 3 of the original 10 markers (inv-8 quarantine, inv-7 pncounter, inv-3 reducer-selection) were **un-skipped and now pass** as part of the round-2 re-audit; 7 remain genuinely deferred, each tagged and none silent. The re-audit ran each of the 10 with `.skip` removed against current source, so the surviving 7 reasons reflect the TRUE absent seam (not frozen pre-implementation text).

### D-51: CLI has no keygen/identity-bootstrap command — writing from the CLI requires hand-creating keyring.json via the SDK

- **Category:** Implementation / CLI ergonomics (developer experience gap; not a correctness defect)
- **Severity:** Minor
- **Surfaced:** docs-consumer convergence round 1 (three doc critics + the executable-example gate independently found the CLI/MCP write quickstart dead-ends at `keyring required to author facts` / exit 3).
- **Location:** `packages/kip-sdk/src/cli/index.ts` (`cmdInit` — creates genesis but writes no `keyring.json`; the command list is init/open/assert/retract/get/query/recall/asof/fsck/rollup/sync/ask — no `keygen`); `packages/kip-sdk/src/cli/resolve.ts:44-49` (`resolveKeyringPath` — the `<dir>/keyring.json` default counts only "if present"); `resolve.ts:123-127` (`resolveRepo` with `requireKeyring: true` throws `keyring required to author facts` → exit 3). The only supported way to produce the file is the SDK (`generateEd25519KeyPair()` → export PEM, or `KipRepo.exportKeyring()` — `kip-repo.ts:774`).
- **Evidence:** A newcomer who runs `kip init --create` then `kip assert node ...` hits exit 3, because `kip init` persists no key and no CLI command creates one. Every CLI/MCP **write** surface (`kip assert`, `kip retract`, `kip sync --push`; MCP `kip_assert`/`kip_retract`/`kip_sync`) is therefore unreachable from the binaries alone — the reader must drop to a Node/SDK script to mint `{ privateKeyPem, publicKeyPem }` and write it to `<dir>/keyring.json` (or point `--keyring`/`KIP_KEYRING` at it). Verified against the built binary: after `node make-keyring.mjs` writes the file, `kip assert node --eid ada ...` exits 0 and `kip get ada --json` returns the `NodeView`.
- **Why it is debt:** The write journey is a hard dead-end from the CLI/MCP surface as shipped — the one bootstrap step the binaries need is the one step they cannot perform. It is a pure ergonomics gap (the SDK workaround is small and now documented), not a correctness bug: nothing produces a wrong result, and the failure is loud (exit 3 with an actionable message). This entry is the honest disclosure the consumer docs point at wherever they hand the reader the SDK workaround.
- **Suggested fix:** Add a first-class bootstrap command — `kip keygen [--out <path>]` that writes a fresh `{ privateKeyPem, publicKeyPem }` keyring to `<dir>/keyring.json` (or a `--with-keyring` flag on `kip init` that emits genesis **and** a keyring in one step, guarded so it never overwrites an existing key). Until then, the documented workaround (a tiny SDK script using `generateEd25519KeyPair()` / `exportKeyring()`) stands; see [Getting started → Signing keys and a stable identity](./guide/getting-started.md#signing-keys-and-a-stable-identity).
- **Status:** Open (documented workaround in place). The dead-end is fully documented across the consumer doc set — the CLI ([cli.md](./guide/cli.md#creating-a-keyring)), MCP ([mcp.md](./guide/mcp.md#creating-a-keyring)), README terminal quickstart, and the canonical how-to ([getting-started.md](./guide/getting-started.md#create-a-keyringjson-for-the-cli--mcp)) — each of which references this entry so the reader knows the hand-rolled step is a tracked rough edge. No code was changed (docs-only convergence round).

---

## Audit round 8 — the `kip-mature` program (maturity, test & documentation)

> The **`kip-mature`** program took kip-sdk from spec-complete-but-undocumented-and-CLI-untested to
> **demo-ready**: a live `kip ask` (ADR-B8 model wiring), real-binary e2e (CLI + MCP), a hardened suite, and
> full consumer/maintainer/integration docs. See [`reviews/maturity-report.md`](../reviews/maturity-report.md)
> for the whole-program narrative (per-item convergence, critic minimums 88–93, all 6 acceptance passes PASS,
> the cold-built live-demo transcript, final suite 91 files / 684 passed / 8 skipped / 0 failed). This program
> **resolved [[D-44]]** (`kip ask` answers live — ADR-B8 / `graph-qa-live`), **[[D-38]]** (temp-dir leak —
> `close()` `rmSync` + `afterEach` sweep, verified 0 net-new leak / `suite-hardening`), and **[[D-49]]** (both
> tails — the `dist` manifest is bundled by a dependency-free build step, and the dispatch-failure reason now
> reaches the operator on both the CLI and the MCP `kip_ask` surface, the latter closed in `e2e-binaries`);
> **[[D-50]]** (7 deferred conformance skips) and **[[D-51]]** (no `kip keygen`) remain Open/tracked. The one
> new residual it surfaced — a real retrieval-brittleness limitation found by the live demo itself — is D-52.

### D-52: graph-QA retrieval is content-seed-brittle — `kip ask` abstains on genuine free-text questions unless a `content` prop mirrors the query verbatim

- **Category:** Implementation / retrieval robustness (honestly disclosed, surfaced by the live demo)
- **Severity:** Minor (safe — abstains, never guesses — but the headline `ask` verb is not yet robust for real NL)
- **Surfaced:** `kip-mature` Phase C — the cold-built end-to-end **live demo** (`kip ask`, `KIP_ASK_LIVE=1`, haiku, exit 0). The demo answered correctly and cited a real signed `factId`, but only **after** a `content` prop equal to the question verbatim was seeded onto the graph; without that seed the same `ask` abstains.
- **Location:** `packages/kip-sdk/src/kip-repo.ts` (`recall` — the vector → graph → RRF + §5.4 salience pipeline, specifically its **text-seed** path); consumed by `packages/kip-sdk/src/graph-qa/index.ts` (the read-only retrieval → cite/abstain pipeline) and the `ask` entry points (`src/cli/ask.ts`, the MCP `kip_ask` tool).
- **Evidence:** `recall`'s text path is **exact-content-seed matching** — it locates a fact by matching the query text against a fact's `content` prop, not by semantic similarity or fuzzy/lexical text retrieval. In the live demo, `kip ask "…"` returned an answer only once a `content` prop **equal to the question verbatim** had been added to the graph; on a graph carrying the same facts **without** that mirror prop, retrieval found nothing and the graph-QA pipeline correctly **abstained**. So `kip ask` is end-to-end demonstrable today only with a content-seed that pre-encodes the question.
- **Why it is debt:** The whole point of the `ask` verb is answering **genuine free-text natural-language questions** against the graph. As shipped it can only answer when the corpus already contains a `content` prop that mirrors the question — a condition a real NL consumer will almost never satisfy — so in practice `ask` abstains on real questions. This is **safe** (cite-or-abstain holds; it never fabricates and never returns a wrong fact) and is distinct from D-43's *vector*-half exact-cosine/no-ANN narrowing: D-43 is about scale of the vector scan, D-52 is about the **text-seed retrieval being exact-match rather than semantic/lexical**, which is what makes free-text `ask` brittle. It is the honest limitation the maturity demo disclosed rather than hid.
- **Suggested fix:** Give the graph-QA retrieval **real semantic or text retrieval** so `ask` is robust for actual NL questions — either wire the embedding/vector seam through the text path (so `content`/prop text is embedded and matched by similarity, reusing the M4 vector infrastructure) or add proper lexical/fuzzy text retrieval (e.g. tokenized/BM25-style matching) in place of the exact-content-seed equality check. Until then, `kip ask` is demo-able only with a content-seed and should be documented as such wherever it is presented as answering free-text questions.
- **Status:** **Resolved** — closed by the **`text-autoencoder`** program (audit round 10). The *lexical* half
  of the suggested fix shipped as deterministic recall lexical seeding (commit `55afa73be`), and graph-QA now
  hydrates and **cites** edge props (commit `af45ed046`), so `kip ask` answers over a `kip learn`-produced
  graph instead of abstaining by construction — the live-demo failure that surfaced this debt is closed. The
  D-52 deliverable for this release (make free-text `ask` answer over a learned graph) is met; the residuals
  documented under "D-52 residual — what is STILL OPEN" below are **not** invented-away — they are **promoted
  to their own standalone tracked entries**: the *semantic/embedding* half → **[[D-57]]**, the free-text-only
  subject retrieved-then-abstained → **[[D-59]]**, and the cross-document contradiction no longer surfacing as
  `kip:conflict` → **[[D-60]]**. (The residual subsection below is retained verbatim as the evidence record
  for those promotions.)

#### D-52 closure note — what is FIXED

`recall`'s text path is no longer exact-`content` equality. `computeRecall` now builds, for every
candidate node, a **searchable surface** (`recallSurfaceTerms`) from its `eid` **with the `kip learn`
`doc:<blob-oid>#` namespace stripped**, its node `kind`, **every prop KEY**, the string form of every
prop VALUE covering the query's resolved gate instant (via the SAME `coveringPropValue` read, so
valid-time/`asOf` semantics are byte-for-byte unchanged; `null`/`BlobRef` values contribute nothing,
though their key is still indexed), and the `EdgeKind` of **every as-of-valid incident edge**. Query
and surface are tokenized identically by one shared tokenizer (`src/text-terms.ts`) — explicit
`toLowerCase()` (never locale-sensitive), runs of ASCII alphanumerics, a small fixed stopword set —
and a node scores by the count of **distinct** query terms it matches. Seeds are ordered
`(score desc, eid asc)`, truncated to `k`, and carry that order into their hop-0 graph rank. The path
is a pure function of the fact set + query: no clock, no randomness, no Map-iteration-order or locale
dependence — two replicas holding the same facts return the identical ranked list (pinned by
`src/__tests__/debt-closure-d52.test.ts`).

**The seeding predicate (round-3, the ACTUAL bar).** A candidate is a seed **iff** it is the exact
`props.content === q.text` match **OR its own surface matches ≥1 distinct query term**. The bar is
**LOCAL to the candidate** — whether node X is seeded never depends on any other node in the graph
(retrieval locality, pinned by the non-locality property test in `debt-closure-d52.test.ts`). This is
the round-3 correction of the round-2 note, which read "Zero matching terms ⇒ not a seed" with no
mention of any bar: round 2 in fact shipped a graph-GLOBAL third bar (`bestMatched >= 2` — admit a
single-term match only if *some other* node matched ≥2 terms). That bar was a **retrieval
regression**: on a repo holding `zara` (`name:"Zara"`, `employer:"Acme Corp"`),
`recall({text:"Where does Zara work?"})` and `recall({text:"Zara employer"})` both returned `[]`
though the entity was right there, while `recall({text:"Who is Zara?"})` returned `["zara"]` — so
adding true, relevant terms DESTROYED retrieval; and ingesting one unrelated node containing "zara
work" flipped the first query to return the irrelevant node FIRST. A silent false-negative abstention
is itself a "surfaced, never silent" violation (docs/27 §0). The fabrication guard that bar reached
for now lives where it can be evaluated — graph-QA's **subject-anchoring relevance check on the
retrieved evidence** (kip-graph-qa.md §6.1b) — not in the retrieval floor.

**Round-4 amendment — the anchoring surface is WIDENED (finding #1).** Round 3's anchoring surface was
IDENTITY-ONLY (`eid`/`kind`/`EdgeKind`s + the values of `name`/`title`/`label`). That reintroduced a
silent false-negative in the SAME "surfaced, never silent" direction: a question keyed on a prop KEY
or a STRUCTURED prop value — "Who is the CEO?" answered by `role:"CEO"`, "What is the status?" answered
by `status:"blocked"` — retrieved and hydrated the backing signed fact and then abstained, because the
answer term appeared in no identity value. Round 4 widens the surface to also include every prop/
edge-prop KEY and every STRUCTURED (string/number/boolean) prop VALUE, while STILL excluding free-text
VALUES (`content`/`description`/`summary`), so the Zara-absent fabrication guard (§8.4) keeps abstaining.
Pinned both directions in `graph-qa.test.ts` (round-4 §6.1b): the CEO/status questions ANSWER, and a
query term living ONLY in a free-text value still ABSTAINS.

**Backward compatibility:** an exact `props.content === q.text` match is still a seed and is given a
dominant boost (`RECALL_EXACT_CONTENT_BOOST`) that exceeds any achievable distinct-term score, so it
still ranks first — including when the query is entirely stopwords and tokenizes to nothing. The
vector/embedding half is untouched.

Consequence: the live-demo failure is closed. A `kip learn`-produced graph (nodes with
`name`/`description` props and typed edges, **no** `content` prop) is now discoverable —
`recall({ text: "which team owns Ledger", k: 10 })` returns the Ledger and owning-team nodes instead
of `[]`, so `kip ask` composes to an answer rather than a guaranteed abstention.

#### D-52 residual — what is STILL OPEN

This is **keyword matching, not semantic retrieval.** Concretely, still missing:

- **No embedding/semantic similarity on the text path.** A question that shares **no lexical term**
  with the graph still retrieves nothing and `ask` still abstains — e.g. asking about "revenue
  recognition" over a graph that only ever says "booking settlement". Synonyms, paraphrase,
  morphology (`owns`/`ownership`), and translation are all misses. The vector half remains inert
  unless the caller supplies `q.embedding` (kip deliberately never embeds the query, N2/N5), so
  nothing closes this gap today.
- **No relevance weighting.** Scoring is a flat count of distinct matched terms — no IDF/BM25, so a
  common term counts exactly as much as a highly discriminative one, and long documents are neither
  penalized nor normalized.
- **No stemming/lemmatization, no fuzzy matching**, and the stopword set is small, closed, and
  English-only.
- **Non-ASCII text is not tokenized.** The `[a-z0-9]+` tokenizer drops CJK and any non-Latin script
  entirely, so those graphs remain undiscoverable by the text path.
- **Recomputed per call** — the surface index is rebuilt on every `recall`, like the vector half
  (see D-43); there is no persisted inverted index.
- **Prop keys and edge kinds widen the surface (round-3).** Indexing prop KEYS and incident EDGE
  KINDS is what lets relation words anchor a match, but it also means a common schema key (`name`,
  `status`) or edge kind matches uniformly across a graph and carries little discriminating signal —
  the flat term-count scoring above does not down-weight it (no IDF). It is a recall win with a
  precision cost, contained only by the `k` cap and the graph-QA subject-anchoring check.
- **The graph-QA anchoring check still excludes free-text VALUES (round-4).** The §6.1b surface indexes
  `eid`/`kind`/`EdgeKind`s/prop KEYS/STRUCTURED values but NOT the values of `content`/`description`/
  `summary` — the exclusion that keeps the §8.4 fabrication guard abstaining. The honest residual: a
  subject that a graph names ONLY inside a free-text blob (never in its `eid`/`kind`/`name` or a
  structured prop) will be lexically retrieved by `recall` but then abstained on by graph-QA, because
  the subject term is absent from the anchoring surface. This is the deliberate precision/recall
  trade-off that separates "the subject is genuinely present" from "a relation word coincidentally
  appears in unrelated prose"; closing it for the free-text-only-subject case needs the semantic
  retrieval the first residual above names, not a wider lexical surface (which would reopen §8.4).
- **Cross-document contradictions do not surface as `kip:conflict` (round-3, cross-ref ADR-B10d).**
  The `doc:<blob>#` eid namespace that makes retrieval local also makes two documents' facts about the
  same real-world entity DISJOINT cells, so a genuine A-vs-B disagreement is stored as two
  non-conflicting facts rather than one surfaced `kip:conflict`. Resolving it needs an explicit
  cross-document entity-resolution/`same_as` layer that no bundled learn role performs.

Closing the residual means wiring real semantic retrieval (embed the corpus surface and match by
similarity through the existing §5.3 accelerator seam) — that remains the open half of this item.

---

## Audit round 9 — the `code-analysis-miner` program (bash-tool code-analysis Miner)

> The **`code-analysis-miner`** program added a real, first-class **code-analysis Miner** to kip-sdk — a
> bundled `code-miner@1.0.0` `MicroagentManifest`, a `codeMinerDispatch: DispatchMicroagentFn`, and a new
> `kip index <path>` CLI verb — as an **M7 acquisition-family** addition (ADR-B9 / B9a / B9b / B9c). It reuses
> the existing `runAcquisition` orchestrator seam (no new write path); the one core change threaded an
> optional `dispatchMicroagent` through `OpenOptions` → `open()` → `KipRepo`, and **INV-A1 holds structurally**
> (the miner never receives a `Repo`/write seam; only `runAcquisition` authors signed facts). See
> [`reviews/code-miner-report.md`](../reviews/code-miner-report.md) for the whole-program narrative (3 TDD
> rounds, minimums R1=72 → R2=81 → R3=89 vs target 88, per-critic R3 spec-fidelity 89 / tooling-honesty 90 /
> code-quality 94, acceptance PASS, and the cold-CLI live demo that authored **41 signed code facts** from the
> graph-qa source using the guaranteed tier alone). The integration gate PASSED (`build:sdk` + kip build +
> full kip test 692 passed / 8 skipped / 93 files + `verify:metadata`, all green; `package-lock.json`
> untouched; zero new runtime deps). This round adds **four** new residuals surfaced by the program: D-53
> (probed-tier lacks automated coverage / live-gated), D-54 (ast-grep/tsc/eslint declared-but-no-extractor),
> D-55 (newline-LOC off-by-one without trailing newline), and D-56 (`runAcquisition` swallows the miner's
> verbatim error). D-53 and D-56 were surfaced structurally; the live demo also fixed and re-verified two
> further demo-only defects (`kip index <subdir>` ENOENT; `--include`/`--exclude`/`--git-sha` unregistered in
> the arg parser) that are closed and therefore not filed as debt.

### D-53: code Miner probed/accelerator tier is live-gated (`KIP_INDEX_TOOLS`) and has no automated coverage

- **Category:** Test coverage / accelerator-class gap (honestly disclosed; accelerator-class §5.3)
- **Severity:** Minor
- **Surfaced:** `code-analysis-miner` — the guaranteed tier is fully covered and demo-verified; the probed
  tier is exercised only opportunistically (live demo used `rg` under `KIP_INDEX_TOOLS=1`), never in an
  automated suite.
- **Location:** the code Miner's probed-tier path (rg / tokei / scc / cloc / ast-grep / tsc / eslint), gated
  behind the `KIP_INDEX_TOOLS` environment flag; `packages/kip-sdk/src/cli/index.ts` (`kip index`) and the
  `code-miner` dispatch.
- **Evidence:** The probed tier only runs when `KIP_INDEX_TOOLS` is set **and** the external tool is present
  on the machine, so no frozen test in the suite reaches it — the automated coverage is entirely over the
  guaranteed tier (git + Node builtins). The probed tier was validated only manually, by the live demo, which
  genuinely used `rg` and recorded `skipped:<tool>` for the absent tools. Like every other accelerator-class
  seam in this project, its live behavior is **measured**, not gamed, but it is not pinned by an automated
  test.
- **Why it is debt:** A whole tier of the Miner (the accelerator/probed metrics) ships without automated
  coverage, so a regression in the probe-and-skip-with-reason (N5) behavior — an absent tool silently
  producing a fabricated metric instead of `skipped:<tool>`, or first-available-wins arbitration for the
  shared `linesOfCode` cell regressing — would not be caught by the suite. This is safe (the guaranteed tier
  is fully covered and always authors real facts; the probed tier only *adds* honestly-skipped metrics) but
  it is an honest coverage gap.
- **Suggested fix:** Add automated coverage for the probed tier that does not depend on the host having the
  external tools installed — e.g. a fake-`PATH` / injected-probe seam that asserts (a) an absent tool records
  `skipped:<tool>` and never a fabricated metric, and (b) first-available-wins arbitration for the shared
  `linesOfCode` cell — so the probed tier's N5 behavior is pinned regardless of the CI machine's toolchain.
- **Status:** Resolved — the probed tier's three host-dependent primitives (tool resolution, `--version`
  probe, synchronous run) plus the opt-in env are now an injectable `CodeMinerProbeSeam`
  (`src/miner/code-miner.ts`); production passes `DEFAULT_PROBE_SEAM` (the real ask.ts helpers + `process.env`),
  so shipped behavior is byte-identical. A HERMETIC test (`src/__tests__/code-miner-debts.test.ts`) injects a
  fake seam — no real subprocess, no `KIP_INDEX_TOOLS` — and pins the N5 behaviors: a present tool emits its
  metric WITH the `<metric>Tool` provenance prop; an absent tool records `skipped:<tool>` with a reason and NO
  fabricated metric; and first-available-wins LOC dedup (tokei writes `linesOfCode`; scc/cloc loud-skip with a
  reason naming the winner). (D-54 — ast-grep/tsc/eslint declared-but-inert — remains a separate open debt.)

### D-54: code Miner declares ast-grep / tsc / eslint in the probed tier but has no extractor for them (skip-only)

- **Category:** Implementation / probed-tier completeness (honestly disclosed; not a correctness defect)
- **Severity:** Minor
- **Surfaced:** `code-analysis-miner` — the probed-tier declaration lists ast-grep / tsc / eslint, but the
  Miner has no code that turns their output into facts.
- **Location:** the code Miner's probed-tier tool set (ast-grep / tsc / eslint alongside rg / tokei / scc /
  cloc); `packages/kip-sdk/src/cli/index.ts` (`kip index`) and the `code-miner` dispatch.
- **Evidence:** ast-grep, tsc, and eslint are named as probed tools, but no extractor consumes their output —
  so even when the tool is present and `KIP_INDEX_TOOLS` is set, the Miner can only ever record
  `skipped:<tool>` for them; it never derives a fact from an ast-grep match, a tsc diagnostic, or an eslint
  finding. They are declared-but-inert.
- **Why it is debt:** The probed tier over-declares its capability relative to what the Miner actually does:
  three of the named tools can never contribute a metric or fact in the current implementation. This is
  **safe** (they skip-with-reason exactly like a genuinely-absent tool — no fabricated data) but it means the
  declared tool set overstates the Miner's real extraction reach, and a reader could reasonably expect
  ast-grep/tsc/eslint facts that never arrive.
- **Suggested fix:** Either add real extractors (ast-grep → structural `code:` facts / edges; tsc →
  type-diagnostic facts; eslint → lint-finding facts), or remove ast-grep/tsc/eslint from the declared probed
  tier until an extractor exists, so the declaration matches the behavior.
- **Status:** Open (tracked). Declared-but-skip-only; no fact is ever authored from ast-grep/tsc/eslint today.

### D-55: code Miner's newline-counted LOC is off-by-one on files with no trailing newline

- **Category:** Implementation / metric accuracy (minor undercount; not a safety defect)
- **Severity:** Minor
- **Surfaced:** `code-analysis-miner` — the guaranteed-tier LOC metric counts newlines.
- **Location:** the code Miner's guaranteed-tier LOC computation (Node-builtins newline count) in the
  `code-miner` dispatch / `kip index` path.
- **Evidence:** LOC is computed by counting newline characters. A file whose final line has **no trailing
  newline** therefore has its last line uncounted — an off-by-one **undercount** of exactly one line for any
  file that does not end in `\n`.
- **Why it is debt:** The guaranteed-tier `linesOfCode` metric is systematically low by one for
  no-trailing-newline files. It is a small, bounded inaccuracy in a metric (not a correctness or safety
  guarantee — no fact provenance or signature is affected), but it is a real off-by-one in an authored metric
  value.
- **Suggested fix:** Count lines as `newlines + (endsWithNewline ? 0 : (fileNonEmpty ? 1 : 0))` — i.e. add a
  line for a final non-empty line lacking a trailing newline, while keeping a genuinely-empty file at 0 — so
  the newline-LOC matches the intuitive line count regardless of trailing-newline presence.
- **Status:** Resolved — `newlineLoc` now returns `(count of \n) + (raw.length > 0 && last byte !== \n ? 1 : 0)`
  in `src/miner/code-miner.ts`, so a file whose final line lacks a trailing newline counts that line, a
  trailing-newline file is unchanged, and an empty file stays 0. Covered by `src/__tests__/code-miner-debts.test.ts`
  (no-trailing-newline, one-line-no-newline, trailing-newline, and empty fixtures).

### D-56: `runAcquisition` swallows the code Miner's verbatim error message, surfacing only a generic non-zero exit

- **Category:** Implementation / failure diagnosability (loud failure, but the specific reason is lost)
- **Severity:** Minor
- **Surfaced:** `code-analysis-miner` Phase C — the cold-CLI **live demo** (defect **D3**). The demo also
  found and **fixed** two other CLI defects (`kip index <subdir>` ENOENT → the miner now walks up to the
  enclosing git root, scopes facts to the subdir, and fails loud on a non-repo; and
  `--include`/`--exclude`/`--git-sha` read by `cmdIndex` but unregistered in `cli/args.ts` → now registered),
  both re-verified via a real CLI run — those are closed and not filed here. This entry is the one demo defect
  recorded as debt rather than fixed in-program.
- **Location:** `runAcquisition` (the M7 acquisition orchestrator seam) and its generic non-zero-exit N5
  guard, as consumed by the `code-miner` dispatch / `kip index` path.
- **Evidence:** When the code Miner throws a precise, actionable error, `runAcquisition` wraps it in its
  generic non-zero-exit N5 guard, so the operator sees a generic dispatch/non-zero-exit failure rather than
  the miner's verbatim error string. The failure is **loud** (the run stops, N5 — no fabricated facts), but
  the specific cause is dropped on the floor, exactly as D-49 item (2) described for the graph-QA dispatch
  path before it was fixed.
- **Why it is debt:** The N5 no-fallback / no-fabrication guarantee is correct — the run fails loud and
  authors nothing — but every distinct miner-side cause collapses into one generic non-zero-exit message,
  making a real code-indexing failure expensive to diagnose. It is a diagnosability gap on the failure
  channel, not a correctness or safety regression.
- **Suggested fix:** Thread the miner's verbatim error message through `runAcquisition`'s non-zero-exit guard
  to the operator-facing failure (mirroring D-49(2)'s fix, which surfaced the graph-QA dispatch reason on the
  `output.error` channel and appended it to the failure message) so the specific cause survives, while
  keeping the failure strictly on the error channel (it authors no facts, so a reason string can never become
  a fabricated fact — N5 preserved).
- **Status:** Resolved — `runAcquisition` (`src/kip-repo.ts`) now reads the microagent's verbatim reason off
  `MicroagentResult.output.error` (via `acquisitionDispatchFailureReason`, the same `output.error` channel the
  code Miner / learn bodies write and that `runAsk`/the MCP surface read for D-49(2)) and includes it in the
  thrown `KipError`'s message AND its `context.reason`. The error CODE (`ERR_MALFORMED_INPUT`) and the N5
  fail-loud, author-nothing contract are unchanged — the reason is a failure-channel diagnostic only. Covered
  by `src/__tests__/code-miner-debts.test.ts` (a scripted `{exitCode:1, output:{error:"…"}}` dispatch → the
  reason appears in message + context; a non-zero exit without `output.error` still fails loud with no reason clause).

---

## Audit round 10 — the `text-autoencoder` program (text→graph autoencoding)

> The **`text-autoencoder`** program made kip's **text→graph** path real. `Repo.learn()` (the
> knowledge-autoencoding loop) was already implemented but **dead** — none of the four microagent bodies it
> dispatches existed, and a raw document had no way to enter kip. This program built (ADR-B10 through
> ADR-B10f) a content-addressed **blob API** (`putBlob`/`getBlob` via the existing `Substrate.writeBlob`; a
> stored file is content, not knowledge — no facts authored, projection byte-identical), **four model-backed
> microagent bodies** (`encode`/`decode`/`learner`/`loss` in `src/learn/`, each spawning the authenticated
> `claude` CLI through ask.ts's Windows-hardened helpers) behind **one** `makeLearnDispatch` router and four
> bundled manifests, `compileGraphToAssertInputs` (which compiles the model's narrow `{nodes,edges}` JSON into
> well-formed, `doc:<blob>#<slug>`-namespaced signed facts — the model never emits `AssertInput` directly),
> and a **`kip learn <file>`** CLI (opt-in `KIP_LEARN_LIVE` gate, honest exit codes 0/5/2/1/7). It also
> shipped the two retrieval fixes that let `kip ask` answer over a learned graph — **[[D-52]]** (recall
> lexical seeding, `55afa73be`) and graph-QA **edge-prop hydration** (`af45ed046`) — **resolving D-52**. See
> [`reviews/text-autoencoder-report.md`](../reviews/text-autoencoder-report.md) for the whole-program
> narrative (four adversarial critic rounds, minimums R1=62 → R2=70 → R3=84 → R4=87/68/67; acceptance PASS;
> and the cold-CLI live demo that turned a real design note into **60 signed facts** — a faithful
> 13-node/17-edge graph accepted on iteration 1 at loss 0.22 < 0.25, all four factual questions answered
> correctly with real-`factId` citations, and two absent-subject controls that held their abstention). The
> integration gate PASSED (`build:sdk` + kip build + full kip test **771 passed / 8 skipped** +
> `verify:metadata`, all green; `package-lock.json` untouched; zero new runtime deps; `.gitattributes` added
> enforcing LF). This round adds **five** honest residuals: **D-57** (recall is keyword-not-semantic — the
> promoted semantic half of D-52), **D-58** (learner non-determinism), **D-59** (free-text-value subject
> retrieved-then-abstained — promoted from D-52), **D-60** (cross-document contradiction no longer surfaces as
> `kip:conflict` — promoted from D-52), and **D-61** (temporal invalidation not modeled).

### D-57: graph-QA text retrieval is KEYWORD lexical, not semantic — `kip ask` abstains when the question shares no lexical term with the graph

- **Category:** Implementation / retrieval robustness (honestly disclosed; the open half of D-52)
- **Severity:** Minor (safe — abstains, never guesses — but `ask` is not robust for real NL paraphrase)
- **Surfaced:** `text-autoencoder` — the promoted *semantic/embedding* half of D-52. D-52's lexical seeding
  made a `kip learn`-produced graph discoverable by **shared keyword**; this entry tracks what lexical
  matching still cannot do.
- **Location:** `packages/kip-sdk/src/kip-repo.ts` (`computeRecall` — the `recallSurfaceTerms` searchable-
  surface + shared tokenizer `src/text-terms.ts` text path); consumed by `packages/kip-sdk/src/graph-qa/`
  and the `ask` entry points (`src/cli/ask.ts`, the MCP `kip_ask` tool).
- **Evidence:** Recall scores a node by the count of **distinct** query terms that appear in its searchable
  surface (eid with the `doc:<blob>#` namespace stripped + node `kind` + prop keys + structured prop values +
  incident edge kinds), tokenized identically to the query. A question that shares **no lexical term** with
  the graph therefore retrieves nothing and `ask` abstains — synonyms ("revenue recognition" vs "booking
  settlement"), paraphrase, morphology (`owns`/`ownership`), and translation are all misses. Scoring is a
  flat distinct-term count (no IDF/BM25, so a common term counts as much as a discriminative one), there is
  no stemming/lemmatization/fuzzy matching, the stopword set is small/closed/English-only, and the
  `[a-z0-9]+` tokenizer drops CJK and any non-Latin script entirely. The vector half remains inert unless the
  caller supplies `q.embedding` (kip deliberately never embeds the query, N2/N5), so nothing closes this gap
  today. Indexing prop keys and edge kinds is what lets relation words anchor, but a common schema key/edge
  kind matches uniformly across a graph and the flat scoring does not down-weight it (a recall win with a
  precision cost, contained only by the `k` cap and the graph-QA subject-anchoring check).
- **Why it is debt:** The point of `ask` is answering genuine free-text NL questions; as shipped it answers
  only when the question and the graph share surface keywords. This is **safe** (cite-or-abstain holds; it
  never fabricates) but the headline verb is not yet robust for real NL. It is distinct from D-43 (the
  *vector*-half scale/no-ANN narrowing): D-43 is about the vector scan, D-57 is that the *text* path is
  lexical-not-semantic.
- **Suggested fix:** Wire **real semantic retrieval** through the existing §5.3 accelerator seam — embed the
  corpus searchable surface and match by similarity (reusing the M4 vector infrastructure) — and/or add
  relevance weighting (IDF/BM25), stemming/fuzzy matching, and a Unicode-aware tokenizer. Until then, `ask`
  is robust only for questions that share lexical terms with the graph and should be documented as such.
- **Status:** Open (tracked). Lexical seeding shipped (D-52 resolved); semantic retrieval remains the open
  half.

### D-58: the learn `learner`'s encoding is non-deterministic — the same document produces a different node/edge split across runs

- **Category:** Implementation / reproducibility (accelerator-class; honestly disclosed)
- **Severity:** Minor (safe — every run authors well-formed, namespaced, signed facts — but not reproducible)
- **Surfaced:** `text-autoencoder` — the live `kip learn` path spawns a model, whose output varies per call.
- **Location:** the `learner`/`encode` roles in `packages/kip-sdk/src/learn/index.ts` (each spawns the
  authenticated `claude` CLI), consumed by `Repo.learn()` and the `kip learn` CLI (`src/cli/`), gated behind
  `KIP_LEARN_LIVE` (ADR-B10f).
- **Evidence:** The encoding step asks the model to produce the `{nodes,edges}` graph for a document; the
  model path is opt-in and **accelerator-class**, so two `kip learn` runs over the **same** document can
  return a different node/edge decomposition (a different concept split, different slugs, a different
  edge count) even though `compileGraphToAssertInputs` deterministically namespaces and signs whatever graph
  it is handed. The loss is a **search signal only** (it drives accept/iterate and never touches
  `orderKey`/reducers/trust), so non-determinism upstream of the compile step does not compromise convergence
  of the *admitted* set — but the admitted set itself differs between runs of the same input.
- **Why it is debt:** Autoencoding a document is not reproducible: re-learning the same file yields a
  different graph, so a consumer cannot rely on `doc:<blob>#<slug>` eids being stable across re-runs, and two
  replicas that independently `kip learn` the identical file will not converge to byte-identical facts (they
  converge only over facts they actually exchange, per SEC). This is **safe** (each run's facts are
  well-formed and signed; nothing is fabricated) but is a real reproducibility gap intrinsic to the
  model-backed encoding.
- **Suggested fix:** Reduce non-determinism where the seam allows — e.g. pin decoding temperature/seed if the
  host model exposes it, and/or add a deterministic canonicalization/normalization pass over the model's
  `{nodes,edges}` (stable slug derivation, canonical node/edge ordering) before compile — while documenting
  that the live model path is inherently accelerator-class and not a determinism guarantee.
- **Status:** Open (tracked). The live learn path is opt-in and accelerator-class; the same document can
  produce a different graph across runs.

### D-59: a subject named ONLY inside a free-text prop value is lexically retrieved but then abstained on by graph-QA

- **Category:** Implementation / retrieval precision-recall trade-off (honestly disclosed; promoted from D-52)
- **Severity:** Minor (safe — abstains, never fabricates — the deliberate §8.4-guard trade-off)
- **Surfaced:** `text-autoencoder` — the round-4 anchoring-surface widening (D-52 closure note) fixed the
  prop-key/structured-value case but kept free-text values excluded to hold the §8.4 fabrication guard.
- **Location:** graph-QA's subject-anchoring relevance check (`kip-graph-qa.md` §6.1b) over the retrieved
  evidence, in `packages/kip-sdk/src/graph-qa/`; the anchoring surface indexes
  `eid`/`kind`/`EdgeKind`s/prop KEYS/STRUCTURED prop values but **excludes** the values of
  `content`/`description`/`summary`.
- **Evidence:** `recall` will lexically retrieve a node whose free-text blob (`content`/`description`/
  `summary`) contains the query's subject term, and the backing signed fact is hydrated — but graph-QA's
  §6.1b anchoring check then **abstains**, because the subject term appears in no identity value or structured
  prop on the anchoring surface. The exclusion is deliberate: including free-text values would reopen the §8.4
  absent-subject fabrication (the Tal-only "What is Zara's role?" → "Engineer" defect), so a subject the graph
  names ONLY in prose is retrieved-then-abstained.
- **Why it is debt:** A genuinely-present subject that lives only inside free-text prose is unanswerable —
  graph-QA cannot distinguish "the subject is genuinely present in prose" from "a relation word coincidentally
  appears in unrelated prose," so it abstains on both. This is **safe** (cite-or-abstain holds; it never
  fabricates) but it is a real recall gap for prose-only subjects, and the honest cost of the §8.4 guard.
- **Suggested fix:** Close it via the **semantic retrieval** D-57 names (embedding the free-text surface and
  matching by similarity lets graph-QA anchor on genuine subject presence rather than raw substring), **not**
  by widening the lexical anchoring surface to free-text values — which would reopen the §8.4 fabrication
  guard.
- **Status:** Open (tracked). Retrieved-then-abstained by design; closing it needs semantic retrieval (D-57),
  not a wider lexical surface.

### D-60: cross-document contradictions do not surface as `kip:conflict` — the `doc:<blob>#` namespace makes two documents' facts disjoint cells

- **Category:** Implementation / conflict-surfacing (honestly disclosed; promoted from D-52; cross-ref ADR-B10d)
- **Severity:** Minor (safe — no wrong trusted value — but a genuine A-vs-B disagreement is not surfaced)
- **Surfaced:** `text-autoencoder` — the `doc:<blob>#` eid namespacing (which fixes the cross-document cell
  contamination defect (b) in the report) has the dual consequence that two documents' facts about the same
  real-world entity never share a cell.
- **Location:** `compileGraphToAssertInputs` / `namespaceEid` in `packages/kip-sdk/src/learn/compile.ts` (the
  `doc:<blob>#<slug>` eid namespacing), and the reducer/conflict-surfacing layer (`22-git-substrate.md` §4.4)
  that would otherwise emit `kip:conflict` on competing values for a shared cell.
- **Evidence:** Because every learned fact's eid is namespaced by the source document's blob oid, document A's
  fact about entity E and document B's contradicting fact about the same entity E land in **disjoint cells**
  (`doc:A#e` vs `doc:B#e`), not the same cell. The conflict reducer only surfaces `kip:conflict` for competing
  values **within one cell**, so a genuine A-vs-B disagreement is stored as two non-conflicting facts and is
  never flagged. This is the deliberate flip side of the namespacing that closes cross-document cell
  contamination.
- **Why it is debt:** Two documents that genuinely disagree about the world do not produce a surfaced
  `kip:conflict` — the disagreement is silently coexistent rather than flagged for resolution. This is
  **safe** (no cell ever holds a wrong *trusted* value — the values are simply in different cells) but it
  means the conflict-surfacing guarantee does not extend across documents.
- **Suggested fix:** Add an explicit cross-document **entity-resolution / `same_as`** layer (which no bundled
  learn role performs today) that links `doc:A#e` and `doc:B#e` when they denote the same real-world entity,
  so competing values become a surfaced `kip:conflict` through the existing `same_as`/reducer machinery
  rather than remaining disjoint.
- **Status:** Open (tracked). Namespacing keeps retrieval local and cross-document contamination closed at the
  cost of cross-document conflict surfacing; resolving it needs an entity-resolution layer.

### D-61: temporal invalidation is not modeled — a decision that supersedes an earlier design choice leaves the stale edge marked `status:"current"`

- **Category:** Implementation / temporal fidelity (honestly disclosed; surfaced by the live demo)
- **Severity:** Minor (safe — the fact is signed and faithful to the prose — but it overstates present tense)
- **Surfaced:** `text-autoencoder` Phase C — the cold-CLI **live demo**. The learned graph retained a
  pre-decision "Orchid writes Ledger" edge as `status:"current"`, slightly overstating present tense even
  though the same document's ADR structure records that the choice was later superseded.
- **Location:** the `encode`/`learner` roles in `packages/kip-sdk/src/learn/index.ts` and
  `compileGraphToAssertInputs` (`src/learn/compile.ts`) — the learned graph carries a `status` prop but no
  step invalidates an edge that a later decision in the same document supersedes.
- **Evidence:** In the live demo the design note described an earlier data-flow choice ("Orchid writes
  Ledger") that a subsequent decision superseded, yet the compiled graph committed that edge with
  `status:"current"`. The learn loop faithfully encoded the edge the prose stated but did not model the
  **temporal supersession** — there is no valid-time invalidation of the stale edge when a later fact
  supersedes the earlier design choice, so a `kip ask` over the graph can present the superseded edge as
  present-tense.
- **Why it is debt:** The learned graph overstates the present tense: an edge that a later decision made
  historical is still marked current, so free-text answers over the graph can report a superseded design
  choice as live. This is **safe** (every fact is signed and faithful to the sentence that produced it;
  nothing is fabricated) but it is a real temporal-fidelity gap — the autoencoder captures *what the document
  says* without capturing *when a statement was superseded*.
- **Suggested fix:** Model temporal supersession in the learn path — either have the `learner` emit valid-time
  `validTo`/supersede facts when the document records that a design choice was later changed, or add a
  post-compile pass that invalidates an edge whose subject a later ADR/decision node supersedes — so stale
  edges project as historical rather than `status:"current"`.
- **Status:** Open (tracked). The learned graph does not model temporal invalidation; superseded edges can
  remain marked current.

---

## Audit round 11 — the `entity-linker` program (deterministic code↔concept graph unification)

> The **`entity-linker`** program shipped **Layer 1** of kip's unification story. A kip repo could already hold
> a **code graph** (`code:*` from `kip index`) and one or more **concept graphs** (`doc:<blob>#slug` from `kip
> learn`) in the same substrate, but the two lived as **disconnected islands**. This program built (ADR-B11 /
> B11a / B11b / B11c) a **deterministic** entity linker that connects them into one queryable memory by
> **asserting signed, reversible link edges** and **never merging identities**: a pure, no-model
> `linkResolver(inventory) → AcquisitionResult` (INV-A1) behind a `linkResolverDispatch` routed exactly like
> the code Miner, a minimal read-only `Repo.nodeEids({prefixes})` enumeration seam, and a **`kip link`** CLI
> (counts by kind, examples, `--json`, `--dry-run`; honest zero-link = exit 0). It authors three rules — a
> concept→`code:module` **`documents`** edge on a full path-qualified relPath match, concept→symbol/package
> links from identity fields, and a cross-document **`same_as`** pair on a distinctive (strong) name — all
> through the existing `runAcquisition` path (no new write path; INV-A1 holds structurally). Its **headline
> finding**: the code↔concept union needs **ZERO retrieval change** — graph-qa's existing depth-3
> both-direction traversal already crosses the `documents` edge. See
> [`reviews/entity-linker-report.md`](../reviews/entity-linker-report.md) for the whole-program narrative (four
> adversarial critic rounds, minimums R1=32 → R2=84 → R3=85 → R4=85 — the R1=32 flagging a CRITICAL cross-doc
> `same_as` false-merge — then post-loop precision fixes driving spec-fidelity 89→93→95 and code-quality to a
> final 90; acceptance PASS; and the live demo that indexed **57 code facts** + learned **55 concept facts**
> into one repo, `kip link`-ed **2 reversible `documents` edges**, and traversed the boundary in both
> directions via `kip query --direction both --depth 3` — reversibly and idempotently, after fixing a
> learn→link composition gap and a `--dry-run` arg-parser bug). The integration gate PASSED (`build:sdk` + kip
> build + full kip test **820 passed / 8 skipped** + `verify:metadata`, all green; `package-lock.json`
> untouched; zero new deps; `.gitattributes` LF). This round adds **six** honest residuals: **D-62** (`kip ask`
> cites the concept side only, not the `code:module` fact across the `documents` edge — graph-qa citation
> selection), **D-63** (cross-doc `same_as` can false-merge a genuine homonym — Layer-2 deferral), **D-64**
> (`--include`/`--exclude` unwired on `kip link`), **D-65** (`Repo.nodeEids` absent from docs/40), **D-66**
> (ADR-B11c `same_as` prop-union in retrieval — designed follow-on), and **D-67** (RDF/linked-data
> `owl:sameAs` ingestion — designed-but-unbuilt follow-on).

### D-62: `kip ask` over a linked graph cites the concept side only, not the `code:module` fact across the `documents` edge

- **Category:** Implementation / retrieval — citation selection (honestly disclosed; graph-qa, not the linker)
- **Severity:** Minor (safe — the answer is named correctly and the graph is unified/traversable via `kip query`)
- **Surfaced:** `entity-linker` — over a repo whose code graph and concept graph are joined by `documents`
  edges, `kip ask` names the answer correctly but cites the concept node, never the linked `code:module` fact.
- **Location:** graph-qa's citation-selection path in `packages/kip-sdk/src/graph-qa/` and the `ask` entry
  points (`src/cli/ask.ts`, the MCP `kip_ask` tool); the `documents` edge is authored by the linker
  (`linkResolver`), but the gap is downstream in graph-qa's choice of which retrieved fact to cite.
- **Evidence:** After `kip link` authors a `documents` edge from a concept node to its `code:module` node,
  `kip ask` answers the question correctly (the graph IS unified — `kip query --direction both --depth 3`
  crosses the edge in both directions), but the citation it selects is the **concept-side** fact, not the
  `code:module` fact across the edge. The `code:module` node carries only content-blob / format / loc props
  with **no question-relevant text**, so graph-qa's citation-selection heuristic never picks it over the
  concept node whose props do lexically match the question.
- **Why it is debt:** The answer is correct and the boundary is genuinely traversable, but a user asking about
  the code gets a citation pointing at the concept description rather than at the code fact it links to, so the
  provenance under-serves the code side of the union. This is **safe** (the answer is named correctly, nothing
  is fabricated, and `kip query` exposes the full traversal) and it is a graph-qa **citation-selection** gap,
  **not** a linker defect — the linker's job (authoring the reversible `documents` edge) is done.
- **Suggested fix:** Extend graph-qa citation selection to prefer or additionally cite the `code:module` fact
  reached across a `documents` edge when the answer is about the code side — e.g. treat a `documents`-linked
  `code:module` node as a citable target even though its props carry no question-lexical text — so the
  provenance follows the edge the traversal already crosses. A graph-qa follow-on, tracked separately from the
  linker.
- **Status:** Open (tracked). The graph is unified and traversable via `kip query`; only graph-qa's `ask`
  citation selection does not yet follow the `documents` edge to the code side.

### D-63: cross-document `same_as` can still false-merge a genuine homonym — deferred to the model-assisted Layer 2

- **Category:** Implementation / entity-resolution precision (honestly disclosed; deliberate Layer-1/Layer-2 boundary)
- **Severity:** Minor (safe — narrow, reversible via `not_same_as`/retract; never renames or merges an eid)
- **Surfaced:** `entity-linker` — the deterministic `same_as` rule pairs two concepts in different documents
  that share a distinctive (strong) name; a genuine homonym (two distinct entities sharing that name) can be
  falsely paired.
- **Location:** the `same_as` rule in `linkResolver` (`packages/kip-sdk/src/` acquisition / link-resolver
  path), consumed by `kip link`; the pair is authored through `runAcquisition` as a reversible `same_as` edge.
- **Evidence:** The deterministic rule fires `same_as` only on a **distinctive (strong) name** — multi-token
  or internal-marker names, with a minimum length and a stopword filter, and a camelCase `[A-Z][a-z]`
  distinctiveness rule that excludes all-caps acronyms/extensions and filename-shaped strings (the R1
  false-merge and its follow-on tightenings). Single ambiguous tokens (bare common nouns, all-caps acronyms,
  filename-shaped names) are **deterministically abstained** (high precision, may miss). But a genuine
  **homonym** — two distinct real-world entities that legitimately share a distinctive name across documents —
  can still be paired, because a deterministic name-only rule cannot tell a shared name apart from a shared
  identity.
- **Why it is debt:** A `same_as` pair asserts "these two concept nodes denote the same thing"; on a genuine
  homonym that assertion is wrong. The residual is **narrow** (only distinctive-name collisions across
  documents), **safe** (nothing is merged — `same_as` is an asserted edge, so a mistaken pair is undone by
  asserting `not_same_as` or retracting the edge, never by un-merging an identity), and it is the **deliberate
  boundary** between deterministic Layer 1 and the model-assisted Layer 2: disambiguating a genuine homonym
  needs context the name alone does not carry.
- **Suggested fix:** Resolve genuine homonyms in the **model-assisted Layer 2 fuzzy resolver** (context-aware
  entity resolution over the props/neighbourhood of the two candidates), keeping the deterministic Layer-1 rule
  as the high-precision floor. Until then, a mistaken cross-document `same_as` is corrected by `not_same_as` /
  retract.
- **Status:** Open (tracked). Deterministic name-only `same_as` is high-precision but can false-merge a genuine
  homonym; disambiguation is deliberately deferred to Layer 2.

### D-64: `--include` / `--exclude` are declared for `kip link` (ADR) but not wired

- **Category:** Implementation / CLI completeness (honestly disclosed; not a correctness defect)
- **Severity:** Minor
- **Surfaced:** `entity-linker` acceptance — a documented non-hard gap: the ADR lists `--include` / `--exclude`
  on `kip link`, but they are not registered/honored.
- **Location:** the `kip link` CLI (`packages/kip-sdk/src/cli/`) — the arg parser and the `linkResolver`
  inventory scope; ADR-B11.
- **Evidence:** ADR-B11 lists `--include` / `--exclude` scoping flags on `kip link`, but they are not wired
  into the CLI: the flags are declared in the design but not registered in the arg parser nor threaded into the
  resolver's inventory enumeration, so passing them has no effect (this mirrors the code Miner's
  `--include`/`--exclude`/`--git-sha` arg-parser gap the `code-analysis-miner` demo found and fixed).
- **Why it is debt:** The declared CLI surface overstates what `kip link` actually accepts — an operator
  reading the ADR would expect to scope linking with `--include` / `--exclude`, but the flags are inert. This
  is **safe** (linking still runs over the full enumerated inventory; nothing is fabricated) but the declared
  interface does not match the behavior.
- **Suggested fix:** Register `--include` / `--exclude` in the `kip link` arg parser and thread them into the
  `Repo.nodeEids` inventory enumeration so linking can be scoped, or remove them from the ADR until they are
  wired, so the declaration matches the behavior.
- **Status:** Resolved — `cmdLink` (`src/cli/index.ts`) now honors the flags (they were already in the
  `--include`/`--exclude` repeatable arg set): `--include <prefix>` (repeatable) REPLACES the enumerated
  `nodeEids` prefixes (default `['code:','doc:']` when absent), and `--exclude <prefix>` (repeatable) drops any
  enumerated node whose eid starts with an excluded prefix. Covered by `src/__tests__/kip-link-scope.test.ts`,
  which drives the real CLI (`runCli(['link', …])`) through a spy `Repo` and asserts the flags change the
  enumerated prefixes and the resulting inventory.

### D-65: `Repo.nodeEids` is not documented in docs/40 (SDK API surface)

- **Category:** Documentation / completeness (honestly disclosed; API-surface gap)
- **Severity:** Minor
- **Surfaced:** `entity-linker` acceptance — a documented non-hard gap: the new read-only `Repo.nodeEids`
  enumeration seam is not enumerated in the SDK API surface doc.
- **Location:** [40-sdk-api-surface.md](./40-sdk-api-surface.md) (the `Repo` API surface) vs the shipped
  `Repo.nodeEids({prefixes})` method in `packages/kip-sdk/src/`.
- **Evidence:** The program added a minimal read-only `Repo.nodeEids({prefixes})` seam that enumerates existing
  node eids by namespace prefix (so the resolver can see both the `code:` and `doc:` graphs), but
  `40-sdk-api-surface.md` — the canonical `Repo` API surface — does not list it. A reader building against the
  documented API surface would not know the enumeration seam exists.
- **Why it is debt:** The API-surface doc is the authoritative catalog of the `Repo` seam; a shipped public
  method absent from it is a completeness gap that leaves the enumeration seam undiscoverable from the docs.
  This is **safe** (the method exists and behaves; only its documentation is missing) but it is a real
  doc/implementation drift.
- **Suggested fix:** Add `Repo.nodeEids({prefixes})` to `40-sdk-api-surface.md` — its read-only,
  authoring-nothing contract and its prefix-scoped enumeration semantics — alongside the other `Repo` read
  seams.
- **Status:** Resolved — `nodeEids(opts?: { prefixes?: string[] }): Promise<EID[]>` is now listed in the
  `40-sdk-api-surface.md` `Repo` reads section, documented as a read-only, sorted enumeration of every LIVE node
  eid (optionally prefix-filtered) that excludes tombstoned/absent nodes and authors nothing (INV-A1) — matching
  `src/kip-repo.ts`'s `nodeEids` and the `Repo` interface in `src/types.ts`.

### D-66: ADR-B11c `same_as` prop-union in retrieval is a designed follow-on (not yet built)

- **Category:** Implementation / retrieval — designed-but-unbuilt follow-on (honestly disclosed)
- **Severity:** Minor (safe — the `same_as` edge is authored and reversible; retrieval simply does not yet union props)
- **Surfaced:** `entity-linker` — the linker authors `same_as` pairs (ADR-B11), but the ADR-B11c retrieval-side
  consumption of those pairs (unioning the props of `same_as`-linked nodes at retrieval time) is a named
  follow-on, not built.
- **Location:** the retrieval / graph-qa path in `packages/kip-sdk/src/` (`computeRecall` / `src/graph-qa/`)
  that would consume `same_as` edges authored by `linkResolver`; ADR-B11c.
- **Evidence:** ADR-B11c designs a retrieval behavior in which the props of two `same_as`-linked nodes are
  **unioned** so a question answerable from either node's props can be answered from the union. The linker
  authors the `same_as` edge, but retrieval does not yet perform that prop-union — a node linked `same_as` to
  another is not enriched by the other's props at recall/answer time.
- **Why it is debt:** The `same_as` channel is only half-consumed: the edge is authored, but the retrieval
  benefit the ADR designs (answering from the union of linked nodes' props) is not realized, so a `same_as`
  link does not yet improve answerability. This is **safe** (nothing is fabricated; the edge is a faithful,
  reversible assertion) but it is a designed capability that is not built.
- **Suggested fix:** Implement the ADR-B11c prop-union in retrieval — when a retrieved node is `same_as`-linked
  to another, union their props for recall/answer purposes — so the authored `same_as` edges deliver the
  designed retrieval benefit.
- **Status:** Open (tracked). `same_as` edges are authored; the ADR-B11c retrieval-side prop-union is a named
  follow-on, not built.

### D-67: RDF / linked-data `owl:sameAs` ingestion is a designed-but-unbuilt follow-on

- **Category:** Implementation / ingestion — designed-but-unbuilt follow-on (honestly disclosed)
- **Severity:** Minor (safe — nothing is fabricated; the ingestion path simply does not exist yet)
- **Surfaced:** `entity-linker` — the `same_as` channel the linker uses is designed to also carry RDF /
  linked-data `owl:sameAs` assertions (IRIs as global eids), but no ingestion path for RDF/linked-data is built.
- **Location:** the acquisition family in `packages/kip-sdk/src/` (the `sameAs` channel that `linkResolver`
  authors into) and the (unbuilt) RDF/linked-data ingestion path; ADR-B11.
- **Evidence:** The design reuses the same `sameAs` channel to ingest RDF / linked-data `owl:sameAs`
  statements, treating IRIs as global eids so an external linked-data graph can join kip's memory through the
  same reversible-edge machinery the entity linker uses. This ingestion is **designed** (it deliberately reuses
  the `sameAs` channel and the IRI-as-global-eid model) but **not built** — there is no RDF/linked-data reader.
- **Why it is debt:** A designed interoperability capability (joining external RDF/linked-data graphs via
  `owl:sameAs` on the same reversible `sameAs` channel) is named in the design but has no implementation, so
  the union story stops at kip's own code and concept graphs. This is **safe** (the absence is a missing
  feature, not an incorrect behavior — nothing is fabricated) but it is a designed follow-on that is not yet
  realized.
- **Suggested fix:** Build an RDF / linked-data ingestion path that reads `owl:sameAs` statements and authors
  them onto the existing `sameAs` channel (IRIs as global eids), reusing the entity linker's reversible-edge
  machinery, so external linked-data graphs can join kip's memory.
- **Status:** Open (tracked). Designed to reuse the `sameAs` channel (IRIs as global eids); no RDF/linked-data
  ingestion path is built.
