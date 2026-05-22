# Unit and integration tests

## Unit test targets

| Area | Examples |
| --- | --- |
| Resource model | kind definitions, required spec fields, schema generation, plural names. |
| Org routing helpers | `orgHref`, route ambiguity, slug handling, breadcrumb construction. |
| API validation | required fields, stable errors, org mismatch, no-secret responses. |
| Context assembly | source manifests, digest calculation, redaction ordering, truncation. |
| Memory utilities | ref resolution, graph/frontmatter parsing, grep result bounding, import normalization. |
| Auth/RBAC helpers | delegated identity, SubjectAccessReview requests, permission summaries. |
| Chart/package scripts | required files, CRD coverage, values coverage. |
| Setup/smoke scripts | deterministic dry-run output and command plans. |

## Integration test targets

| Boundary | Required tests |
| --- | --- |
| API controller + fake Kubernetes | list/get/apply/delete resources, org filters, watch setup. |
| UI model + fake controller | dashboard summaries, org pages, repository pages, run pages. |
| Controller + fake Gitea | repository create, branch protection, permissions, webhook sync. |
| Runner + fake Kubernetes | ServiceAccount selection, untrusted fork policy, job lifecycle. |
| Hook queue + fake delivery | signing, retry, replay, failure status. |
| Memory import + fake Git repo | read `.a5c`, redact, normalize, validate, open PR. |
| Agent dispatch + fake Agent Mux | launch, session binding, events, cancel/resume. |

## Required negative tests

- missing `organizationRef`;
- namespace does not match org binding;
- cross-org repository, memory, secret, config, runner, or session ref;
- denied SubjectAccessReview;
- missing Secret/ConfigMap grant;
- untrusted fork tries to access secrets;
- memory import contains secret-like content;
- webhook signature mismatch;
- duplicate repository slug through legacy route;
- stale memory ref cannot resolve.

## Test style

- Use table-driven cases for resource and API validation.
- Keep fixtures small and explicit.
- Prefer fake adapters over network calls.
- Assert stable error codes, not only messages.
- Assert status conditions and audit fields.
- Assert no secret values appear in responses, logs, snapshots, or artifacts.
