# External backend controllers

## Purpose

External backend controllers reconcile provider configuration, webhook deliveries, backfill, object projection, writes, conflicts, and status.

## Controller set

| Controller | Responsibilities |
| --- | --- |
| provider controller | validate auth, capabilities, installation access, rate limits, and status. |
| binding controller | validate target refs, create provider webhooks, initialize sync states. |
| webhook controller | validate signatures, persist deliveries, enqueue events, support replay. |
| sync controller | process events/backfills and update Krate projections. |
| write controller | apply Krate write intents to provider, retry, confirm, audit. |
| conflict controller | detect field/resource conflicts and manage resolution workflow. |
| runner/controller adapter | manage external CI runners when provider supports it. |
| garbage/tombstone controller | handle external deletions and retention. |

## Reconciliation order

```text
ExternalBackendProvider
  -> auth/capability check
  -> ExternalBackendBinding
  -> webhook registration and sync state initialization
  -> webhook events and backfill
  -> Krate resource projections
  -> write intents and conflicts
```

## Provider controller

- Resolve org namespace and Secret refs.
- Validate provider type and base URLs.
- Verify credentials without storing token values.
- Discover capabilities where possible.
- Track rate-limit status and degraded state.
- Emit `AuthReady`, `InstallationReady`, and interface readiness conditions.

## Binding controller

- Validate target resource belongs to same org.
- Validate provider supports requested interfaces.
- Create/update provider webhooks when Krate owns webhook configuration.
- Create initial `ExternalSyncState` objects.
- Kick off initial backfill.

## Webhook controller

- Validate HMAC/signature before accepting payload.
- Persist `ExternalWebhookDelivery` with provider delivery ID.
- Dedupe repeated deliveries.
- Enqueue normalized `ExternalSyncEvent`.
- Return quickly and process asynchronously.
- Support manual replay/redelivery records.

## Sync controller

- Hydrate provider objects from webhook payload or API.
- Upsert Krate resources/projections with external identity fields.
- Maintain high-watermarks and cursors.
- Respect ownership mode.
- Mark tombstones for external deletions.
- Emit watch and audit events.

## Write controller

- Reads `ExternalWriteIntent` after Krate admission and optional approval.
- Applies provider write with provider-specific idempotency where available.
- Handles rate limits and retryable failures.
- Confirms via provider response, webhook, or follow-up read.
- Creates conflict if provider state diverged.

## Controller acceptance criteria

- Controllers are idempotent by provider, installation, interface, native object ID, and delivery/write ID.
- Provider outage degrades sync without corrupting Krate state.
- Cross-org references fail before provider calls.
- Secret/token values never enter status, events, logs, or sync payloads.
- Webhook replay and cursor backfill converge.

## Interface adapter controllers

Each interface has a provider-neutral reconciler and provider-specific adapter methods.

### Issue sync controller

Responsibilities:

- watch issue-related webhooks;
- backfill issues, comments, labels, milestones, project fields;
- upsert `Issue` projections;
- link PR-backed issue numbers to `PullRequest`;
- process issue write intents;
- detect comment/label/state conflicts.

### CI/CD sync controller

Responsibilities:

- watch workflow/check/status events;
- backfill pipelines, jobs, checks, logs, artifacts;
- upsert `Pipeline` and `Job` projections;
- lazy-fetch logs/artifacts on demand;
- process rerun/cancel/check update write intents;
- sync runner inventory where supported.

### Git forge sync controller

Responsibilities:

- watch repository, PR, review, push, branch/tag, key, collaborator, and protection events;
- backfill repos, pull requests, refs, branch protection, keys, collaborators;
- upsert `Repository`, `PullRequest`, `Review`, `SSHKey`, `RepositoryPermission`, `BranchProtection`, and `RefPolicy` projections;
- process PR, merge, key, collaborator, and branch protection writes;
- detect force-push and stale diff/check state.

## Provider adapter lifecycle

```text
load provider descriptor
  -> validate configured interfaces
  -> create adapter client with scoped credentials
  -> run health/capability probe
  -> start webhook/backfill loops
  -> expose provider operations to sync/write controllers
```

## Rate-limit handling

Controllers should:

- bucket requests by provider, installation/account, org, and repository;
- preserve webhook deliveries even when rate limited;
- pause backfill before write intents when budget is low;
- expose `RateLimited` conditions with reset time;
- avoid retry storms by using exponential backoff and jitter.

## Provider plugin contract

Future provider plugins should implement:

```ts
interface ExternalProviderAdapter {
  descriptor(): ProviderDescriptor;
  health(): ProviderHealth;
  issueTracking?: IssueTrackingProvider;
  cicd?: CicdProvider;
  gitForge?: GitForgeProvider;
  normalizeWebhook(payload): NormalizedExternalEvent[];
  verifyWebhook(request): VerificationResult;
}
```

The core controllers own persistence, org checks, queueing, conflicts, and audit; adapters only translate provider operations.

## Controller status surfaces

Provider and binding status should expose:

- interface readiness;
- last successful webhook;
- last failed webhook;
- last backfill by interface;
- queue depth;
- rate limit remaining/reset;
- conflicts count;
- pending write count;
- last provider error class.
