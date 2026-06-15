# Kradle Chart



This chart is the installable package surface for the Kradle Kubernetes-native contract. It packages CRDs, optional APIService registration for aggregated-API deployments, service accounts, RBAC, controller/API/UI workloads, the Gitea backend, Argo CD Application surface, services, and network policy defaults.



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

Kradle installs with GitHub login enabled by default and optional SSO disabled until an operator supplies provider settings. SSO is installation configuration only: admins manage users, teams, invites, repository access, and identity mappings in Kradle after the provider is configured through Helm values.

### Create a GitHub OAuth client

1. In GitHub, open **Settings -> Developer settings -> OAuth Apps -> New OAuth App**.
2. Set the homepage URL to the public Kradle URL, for example `https://kradle.example.com`.
3. Set the callback URL to `https://kradle.example.com/api/auth/callback/github`.
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
helm upgrade --install kradle charts/kradle -n kradle-system --create-namespace -f auth-values.yaml
```

To disable GitHub login:

```yaml
auth:
  github:
    enabled: false
```

### Configure SSO

Create an OAuth/OIDC client in your identity provider with callback URL `https://kradle.example.com/api/auth/callback/sso`, then pass the provider endpoints through Helm values. This configuration is intentionally not exposed in the UI.

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

When every enabled provider uses `existingSecret`, the chart does not render an additional Kradle-managed auth Secret. If only one provider uses an existing Secret, the chart renders only the inline-managed provider keys.

```yaml
auth:
  github:
    existingSecret: kradle-auth-secrets
  sso:
    existingSecret: kradle-auth-secrets
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
      groups: kradle:repo-admins
```

Kradle stores `User`, `Team`, `Invite`, `IdentityMapping`, `RepositoryPermission`, and `SSHKey` resources. OAuth callbacks and delegated identity headers auto-register the Kradle user plus identity mapping, and controllers reconcile those resources into workspace access, repository account mappings, team membership, SSH keys, and repository permissions while the UI exposes only Kradle people and access flows.

### Configure Staging Service Bindings

Assistant and Gitea tokens must come from Kubernetes Secrets. The chart renders only `secretKeyRef` names and keys, never token values:

```yaml
assistant:
  anthropic:
    existingSecret: kradle-assistant
    key: anthropic-api-key
  kradleAssistant:
    existingSecret: kradle-assistant
    key: kradle-assistant-api-key
gitea:
  httpUrl: http://kradle-gitea-http.kradle-system.svc.cluster.local:3000/kradle
  token:
    existingSecret: kradle-gitea-token
    key: token
agentMux:
  url: http://adapters.kradle-system.svc.cluster.local:8080
  gatewayUrl: http://agent-gateway.kradle-system.svc.cluster.local:8080
```

Leave any value empty to keep the corresponding env var out of the rendered workloads. Staging deployments should create the referenced Secrets through the approved secret manager or cluster operations flow before enabling these values.

## Kyverno policy integration

Kradle supports three Kyverno modes through `externalDependencies.kyverno`:

- `mode: auto` keeps Kyverno optional while discovering an existing Kyverno installation when its CRDs are readable. Kradle still installs native `RefPolicy`, `BranchProtection`, `PolicyProfile`, `PolicyTemplate`, `PolicyBinding`, and `PolicyExceptionRequest` CRDs when Kyverno is not present.
- `mode: byo` discovers an existing Kyverno installation, reads policies, policy reports, exceptions, controller health, and RBAC permissions, and lets Kradle-managed `PolicyBinding` resources render policy work when write RBAC is granted.
- `mode: managed` renders an Argo CD child `Application` for the upstream Kyverno Helm chart using `externalDependencies.kyverno.managed.*` values.

Policy-related environment variables are projected into API, controller, and web workloads: `KRADLE_KYVERNO_MODE`, `KRADLE_KYVERNO_NAMESPACE`, `KRADLE_KYVERNO_POLICY_NAMESPACE`, `KRADLE_KYVERNO_REQUIRE_FOR_ENFORCE_MODE`, `KRADLE_KYVERNO_POLICY_REPORTER_ENABLED`, and `KRADLE_KYVERNO_DISCOVER_EXISTING`.

Example BYO setup:

```yaml
externalDependencies:
  kyverno:
    mode: byo
    namespace: kyverno
    policyNamespace: kradle-system
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
