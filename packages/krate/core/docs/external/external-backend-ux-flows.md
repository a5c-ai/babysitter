# External backend UX flows

## Purpose

This document turns the UI specification into user-facing flows that can become acceptance tests and implementation tickets.

## Flow: connect GitHub provider

1. Org admin opens `/orgs/a5c/settings/external-backends`.
2. Clicks `Add provider`.
3. Selects `GitHub`.
4. Selects `GitHub App` auth.
5. Enters or selects Kubernetes Secret refs for app ID, private key, and webhook secret.
6. Enters installation ID or authorizes installation discovery.
7. Selects interfaces: Issues, Actions/CI, Git forge.
8. Runs capability check.
9. Selects repositories to bind.
10. Chooses sync modes per interface.
11. Reviews YAML.
12. Applies provider and binding.
13. UI shows initial backfill progress and webhook status.

Acceptance:

- no token/private key value is shown after entry;
- unsupported operations are explained;
- provider and binding resources are created with org labels;
- initial backfill status appears.

## Flow: connect Jira for issues only

1. Admin selects `Jira` provider.
2. UI shows only Issue Tracking interface.
3. Admin configures base URL, auth Secret, and project keys.
4. Chooses read-only or bidirectional issue sync.
5. Applies binding to a Krate repository or org work board.
6. Issue pages show Jira badge and native links.

Acceptance:

- CI/CD and git forge options are disabled;
- PR and pipeline pages do not claim Jira ownership;
- Jira rich text conversion warnings are visible when relevant.

## Flow: combine GitHub forge with Buildkite CI

1. Repository has GitHub binding for git forge and issue tracking.
2. Admin adds Buildkite provider with CI/CD only.
3. Admin binds Buildkite pipelines to the same Krate repository.
4. Runs page shows GitHub PR context and Buildkite builds together.
5. Agent trigger rules can match Buildkite failures and write PR comments through GitHub after approval.

Acceptance:

- separate provider badges are visible;
- CI actions go to Buildkite, PR comments go to GitHub;
- audit records show both providers when a flow crosses interfaces.

## Flow: resolve sync conflict

1. User opens Inbox or provider Conflicts page.
2. Selects conflict for issue labels.
3. UI shows local and external values and sync history.
4. User chooses `Keep external`.
5. Conflict controller updates Krate projection and closes conflict.
6. Audit records decision.

Acceptance:

- no hidden overwrite occurs;
- user can inspect native provider link;
- resolved state is visible in resource detail.

## Flow: reviewed external write from agent

1. Agent proposes GitHub PR comment or label update.
2. Krate creates `ExternalWriteIntent` with request digest.
3. UI shows approval in Inbox and run detail.
4. Reviewer approves.
5. Write controller posts to GitHub.
6. Webhook or read-back confirms write.
7. Run detail and PR page show result.

Acceptance:

- agent cannot write directly without Krate approval policy;
- request preview is redacted;
- native URL and provider response summary are visible.

## Flow: webhook recovery

1. Webhook delivery fails processing and becomes `DeadLettered`.
2. Provider page shows failed delivery.
3. Operator opens delivery detail and sees normalized error.
4. Operator chooses replay.
5. Delivery re-enters queue and succeeds or remains dead-lettered with updated attempts.

Acceptance:

- duplicate replay is idempotent;
- raw payload access is permission-gated;
- sync state updates after replay.

## Flow: provider rate limit

1. Provider reaches low rate-limit threshold.
2. Provider status becomes `Degraded` or `RateLimited`.
3. Backfill pauses; webhook ingest continues.
4. UI shows reset time and impacted interfaces.
5. Sync resumes after reset.

Acceptance:

- user actions that require provider writes are disabled or queued by policy;
- status clearly separates webhook ingestion from API backfill.
