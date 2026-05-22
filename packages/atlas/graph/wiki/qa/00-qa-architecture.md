---
id: page:qa-00-qa-architecture
nodeKind: Page
title: "QA Architecture"
slug: "qa/00-qa-architecture"
articlePath: "wiki/qa/00-qa-architecture.md"
documents: []
---
# QA Architecture

> Phase-5 deliverable. The test pyramid, evidence-boundary checks, and regression detection regime that gate every change to the v6 ecosystem.

## Test pyramid

```
            ┌──────────────────────────┐
            │     E2E (handful)        │   schema → regenerate → SDK consumer compiles
            ├──────────────────────────┤
            │  Integration (per-gen)   │   generator vs known-graph fixture
            ├──────────────────────────┤
            │  Generator-output checks │   manifest correctness, idempotency, hash
            ├──────────────────────────┤
            │  Schema validation       │   ontology-schema.yaml, invariants.yaml, examples/
            └──────────────────────────┘
```

### Layer 1 — Schema validation (largest)

Runs on every PR. Implements `graph/schema/validation-rules.md`:

- **Structural**: every example YAML parses against the relevant NodeKind in `ontology-schema.yaml`. All `ref<>` fields resolve. No orphans outside the explicitly-orphan-allowed kinds.
- **Invariants**: `invariants.yaml` rules execute against the loaded graph. V-1.x..V-12.x as enumerated in the validation-rules spec.
- **Markdown ↔ YAML parity** (V-12.5): every NodeKind file under `schema/node-kinds/` describes the same attributes (with same types and required-flags) as the YAML.
- **Evidence completeness** (V-2.1): every fact-bearing claim has at least one `EvidenceSource`.

### Layer 2 — Generator output checks

For every generator:

- **Determinism**: run twice; outputs byte-identical.
- **Manifest correctness**: declared `consumes` matches the nodes/edges actually traversed.
- **Idempotency**: third run on disk produces zero diff.
- **No hand-edits**: outputs under `wiki/generated/`, `wiki/generators/templates/<gen>/__fixtures__/expected/`, etc., are byte-equal to the regenerated form. CI fails any PR where a generator output diverges from a fresh regeneration on the same input graph.

### Layer 3 — Integration tests

For each of the 11 generators (10 + Gap sync), a test loads a frozen graph fixture from `wiki/qa/tests/fixtures/<gen>/in/`, runs the generator, and snapshot-compares against `wiki/qa/tests/fixtures/<gen>/out/`. Fixtures change only when the generator's contract changes — and then in the same PR.

### Layer 4 — E2E

A small number of end-to-end scenarios:

1. **Schema bump propagates**: add an attribute to a NodeKind in `ontology-schema.yaml`; run all generators; assert the wiki, SDK types, and OpenAPI artifact reflect it.
2. **SDK consumer compiles**: a fixture project under `wiki/qa/tests/sdk-consumer/` imports the regenerated SDK and `tsc --noEmit` succeeds.
3. **Gap close cascade**: open a fake `Gap` node, fire the propagation generator, observe `propagationStatus` flip across all seven levels.

E2E runs nightly and on release tags, not per-PR.

## Evidence-boundary checks

The graph claims facts about the outside world. The boundary between "graph claim" and "external source" is where staleness creeps in. Phase 5 enforces:

- **Every claim has live evidence**. CI fails if any `Claim` has no `EvidenceSource` in its `evidenceSourceIds` (V-2.1) or if every linked source is past its `freshnessWindowDays` (V-2.6).
- **Reachability sweeps** (weekly job). Every `EvidenceSource{kindLabel: web}` has its `reachabilityCheck` re-run. `status != ok` for >7 days opens a Level-1 Gap automatically.
- **Trust-floor enforcement** (V-2.4). Safety-critical attributes (capability binding, install method, sandbox profile) MUST NOT be backed solely by `synthetic` evidence. CI rejects.
- **Attestation freshness**. `Attestation` records have explicit `expiresAt`. Past-expiry attestations move the claim back to "unattested" and fail any policy that requires attestation.

See [`04-evidence-boundaries.md`](./04-evidence-boundaries.md) for boundary-specific tooling.

## Regression detection

Three kinds of regression are watched:

1. **Generator output regression**: a PR that touches a generator template must include the regenerated output. CI runs the generator and fails if the diff is missing or different from the PR's diff.
2. **Schema regression**: any breaking change to `ontology-schema.yaml` (removed attribute, removed NodeKind, changed enum domain) must be accompanied by a major `CatalogVersion` bump and a `MigrationSpec`. Detected by comparing the PR's schema against `main`'s.
3. **Coverage regression**: see [`03-coverage.md`](./03-coverage.md). A drop in NodeKind / Edge / Capability / Evidence-freshness / Generator coverage fails the build.

## Spot-check queries (search smoke tests)

To verify the wiki search index, the test suite runs a fixed set of natural-language queries against the rendered site and asserts the expected node ids appear in the top-N results. Examples:

- "extended thinking" → `capability:extended-thinking`, `model:claude-opus-4-7`
- "PreToolUse hook" → `hook-surface:pre-tool-use`
- "MCP stdio transport" → `mcp-transport:stdio`

Updates to the spot-check list track schema bumps; they are themselves a Level-2 deliverable.

## Runtime budget

- Schema validation: <30 s.
- Generator suite (11 generators on full graph): <2 min.
- Integration tests: <5 min.
- E2E: <15 min (nightly).

Exceeding budget is a P1 gap.
