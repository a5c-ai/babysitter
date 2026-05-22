# Identity, RBAC, and Policy Component Requirements

## Purpose

Krate inherits Kubernetes identity, RBAC, admission, and audit so the forge does not create a parallel permission system. Human actions and CI actions must be attributable to Kubernetes users, groups, or ServiceAccounts.

## Responsibilities

- Authenticate humans with GitHub OAuth, optional installation-configured SSO, or a delegated identity proxy.
- Store `User`, `Team`, `Invite`, `IdentityMapping`, and `AuthProvider` resources as the Krate source of truth.
- Manage native Kubernetes `ServiceAccount`, `Role`, `ClusterRole`, `RoleBinding`, and `ClusterRoleBinding` projections for users, teams, agents, and runners.
- Map human users and groups into Kubernetes identities and repository identities.
- Use TokenRequest or equivalent delegation for UI-to-API calls.
- Issue scoped ServiceAccount identities for CI jobs, agent dispatch attempts, and runner pools.
- Enforce trust tiers and policy through admission.

## API and resource surface

- `User`, `Team`, `Invite`, `IdentityMapping`, and `AuthProvider` CRDs.
- RBAC Roles/ClusterRoles for forge resources.
- ServiceAccounts for runner pools, jobs, and agent stacks.
- Agent RBAC management resources such as `AgentServiceAccount`, `AgentRoleBinding`, `AgentSecretGrant`, and `AgentConfigGrant`.
- Admission policies for `PullRequest`, `Pipeline`, `Job`, and related resources.
- Policy templates for common PR and runner constraints.

## Requirements

- No core workflow may require PATs.
- UI permission checks must be server-enforced by Kubernetes API calls.
- Fork PR pipelines must run as untrusted jobs with no secrets and no cluster API access.
- Runner trust tier must be admitted and enforced before scheduling.
- Activity records must be traceable to Kubernetes identity.

## Dependencies

- GitHub OAuth app and optional OIDC/SSO provider configured through Helm values.
- Kubernetes TokenRequest API.
- Kubernetes RBAC.
- Kyverno, Gatekeeper, or native ValidatingAdmissionPolicy where available.
- Runner controller and scheduler.

## Security and policy

- Secrets may only be mounted into trusted jobs or agent dispatches that satisfy repo/ref/pipeline/trigger constraints and explicit Secret grants.
- ConfigMaps used by tools, skills, MCP servers, agents, and runners must be admitted through explicit ConfigMap grants when they affect execution.
- Untrusted jobs must not be able to mutate cluster resources.
- Policy bypass must require explicit RBAC grants and be auditable.
- Admission failures must return clear user-facing messages.

## Scaling and performance

- Token exchange and authorization must not become the UI bottleneck.
- RBAC and admission checks must be cached only where safe and must respect revocation semantics.

## Failure modes

- OIDC provider unavailable: new logins fail; existing sessions follow configured token lifetime.
- TokenRequest fails: UI actions fail closed.
- Admission webhook unavailable: enforcement policies fail according to Kubernetes failure policy.
- RBAC misconfiguration: UI must surface denied actions without hiding the underlying resource.

## Observability

- Auth failures, token exchange latency, RBAC denied counts, admission decisions, and trust-tier violations.
- Audit events for privileged changes and policy bypass.

## Acceptance criteria

- An admin can invite users, manage teams, map sign-in identities, grant repository access, manage agent/runner ServiceAccounts, and bind native Kubernetes roles from the Krate UI.
- A user can perform allowed PR actions based on Kubernetes RBAC.
- A user is denied forbidden actions by the API server, not UI-only logic.
- An untrusted fork PR cannot access secrets or privileged agent/runner ServiceAccounts.
- A Kyverno policy can require PR descriptions or reviewer rules.
