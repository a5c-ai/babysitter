# Observability and reliability tests

## Observability coverage

Required signals:

- API request latency and errors;
- controller reconcile counts, durations, retries, and failures;
- watch connection counts and reconnects;
- Git operation latency/errors;
- webhook queue depth and delivery status;
- runner queue/wait/runtime metrics;
- memory query latency and import validation status;
- Agent Mux session binding and event stream status;
- audit event counts by action/outcome.

## Reliability tests

| Failure | Expected behavior |
| --- | --- |
| Kubernetes API temporary failure | retry with backoff, status condition, no duplicate side effects. |
| Gitea unavailable | repository status degraded, no data loss, UI warning. |
| Postgres unavailable | aggregated API degraded/read-only where possible. |
| object storage unavailable | artifact writes fail safely with retry. |
| webhook receiver fails | retry and replay available. |
| watch disconnects | UI reconnects and resumes from list state. |
| memory repo unavailable | required-memory dispatch blocks, optional memory warns. |
| Agent Mux unavailable | dispatch shows pending/failed handoff and retry/recover action. |
| redaction failure | memory import blocks and no content leaks. |

## Chaos and load

Nightly/staging tests should eventually cover:

- burst webhook deliveries;
- many repository list queries;
- concurrent dispatches;
- runner pool exhaustion;
- memory grep/query bounds;
- large context truncation;
- controller restart during reconciliation;
- duplicate event delivery idempotency.

## Audit assertions

Every mutating or denied action should emit audit with:

- org and namespace;
- actor;
- resource ref;
- action and outcome;
- source event/run/session when applicable;
- digest fields for artifacts/context/memory;
- no secret values.
