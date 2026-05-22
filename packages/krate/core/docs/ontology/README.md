# Krate Ontology

This tree turns the requirements in `docs/` into an implementation ontology for the Kubernetes-native forge MVP.

## Reading order

1. `world.md` - domain, actors, external systems, and assumptions.
2. `problem-space.md` - jobs, risks, and failure modes Krate must solve.
3. `solution-space.md` - architecture and MVP module mapping.
4. `bounded-contexts.md` - ownership boundaries across control, data, identity, CI, hooks, UI, and operations.
5. `resource-taxonomy.md` and `resource-contracts.md` - API kinds and lifecycle contracts.
6. Workflow, policy, storage, event, CI, UI, operations, and validation files for executable acceptance gates.

## Traceability model

Each ontology entry traces to at least one source document under `docs/`, one implementation module under `src/`, and one validation surface in `tests/` or `scripts/`.

| Ontology area | Source docs | Implementation | Validation |
| --- | --- | --- | --- |
| Control-plane resources | `docs/components/control-plane.md` | `src/resource-model.js`, `src/control-plane.js` | `tests/krate.test.js` |
| Identity and policy | `docs/components/identity-rbac-policy.md` | `src/identity-policy.js` | RBAC/admission tests |
| Git data plane | `docs/components/data-plane.md` | `src/data-plane.js` | Gitea backend tests |
| CI and runners | `docs/components/runners-ci.md` | `src/runners-ci.js` | Runner scheduler tests |
| Hooks and webhooks | `docs/components/hooks-events.md` | `src/hooks-events.js` | Webhook bus tests |
| Web UI flows | `docs/components/web-ui.md` | `src/web-ui.js` | smoke assertions |
| Operations and release | `docs/components/operations-publishing.md` | `src/operations.js` | build, smoke, doc coverage |

## Completion criteria

- All resource kinds are classified as CRD-backed configuration or aggregated Postgres-backed records.
- All high-risk invariants are executable: RBAC, admission, storage boundaries, fork isolation, ref protection, webhook replay, UI YAML transparency, and backup/restore order.
- `npm run check` verifies build output, doc/ontology coverage, tests, and smoke flow.
