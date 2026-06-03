# Runners and CI

## Runner pools

`RunnerPool` records declare warm replicas, maximum replicas, queue scaling, cache settings, and trust boundaries.

## Pipelines

`Pipeline` records represent a run for repository/ref work. They include steps, status, trust tier, and optional `resumeFrom` state for rerun/resume.

## Jobs

`Job` records represent executable steps. Each job receives a service-account profile derived from the pipeline trust tier.

## Fork isolation

- Fork PR pipelines are untrusted.
- Untrusted jobs have `secrets: false` and `clusterApi: false`.
- Trusted jobs may use configured scopes, but scopes remain explicit.

## Scaling

Queue depth maps to desired replicas within warm and max bounds. Scaling is deterministic and inspectable from pool spec/status.

## Acceptance gates

- Starting a fork pipeline produces jobs with no secrets and no cluster API access.
- Rerun from a named step sets `resumeFrom`.
- Pool replica planning respects warm and maximum replica limits.
