# kip-sdk Documentation Debt Register

> Purpose: a verified catalog of **documentation** debt in the kip-sdk doc set — contradictions,
> definitional gaps, faithfulness drift from `SPEC.md`, architectural-view gaps, completeness gaps, and
> redundancy. Every entry below was opened at its cited file:line and confirmed both that the quoted
> text exists and that it actually constitutes the claimed debt.

This register catalogs **documentation** debt only (not implementation debt). It is verified against the
docs under `packages/kip-sdk/docs/` and, for faithfulness, against `packages/kip-sdk/SPEC.md` (the source
of truth). **It does NOT fix the debts** — each entry records a suggested fix for later work.

## Summary

> Counts below are the register-wide rollup across both audit rounds (round 1: D-01–D-21; round 2: D-22–D-26).
> See the per-round breakdown in "Audit round 2 — new docs (27, 28) + integrity".

| Severity | Count |
|---|---|
| Critical | 2 |
| Major | 6 |
| Minor | 18 |
| **Total kept** | **26** |
| Dropped (unsubstantiated) | 1 |

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
- **Status:** Resolved — expanded `30-active-knowledge-overview.md` from a stub into a real overview: added "How the three subsystems relate" (the layered acquisition→autoencoding→contextual dependency) and "Cross-cutting contracts" (orchestrator-authoring lifecycle, asOf-reproducibility residual R5, typed-choice rule N5/INV-A7) with links to 31/32/33 and the failure model; faithful to §5b intro, no new claims. (The `81` split was out of scope for this architecture-doc pass and is not addressed here.)

### D-13: WBS legend promises per-id links, but every FR/NFR/INV link points to the file root

- **Category:** Completeness
- **Severity:** Minor
- **Locations:** [81-roadmap-epics-and-tasks.md](./81-roadmap-epics-and-tasks.md) L22-L23, L286, L347 · [10-functional-requirements.md](./10-functional-requirements.md) (no `<a id>` anchors) · [11-non-functional-requirements.md](./11-non-functional-requirements.md) · [60-conformance-and-testability.md](./60-conformance-and-testability.md)
- **Evidence:**
  - `81` L22: "**Implements:** ... **FR-\*** (linked to [./10-functional-requirements.md])".
  - `81` L286 (actual per-task link, no `#anchor`): "**Implements:** [FR-D4](./10-functional-requirements.md) · [NFR-A1](./11-non-functional-requirements.md)".
  - `10/11/60` contain 0 `<a id=...>` anchors and define FR/NFR/INV ids as bold inline labels, so there is no `#fr-d4` / `#nfr-a1` / `#inv-7` slug to target.
- **Why it is debt:** The legend states each id is "linked to" its requirement, but the hundreds of per-task FR/NFR/INV links resolve only to the top of a long doc — the promised id-level traceability navigation is not delivered.
- **Suggested fix:** Either add explicit `<a id="fr-d4">` anchors (or `### FR-D4` headings) in 10/11/60 and point each `81` link at `...md#fr-d4`, or soften the legend wording from "linked to [the requirement]" to "links to the requirements doc."
- **Status:** Resolved — softened the `81` legend (faithful minimal fix): the Implements/Exit-criteria bullets now state the id text names the exact FR/NFR/INV while the link resolves to the requirements **doc** (10/11/60 carry no per-id `#anchor` slugs; ids are bold inline labels), so no per-id deep link is promised.

### D-14: All 76 in-page task dependency links rely on hand-authored `<a id="T#.#">` tags

- **Category:** Completeness
- **Severity:** Minor
- **Locations:** [81-roadmap-epics-and-tasks.md](./81-roadmap-epics-and-tasks.md) L24, L282, L300
- **Evidence:**
  - `81` L282 (anchor definition): `### <a id="T1.1"></a>T1.1 Object & ref layout + frozen manifest`.
  - `81` L300 (dependency link): "**Depends on:** [T1.1](#T1.1)".
- **Why it is debt:** Every `[T#.#](#T#.#)` dependency link resolves ONLY through the explicit `<a id="T#.#">` tag — not through the heading's auto-generated slug. Any future edit that drops or mistypes one `<a id>` silently breaks the link with no build-time check. All 76 are currently intact, but the convention is undocumented and brittle.
- **Suggested fix:** Document the `<a id="T#.#">` anchor convention near the legend (L24), and/or add a CI link-check (markdown-link-check / remark-validate-links) over `packages/kip-sdk/docs` so a dropped anchor or mistyped id fails the build.
- **Status:** Resolved — added a maintenance `[!NOTE]` to the `81` legend documenting that `[T#.#](#T#.#)` links resolve through hand-authored `<a id="T#.#">` tags (not heading slugs), that a dropped/mistyped anchor breaks silently with no build error, that contributors MUST verify task-anchor links by hand when editing, and naming a CI link-checker (markdown-link-check / remark-validate-links over `packages/kip-sdk/docs`) as the documented mitigation.

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
- **Status:** Resolved — INV titles/bodies kept canonical in `60`; `24` §7 now lists the INV ids bare (one sentence, no per-INV gloss) and `80`'s exit-criteria lines (M0/M1/M2/M3/M4/M8) now list bare `[INV-n](./60-conformance-and-testability.md)` links without the duplicated parenthetical glosses. No timeline introduced.

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
