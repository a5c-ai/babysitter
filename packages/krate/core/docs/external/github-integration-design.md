# GitHub integration design

## Purpose

GitHub is the first full external backend provider for Krate. It can support all three unified interfaces: issue tracking, CI/CD, and git forge. Krate should integrate through a GitHub App by default, with optional user-attributed actions when a user token is available and admitted.

## Authentication model

Preferred auth:

```yaml
kind: ExternalBackendProvider
spec:
  providerType: github
  auth:
    mode: github-app
    appIdSecretRef:
      name: github-app-a5c
      key: app-id
    privateKeySecretRef:
      name: github-app-a5c
      key: private-key.pem
    webhookSecretRef:
      name: github-app-a5c
      key: webhook-secret
```

Flow:

1. Krate signs a GitHub App JWT.
2. Krate exchanges it for installation access tokens per org/repository installation.
3. Tokens are cached only until expiry and never stored in status.
4. User-attributed actions use GitHub App user access tokens when available and required.
5. All actions still pass Krate org/RBAC/admission checks.

## GitHub provider capabilities

```yaml
capabilities:
  issueTracking:
    issues: true
    comments: true
    labels: true
    milestones: true
    projects: optional
  cicd:
    actionsWorkflowRuns: true
    workflowJobs: true
    checks: true
    statuses: true
    selfHostedRunners: optional
  gitForge:
    repositories: true
    pullRequests: true
    reviews: true
    refs: true
    commits: true
    deployKeys: true
    branchProtection: true
    collaborators: true
```

## Installation binding

```yaml
kind: ExternalBackendBinding
spec:
  organizationRef: a5c
  providerRef: github-a5c
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

## Webhook events

Recommended GitHub events:

| Interface | Events |
| --- | --- |
| Issue tracking | `issues`, `issue_comment`, `label`, `milestone`, `projects_v2_item` where available. |
| CI/CD | `workflow_run`, `workflow_job`, `check_run`, `check_suite`, `status`, `push`. |
| Git forge | `repository`, `pull_request`, `pull_request_review`, `pull_request_review_comment`, `push`, `create`, `delete`, `branch_protection_rule`, `deploy_key`. |
| Provider lifecycle | `installation`, `installation_repositories`, `meta`. |

Webhook delivery handling:

- validate signature before parsing;
- record delivery ID and event type;
- respond quickly with 2XX after enqueue;
- process asynchronously through Krate queue/controller;
- dedupe by provider, delivery ID, event, and installation;
- support redelivery and replay.

## Backfill and repair

Backfill should run when:

- provider binding is created;
- webhook delivery is missed or failed;
- rate limit window recovers;
- manual `resync` is requested;
- native object has stale `lastSyncedAt`;
- provider installation changes repository access.

GitHub backfill strategy:

- GraphQL for list hydration where it reduces calls and provides cursors;
- REST for endpoints with first-class Actions, checks, deploy keys, webhooks, branch protection, and logs;
- conditional requests with ETags where useful;
- rate-limit aware scheduling by installation and org.

## Write paths

| Action | Default mode |
| --- | --- |
| create/update issue | write-through or reviewed-write by policy. |
| comment on issue/PR | write-through for humans, reviewed-write for agents. |
| update labels | bidirectional with conflict detection. |
| rerun/cancel workflow | write-through after permission review. |
| create/update PR | reviewed-write for agents; write-through for authorized humans. |
| merge PR | external-owned or reviewed-write; require branch protection status. |
| deploy key update | Krate-owned or reviewed-write. |
| branch protection update | reviewed-write unless org policy says Krate-owned. |

## GitHub-specific conflicts

- Issue and PR share number namespace; PR-backed issue projections must link to PR.
- Labels can be edited externally while Krate has pending desired changes.
- Branch protection fields may not map 1:1 to Krate `RefPolicy`.
- Workflow runs may be rerun externally while Krate still shows an old attempt.
- Force-push updates PR head SHA and invalidates cached diff/check context.

## UI requirements

- Provider setup wizard for GitHub App app ID, private key, webhook secret, installation ID, owner, repository selection, and selected interfaces.
- Repository settings page shows GitHub binding and per-interface mode.
- Issue/PR/run pages show native GitHub link, sync status, and conflict banner.
- Actions/runs page can filter external GitHub Actions vs Krate-native pipelines.
- Webhook page shows delivery IDs, replay, redelivery, and backfill status.
