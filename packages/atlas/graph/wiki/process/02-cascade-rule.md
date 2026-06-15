---
id: page:process-02-cascade-rule
nodeKind: Page
title: "Cascade Rule"
slug: "process/02-cascade-rule"
articlePath: "wiki/process/02-cascade-rule.md"
documents: []
---
# Cascade Rule

> Companion to [`00-process-design.md`](./00-process-design.md), Section 4.

When closing a gap at Level **N**, propagate the change **down through Levels N+1..7 BEFORE picking up generic gaps at higher levels**. Track each propagated change as an entry in the gap node's `propagationStatus` field; the gap is **not** closed until every applicable level reads `done` or `not-applicable` (with a one-line reason).

## Why it matters

The most common failure mode of any debt-loop discipline is fixing the originating level and forgetting that downstream projections still encode the old truth. After such a half-fix, prose, generators, code, SDK, and UI all *appear* internally consistent but disagree with the graph. The cascade rule turns this into a structurally enforced property: an open `propagationStatus` entry is a visible obligation, queryable by every generator and surfaced in every wiki dashboard.

## Worked example — Anthropic releases a new model variant

**Trigger (Level 1).** Anthropic announces `claude-opus-4-7[1m]`, a long-context variant of `claude-opus-4-7`. The announcement adds a `contextWindow: 1000000` attribute and notes that prompt caching behaves identically.

### Level 1 — Real world vs graph + schema

- Add a new `ModelVersion` node `model:claude-opus-4-7-1m` under `schema/examples/`.
- Add an `EvidenceSource` for the announcement page; verify `reachabilityCheck.status = ok`.
- Add a `Claim` for `contextWindow = 1_000_000` referencing that evidence.
- Decide whether the `contextWindow` attribute already exists on `ModelVersion`. If not, the schema (`ontology-schema.yaml`) gets a non-breaking minor bump adding the attribute.
- `propagationStatus.level1 = done`.

### Level 2 — Graph vs docs

- Update `02-node-kinds/agent-stack.md` (the file that holds `ModelVersion`'s prose spec) to document `contextWindow`.
- Add the new attribute to `attribute-types.yaml` and a corresponding paragraph to `05-validation-rules.md` if the attribute carries any invariant.
- Run the markdown-vs-YAML parity check (V-12.5) — it must pass.
- `propagationStatus.level2 = done`.

### Level 3 — Quality / delivery process vs docs

- Bump `CatalogVersion` per `07-versioning.md`. Add a release-notes entry. CI versioning gate must pass.
- `propagationStatus.level3 = done`.

### Level 4 — Generators vs docs

- Re-run the glossary generator (new term: "1M context"), the product-card generator (new card for the variant), and the capability-matrix generator (new row).
- Diff the regenerated wiki output. Commit the diff.
- `propagationStatus.level4 = done`.

### Level 5 — Code vs docs + above

- If validator code hard-codes a list of known model ids, replace with a graph query. Otherwise mark `not-applicable: validator already reads dynamically from graph`.
- `propagationStatus.level5 = done` or `not-applicable`.

### Level 6 — SDK

- Regenerate the `ModelVersionId` TypeScript union; add the new variant. Type tests pass.
- `propagationStatus.level6 = done`.

### Level 7 — Interfaces

- The `--model` CLI autocomplete should now offer the new variant via the regenerated SDK constant.
- Dashboard model-picker widget refreshes from the SDK on next deploy.
- `propagationStatus.level7 = done`.

### Closing

The Gap moves to `status: closed`, `closedAt` is set, and `propagationChain` records each level's fix in order. Adversarial review (Section 5) signs off before close.

## When a level is `not-applicable`

Set `not-applicable` only with a one-line justification:
- "No SDK type touches this attribute" (Level 6).
- "No CLI flag depends on this enum" (Level 7).

A `not-applicable` reason that turns out to be wrong is itself a Level-1 gap when discovered.
