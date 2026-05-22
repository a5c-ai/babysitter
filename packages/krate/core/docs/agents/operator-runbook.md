# Agent operator runbook

## Purpose

This runbook describes how an operator should install, enable, validate, troubleshoot, and safely disable Krate agent orchestration once implemented. It is docs-only and aligns with the current chart/API validation surfaces.

## Current baseline

Before agent implementation, these commands should remain green:

```powershell
npm run validate:docs
npm run package:check
npm run ui:validate
npm run check
```

Current install surfaces:

- chart: `charts/krate`;
- values: `charts/krate/values.yaml`;
- CRDs: `charts/krate/crds/`;
- controller API: `/api/controller`;
- resource API: `/api/controller/resources`;
- watch API: `/api/watch/orgs/[org]/*`.

## Enablement checklist

When agents are implemented, enable in this order:

1. Install/upgrade CRDs for agent config resources.
2. Enable `agents.enabled=true` in Helm values.
3. Configure Agent Mux gateway URL and credentials through `existingSecret`.
4. Configure default untrusted runner pool.
5. Configure default agent runtime ServiceAccount.
6. Enable permission review without auto-dispatch.
7. Create a read-only agent stack.
8. Validate stack readiness and permission review.
9. Enable manual dispatch for a test repository.
10. Enable trigger rules only after manual dispatch is stable.
11. Enable write-back approvals last.

## Preflight checks

Operator should verify:

- Kubernetes API reachable from controller pod;
- Krate CRDs installed;
- native RBAC allows controller to manage intended resources;
- Agent Mux gateway reachable from controller namespace;
- runner pools exist and trust tiers are correct;
- Secret/ConfigMap grant management feature gate configured;
- NetworkPolicy allows only required Agent Mux/MCP egress;
- `/api/controller` reports healthy controller model;
- `/api/watch/orgs/[org]/repositories` streams events.

## Safe default policy

Default install should be safe:

- agents disabled;
- trigger rules disabled;
- manual dispatch disabled;
- write-back approval required;
- no privileged secrets on forks;
- untrusted runner pool default;
- no broad Secret read for web pod;
- Agent Mux gateway optional/degraded if absent.

## Common operations

### Create first read-only stack

1. Create `AgentServiceAccount` with read-only role template.
2. Create `AgentToolProfile` with filesystem read-only and network deny.
3. Create `AgentStack` using read-only tool profile.
4. Run permission review.
5. Confirm stack `Ready=True`.

### Grant a tool Secret

1. Open Secret grant wizard or apply `AgentSecretGrant`.
2. Scope to stack/tool, repository, refs, trigger sources, and purpose.
3. Confirm Secret key metadata exists.
4. Confirm stack readiness updates.
5. Run dry-run before dispatch.

### Enable CI diagnosis

1. Create CI diagnosis stack.
2. Create `AgentTriggerRule` in draft.
3. Dry-run against failed `Pipeline`/`Job` payload.
4. Validate context bundle preview and permission review.
5. Set lifecycle to active.
6. Watch `AgentTriggerExecution` and `AgentDispatchRun` resources.

### Rotate Secret

1. Update native Secret using approved process.
2. Confirm `AgentSecretGrant` status updates metadata version.
3. Check affected stacks/rules/runs.
4. Retry/resume only after fresh permission review.

## Troubleshooting

| Symptom | Check | Likely fix |
| --- | --- | --- |
| stack not ready | stack conditions | fix adapter, ServiceAccount, grant, MCP, or skill dependency. |
| dispatch denied | permission review response | add least-privilege role/grant or change runner/source. |
| Agent Mux launch fails | attempt status and adapter rejection | update launch options or adapter configuration. |
| session stuck pending | Agent Mux gateway and session binding | retry binding or inspect gateway logs. |
| no watch updates | `/api/watch/orgs/<org>/<resource>` | check Kubernetes watch/RBAC/network. |
| Secret grant missing | capability requirements | create scoped `AgentSecretGrant`. |
| fork run gets privileged pool | trigger/runner trust policy | force untrusted pool and audit policy violation. |
| write-back duplicated | idempotency key/audit | fix write-back controller idempotency before retrying. |

## Rollback and disablement

To disable safely:

1. Pause trigger rules.
2. Disable manual dispatch.
3. Wait for active dispatches or cancel them.
4. Disable write-back actions.
5. Keep read-only run/artifact/audit views available.
6. Disable Agent Mux gateway integration.
7. Leave CRDs installed until retained records are exported or pruned.

Emergency disable:

- set `agents.enabled=false` or feature gates false;
- revoke Agent Mux gateway secret;
- revoke privileged `AgentSecretGrant` and `AgentRoleBinding` resources;
- scale agent controllers down if necessary;
- preserve audit and run records.

## Operational metrics to watch

- active dispatches;
- queued dispatches;
- failed dispatches;
- pending approvals;
- Agent Mux launch failures;
- permission review denials;
- RBAC drift;
- missing grants;
- write-back failures;
- retention job failures.

## Support bundle

A safe support bundle should include:

- controller model from `/api/controller` with secrets redacted;
- stack/rule/run resource YAML;
- permission review response;
- conditions from ServiceAccount/RoleBinding/SecretGrant/ConfigGrant resources;
- event timeline;
- Agent Mux run/session IDs;
- audit records;
- chart values with Secret values redacted.

It must not include Secret values, raw tokens, kubeconfigs, private keys, or full transcripts unless explicitly approved.

## Company brain operations

Operators should treat the memory repository like production configuration:

- verify `AgentMemoryRepository` health before enabling required-memory stacks;
- keep ontology validation green before allowing memory update merges;
- monitor index age and query failures;
- use historical memory refs for reproducible incident replay;
- disable affected `AgentMemorySource` scopes before reverting a bad memory commit;
- preserve `AgentMemorySnapshot` records even when source policies change.
