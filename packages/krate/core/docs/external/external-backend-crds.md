# External backend CRDs

## Purpose

This document defines the resource contracts for external backend providers, bindings, sync state, write intents, conflicts, and webhook deliveries.

## Config resources

### `ExternalBackendProvider`

```yaml
apiVersion: krate.a5c.ai/v1alpha1
kind: ExternalBackendProvider
metadata:
  name: github-a5c
  namespace: krate-org-a5c
spec:
  organizationRef: a5c
  providerType: github
  displayName: GitHub a5c-ai
  baseUrl: https://github.com
  apiBaseUrl: https://api.github.com
  authRef:
    secretRef:
      name: github-app-a5c
  capabilities:
    issueTracking: true
    cicd: true
    gitForge: true
status:
  phase: Ready
  conditions: []
```

### `ExternalBackendBinding`

```yaml
kind: ExternalBackendBinding
spec:
  organizationRef: a5c
  providerRef: github-a5c
  targetRef:
    kind: Repository
    name: krate
  externalRef:
    owner: a5c-ai
    repository: krate
    installationId: 123456
  interfaces:
    issueTracking:
      enabled: true
      mode: bidirectional
    cicd:
      enabled: true
      mode: external-owned
    gitForge:
      enabled: true
      mode: bidirectional
```

### `ExternalBackendSyncPolicy`

```yaml
kind: ExternalBackendSyncPolicy
spec:
  organizationRef: a5c
  providerRef: github-a5c
  webhookFirst: true
  backfill:
    interval: 15m
    fullResyncInterval: 24h
  writePolicy:
    defaultMode: reviewed-write
    agentWriteRequiresApproval: true
  conflictPolicy:
    defaultResolution: manual
```

## Aggregated resources

| Kind | Purpose |
| --- | --- |
| `ExternalWebhookDelivery` | provider webhook delivery record and processing state. |
| `ExternalSyncEvent` | normalized provider event. |
| `ExternalSyncState` | cursor/high-watermark per provider/interface/resource scope. |
| `ExternalWriteIntent` | Krate-originated write to provider. |
| `ExternalSyncConflict` | field/resource conflict requiring resolution. |
| `ExternalObjectLink` | external native ID/link attached to a Krate resource. |

## Required labels

- `krate.a5c.ai/org`;
- `krate.a5c.ai/provider`;
- `krate.a5c.ai/interface`;
- `krate.a5c.ai/repository` when repository-scoped;
- `krate.a5c.ai/external-owner` when provider owner/org is known.

## Status conditions

Providers and bindings should use:

- `AuthReady`;
- `InstallationReady`;
- `WebhookReady`;
- `IssueTrackingReady`;
- `CicdReady`;
- `GitForgeReady`;
- `RateLimited`;
- `BackfillHealthy`;
- `ConflictsPresent`;
- `Ready`.

## Storage class

- provider/binding/sync policy: CRD/etcd;
- deliveries/events/state/write intents/conflicts/object links: aggregated API/Postgres;
- large payloads/logs/artifacts: object storage by digest;
- provider credentials: Kubernetes Secret in org namespace.

## Detailed resource schemas

### `ExternalWebhookDelivery.spec`

```yaml
organizationRef: a5c
providerRef: github-a5c
bindingRef: github-krate
interfaceHints: [gitForge, issueTracking]
deliveryId: "github-delivery-guid"
eventType: pull_request
action: opened
receivedAt: 2026-05-11T12:00:00Z
signature:
  algorithm: sha256
  verified: true
source:
  owner: a5c-ai
  repository: krate
payloadRef:
  storage: object
  digest: sha256:payload
processing:
  phase: Queued
  attempts: 0
```

### `ExternalSyncEvent.spec`

```yaml
organizationRef: a5c
providerRef: github-a5c
bindingRef: github-krate
sourceDelivery: github-delivery-guid
interface: gitForge
resourceKind: PullRequest
nativeId: "42"
nodeId: PR_kwDO...
action: opened
eventTime: 2026-05-11T12:00:00Z
normalized:
  repository: krate
  pullRequest: 42
  headSha: abcdef1234
```

### `ExternalWriteIntent.spec`

```yaml
organizationRef: a5c
providerRef: github-a5c
bindingRef: github-krate
interface: issueTracking
operation: createComment
source:
  kind: UserAction
  actor: user:alice
target:
  kind: Issue
  name: issue-42
nativeTarget:
  owner: a5c-ai
  repository: krate
  issueNumber: 42
requestDigest: sha256:request
approvalPolicy:
  required: false
idempotencyKey: a5c:issue-42:create-comment:01hx
```

### `ExternalObjectLink.spec`

```yaml
organizationRef: a5c
providerRef: github-a5c
bindingRef: github-krate
localRef:
  apiVersion: krate.a5c.ai/v1alpha1
  kind: PullRequest
  name: pr-42
external:
  interface: gitForge
  nativeId: "42"
  nativeNumber: 42
  nodeId: PR_kwDO...
  url: https://github.com/a5c-ai/krate/pull/42
  apiUrl: https://api.github.com/repos/a5c-ai/krate/pulls/42
  etag: W/"..."
```

## Provider type registry

Provider types should be registered in a data-driven registry:

```yaml
providerType: github
interfaces: [issueTracking, cicd, gitForge]
hosting: [saas, ghe]
authModes: [github-app, oauth-user]
webhookSignature: hmac-sha256
supportsGraphql: true
supportsRest: true
```

Custom providers can be loaded later through plugin registration, but CRDs should not need a schema change for every provider.

## Validation rules

- `providerType` must exist in registry or use `custom` with explicit adapter ref.
- enabled interface must be supported by provider descriptor.
- binding target must be in the same org.
- auth Secret must be in the org namespace.
- write mode must be compatible with provider operations.
- webhook endpoint must have a verification secret unless provider has a signed alternative.
- `ExternalWriteIntent` cannot reference raw Secret values.
