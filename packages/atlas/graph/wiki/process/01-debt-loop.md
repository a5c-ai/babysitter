---
id: page:process-01-debt-loop
nodeKind: Page
title: "Debt-Driven Loop"
slug: "process/01-debt-loop"
articlePath: "wiki/process/01-debt-loop.md"
documents: []
---
# Debt-Driven Loop

> Companion to [`00-process-design.md`](./00-process-design.md), Section 3. This document describes the seven levels of the debt loop with concrete, worked examples per level and the day-to-day mechanics of running it.

The debt loop is the engine that keeps the v6 ecosystem in alignment after the forward phases (1–5) have laid down the initial artifacts. It detects, prioritizes, and closes drift between **what is true in the world** and **what every projection of the graph claims is true**. Levels are ordered by priority — lower level numbers always win — because a finding at Level N invalidates every derivation at Levels N+1..7.

## Level 1 — Real world vs graph + schema

Truth from outside the repository contradicts (or extends) what the graph + schema say.

Examples:
- Anthropic publishes a new model variant (e.g. `claude-opus-4-7[1m]`) with attributes the schema does not yet model. The graph has no `ModelVersion` node for it; `attribute-types.yaml` has no field for the new context-window size.
- A vendor changelog deprecates a transport (e.g. SSE for MCP) — graph still records `MCPTransport: sse` as `supportLevel: stable`.
- A community plugin lands on the Claude Code marketplace covering a use case the graph does not list as a `Plugin`.
- Telemetry shows a 404 spike on a generated docs page after an upstream URL renames — `EvidenceSource.reachabilityCheck` should fail and surface the gap.

Closing a Level-1 gap typically requires a schema bump (new attribute or NodeKind) **and** new graph data **and** new evidence.

## Level 2 — Graph vs docs

The graph data drifts from the prose specifications under `schema/node-kinds/` and the YAML schema files.

Examples:
- An invariant is added to `invariants.yaml` (V-12.7 say) but never written into the prose of `schema/validation-rules.md`.
- A NodeKind file lists an attribute that the YAML no longer requires; or the YAML adds an attribute the markdown does not document.
- An example YAML under `schema/examples/` references a removed edge name.

Closing a Level-2 gap is mostly mechanical: docs ↔ data ↔ schema reconciliation, gated by the markdown/YAML parity check (V-12.5).

## Level 3 — Quality / delivery process vs docs

Phase-5 deliverables (CI, versioning, distribution) drift from what the process docs say they should do.

Examples:
- `schema/versioning.md` says major bumps require a `MigrationSpec`, but the release pipeline does not enforce it.
- The CI gate on freshness runs nightly even though [`qa/02-cicd.md`](../qa/02-cicd.md) mandates per-PR.
- `npm publish` for the SDK fires without the `sourceGraphVersion` tag the spec requires.

## Level 4 — Generators vs docs

A generator under `wiki/generators/` emits something different from what `schema/derivation-spec.md` and the wiki architecture documents specify.

Examples:
- The glossary generator drops `deprecatedAt` from `Term` entries even though the spec says deprecated terms must show a strikethrough notice.
- The capability matrix renders the wrong column order after a schema attribute is renamed but the generator template is not updated.
- A page-type-to-query mapping in `wiki/01-derivation-mapping.md` references an edge the generator no longer traverses.

## Level 5 — Code vs docs + above

Implementation code (validators, generator code, runtime helpers) hard-codes facts that the schema/graph already encodes, or diverges from the spec.

Examples:
- A validator hand-codes the list of `kindLabel` values for `EvidenceSource` instead of reading them from `attribute-types.yaml`. When a new label lands at Level 1, the validator silently passes invalid graphs.
- A generator script reads `model:claude-opus-4-7` directly by id rather than querying `ModelFamily → has_version → ModelVersion` — adding a new version requires a code edit instead of a graph edit.

## Level 6 — Programmable interfaces vs SDK + above

The SDK surface (TypeScript types, exported constants, function signatures) drifts from the schema-derived contract.

Examples:
- A new `CapabilitySupport.supportLevel` enum value is added at Level 1; the SDK's TypeScript union type is not regenerated, so consumers cannot type-check new graphs.
- An exported constant `KNOWN_HOOK_SURFACES` is hand-maintained rather than generated from `HookSurface` nodes.

## Level 7 — User-facing interfaces vs everything above

CLI, web UI, dashboards drift from the SDK and the spec.

Examples:
- The `babysitter` CLI's `--model` flag autocompletes an outdated model list because the autocomplete script is hand-rolled instead of fed by the SDK constant.
- A dashboard widget shows `coverage: 87%` from a stale snapshot rather than re-querying via the SDK.

## Mechanics per iteration

1. Pick the highest-priority unaddressed gap (Section 3 of the design doc).
2. Open a `Gap` node and a `process/gaps/GAP-...md` file (template: [`gaps/_template.md`](./gaps/_template.md)).
3. Close the originating level.
4. Apply the cascade ([`02-cascade-rule.md`](./02-cascade-rule.md)).
5. Adversarial review by a different identity.
6. Flip `status` to `closed` once every `propagationStatus` entry is `done` or `not-applicable`.
