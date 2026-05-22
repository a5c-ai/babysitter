# Events and Hooks

Krate separates server-side Git hooks, outbound HTTP webhooks, Kubernetes admission hooks, and resource watch events.

## Watch events

- Emitted on resource create/update/status mutations.
- Include resource kind, storage boundary, and audit context.
- Used by UI, controllers, and smoke assertions.

## Server-side Git hooks

- Modeled through `RefPolicy` and `BranchProtection`.
- Enforced during receive-pack before protected writes complete.
- Must not mount broad secrets or shell out with ambient privilege.

## Outbound webhooks

- Configured by `WebhookSubscription`.
- Materialized as durable `WebhookDelivery` records.
- Signed with HMAC SHA-256.
- Replay creates a new delivery attempt and keeps replay metadata.

## Admission hooks

- Validate Krate resources before storage.
- Support audit warnings and enforce denial.
- Must expose actionable status when denied.

## Observability

Every delivery and event should expose phase, latency or timestamp, response metadata where applicable, and enough context for replay or remediation.
