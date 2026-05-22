# NodeKinds: `ComplianceFramework`, `Regulator`, `ContentPolicy`, `JailbreakPattern`

> Cluster — Compliance & safety. See [`README.md`](./README.md) for the full catalog.

## Purpose

This cluster makes regulatory frameworks, the bodies that publish them, and the safety
artifacts that operationalize them addressable in the catalog. Without it, the graph can
say an agent has a content policy but cannot anchor *which framework* the policy
implements, *which regulator* publishes that framework, or *which jailbreak patterns* the
policy is meant to detect. With it, the chain
`Regulator → ComplianceFramework → ContentPolicy → JailbreakPattern` is queryable end to
end.

The four NodeKinds are:

1. **`ComplianceFramework`** — a published framework or regulation (NIST AI RMF, EU AI Act,
   ISO/IEC 42001).
2. **`Regulator`** — the body that publishes / enforces a framework (NIST, EU AI Office,
   ICO, FTC).
3. **`ContentPolicy`** — an operational ruleset applied at runtime (acceptable-use,
   data-handling, brand-voice).
4. **`JailbreakPattern`** — a known attack pattern a `ContentPolicy` is meant to detect
   (DAN, indirect prompt injection, persona override).

This cluster is the surface that lets the schema answer:

- "Which `ContentPolicy` does `agent-version:symphony@1.4.0` apply, and which framework does
  it implement?"
- "List jailbreak patterns first observed before 2024 that the default acceptable-use
  policy claims to detect."
- "Which `Regulator` publishes the EU AI Act?"

---

## `ComplianceFramework`

A published framework or regulation.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `compliance-framework:<slug>`. |
| `displayName` | string | yes | Canonical name. |
| `shortName` | string | optional | Common abbreviation (e.g., `"NIST AI RMF"`). |
| `homepageUrl` | url | yes, evidence: vendor-doc-or-better | Canonical homepage. |
| `jurisdiction` | enum<global,us,eu,uk,jp,ca,au,other> | yes | Geographic scope. |
| `version` | string | yes | Free-form (frameworks do not share a versioning scheme). |
| `publishedAt` | iso-date | yes | First publication date. |
| `description` | markdown | yes | One-paragraph description. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `published_by` | `Regulator` | N:1 | The body that publishes / owns the framework. |

### Evidence

`homepageUrl` is required and evidence-bound at `vendor-doc-or-better`.

### Invariants

1. `id` MUST follow the form `compliance-framework:<kebab-slug>`.

---

## `Regulator`

A regulatory body or standards organization.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `regulator:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `homepageUrl` | url | yes, evidence: vendor-doc-or-better | Canonical homepage. |
| `jurisdiction` | enum<global,us,eu,uk,jp,ca,au,other> | yes | Geographic scope of authority. |
| `authorityKind` | enum<agency,standards-body,inter-government,industry-association> | yes | Kind of authority. |
| `description` | markdown | yes | One-paragraph description. |

### Edges

No outgoing edges by default. Inverse: `ComplianceFramework.published_by`.

### Evidence

`homepageUrl` is required and evidence-bound at `vendor-doc-or-better`.

### Invariants

1. `id` MUST follow the form `regulator:<kebab-slug>`.

---

## `ContentPolicy`

An operational ruleset applied at runtime.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `content-policy:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `policyKind` | enum<acceptable-use,data-handling,brand-voice,safety,jurisdictional> | yes | Discriminator. |
| `version` | string | yes | Free-form version tag. |
| `prohibits` | list<string> | yes | Tags / categories prohibited (e.g., `csam`, `pii-exfiltration`). |
| `restrictedDomains` | list<string> | optional | Domain names where the policy applies extra restriction (e.g., `healthcare`, `legal`). |
| `description` | markdown | yes | One-paragraph description. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `applied_by` | `AgentVersion` | N:N | The agent version that applies the policy at runtime. (Plan originally also targeted `Guardrail`; that NodeKind does not exist in atlas — dropped per catalog pass 19 review until/unless `Guardrail` is separately introduced.) |
| `implements_framework` | `ComplianceFramework` | N:N | The framework(s) the policy operationalizes. |

### Evidence

No evidence-bound attributes by default.

### Invariants

1. `prohibits` is non-empty.
2. `id` MUST follow the form `content-policy:<kebab-slug>`.

---

## `JailbreakPattern`

A known attack pattern.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `jailbreak-pattern:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `patternKind` | enum<persona-override,indirect-injection,prompt-leak,context-stuffing,roleplay,obfuscation,other> | yes | Discriminator. |
| `firstObservedAt` | iso-date | yes | First-observed date. |
| `description` | markdown | yes | One-paragraph description of the pattern. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `detected_by` | `ContentPolicy` | N:N | The policy / detector that catches the pattern. |

### Evidence

No evidence-bound attributes by default.

### Invariants

1. `id` MUST follow the form `jailbreak-pattern:<kebab-slug>`.

---

## Examples

See [`graph/extensions/compliance/`](../graph/extensions/compliance/).

## Related

- [`README.md`](./README.md) — the full node-kind catalog and cluster index.
- [`agent-stack.md`](./agent-stack.md) — `AgentVersion` is the target of
  `ContentPolicy.applied_by`.
- [`../../schema/edge-kinds.md`](../../schema/edge-kinds.md) — `published_by`, `applied_by`,
  `implements_framework`, `detected_by` edge specs.

## catalog pass 53 — OutputGuard

Agent-core runtime safety gate, distinct from `ContentPolicy` (the compliance-
side, organization-mandated declaration). `OutputGuard` is the executable hook
that runs over generated tokens / tool results before they reach the user —
sourced from pi-mono `output-guard.ts` and claude-code `getErrorMessageIfRefusal`
(stop_reason=refusal handling, AUP-violation rewrite).

### NodeKind: `OutputGuard`

#### Attributes

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | |
| `displayName` | string | yes | |
| `appliesTo` | enum&lt;assistant-text,tool-result,thinking,all&gt; | yes | |
| `phase` | enum&lt;streaming,post-call,both&gt; | no | |
| `detectorKinds` | list&lt;enum&lt;refusal-stop-reason,aup-violation,secret-leak,pii-leak,prompt-injection-echo,format-violation,profanity,custom&gt;&gt; | no | |
| `onTrigger` | enum&lt;rewrite,redact,block,emit-error,emit-system-message,fallback-model&gt; | yes | |
| `emitsErrorCategoryId` | ref&lt;ErrorCategory&gt; | no | |
| `rewriteTemplateId` | ref&lt;PromptTemplate&gt; | no | claude-code AUP refusal message. |
| `severity` | enum&lt;info,warn,block-call,block-session&gt; | no | |
| `description` | markdown | no | |

#### Invariants

1. `id` MUST start with `output-guard:`.

#### Relationships

- `applies_output_guard` → `AgentVersion | AgentRuntimeImpl | AgentCoreImpl` (inverse `output_guard_applied_by`, N:N)

