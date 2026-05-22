# External sync state machines

## Purpose

This document defines stable phases and transitions for provider setup, bindings, webhook deliveries, backfill, write intents, conflicts, and provider health. UI, controllers, tests, and audit should use these phases consistently.

## Provider phases

| Phase | Meaning |
| --- | --- |
| `Pending` | resource created, not yet validated. |
| `Authenticating` | controller is checking credentials. |
| `Discovering` | capabilities, installation, and rate-limit metadata are being discovered. |
| `Ready` | provider can serve at least one enabled interface. |
| `Degraded` | provider is usable but has warnings such as rate limits or partial interface failure. |
| `Paused` | user paused sync/write operations. |
| `Failed` | provider cannot be used until configuration changes. |

## Binding phases

| Phase | Meaning |
| --- | --- |
| `Pending` | binding accepted. |
| `ValidatingTarget` | target Krate repo/project/org is being validated. |
| `RegisteringWebhook` | provider webhook registration is in progress. |
| `Backfilling` | initial sync is running. |
| `Ready` | binding sync is active. |
| `Conflict` | sync conflicts exist but binding may continue. |
| `Paused` | sync paused for this binding. |
| `Failed` | binding cannot sync. |

## Webhook delivery phases

| Phase | Meaning |
| --- | --- |
| `Received` | request accepted. |
| `SignatureRejected` | signature validation failed; no payload processing. |
| `Queued` | valid delivery queued. |
| `Normalizing` | provider payload is becoming canonical events. |
| `Processing` | sync controller is applying events. |
| `Succeeded` | event applied or safely deduped. |
| `Retrying` | transient failure. |
| `DeadLettered` | repeated failure needs operator action. |

## Backfill phases

| Phase | Meaning |
| --- | --- |
| `Scheduled` | backfill requested. |
| `Listing` | provider objects are being paginated. |
| `Hydrating` | details are being fetched. |
| `Applying` | Krate projections are being updated. |
| `Checkpointing` | cursor/high-watermark is being persisted. |
| `Succeeded` | backfill completed. |
| `RateLimited` | paused until reset. |
| `Failed` | backfill failed. |

## Write intent phases

| Phase | Meaning |
| --- | --- |
| `PendingApproval` | approval required before provider call. |
| `ReadyToSend` | admitted and queued for provider write. |
| `Sending` | provider call in progress. |
| `AwaitingConfirmation` | provider response accepted; waiting for webhook/read confirmation. |
| `Succeeded` | provider state confirmed. |
| `Conflict` | provider state changed or rejected due to version mismatch. |
| `Retrying` | transient failure. |
| `Rejected` | human or policy rejected the write. |
| `Failed` | non-retryable failure. |

## Conflict phases

| Phase | Meaning |
| --- | --- |
| `Open` | conflict requires resolution. |
| `Resolving` | selected resolution is being applied. |
| `Resolved` | conflict closed and sync confirmed. |
| `Ignored` | unsupported or intentionally ignored field. |
| `Superseded` | newer sync state replaced this conflict. |

## State transition invariants

- `SignatureRejected` deliveries never become `Processing`.
- `DeadLettered` deliveries require explicit replay or skip.
- `PendingApproval` write intents never call provider before approval.
- `Succeeded` write intents include provider native response or confirmation digest.
- `Conflict` states must link to `ExternalSyncConflict`.
- `Paused` provider/binding states block new backfills and writes but preserve webhook delivery records.

## UI state mapping

| State | UI tone | Action |
| --- | --- | --- |
| `Ready` | good | normal actions. |
| `Degraded` | warning | show reason and retry/backfill actions. |
| `RateLimited` | warning | show reset time. |
| `Conflict` | danger/warning | link to conflict resolution. |
| `Paused` | neutral | resume action. |
| `Failed` | danger | show configuration fix. |
| `DeadLettered` | danger | replay or skip action. |

## Acceptance criteria

- Every external backend resource has a stable phase and conditions.
- Tests assert phase transitions, not only final data shape.
- UI uses consistent status language across providers.
- Audit events include phase transitions for deliveries, writes, and conflicts.
