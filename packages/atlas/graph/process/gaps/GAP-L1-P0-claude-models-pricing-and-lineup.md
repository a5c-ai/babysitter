# GAP-L1-P0 — claude-models-pricing-and-lineup

- **id**: `gap:claude-models-pricing-and-lineup`
- **level**: 1
- **priority**: P0
- **status**: closed
- **discoveredAt**: 2026-04-29 (debt-loop pass 1)
- **closedAt**: 2026-04-29

## Title

Claude Opus 4.7 priced 3000x wrong; Sonnet 4.5/4.6 + Haiku 4.5 + Opus
4.5/4.6 missing from the example fixtures.

## Current state (was)

`claude-opus-4-7.yaml` carried `costPer1kInputTokens: 15.0` and
`costPer1kOutputTokens: 75.0` while the underlying attribute type was
`cost-per-million-tokens`. The attribute *name* lied — the values were
3000x too large for "per million" or 1000x too small for "per thousand".

Sonnet 4.5, Sonnet 4.6, Haiku 4.5, Opus 4.5, and Opus 4.6 had no
`ModelVersion` example files. Opus 4.7 was the only Anthropic model
modeled.

`supportsThinking` was a single bool — it could not express that Opus 4.7
adds adaptive thinking on top of (or, depending on call site, instead of)
the older extended-thinking primitive.

## Desired state (now)

Schema:

- `ModelVersion.costPer1kInputTokens` → renamed to `costPerMTokInput`,
  type unchanged (`cost-per-million-tokens`).
- `ModelVersion.costPer1kOutputTokens` → renamed to `costPerMTokOutput`.
- `ModelVersion.supportsThinking` → split into
  `supportsExtendedThinking` (required) + `supportsAdaptiveThinking`
  (optional). Invariants updated.

Examples:

- `model:claude-opus-4-7` → costs corrected to `$5 / $25` per MTok;
  `supportsAdaptiveThinking: true`.
- New: `model:claude-opus-4-5`, `model:claude-opus-4-6`,
  `model:claude-sonnet-4-5`, `model:claude-sonnet-4-6`,
  `model:claude-haiku-4-5`.
- New `ModelFamily`s: `model-family:claude-sonnet-4`,
  `model-family:claude-haiku-4`. Existing `model-family:claude-opus-4`
  updated to list all three Opus 4.x versions.
- New `Capability`s: `capability:adaptive-thinking`,
  `capability:extended-thinking` with `supported_by` edges wired to the
  model versions.

## Propagation chain

| Level | Fix | Status |
|---|---|---|
| 1 — real-world model lineup | five new `ModelVersion` examples; two new `ModelFamily` examples; pricing on Opus 4.7 corrected | atLeast: full |
| 2 — graph examples | `examples/compute/models/*.yaml` and `examples/compute/model-families/*.yaml` updated/created | atLeast: full |
| 2 — node-kind specs | `ModelVersion` attributes renamed and split in `schema/ontology-schema.yaml` (markdown side `../../schema/node-kinds/compute-path.md` does not yet exist as a separate file; cluster summary in `../../schema/node-kinds/README.md` is unchanged) | atLeast: partial |
| 2 — capabilities | new `Capability` examples for `adaptive-thinking` / `extended-thinking` | atLeast: stub |
| 2 — coverage-checklist | no change — pricing was an example-level fault, not a checklist claim | atLeast: n/a |
| 3 — versioning / qa | not touched in Phase 1 | atLeast: deferred |
| 4-7 — generators / docs / tests / governance | not yet existing in repo (Phase 4-7 not landed) | atLeast: deferred |

## Files changed

- `schema/ontology-schema.yaml` — renamed cost attributes, split
  thinking attributes, updated invariants.
- `graph/compute/models/claude-opus-4-7.yaml` — corrected
  pricing, added adaptive thinking, removed TODO placeholder.
- `graph/compute/models/claude-opus-4-5.yaml` — created.
- `graph/compute/models/claude-opus-4-6.yaml` — created.
- `graph/compute/models/claude-sonnet-4-5.yaml` — created.
- `graph/compute/models/claude-sonnet-4-6.yaml` — created.
- `graph/compute/models/claude-haiku-4-5.yaml` — created.
- `graph/compute/model-families/claude-opus-4.yaml` —
  added Opus 4.5 and 4.6 to `has_version`.
- `graph/compute/model-families/claude-sonnet-4.yaml` —
  created.
- `graph/compute/model-families/claude-haiku-4.yaml` —
  created.
- `graph/capabilities/capabilities/adaptive-thinking.yaml`
  — created.
- `graph/capabilities/capabilities/extended-thinking.yaml`
  — created.
- `wiki/process/gaps/GAP-L1-P0-claude-models-pricing-and-lineup.md` —
  this file.

## Notes

Pricing values were taken from Anthropic public pricing for the Opus
4.x / Sonnet 4.x / Haiku 4.x families. Release dates for Opus 4.5/4.6
and Sonnet 4.5/4.6 are best-effort; replace with vendor-doc evidence
sources when the Phase 2 evidence pass runs.

The thinking split closes part of the *cascaded* L1 gap
`gap:adaptive-thinking-vs-extended-thinking` at the schema level. The
matching invariants and full doc spec in `../../schema/node-kinds/compute-path.md`
remain to be authored when that markdown file is created.
