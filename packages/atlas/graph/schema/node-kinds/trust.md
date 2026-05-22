# NodeKinds: Trust

> Cluster 12 — Trust. Specifies the `TrustLevel` enum that grades evidence
> quality. See [`README.md`](./README.md) for the full catalog and
> [`../../schema/meta-schema.md`](../../schema/meta-schema.md) for the standard node-kind file shape.
>
> **Scope note (Phase 1 ontology):** the cross-stack signing / attestation
> Trust Chain (formerly `Authority` and `Attestation` NodeKinds, plus the
> `trust-interface` ExtensionInterface) is **out-of-scope for the atlas Phase 1
> ontology**. The Trust Chain is being deferred to a separate trust-and-signing
> initiative if pursued. What remains here is the evidence-quality grading
> primitive — `TrustLevel` — which is unrelated to chain-signing and is
> referenced from every `EvidenceSource` (see
> [`../../schema/evidence-model.md`](../../schema/evidence-model.md)).

## Purpose

This file specifies `TrustLevel`, the four-rung enum that gates evidence quality
([`../../schema/evidence-model.md`](../../schema/evidence-model.md)). Every `EvidenceSource`
carries a `TrustLevel`, so the validator can distinguish a vendor-attributable
claim from a synthetic guess.

`TrustLevel` is intentionally **not** a chain-signing concept. It does not name
principals, carry signatures, or chain attestations. It is purely a grade applied
to a piece of evidence so policy rules ("safety-critical claims MUST NOT be
backed solely by synthetic evidence") can be expressed declaratively.

---

## NodeKind: `TrustLevel`

The fixed four-rung enum, stored as nodes so freshness defaults and definitions
attach to it. Referenced from every `EvidenceSource`.

> **Naming note:** despite the bare name `TrustLevel`, this NodeKind models
> *evidence quality grading* (official-web > vendor-doc > community > synthetic),
> NOT a chain-signing concept. It exists solely to back the
> `EvidenceSource.trustLevel` attribute and the evidence-policy
> `minimumTrustLevel` rule. Treat the name as shorthand for "evidence trust
> level".

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `trust-level:<slug>`, e.g. `trust-level:official-web`. |
| `displayName` | string | yes | Human-readable name. |
| `level` | enum<official-web,vendor-doc,community,synthetic,repo> | yes | The canonical level identifier. |
| `description` | markdown | yes | What evidence at this level looks like. |
| `freshnessWindowDaysDefault` | int | yes | Default freshness window in days for evidence at this level. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `evidence_at_level` | `EvidenceSource` | 1:N | Inverse of `at_trust_level`. |

### Invariants

1. The set of `level` values is exactly `{official-web, vendor-doc, community, synthetic, repo}` (V-8.3). New levels require a schema bump.
2. `TrustLevel` is `isolatedAllowed: true` for V-12.1 (its only edges arrive from
   `EvidenceSource`).

---

## Examples

```yaml
# The four TrustLevel records
- id: trust-level:official-web
  displayName: "Official web"
  level: official-web
  freshnessWindowDaysDefault: 180
  description: |
    Vendor-published web documentation currently live on the vendor's domain.
- id: trust-level:vendor-doc
  displayName: "Vendor documentation"
  level: vendor-doc
  freshnessWindowDaysDefault: 365
  description: |
    Vendor-authored documentation: PDFs, mirrored doc sites, signed release notes.
- id: trust-level:community
  displayName: "Community"
  level: community
  freshnessWindowDaysDefault: 365
  description: |
    Third-party community sources — blog posts, talks, well-known maintainers' notes.
- id: trust-level:synthetic
  displayName: "Synthetic"
  level: synthetic
  freshnessWindowDaysDefault: 90
  description: |
    LLM-generated content, model-card paraphrase, or schema-inferred default. Never
    sufficient on its own for safety-critical claims.
- id: trust-level:repo
  displayName: "Repo"
  level: repo
  freshnessWindowDaysDefault: 30
  description: |
    First-party source-of-truth from this repository (committed code, package
    layouts, in-repo docs). Used by EvidenceSource entries that point at files
    inside the catalog's own monorepo. Highest-trust evidence for facts about
    this repo's own behavior; not authoritative for external vendor surfaces.
```

## Related

- [`../../schema/evidence-model.md`](../../schema/evidence-model.md) — `Claim`, `EvidenceSource`,
  `EvidencePolicy`, the trust ordering, and the worked example.
- [`catalog-meta.md`](./catalog-meta.md) — the catalog-meta cluster these nodes
  participate in.
- [`../../schema/validation-rules.md`](../../schema/validation-rules.md) — V-8 trust rules.
