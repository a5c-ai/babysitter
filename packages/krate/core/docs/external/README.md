# External backend integration docs

## Purpose

This directory defines how Krate should integrate with GitHub first and support other externally managed backends later. External backends can implement one, two, or all three Krate provider interfaces:

1. issue tracking and work management sync;
2. CI/CD, triggers, runners, pipelines, checks, and workflow sync;
3. git forge sync for repositories, pull requests, refs, commits, SSH/deploy keys, collaborators, and repository policy.

The design supports bidirectional, efficient sync without forcing every backend to be a full forge.

## Documents

- [Research results](./research-results.md) summarizes GitHub API and webhook capabilities used by this design.
- [Pluggable backend provider catalog](./provider-catalog.md) lists GitHub, GitLab, Bitbucket, Azure DevOps, Jira, Linear, Buildkite, CircleCI, Jenkins, Gitea, Gerrit, raw Git, and custom providers by supported interface.

- [Unified external backend model](./unified-external-backend-model.md) defines provider capabilities, ownership, identifiers, sync modes, and the three interface split.
- [Provider capability manifests](./provider-capability-manifests.md) defines data-driven adapter manifests for operations, auth, webhooks, and tests.
- [External object mapping spec](./external-object-mapping.md) defines loss-aware mappings from provider objects to Krate resources.

- [Issue tracking interface](./issue-tracking-interface.md) defines issue/comment/label/milestone/project/work-item sync.
- [CI/CD interface](./cicd-interface.md) defines workflow/check/pipeline/job/runner/trigger sync.
- [Git forge interface](./git-forge-interface.md) defines repository/PR/ref/commit/key/collaborator/policy sync.
- [GitHub integration design](./github-integration-design.md) maps GitHub App, REST, GraphQL, webhooks, and Actions onto the three interfaces.
- [Efficient bidirectional sync](./bidirectional-sync-design.md) defines webhook-first, cursor-based, idempotent reconciliation and conflict handling.
- [External sync state machines](./sync-state-machines.md) defines stable phases for providers, bindings, deliveries, backfill, writes, and conflicts.

- [External backend CRDs](./external-backend-crds.md) defines resources and schemas.
- [External backend controllers](./external-backend-controllers.md) defines reconciliation loops and side effects.
- [User-facing changes](./user-facing-changes.md) defines UI, settings, status, and workflow changes.
- [External backend UI specification](./external-backend-ui-spec.md) defines org-scoped provider setup, bindings, sync health, conflicts, write intents, webhook, and repository UI.
- [External backend UX flows](./external-backend-ux-flows.md) defines user-facing setup, mixed-provider, conflict, write approval, recovery, and rate-limit flows.


- [Security, auth, and permissions](./security-auth-permissions.md) defines GitHub App auth, tokens, secrets, RBAC, and audit.
- [Provider rollout and testing](./provider-rollout-testing.md) defines implementation slices, validation, and QA coverage.

## Design principles

- Krate keeps its org namespace and resource model; external backends are providers, not the source of Krate tenancy.
- Providers declare which interfaces they support.
- Every external object stores provider ID, native ID, global node ID when available, URL, etag/cursor, and last synced generation.
- Webhooks are the primary freshness mechanism; polling/backfill repairs missed or truncated events.
- Krate can run in mirror mode, bidirectional mode, or Krate-owned mode per interface and resource type.
- Conflicts are explicit resources and UI states, not silent overwrites.
- Secrets and provider tokens stay in Kubernetes Secrets and are surfaced only as grant metadata.
