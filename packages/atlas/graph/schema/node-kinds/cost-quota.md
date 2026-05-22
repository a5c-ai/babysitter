# NodeKinds: `CostModel`, `Quota`, `UsageRecord`, `BudgetPolicy`

> Cluster — Cost & quota. See [`README.md`](./README.md) for the full catalog.

## Purpose

This cluster makes per-token, per-call, and per-tenant economic data first-class catalog
entities. Without it, the graph can describe *which* model an agent uses but not *what it
costs* nor *who is responsible for the bill*. With it, the graph carries the chain
`CostModel → UsageRecord → BudgetPolicy → Quota`, so any spend claim is queryable, billable,
and enforceable.

The four NodeKinds split into:

1. **`CostModel`** — a price card for a `Provider` (per-million input/output token rates,
   currency, effective-from date). The unit-economics root.
2. **`Quota`** — a metered ceiling (tokens, requests, dollars) over a window. Quotas
   `constrains` `Tenant`, `Customer`, `Role`, or `OrgUnit` actors.
3. **`UsageRecord`** — a single observed unit of consumption (tokens in/out, total cost) at
   a timestamp, attributed to a `Tenant` and priced by a `CostModel`.
4. **`BudgetPolicy`** — a higher-order spend cap with alert thresholds and an
   `onExceeded` action (`block` / `throttle` / `alert`); composes one or more `Quota`s.

This cluster is the surface that lets the schema answer:

- "What's the projected monthly spend for `tenant:acme` across all model providers?"
- "Which `BudgetPolicy` governs `tenant:acme` in Q2 2026, and at what alert thresholds?"
- "List the `Quota`s currently constraining `role:end-user`."
- "For `agent-version:symphony@1.4.0`, what is the per-run average `UsageRecord.totalCost`?"

---

## `CostModel`

A price card for a model or provider, per-million tokens.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `cost-model:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `currency` | enum<USD,EUR,GBP,JPY> | yes | ISO-4217 currency code (whitelist; expand as needed). |
| `inputPricePerMTokens` | cost-per-million-tokens | yes | Cost per million input tokens. |
| `outputPricePerMTokens` | cost-per-million-tokens | yes | Cost per million output tokens. |
| `effectiveFrom` | iso-date | yes | Date the price card became effective. |
| `effectiveUntil` | iso-date | optional | Date the price card was retired (open-ended when unset). |
| `description` | markdown | yes | One-paragraph description of the price card. |
| `homepageUrl` | url | optional, evidence: vendor-doc-or-better | Vendor pricing page; evidence-bound when set. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `provides_cost_for` | `Provider` | N:N | The provider this price card prices. (Plan originally specified `ModelProvider`; remapped to `Provider` per catalog pass 19 review.) |

### Evidence

`homepageUrl`, when set, is evidence-bound at `vendor-doc-or-better`. Numeric prices are
editorial unless an explicit policy upgrades them.

### Invariants

1. `inputPricePerMTokens` ≥ 0 and `outputPricePerMTokens` ≥ 0.
2. `effectiveFrom` ≤ `effectiveUntil` (when both set).
3. `id` MUST follow the form `cost-model:<kebab-slug>`.

---

## `Quota`

A metered ceiling enforced over a window.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `quota:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `metric` | enum<tokens,requests,cost-usd,calls> | yes | What is metered. |
| `limit` | float | yes | Numeric ceiling in `metric`'s unit. |
| `windowSeconds` | int | yes | Rolling window length in seconds. |
| `hardLimit` | bool | yes | `true` = block on breach; `false` = soft (alert only). |
| `description` | markdown | yes | One-paragraph description. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `constrains` | `Tenant` \| `Customer` \| `Role` \| `OrgUnit` | N:N | The actor whose consumption the quota meters. (Plan originally also targeted `Identity`; that NodeKind does not exist in atlas — replaced with `Role` per catalog pass 19 review.) |

### Evidence

No evidence-bound attributes by default.

### Invariants

1. `limit` > 0; `windowSeconds` > 0.
2. `id` MUST follow the form `quota:<kebab-slug>`.

---

## `UsageRecord`

A single observed unit of consumption at a point in time.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `usage-record:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `occurredAt` | iso-timestamp | yes | When the usage occurred. |
| `inputTokens` | tokens | optional | Input tokens, when applicable. |
| `outputTokens` | tokens | optional | Output tokens, when applicable. |
| `totalCost` | float | yes | Total cost in `currency`. |
| `currency` | enum<USD,EUR,GBP,JPY> | yes | ISO-4217 currency code. |
| `description` | markdown | optional | Free-form commentary. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `measures_usage_of` | `AgentVersion` \| `ModelVersion` \| `Run` \| `Invocation` \| `Effect` | N:1 | The catalog entity whose execution generated the usage. |
| `priced_by` | `CostModel` | N:1 | The price card applied to compute `totalCost`. |
| `attributed_to` | `Tenant` \| `Customer` \| `EndUser` \| `OrgUnit` | N:1 | The actor billed for the usage. |

### Evidence

No evidence-bound attributes by default.

### Invariants

1. `totalCost` ≥ 0.
2. If `inputTokens` and `outputTokens` are both set and `priced_by` is bound, `totalCost`
   SHOULD be consistent with the referenced `CostModel`.
3. `id` MUST follow the form `usage-record:<kebab-slug>`.

---

## `BudgetPolicy`

A higher-order spend cap composed of one or more quotas, with alert thresholds and an
`onExceeded` action.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `budget-policy:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `totalBudget` | float | yes | Total spend ceiling in `currency`. |
| `currency` | enum<USD,EUR,GBP,JPY> | yes | ISO-4217 currency code. |
| `periodStart` | iso-date | yes | Period start. |
| `periodEnd` | iso-date | yes | Period end. |
| `alertThresholds` | list<float> | yes | Fractional thresholds (0..1) at which alerts fire (e.g., `[0.5, 0.8, 0.95]`). |
| `onExceeded` | enum<block,throttle,alert> | yes | Action when `totalBudget` is reached. |
| `description` | markdown | yes | One-paragraph description. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `governs` | `Tenant` \| `Customer` \| `OrgUnit` | N:N | The actor whose spend the policy caps. |
| `enforces` | `Quota` | N:N | The quota(s) this policy aggregates / enforces. |

### Evidence

No evidence-bound attributes by default.

### Invariants

1. `totalBudget` > 0; `periodStart` < `periodEnd`.
2. Every entry in `alertThresholds` lies in `(0, 1]`; the list is sorted ascending.
3. `id` MUST follow the form `budget-policy:<kebab-slug>`.

---

## Examples

See [`graph/extensions/cost-quota/`](../graph/extensions/cost-quota/).

## Related

- [`README.md`](./README.md) — the full node-kind catalog and cluster index.
- [`role-ontology.md`](./role-ontology.md) — `Tenant`, `Customer`, `EndUser`, `OrgUnit` are
  the actors `Quota.constrains` and `BudgetPolicy.governs`.
- [`../../schema/edge-kinds.md`](../../schema/edge-kinds.md) — `provides_cost_for`, `constrains`,
  `measures_usage_of`, `priced_by`, `attributed_to`, `governs`, `enforces` edge specs.

