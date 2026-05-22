# Coverage model

## Coverage dimensions

Krate coverage is multi-dimensional. Line coverage is useful but not sufficient.

| Dimension | Required coverage |
| --- | --- |
| Code coverage | statements, branches, functions, and critical path modules. |
| Resource coverage | every CRD/config kind and aggregated kind has schema and example tests. |
| Route coverage | every org/repo/agent/deployment route has render and authorization tests. |
| API coverage | every typed endpoint has success, validation failure, auth failure, and cross-org negative tests. |
| Controller coverage | reconcile create/update/delete, idempotency, retry, drift, finalizer, and status conditions. |
| UI coverage | primary journeys, disabled states, advanced YAML panels, accessibility, route guards. |
| Security coverage | auth, RBAC, Secret/ConfigMap grants, no-leak responses, audit records. |
| Release coverage | package files, chart templates, CRDs, examples, smoke install, Docker image. |
| Agent coverage | dispatch, context, memory, tools, triggers, sessions, imports, approvals, write-back. |

## Initial thresholds

| Layer | Target |
| --- | --- |
| Pure `src` modules | 85% line, 75% branch once coverage tooling lands. |
| Controller/API critical paths | 90% path coverage by table-driven tests. |
| UI route smoke | 100% of primary org/repo/deployment/agent routes render. |
| Resource kinds | 100% listed in resource model, docs, package examples, and tests. |
| Security negative paths | 100% for cross-org, no-secret, untrusted fork, and missing grant cases. |

Thresholds should ratchet upward; do not block early docs-only work on coverage tooling that does not exist yet.

## Traceability

Every feature should map:

```text
requirement -> resource/API/UI/controller -> test file -> CI gate -> artifact/report
```

The existing `docs/agents/traceability-matrix.md` is the model for agent features. Product-wide coverage should extend the same pattern into `docs/tests`.

## Coverage reports

Reports should include:

- per-command status;
- code coverage when available;
- resource kind coverage;
- route/API coverage;
- browser scenario coverage;
- security negative coverage;
- flaky tests and retries;
- untested new files/resources.

## Coverage exclusions

Allowed exclusions:

- generated files;
- static docs;
- vendored assets;
- intentionally unreachable defensive branches when documented;
- live-only integrations covered by staging/nightly gates.

Exclusions must be explicit and reviewed.
