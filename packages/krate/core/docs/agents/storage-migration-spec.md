# Agent storage and migration spec

## Purpose

This document defines how agent resources should be stored, indexed, migrated, and retained. It follows the current Krate split in `src/resource-model.js`: declarative configuration resources live in etcd/CRDs, while high-cardinality forge activity is served by the aggregated API/Postgres boundary.

## Storage classes

| Class | Resources | Backing store | Reason |
| --- | --- | --- | --- |
| Declarative config | stacks, tools, MCP servers, skills, triggers, context labels, ServiceAccounts, role bindings, grants | CRDs/etcd | GitOps-friendly, low-cardinality, reviewable. |
| Execution metadata | dispatch runs, attempts, sessions, workspaces, approvals, trigger executions, capability requirements | aggregated API/Postgres | high-cardinality, frequently updated, query-heavy. |
| Blob/artifact data | context bundles, logs, patches, transcripts, subagent outputs, review artifacts | object storage + metadata in Postgres | potentially large, immutable or append-heavy. |
| Native Kubernetes objects | ServiceAccounts, Roles, RoleBindings, Secrets, ConfigMaps | Kubernetes API | authoritative enforcement objects. |
| External runtime state | Agent Mux sessions/runs/events | Agent Mux storage/gateway | adapter-specific execution details. |

## Resource lifecycle

### Config resources

- Created through generic controller resources API or typed agent routes.
- Reconciled into status by controllers.
- Can be managed by GitOps through Helm/Argo CD.
- Should use `metadata.generation` and `status.observedGeneration`.
- Deleting a config resource must show dependent stacks/rules/runs before finalization.

### Execution resources

- Created by controllers or admitted API actions, not by GitOps by default.
- Must keep source breadcrumbs and immutable snapshots.
- Status updates are frequent and should not be CRD-heavy if volume grows.
- Retention policies should prune or archive old execution records while preserving audit summaries.

### Artifact resources

- Metadata stored in `AgentArtifact`, `AgentContextBundle`, or `AgentReviewArtifact`.
- Bytes stored in object storage.
- Digest and retention metadata are mandatory.
- Secret values and raw credentials are never stored as artifacts.

## Postgres tables for aggregated resources

Suggested logical tables:

| Table | Primary key | Important indexes |
| --- | --- | --- |
| `agent_dispatch_runs` | `uid` | repository, status, stack, trigger, source kind/name, branch, created_at |
| `agent_dispatch_attempts` | `uid` | dispatch_run_uid, phase, agent_mux_run_id, agent_mux_session_id |
| `agent_sessions` | `uid` | agent_mux_session_id, dispatch_run_uid, workspace_uid |
| `agent_workspaces` | `uid` | repository, workspace_path, branch, status, ownership kind/name |
| `agent_approvals` | `uid` | dispatch_run_uid, phase, action_type, requested_by, approver |
| `agent_trigger_executions` | `uid` | trigger_rule, source_event_uid, dedupe_key, decision, created_at |
| `agent_capability_requirements` | `uid` | owner kind/name, stack, missing grant kind |
| `agent_artifacts` | `uid` | dispatch_run_uid, kind, digest, created_at |
| `agent_context_bundles` | `uid` | digest, dispatch_run_uid, source digest |
| `work_item_session_links` | `uid` | work_item_ref, agent_session_uid |
| `work_item_workspace_links` | `uid` | work_item_ref, workspace_uid |

## Immutable snapshots

Every `AgentDispatchAttempt` must snapshot:

- stack name and generation;
- expanded tool/MCP/skill/subagent refs;
- prompt/context labels and rendered prompt digest;
- context bundle digest and source manifest;
- permission review digest;
- runtime ServiceAccount and runner ServiceAccount;
- Secret/ConfigMap grant names, key names, and metadata versions;
- runner pool and workspace policy;
- Agent Mux launch options after redaction.

Snapshots protect retries from silently changing due to later stack or secret edits. Retry/resume may intentionally create a new snapshot.

## Retention policy

Default retention knobs should be chart values later:

| Data | Default | Notes |
| --- | --- | --- |
| dispatch runs | 90 days | keep longer summaries for audit. |
| attempts/events | 90 days | compact old event streams into summaries. |
| transcripts | 30 days | configurable by repository/org. |
| context bundles | 30 days | shorter for large/log-heavy bundles. |
| patch/review artifacts | 180 days | linked to PR lifecycle. |
| approvals/audit summaries | 1 year | no secret values. |
| workspaces | policy-driven | cleanup after merge/close unless pinned. |

## Migration plan

### Phase 1: resource definitions

- Add agent kinds to `src/resource-model.js`.
- Add `KRATE_RESOURCES` entries in `src/kubernetes-controller.js`.
- Add CRDs under `charts/krate/crds/`.
- Validate generic list/apply/watch still works.

### Phase 2: aggregated schema

- Add tables for dispatches, attempts, approvals, workspaces, trigger executions, artifacts, and links.
- Backfill no data; first version starts empty.
- Ensure every table has repository/source/status/time indexes.

### Phase 3: snapshots and artifacts

- Add immutable context/permission snapshot metadata.
- Add object-storage references and digest validation.
- Add retention jobs but keep deletion disabled by default in dev/demo.

### Phase 4: migration hardening

- Add schema version resource or table.
- Migrations must be idempotent.
- Failed migrations block controller start but keep web read-only where possible.

## Consistency model

- Config resources are eventually reconciled into readiness conditions.
- Dispatch creation requires current permission review and stack status, but final launch uses immutable attempt snapshot.
- Agent Mux session state may lag; Krate run status should expose `AgentMuxSessionBound` and stream cursor.
- Watch reconnect should resume from current list state if event cursor is unavailable.

## Query requirements for UI

The storage layer must support:

- repository-scoped run list;
- source PR/issue/pipeline run list;
- global pending approvals;
- missing permission warnings by stack and repository;
- active sessions by workspace;
- Secret/ConfigMap consumer graph;
- trigger execution history and coalescing decisions;
- stale/drifted ServiceAccount/RoleBinding/grant summaries.

## Company brain storage class

The company brain uses Git as the source of truth and Krate resources as the control plane.

| Data | Backing store | Notes |
| --- | --- | --- |
| memory source files | internal Git repository | Markdown, YAML frontmatter, graph YAML, ontology YAML. |
| generated indexes | Git, object storage, or controller cache | reproducible from source commit. |
| memory config | CRDs/etcd | repository, source policy, ontology, associations. |
| memory snapshots and queries | Postgres/object storage | high-cardinality run-bound records and selected excerpts. |
| memory update artifacts | object storage + memory repo PR | proposed patches, validation reports, approvals. |

Dispatch snapshots must store the resolved memory commit so future retries and audits do not depend on mutable branch state.

## Babysitter memory storage

`.a5c` directories remain run-local operational state. The company brain stores admitted org memory derived from them:

| Source | Stored in memory repo | Notes |
| --- | --- | --- |
| `MEMORY.md` | `babysitter/MEMORY.md` | org-level orchestration entrypoint. |
| `.a5c/runs/*/run.json` | `babysitter/runs/<run>/run.yaml` | normalized metadata, org, repo, process, status. |
| `.a5c/runs/*/journal/*.json` | `babysitter/runs/<run>/journal/*.yaml` | curated/redacted ordered events. |
| `.a5c/runs/*/tasks/*/result.json` | `babysitter/runs/<run>/tasks/*.yaml` | task result summary and evidence refs. |
| `.a5c/artifacts/*` | artifact manifest/digest only by default | raw artifacts require explicit retention policy. |

Imports must preserve source digests and never mutate historical dispatch snapshots.

## Org-scoped backup and restore

Org backup must include declarative resources from the org namespace, aggregated API rows filtered by org, repository storage, deployment metadata, object artifacts, and the org company brain memory repository. Restore order is namespace and org binding first, then config resources, repositories, memory repo, Postgres rows, object artifacts, controllers, and finally watch/index rebuild.

`AgentMemorySnapshot` records must remain readable even if the current company brain repository has moved; snapshots store resolved commit and selected digests for this reason.
