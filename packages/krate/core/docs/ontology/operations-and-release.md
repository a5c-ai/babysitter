# Operations and Release

## Install

Install manifests must include CRDs, APIService, controllers, Gitea backend, runner scheduler, webhook dispatcher, and web UI deployments or equivalent resources.

## Observability

Operators need metrics and logs for API latency, storage boundary health, Git receive latency, queue depth, runner saturation, webhook delivery phase, replay counts, and admission denials.

## Backup and restore

Backup covers CRDs/config, Postgres records, Gitea repositories, and object storage. Restore order is API/config, Postgres, Gitea repositories, objects, controllers. Validation includes listing resources, reading refs, opening a PR, and replaying webhooks.

## Upgrade

Upgrades must preserve CRD compatibility, aggregated API availability, migrations, controller reconciliation, and rollback instructions.

## Release gates

- Build produces `dist/krate-summary.json`.
- Documentation and ontology coverage pass.
- Unit acceptance tests pass.
- Smoke flow passes.
- Known limitations are explicit and not hidden in incomplete implementation paths.
