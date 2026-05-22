# 04 — Evidence Model

A claim without evidence is not a claim. This file defines the `Claim` and `EvidenceSource` node kinds, the `TrustLevel` enum, the evidence policies that gate evidence-bound attributes, and a worked example.

## Two paths: direct `evidenceSourceIds` vs. reified `Claim`

> **catalog pass 9c remodel (2026-04-29):** evidence binding has two valid forms.
> Pick the simpler one by default.

There are two valid ways to attach evidence to a fact in the graph:

1. **Direct `evidenceSourceIds`** — set the optional `evidenceSourceIds:
   list<ref<EvidenceSource>>` attribute (or, on edges that support it,
   the `evidenceSourceIds` edge attribute) directly on the bearer of the
   fact. Most evidence-bound attributes in the catalog use this form; it is
   the default. Every NodeKind whose attributes carry evidence-bound values
   may also carry `evidenceSourceIds` as an explicit optional attribute.

2. **Reified `Claim` node** — mint a separate `Claim` node and link it to
   the subject. Use this **only** when at least one of the following is
   true:
   - The fact is **disputed** — multiple competing evidence sources
     disagree and need explicit reconciliation.
   - The fact is **time-banded** — the value is only valid for a window
     (`claimedAt` / `expiresAt`) and you need to record supersession.
   - The fact has been **superseded** by a newer claim and the lineage
     (`supersededBy`) needs to remain queryable.

Otherwise, prefer the direct form. A direct `evidenceSourceIds` reference
is sufficient for stable, undisputed facts and avoids the indirection cost
of a separate node per fact.

For example, a `supports` edge that records "Claude Code 1.0+ supports MCP"
should use direct `evidenceSourceIds` on the edge entry — there is no
dispute and no time-band. A claim that "context window is 1,000,000 tokens
*until Anthropic widens it again*" is a candidate for a `Claim` because the
value is expected to change.

## Claim

A `Claim` is a typed assertion about `(subject, attribute, value)` backed by one or more `EvidenceSource` records. **Optional**: only mint a Claim for disputed / time-banded / superseded facts. For stable facts, use the direct `evidenceSourceIds` path described above.

| Attribute | Type | Required? | Notes |
|---|---|---|---|
| `id` | `id` | yes | `claim:<slug>` |
| `claimId` | `string` | yes | stable identifier (typically equals `id`) |
| `subjectId` | `ref<NodeKind>` | yes | the entity the claim is about |
| `subjectKind` | `string` | no | NodeKind name of the subject (denormalized for fast filtering) |
| `attribute` | `string` | yes | the attribute name on the subject |
| `value` | `any` | yes | the claimed value (typed by the subject's attribute spec) |
| `statement` | `markdown` | no | human-readable restatement of the claim |
| `evidenceSourceIds` | `list<ref<EvidenceSource>>` | yes | at least one |
| `evidenceIds` | `list<ref<EvidenceSource>>` | no | alias / superset of `evidenceSourceIds` for legacy compatibility |
| `confidence` | `enum<low,medium,high,vendor-confirmed>` | no | reviewer confidence in the value |
| `provenanceKind` | `enum<vendor-doc,community,observation,inferred,synthetic>` | no | provenance bucket aligned with the lowest trust level among referenced evidence |
| `evidenceStrength` | `enum<weak,moderate,strong,vendor-confirmed>` | no | strength roll-up across all referenced evidence |
| `status` | `enum<active,deprecated,superseded,disputed>` | no | lifecycle status of the claim |
| `unresolvedGaps` | `list<ref<Gap>>` | no | gaps that block this claim from being closed |
| `claimedAt` | `iso-timestamp` | yes | when the claim was authored |
| `claimedBy` | `ref<Authority>` | yes | reviewer or authority responsible |
| `expiresAt` | `iso-timestamp` | no | when re-evidence is required; defaults from policy `freshnessWindowDays` |
| `supersededBy` | `ref<Claim>` | no | set when a newer claim replaces this one |
| `note` | `markdown` | no | reviewer commentary |
| `claimKind` | `enum<assertion,conformance,evaluation,provenance>` | yes | **catalog pass 19 addition** (new required attribute — verified absent from prior atlas Claim schema). Discriminates the kind of claim: a generic factual `assertion`, a `conformance` claim against a `ComplianceFramework` (subsumes the former `ConformanceClaim` proposal — catalog pass 19 reviewer fold), an `evaluation` rollup citing one or more `EvalResult`s, or a `provenance` claim about how a value was sourced. |

## EvidenceSource

An `EvidenceSource` is a discrete piece of evidence (a doc page, a file, a package metadata entry, an observation, an attestation).

| Attribute | Type | Required? | Notes |
|---|---|---|---|
| `id` | `id` | yes | `evidence:<slug>` |
| `evidenceId` | `string` | yes | stable identifier (typically equals `id`) |
| `kindLabel` | `enum<web,file,package,observation,attestation>` | yes | what kind of source |
| `trustLevel` | `ref<TrustLevel>` | yes | one of the four levels (see below) |
| `sourcePathOrUrl` | `string` | no | unified pointer (URL, repo-relative path, or package coordinate); supersedes `sourceUrl`/`filePath`/`packageId` for new entries |
| `sourceUrl` | `url` | conditional | required when `kindLabel = web` |
| `filePath` | `string` | conditional | required when `kindLabel = file` |
| `packageId` | `string` | conditional | required when `kindLabel = package` (e.g. npm name + version) |
| `locator` | `string` | no | sub-resource pointer within the source (anchor, line range, page number, key path) |
| `capturedAt` | `iso-timestamp` | no | when the evidence was first captured (alias of `observedAt` for legacy entries) |
| `observedAt` | `iso-timestamp` | yes | when the evidence was captured |
| `observedBy` | `ref<Authority>` | yes | reviewer or automated agent that captured it |
| `reachabilityCheck` | `map<string,any>` | no | `{lastChecked, status, statusCode, redirects}` |
| `reviewOwner` | `ref<Authority>` | no | accountable reviewer for this source |
| `reviewedAt` | `iso-timestamp` | no | last manual review timestamp |
| `freshnessWindowDays` | `int` | no | overrides policy default for this source |
| `excerpt` | `markdown` | no | the relevant snippet (helpful for offline review) |

## TrustLevel

`TrustLevel` is itself a node kind so new levels can be added with definitions and policy hooks.

| Value | Definition |
|---|---|
| `official-web` | Vendor-published web doc currently live on the vendor's domain |
| `vendor-doc` | Vendor-authored doc (PDF, internal mirror, signed release notes) — vendor-attributable but not necessarily live web |
| `community` | Third-party community sources (blog posts, conference talks, well-known maintainers' notes) |
| `synthetic` | LLM-generated content, model-card paraphrase, or schema-inferred default; lowest trust, never sufficient on its own for safety-critical claims |

Trust levels form a strict order: `official-web > vendor-doc > community > synthetic`.

## EvidencePolicy

An `EvidencePolicy` is the rule that gates an evidence-bound attribute. Policies live as nodes (`policy:<slug>`) so they can be composed and version-bumped.

| Attribute | Type | Required? | Notes |
|---|---|---|---|
| `id` | `id` | yes | `policy:<slug>` |
| `minimumTrustLevel` | `ref<TrustLevel>` | yes | the floor for accepted evidence |
| `freshnessWindowDays` | `int` | yes | how many days a source remains valid |
| `requiresAttestation` | `bool` | no | if true, claim must have an `Attestation` signed by an `Authority` |
| `reviewOwnerPattern` | `string` (regex) | no | constraint on `reviewOwner` (e.g., `^@a5c-ai/`) |
| `vendorBackedSelector` | `string` | no | selector for "vendor-backed" claims (e.g., `subjectId starts with model:`) |
| `appliesTo` | `list<string>` | yes | attribute selectors this policy gates (e.g., `Capability.versionRange`, `*.supportsThinking`) |

The schema header declares a **default policy**:

```yaml
- id: policy:default
  minimumTrustLevel: trust:community
  freshnessWindowDays: 365
  requiresAttestation: false
  appliesTo: ["*"]
```

Per-attribute rules override the default. For example, capability claims on `AgentVersion` use:

```yaml
- id: policy:capability
  minimumTrustLevel: trust:vendor-doc
  freshnessWindowDays: 180
  requiresAttestation: false
  reviewOwnerPattern: "^@a5c-ai/"
  appliesTo: ["AgentVersion.supports", "AgentVersion.supportsThinking"]
```

## Worked example

A claim that **Claude Opus 4.7** supports the `thinking_budget_tokens` parameter, backed by Anthropic's API reference.

```yaml
# Subject: model-version:claude-opus-4-7

evidence:
  - id: evidence:anthropic-api-thinking-2026-01
    kindLabel: web
    trustLevel: trust:official-web
    sourceUrl: https://docs.anthropic.com/en/api/messages#extended-thinking
    observedAt: "2026-01-15T09:32:00Z"
    observedBy: authority:a5c-ai-catalog
    reachabilityCheck:
      lastChecked: "2026-04-20T03:00:00Z"
      status: ok
      statusCode: 200
      redirects: 0
    reviewOwner: authority:a5c-ai-catalog
    reviewedAt: "2026-01-15T09:32:00Z"
    freshnessWindowDays: 180
    excerpt: |
      `thinking.budget_tokens` (integer) — the maximum number of tokens
      Claude is allowed to use for its internal reasoning before producing
      a response. Available on Opus 4.7 and Sonnet 4.7.

claims:
  - id: claim:claude-opus-4-7-thinking-budget
    subjectId: model-version:claude-opus-4-7
    attribute: supportsThinkingBudgetTokens
    value: true
    evidenceSourceIds:
      - evidence:anthropic-api-thinking-2026-01
    claimedAt: "2026-01-15T09:35:00Z"
    claimedBy: authority:a5c-ai-catalog
    expiresAt: "2026-07-14T00:00:00Z"   # claimedAt + 180d (policy:capability)
    note: |
      Anthropic API reference explicitly lists Opus 4.7 as supporting
      `thinking.budget_tokens`. Re-verify before policy expiration.
```

The validator binds this claim to the `policy:capability` rule because the attribute `supportsThinkingBudgetTokens` is selector-matched. The single `official-web` source clears the `vendor-doc` floor with margin; `freshnessWindowDays: 180` is observed; `reviewOwner` matches `^@a5c-ai/`. The claim passes.

If the source's `reachabilityCheck.status` later flips to `not-found`, the claim's policy is violated; CI flags the claim as **stale-evidence** and blocks the next release until the claim is renewed or superseded.


