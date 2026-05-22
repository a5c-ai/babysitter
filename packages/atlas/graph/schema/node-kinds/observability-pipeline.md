# NodeKinds: `ObservabilityBackend`, `Span`

> Cluster — Observability pipeline. See [`README.md`](./README.md) for the full catalog.

## Purpose

This cluster makes the *observability data path* — where traces, metrics, and logs from
agent runs flow — addressable in the catalog. Without it, the graph can describe runs but
not where their telemetry lands. With it, the graph carries `Effect → Span →
ObservabilityBackend`, so any "show me the traces for run X" query is answerable.

The cluster collapses former `MetricSink` and `LogSink` proposals into the single
`ObservabilityBackend` NodeKind, discriminated by an `kind` enum. `Span` is the canonical
unit of observed work; it is intentionally OpenTelemetry-shaped.

The two NodeKinds are:

1. **`ObservabilityBackend`** — a destination for telemetry (Datadog, Honeycomb, Grafana
   Cloud, self-hosted Tempo/Loki, etc.), `kind`-discriminated as `trace` / `metric` / `log`
   / `multi`.
2. **`Span`** — one span emitted by an `Effect` (or comparable runtime entity),
   OpenTelemetry-shaped (`traceId`, `spanId`, `parentSpanId`, timing, attributes).

This cluster is the surface that lets the schema answer:

- "Which `ObservabilityBackend` receives traces for `agent-version:symphony@1.4.0`?"
- "For trace `4bf92f...`, what is the root span's duration?"
- "Which backends ingest OTLP, and which are agent-protocol-only?"

---

## `ObservabilityBackend`

A telemetry destination.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `observability-backend:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `homepageUrl` | url | yes, evidence: vendor-doc-or-better | Vendor or project homepage. |
| `kind` | enum<trace,metric,log,multi> | yes | What signal kinds the backend ingests. `multi` covers backends that handle two or more. |
| `protocols` | list<string> | yes | Wire protocols accepted (e.g., `otlp`, `statsd`, `prometheus-remote-write`, `datadog-agent`). |
| `description` | markdown | yes | One-paragraph description. |

### Edges

No outgoing edges by default. Inverse: `Span.reports_to` lands here.

### Evidence

`homepageUrl` is **required** and evidence-bound at `vendor-doc-or-better`.

### Invariants

1. `protocols` is non-empty.
2. `id` MUST follow the form `observability-backend:<kebab-slug>`.

---

## `Span` (origin: `universal`)

> **catalog pass 22 origin correction:** previously `standardized`; reclassified to
> `universal`. Span semantics are universal in tracing — OTel is one (dominant)
> concrete standard, but the span concept predates and outlives any single spec.
> See `REMODEL-NOTES.md` (catalog pass 22 hygiene).

A single observed unit of work, OpenTelemetry-shaped.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `span:<slug>`. |
| `displayName` | string | yes | Span name (`service.name` + operation, typically). |
| `traceId` | string | yes | 16-byte hex trace id. |
| `spanId` | string | yes | 8-byte hex span id. |
| `parentSpanId` | string | optional | Parent span id; null/unset for root spans. |
| `startTime` | iso-timestamp | yes | Span start. |
| `endTime` | iso-timestamp | yes | Span end. |
| `durationMs` | int | optional | Convenience duration in milliseconds (derivable from start/end). |
| `status` | enum<OK,ERROR,UNSET> | yes | OpenTelemetry span status. |
| `attributes` | map<string,any> | optional | Span attributes (OTel-style key/value bag). |
| `description` | markdown | optional | Free-form commentary. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `emitted_by` | `Effect` \| `Invocation` \| `Run` | N:1 | The runtime entity that emitted the span. (Plan originally targeted `ToolInvocation`; that NodeKind does not exist in atlas — remapped to `Effect` per catalog pass 19 review.) |
| `reports_to` | `ObservabilityBackend` | N:1 | The backend the span was shipped to. |

### Evidence

No evidence-bound attributes by default.

### Invariants

1. `startTime` ≤ `endTime`.
2. `traceId` is a 32-hex-char string; `spanId` is a 16-hex-char string.
3. `id` MUST follow the form `span:<kebab-slug>`.

---

## Examples

See [`graph/extensions/observability/`](../graph/extensions/observability/).

## Related

- [`README.md`](./README.md) — the full node-kind catalog and cluster index.
- [`lifecycle.md`](./lifecycle.md) — `Span.emitted_by` references `Effect` / `Invocation`
  / `Run`.
- [`../../schema/edge-kinds.md`](../../schema/edge-kinds.md) — `emitted_by`, `reports_to` edge specs.

