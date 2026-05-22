# Efficient bidirectional sync design

## Purpose

External backends need efficient two-way sync that converges quickly without overwriting user changes or exhausting provider rate limits. This document defines the common sync strategy for all provider interfaces.

## Sync layers

| Layer | Purpose |
| --- | --- |
| Webhook ingest | near-real-time event capture and trigger source. |
| Event normalizer | convert provider payloads into canonical Krate sync events. |
| Cursor backfill | recover missed events and hydrate lists. |
| Object reconciler | compare desired/local/provider state and write projections. |
| Write intent queue | apply Krate-originated writes to provider with retries. |
| Conflict detector | detect local/external divergence. |
| Audit/event stream | explain every sync and write. |

## Sync resource model

```yaml
kind: ExternalSyncState
spec:
  organizationRef: a5c
  providerRef: github-a5c
  bindingRef: github-krate
  interface: gitForge
  resourceKind: PullRequest
status:
  highWatermark: 2026-05-11T12:00:00Z
  cursor: opaque-provider-cursor
  lastWebhookDeliveryId: "..."
  lastFullBackfillAt: 2026-05-11T00:00:00Z
  phase: Ready
```

```yaml
kind: ExternalSyncConflict
spec:
  organizationRef: a5c
  providerRef: github-a5c
  resourceRef:
    kind: Issue
    name: issue-42
  fieldConflicts:
    - field: labels
      local: [bug, priority]
      external: [bug]
  resolutionPolicy: manual
```

## Event processing

```text
provider webhook
  -> validate signature
  -> persist ExternalWebhookDelivery
  -> enqueue by provider installation and repository
  -> normalize into ExternalSyncEvent
  -> dedupe by delivery ID + action + native object ID
  -> apply object-specific reconcile
  -> update Krate projection and sync state
  -> emit audit and watch event
```

## Backfill processing

```text
scheduled or manual backfill
  -> read ExternalSyncState cursor/highWatermark
  -> list changed objects from provider
  -> hydrate missing details
  -> upsert Krate projections
  -> mark deleted/missing objects according to tombstone policy
  -> update cursor/highWatermark
```

## Write processing

```text
Krate user/agent action
  -> admission and RBAC
  -> create ExternalWriteIntent
  -> optional approval
  -> provider write through connector
  -> verify provider response
  -> update local projection with provider IDs/version
  -> wait for webhook or backfill confirmation
  -> close write intent
```

## Efficiency rules

- Prefer webhook payloads for targeted updates.
- Use GraphQL/cursor pagination for bulk list hydration where supported.
- Use REST endpoints for provider-specific operations and logs/artifacts.
- Store ETag or provider resource version when available.
- Batch by installation/org/repository to respect rate limits.
- Lazy-load large logs, diffs, artifacts, and comments.
- Apply bounded retries with dead-letter status for repeated provider errors.
- Separate sync freshness from user-facing last-updated time.

## Conflict rules

Conflict when:

- local desired generation changed after last sync and provider field also changed;
- provider rejects a write because native version/precondition changed;
- provider has a value Krate cannot represent losslessly;
- ownership mode says external-owned and Krate has pending local mutation;
- write intent remains unconfirmed beyond timeout.

Resolution options:

- prefer external;
- prefer Krate desired;
- manual merge;
- create reviewed provider-side change;
- ignore unsupported field with warning.

## Deletion and tombstones

- External deletions become tombstones before local deletion when audit requires retention.
- Krate deletions in mirror mode should not delete provider objects.
- Krate-owned resources may delete provider objects if admission and provider permissions allow it.
- PR/issue deletion may be unsupported in some providers; close/archive instead.

## Acceptance criteria

- Webhook replay and backfill converge to the same resource state.
- Duplicate webhooks are idempotent.
- Rate-limit responses slow sync without losing events.
- Conflicts are visible in UI and API.
- Writes are auditable from Krate action to provider confirmation.
