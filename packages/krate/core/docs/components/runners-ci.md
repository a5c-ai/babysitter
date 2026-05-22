# Runners and CI Component Requirements

## Purpose

Krate treats runners as a first-class forge domain while delegating execution to systems such as ARC, Tekton, or Buildkite Agent. The forge owns identity, caching, trust boundaries, cost attribution, and run UX.

## Responsibilities

- Define `RunnerPool`, `Pipeline`, and `Job` resources.
- Schedule jobs into trusted or untrusted pools.
- Integrate with ARC for MVP execution.
- Provide live run state, logs, rerun controls, queue metrics, and cost visibility.
- Scope caches by repository and pool.

## API and resource surface

- `RunnerPool`: image, resources, node selector, scaling policy, allowed repos, trust tier, serviceAccountRef, cache backend, warm/max replicas.
- `Pipeline`: CI invocation, workflow file, repository/ref, runner pool, resume controls, status.
- `Job`: step execution, runner pod owner, logs/status, identity, cache bindings.

## Requirements

- Trusted pools default to warm replicas for low latency.
- Untrusted pools may scale from zero for safety and cost.
- Admission must prevent untrusted code from scheduling on trusted pools.
- BuildKit cache must be scoped per repo and pool, never shared across trust tiers.
- Rerun failed and rerun from step must create new Pipeline resources.

## Dependencies

- ARC for MVP.
- KEDA for queue-depth scaling.
- Kubernetes Pods and ServiceAccounts.
- S3-compatible cache backend.
- Watch/SSE bridge for UI updates.

## Security and policy

- Job pods receive projected ServiceAccount tokens scoped to repo/ref/pipeline, and agent runner pods receive identities admitted by `AgentServiceAccount`/`AgentRoleBinding` policy.
- Trusted jobs may receive configured secrets through explicit Secret grants; untrusted jobs receive none.
- Runner images and node selectors must be policy-controlled.
- Cost and cache data must not leak across tenants.

## Scaling and performance

- Pool dashboard must show warm/total replicas, queue depth, p50/p95 wait time, and last-hour cost.
- KEDA scales between `warmReplicas` and `maxReplicas` based on queue depth.
- Log streaming must be near real-time through Kubernetes Pod log watch and SSE.

## Failure modes

- Queue saturation: UI explains bottleneck with queue and node events.
- Image pull failure: live run view surfaces pod events and failing image.
- Node pressure: pool dashboard links to scheduling and node pressure signals.
- Cache backend unavailable: jobs run without cache or fail according to pool policy.

## Observability

- Queue depth, wait latency, job duration, pod scheduling latency, image pull latency, cache hit rate, cost by pool/repo, failure signatures.

## Acceptance criteria

- ARC-backed workflow runs for a repository.
- Fork PR jobs are admitted only into untrusted pools.
- Live run view streams logs and step status.
- Similar-failure search works by `failure.signature` labels.
