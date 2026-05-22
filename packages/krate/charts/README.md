# Krate Chart



This chart is the installable package surface for the Krate Kubernetes-native contract. It packages CRDs, optional APIService registration for aggregated-API deployments, service accounts, RBAC, controller/API/UI workloads, the Gitea backend, Argo CD Application surface, services, and network policy defaults.



The chart is intentionally production-shaped but demo-safe: it exposes the Kubernetes lifecycle, Argo CD reconciliation contract, and Gitea-backed Git data-plane contract while local tests provide a deterministic validation harness.



## Local dry-run



```bash

npm run setup:minikube -- --dry-run

npm run e2e

npm run package:check

```



## Real local install



```bash

npm run setup:minikube -- --apply

```



The apply mode expects `minikube`, `kubectl`, `helm`, and a working container driver.



## Sign-in and user management

Krate installs with GitHub login enabled by default and optional SSO disabled until an operator supplies provider settings. SSO is installation configuration only: admins manage users, teams, invites, repository access, and identity mappings in Krate after the provider is configured through Helm values.

### Create a GitHub OAuth client

1. In GitHub, open **Settings -> Developer settings -> OAuth Apps -> New OAuth App**.
2. Set the homepage URL to the public Krate URL, for example `https://krate.example.com`.
3. Set the callback URL to `https://krate.example.com/api/auth/callback/github`.
4. Copy the generated client ID and client secret into a private values file or an existing Kubernetes Secret.

```yaml
auth:
  github:
    enabled: true
    clientId: "<github-client-id>"
    clientSecret: "<github-client-secret>"
```

Install or upgrade with:

```bash
helm upgrade --install krate charts/krate -n krate-system --create-namespace -f auth-values.yaml
```

To disable GitHub login:

```yaml
auth:
  github:
    enabled: false
```

### Configure SSO

Create an OAuth/OIDC client in your identity provider with callback URL `https://krate.example.com/api/auth/callback/sso`, then pass the provider endpoints through Helm values. This configuration is intentionally not exposed in the UI.

```yaml
auth:
  sso:
    enabled: true
    providerName: "Company SSO"
    issuerUrl: "https://idp.example.com"
    authorizationUrl: "https://idp.example.com/oauth2/v1/authorize"
    tokenUrl: "https://idp.example.com/oauth2/v1/token"
    userInfoUrl: "https://idp.example.com/oauth2/v1/userinfo"
    clientId: "<sso-client-id>"
    clientSecret: "<sso-client-secret>"
    scopes: "openid profile email groups"
```

For existing secrets, create keys named `github-client-id`, `github-client-secret`, `sso-client-id`, and `sso-client-secret`, then reference them:

When every enabled provider uses `existingSecret`, the chart does not render an additional Krate-managed auth Secret. If only one provider uses an existing Secret, the chart renders only the inline-managed provider keys.

```yaml
auth:
  github:
    existingSecret: krate-auth-secrets
  sso:
    existingSecret: krate-auth-secrets
```

To expose the Next.js app through an ingress, set `ingress.enabled=true`, provide a host under `ingress.hosts`, configure TLS under `ingress.tls`, and set `global.imagePullSecrets` when the image is in a private registry.

When a cluster ingress or identity proxy delegates authentication, set the forwarded identity headers at install time:

```yaml
auth:
  delegatedIdentity:
    enabled: true
    userHeader: x-forwarded-user
    groupsHeader: x-forwarded-groups
```

For a local cluster reached through `kubectl port-forward`, enable the explicit localhost fallback instead of expecting the port-forward to add identity headers:

```yaml
auth:
  delegatedIdentity:
    enabled: true
    localDevelopment:
      enabled: true
      user: local-developer
      email: local-developer@example.test
      groups: krate:repo-admins
```

Krate stores `User`, `Team`, `Invite`, `IdentityMapping`, `RepositoryPermission`, and `SSHKey` resources. OAuth callbacks and delegated identity headers auto-register the Krate user plus identity mapping, and controllers reconcile those resources into workspace access, repository account mappings, team membership, SSH keys, and repository permissions while the UI exposes only Krate people and access flows.

## Kyverno policy integration

Krate supports three Kyverno modes through `externalDependencies.kyverno`:

- `mode: auto` keeps Kyverno optional while discovering an existing Kyverno installation when its CRDs are readable. Krate still installs native `RefPolicy`, `BranchProtection`, `PolicyProfile`, `PolicyTemplate`, `PolicyBinding`, and `PolicyExceptionRequest` CRDs when Kyverno is not present.
- `mode: byo` discovers an existing Kyverno installation, reads policies, policy reports, exceptions, controller health, and RBAC permissions, and lets Krate-managed `PolicyBinding` resources render policy work when write RBAC is granted.
- `mode: managed` renders an Argo CD child `Application` for the upstream Kyverno Helm chart using `externalDependencies.kyverno.managed.*` values.

Policy-related environment variables are projected into API, controller, and web workloads: `KRATE_KYVERNO_MODE`, `KRATE_KYVERNO_NAMESPACE`, `KRATE_KYVERNO_POLICY_NAMESPACE`, `KRATE_KYVERNO_REQUIRE_FOR_ENFORCE_MODE`, `KRATE_KYVERNO_POLICY_REPORTER_ENABLED`, and `KRATE_KYVERNO_DISCOVER_EXISTING`.

Example BYO setup:

```yaml
externalDependencies:
  kyverno:
    mode: byo
    namespace: kyverno
    policyNamespace: krate-system
    requireForEnforceMode: true
```

Example managed setup:

```yaml
argocd:
  enabled: true
externalDependencies:
  kyverno:
    mode: managed
    namespace: kyverno
    managed:
      releaseName: kyverno
      chartRepoURL: https://kyverno.github.io/kyverno/
      chart: kyverno
      targetRevision: "3.x"
```
