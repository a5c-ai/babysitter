---
id: page:process-03-governance
nodeKind: Page
title: "Governance"
slug: "process/03-governance"
articlePath: "wiki/process/03-governance.md"
documents: []
---
# Governance

> Companion to [`00-process-design.md`](./00-process-design.md), Section 8.

Every phase and every debt-loop level has a named owner. Owners are represented as `Authority` nodes in the graph and referenced from the `owner` field on `Gap` nodes (and on `Claim`, `EvidenceSource` per the evidence model).

## Per-phase owners

| Phase | Owner role | Responsibilities |
|---|---|---|
| 1 — Schema | **Schema owner** | Final say on `ontology-schema.yaml`, `attribute-types.yaml`, `invariants.yaml`, the meta-schema, and all `02-node-kinds/` specs. Approves schema bumps. |
| 2 — Full graph | **Graph data owners** (one per cluster group) | Drive full-coverage population for their NodeKinds. Sign off on evidence freshness. |
| 3 — Generators | **Generator owners** (one per generator listed in `06-derivation-spec.md`, plus the `Gap` sync generator) | Maintain the generator code, templates, and integration tests. |
| 4 — Wiki | **Wiki editors** | Navigation, search, page templates, asset handling. Page **content** is generated; editors do not author prose. |
| 5 — QA / delivery | **QA owner** | CI/CD pipeline, evidence-boundary checks, release gates, downstream artifact distribution, versioning enforcement. |

## Per-level owners (debt loop)

| Level | Owner |
|---|---|
| 1 — Real world vs graph | **Debt-loop coordinator** runs the weekly batch review; cluster-specific graph data owners execute. |
| 2 — Graph vs docs | Schema owner (gate at PR) + relevant graph data owner (fix). |
| 3 — Process docs | Debt-loop coordinator. |
| 4 — Generators / wiki | Generator owner of the affected generator + wiki editor for navigation impact. |
| 5 — Code vs docs | Generator owner (for generator code) or QA owner (for validators / runtime helpers). |
| 6 — SDK | QA owner (releases) + schema owner (contract). |
| 7 — Interfaces | The owner of each interface (CLI, dashboard, etc.) — recorded as the `Authority` on the relevant `Presentation` node. |

## Cross-cutting

The **debt-loop coordinator** is responsible for ensuring the cascade rule ([`02-cascade-rule.md`](./02-cascade-rule.md)) is applied on every gap closure, runs the weekly Level-1 batch review, and arbitrates priority disputes. They do **not** approve their own work — the adversarial-review rule (Section 5) still applies.

When two graph data owners disagree on a cross-cluster edge, the **schema owner** arbitrates. When schema and QA owners disagree on a release gate, the debt-loop coordinator brokers. All such arbitration outcomes land as `Gap` resolutions with `propagationChain` entries citing the deciding authority.

Human-in-the-loop is required for schema changes (any edit to `ontology-schema.yaml`, `attribute-types.yaml`, or `invariants.yaml`); agent-only review is sufficient for graph data changes that do not bump the schema.
