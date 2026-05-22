# Provider rollout and testing

## Purpose

This document defines implementation slices and QA coverage for GitHub and future providers.

## Rollout slices

### Slice 1: provider registry and read-only GitHub binding

- Add `ExternalBackendProvider`, `ExternalBackendBinding`, and sync policy resources.
- Configure GitHub App Secret metadata.
- Validate auth and installation access.
- Show provider in org settings.

### Slice 2: git forge read sync

- Sync repositories and pull requests read-only.
- Store external IDs and native URLs.
- Show GitHub badges and links.
- Backfill plus webhook convergence tests.

### Slice 3: issue tracking sync

- Sync issues, comments, labels, milestones.
- Handle PR-backed issue identity.
- Add issue write-through for authorized humans.

### Slice 4: CI/CD sync

- Sync workflow runs, jobs, checks, statuses.
- Show GitHub Actions runs beside Krate pipelines.
- Add logs/artifacts lazy fetch.

### Slice 5: write intents and conflicts

- Add reviewed-write and write-through actions.
- Add `ExternalWriteIntent` and `ExternalSyncConflict` UI.
- Add agent write-back approval flow.

### Slice 6: runner and advanced repo management

- Self-hosted runner inventory/registration if enabled.
- Deploy keys, collaborators, and branch protection sync.
- Rate-limit aware bulk backfill.

## Test coverage

| Slice | Required tests |
| --- | --- |
| provider registry | auth Secret metadata, missing Secret, bad installation, no-token leak. |
| git forge read | repo/PR backfill, webhook update, duplicate delivery, cross-org denial. |
| issue sync | issue/comment/label update, PR-backed issue link, conflict. |
| CI/CD sync | workflow/job/check event, rerun/cancel permission, log lazy fetch. |
| write intents | approval required, provider write failure, confirmation, conflict. |
| advanced repo | deploy key sync, branch protection drift, runner registration token no-leak. |

## Fixtures

Add fixtures for:

- GitHub App provider Secret metadata;
- installation binding;
- repository webhook payloads;
- issue/comment/label payloads;
- pull request/review payloads;
- workflow run/job/check payloads;
- deploy key/branch protection payloads;
- rate limit and abuse-limit responses;
- redelivery payloads.

## Acceptance criteria

- GitHub can be enabled for one org/repository with selected interfaces.
- A provider implementing only one interface can still be represented.
- Webhook replay and backfill converge.
- Bidirectional writes are explicit, permission-checked, and audited.
- Future providers can be added by implementing one or more provider contracts.
