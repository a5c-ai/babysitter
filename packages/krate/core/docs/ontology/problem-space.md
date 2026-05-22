# Problem-Space Ontology

Krate exists because teams want forge workflows that inherit Kubernetes governance instead of re-implementing identity, policy, audit, deployment, and operations outside the cluster model.

## Jobs to be done

- Host repositories without one-PVC-per-repository scaling failure.
- Review and merge pull requests with branch protection and status checks.
- Run CI on trusted and untrusted work while preserving secret boundaries.
- Govern refs, admission, runner access, and webhook behavior through resources.
- Inspect and replay webhook deliveries without hidden queue state.
- Operate install, upgrade, backup, restore, and release processes with visible gates.
- Triage cross-repository work through selectors and views.

## Failure modes to prevent

- **etcd overload** from comments, jobs, logs, webhook attempts, or high-cardinality records.
- **Cold Git writes** from unprepared receive-pack paths.
- **Token sprawl** from CI jobs using broad personal or cluster credentials.
- **Fork leakage** where untrusted PRs can read secrets or mutate cluster resources.
- **Opaque hooks** where failed webhook deliveries cannot be inspected or replayed.
- **Non-auditable UI** where a click cannot be mapped to a resource mutation.
- **Operational drift** where manifests, backup order, and release gates are not tested.

## Success criteria

- Every mutation has an actor, verb, resource, storage boundary, admission decision, audit entry, and watch event.
- Every resource family has a clear owner context and lifecycle.
- Every excellent flow has a YAML/resource equivalent.
- Every release candidate passes build, doc coverage, unit acceptance tests, and smoke assertions.
