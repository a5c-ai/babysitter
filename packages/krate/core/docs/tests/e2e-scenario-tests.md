# E2E and scenario tests

## Existing E2E baseline

Current E2E tests validate chart package surface and minikube dry-run command plans. This remains the first E2E layer because it is deterministic and does not require a live cluster.

## Core forge scenarios

| Scenario | Steps | Assertions |
| --- | --- | --- |
| Create repository | org dashboard -> repositories -> create | repository resource exists, clone instructions render, namespace/org labels exist. |
| Pull request lifecycle | create PR -> review -> CI status -> merge | PR status, review state, pipeline/job link, policy gates. |
| CI run lifecycle | trigger pipeline -> jobs run -> logs/events -> rerun | pipeline/job statuses, runner pool, ServiceAccount, artifacts. |
| Webhook delivery | configure hook -> send test delivery -> replay failed delivery | signed payload, retry policy, delivery records. |
| Deployment promotion | repo change -> deployment page -> promote/rollback | OAM/Argo status, environment scoping, audit. |
| Org isolation | duplicate repo slug across orgs | no silent legacy route selection, cross-org API denial. |

## Agent and memory scenarios

| Scenario | Steps | Assertions |
| --- | --- | --- |
| Manual agent dispatch | repo code -> dispatch agent -> run detail | dispatch run, attempt, Agent Mux session, context bundle. |
| Dispatch with memory | select memory source -> preview -> dispatch | memory snapshot commit, selected records, digests, redaction. |
| Historical memory | choose `refAt` -> dispatch -> retry | retry stays pinned, stale warning shown. |
| Import run memory | run detail -> import `.a5c` summary -> approve | redacted import, validation report, memory PR/commit. |
| Triggered repair | failed CI -> trigger rule -> dispatch | dedupe, permission review, run row beside pipeline. |
| Write-back approval | agent proposes patch/comment -> approve | artifact digest, approval audit, PR/comment update. |

## Live cluster scenarios

Nightly/staging suites should eventually run against a real cluster with:

- Kubernetes API aggregation;
- Gitea smart HTTP/SSH;
- Postgres;
- object storage;
- NATS/webhook queue;
- Argo CD/KubeVela;
- ARC or runner abstraction;
- Agent Mux gateway/runtime when enabled.

## E2E artifacts

E2E tests should collect:

- generated resources;
- API responses;
- event/watch logs;
- screenshots/traces for browser flows;
- Helm manifests;
- controller logs;
- redaction/validation reports;
- audit event excerpts.
