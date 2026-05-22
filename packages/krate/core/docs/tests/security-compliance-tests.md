# Security and compliance tests

## Authentication and authorization

Required tests:

- OIDC/delegated identity config parsing;
- unauthenticated request rejection;
- user/group mapping;
- Kubernetes SubjectAccessReview invocation;
- org namespace authorization;
- route guard denies resource with wrong org label;
- admin-only actions require admin/RBAC.

## RBAC and policy

Required tests:

- runner ServiceAccount scoped to repo/ref/trust tier;
- agent ServiceAccount cannot mount another org Secret/ConfigMap;
- untrusted fork has no secrets and no cluster write access;
- missing `AgentSecretGrant` or `AgentConfigGrant` blocks stack readiness;
- policy/audit mode surfaces warnings without mutating resources;
- cross-org refs require `OrgSharingPolicy`.

## Secret and data leakage

No secret-like values may appear in:

- API responses;
- UI rendered text;
- context bundles;
- prompt previews;
- memory imports;
- logs and watch events;
- artifacts;
- audit records;
- browser traces.

## Supply chain

Release gates should eventually include:

- dependency vulnerability scan;
- license policy scan;
- Docker image scan;
- SBOM generation;
- image/chart provenance or signatures;
- GitHub Actions workflow lint.

## Agent-specific security

- Memory records are untrusted prompt content.
- Tool calls are admitted by Krate, not Agent Mux alone.
- Historical memory runs cannot read current memory without refresh/approval.
- Agent write-back requires artifact digest and approval.
- `.a5c` imports are redacted and validated before entering company brain.
