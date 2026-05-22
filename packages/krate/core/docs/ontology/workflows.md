# Workflows

## Repository creation

1. Repository admin creates a `Repository` resource.
2. Control plane authorizes and stores it in etcd.
3. Data plane provisions a Gitea repository integration and initializes repository storage.
4. Status exposes Gitea backend integration and health.

## Pull request review

1. Developer creates a `PullRequest` with source/target refs and title.
2. Admission validates required fields and policy.
3. CI starts a `Pipeline` and one or more `Job` records.
4. UI shows checks, changed files, comments, and YAML/resource equivalent.
5. Branch protection requires PR flow for protected refs.

## Git receive-pack

1. Gitea backend resolves repository routing.
2. `RefPolicy` denies forbidden refs or unsafe writes.
3. `BranchProtection` blocks direct protected writes unless actor has repo-admin permission.
4. Write event is emitted and optional search indexing hook is queued.

## Webhook delivery and replay

1. Repository admin creates a `WebhookSubscription`.
2. Event dispatch signs payload and stores a `WebhookDelivery` record.
3. Failure status remains inspectable with request/response metadata.
4. Replay creates a new delivery using the current secret and links replay metadata.

## Backup and restore

1. Export CRDs and low-cardinality config.
2. Backup Postgres aggregated records.
3. Snapshot Gitea repository integration state.
4. Preserve object storage.
5. Restore API/config, Postgres, repositories, objects, then controllers.
6. Validate by listing resources, reading refs, opening a PR, and replaying a webhook.
