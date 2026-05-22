# `packages/cloud` Spec

## 1. Purpose

`packages/cloud` will be the deployment control plane for this monorepo.

It will ship as a single JavaScript package that exposes:

- an SDK for composing deployment plans and environment configurations
- a CLI for install, upgrade, auth bootstrap, provider setup, and status workflows
- Terraform rendering/apply support for cluster infrastructure
- Kubernetes manifest/Helm-style rendering for repo services
- CI/CD entrypoints for staging and production

The package is responsible for making the repo's deployable utilities work together in a Kubernetes environment with minimal manual glue.

## 2. Primary Goals

1. Deploy repo utilities into Kubernetes as one coherent system.
2. Support three target modes:
   - local Minikube
   - existing Kubernetes cluster
   - newly created managed cluster on EKS, AKS, or GKE
3. Support install, upgrade, reconfigure, and drift-aware reconciliation.
4. Make `agent-mux` Kubernetes mode a first-class deployment option.
5. Optionally configure `babysitter-agent` providers and model routing.
6. Optionally install agent binaries and their Babysitter plugins when the target runtime needs them.
7. Provide a non-local authentication bootstrap path, including a default admin password flow.
8. Fit existing repo CI/release conventions with staging and production automation.

## 3. Non-Goals

- Replacing deep runtime logic that belongs in `agent-mux`, `kanban`, or `babysitter-agent`
- Becoming a general-purpose IaC framework outside this monorepo
- Owning application business logic for kanban, gateway, or Babysitter orchestration
- Hiding provider credentials inside the repo; secrets must come from the environment, secret stores, or explicit config files

## 4. What Gets Deployed

`packages/cloud` should be able to deploy, wire, and upgrade at least these repo surfaces:

- `@a5c-ai/kanban`
- `@a5c-ai/agent-mux-gateway`
- `@a5c-ai/babysitter-agent` as an optional service/runtime
- optional observer and supporting runtime components when enabled

The baseline topology is:

- `kanban` exposed as the primary web UI
- `agent-mux-gateway` exposed as the session/control gateway for UI and agents
- persistent storage for gateway token/event state
- shared config and secret wiring between gateway, kanban, and optional agent services
- ingress/service definitions so the components work together in-cluster without manual URL/token patching

## 5. Supported Deployment Modes

### 5.1 Local Minikube

Use case:

- local dev, demo, smoke tests, end-to-end verification

Requirements:

- create or reuse a Minikube cluster
- provision namespace, storage class assumptions, ingress choice, and local DNS/URL hints
- bootstrap a local admin account/password
- default to local-friendly settings, reduced resource requests, and local images where possible

### 5.2 Existing Cluster

Use case:

- platform team already provides Kubernetes

Requirements:

- no cluster creation
- validate context, namespace, ingress class, storage class, and secret prerequisites
- install or upgrade only repo workloads
- support dry-run and render-only modes before apply

### 5.3 New Managed Cluster

Providers:

- AWS EKS
- Azure AKS
- Google GKE (request used `gks`; package should accept `gks` as a friendly alias)

Requirements:

- Terraform module selection by provider
- provider-specific auth/bootstrap config
- cluster + node pool creation
- kubeconfig/context handoff into app deployment stage
- staging/prod preset support

## 6. Package Shape

This package should eventually be a normal workspace package named `@a5c-ai/cloud`.

Proposed implementation layout:

```text
packages/cloud/
  README.md
  SPEC.md
  package.json
  tsconfig.json
  src/
    index.ts
    cli.ts
    sdk/
      config.ts
      environments.ts
      plans.ts
      deploy.ts
      upgrade.ts
      auth.ts
      providers.ts
      agents.ts
    terraform/
      root.ts
      modules/
        minikube/
        eks/
        aks/
        gke/
    kubernetes/
      manifests/
      values/
      render.ts
    adapters/
      kanban.ts
      agent-mux-gateway.ts
      babysitter-agent.ts
  tests/
    unit/
    integration/
    fixtures/
```

## 7. SDK Contract

The SDK should be programmatic first. The CLI should be a thin wrapper over SDK actions.

Core SDK surface:

- `loadCloudConfig(input)`
- `validateCloudConfig(config)`
- `buildDeploymentPlan(config)`
- `renderTerraform(plan)`
- `applyTerraform(plan)`
- `renderKubernetes(plan)`
- `applyKubernetes(plan)`
- `installEnvironment(config)`
- `upgradeEnvironment(config)`
- `bootstrapAuth(config)`
- `configureProviders(config)`
- `installAgents(config)`
- `getEnvironmentStatus(config)`

The SDK must return structured results, not only console strings.

## 8. CLI Contract

Proposed CLI:

```bash
cloud init
cloud plan
cloud install
cloud upgrade
cloud status
cloud auth bootstrap
cloud providers configure
cloud agents install
cloud render terraform
cloud render kubernetes
cloud cluster create
cloud cluster destroy
```

Important flags:

- `--env <local|minikube|staging|prod>`
- `--provider <minikube|existing|eks|aks|gke|gks>`
- `--cluster-name <name>`
- `--namespace <name>`
- `--config <path>`
- `--set key=value`
- `--dry-run`
- `--render-only`
- `--upgrade`
- `--install-agents`
- `--configure-providers`

## 9. Configuration Model

The package needs one canonical config model with layered overrides:

1. built-in defaults
2. environment preset
3. config file
4. CLI flags / explicit overrides
5. secret references / environment variables

Proposed top-level config shape:

```ts
interface CloudConfig {
  environment: "minikube" | "staging" | "prod" | "custom";
  target:
    | { type: "minikube"; profile?: string }
    | { type: "existing"; kubeContext: string; namespace: string }
    | { type: "eks"; region: string; clusterName: string }
    | { type: "aks"; subscriptionId: string; resourceGroup: string; clusterName: string }
    | { type: "gke"; projectId: string; region: string; clusterName: string };
  ingress: {
    hostnames: string[];
    tls?: boolean;
    ingressClassName?: string;
  };
  auth: {
    mode: "local-dev" | "bootstrap-admin";
    adminUsername: string;
    adminPasswordSecretRef?: string;
    defaultAdminPassword?: string;
  };
  components: {
    kanban: { enabled: boolean; replicas?: number };
    gateway: { enabled: boolean; replicas?: number };
    babysitterAgent?: {
      enabled: boolean;
      providers?: ProviderConfig[];
      modelRouting?: ModelRoutingConfig[];
    };
  };
  agents?: {
    install: boolean;
    targets: Array<"claude-code" | "codex" | "cursor" | "copilot" | "gemini-cli" | "opencode">;
    installBabysitterPlugins: boolean;
  };
  storage: {
    className?: string;
    gatewayStateSize?: string;
  };
}
```

## 10. Deployment Architecture

### 10.1 Kubernetes Resources

Baseline resources:

- namespace
- service accounts and RBAC where required
- config maps
- secrets
- persistent volume claims for gateway state and any durable app state
- deployments/statefulsets as appropriate
- services
- ingress
- network policies when enabled

### 10.2 App Wiring

The deployment package must own the cross-service wiring:

- kanban receives the gateway base URL automatically
- gateway receives storage paths and auth bootstrap config automatically
- optional babysitter-agent receives gateway URL, provider config, and model config automatically
- agent-mux Kubernetes invocation mode is selectable in generated runtime config

### 10.3 Auth Bootstrap

For non-local installs:

- the system must support a bootstrap admin identity with a default admin password flow
- bootstrap secrets must be injectable through Kubernetes secrets or cloud secret managers
- first-run token issuance should be automatable for kanban/gateway integration

Open dependency:

- current gateway auth is bearer-token based and does not yet expose a password/admin bootstrap workflow suitable for this package

## 11. Upgrade Model

`packages/cloud` must support:

- first install
- idempotent re-apply
- in-place upgrade
- version-pinned deploys
- rollback-ready plan output

Upgrade sequence:

1. validate target and config
2. render desired infra/app state
3. diff cluster and infra state
4. apply infra changes
5. apply app changes
6. run smoke checks
7. report versions, endpoints, and auth bootstrap outputs

## 12. Provider and Model Configuration

Optional `babysitter-agent` setup should support:

- provider credentials references
- provider enable/disable lists
- default provider selection
- model routing/preset configuration
- environment-specific model defaults

This should be represented as declarative config, not one-off shell scripts.

Open dependency:

- some provider/model automation may require new non-interactive config surfaces in `babysitter-agent` and/or `agent-mux`

## 13. Optional Agent + Plugin Installation

Optional install flow should support:

- agent binary installation where appropriate
- installation validation
- Babysitter plugin installation for selected harnesses
- reporting of installed vs skipped harnesses

Expected initial targets:

- Claude Code
- Codex
- Cursor
- Gemini CLI
- GitHub Copilot
- OpenCode

Open dependency:

- cloud-safe, non-interactive install/config workflows are not yet standardized across all harness/plugin combinations

## 14. CI/CD Integration

The package must hook into existing repo automation with:

- workspace build
- unit tests
- integration tests
- coverage threshold enforcement
- staging deploy entrypoints
- production deploy entrypoints

Expected repo-level additions:

- root scripts for `build:cloud`, `test:cloud`, and coverage validation
- CI workflow coverage for the new workspace
- staging/prod workflow integration for rendering/apply/deploy

## 15. Testing Strategy

Required test layers:

- unit tests for config loading, plan generation, and rendering
- fixture-based tests for Terraform and Kubernetes output
- Minikube integration tests for install and upgrade flows
- smoke tests for auth bootstrap and basic kanban/gateway connectivity
- coverage checks in CI

Suggested minimum scripts:

```json
{
  "scripts": {
    "build": "tsc --build",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run tests/integration",
    "lint": "eslint \"src/**/*.ts\" --max-warnings=0"
  }
}
```

## 16. Ownership Boundaries

### `packages/cloud` owns

- deployment planning
- Terraform orchestration
- Kubernetes rendering/apply
- environment presets
- cross-package wiring
- staged/prod deploy automation entrypoints

### Existing packages should continue to own

- gateway auth/runtime semantics
- kanban application behavior
- babysitter-agent orchestration/runtime behavior
- agent-mux adapter capabilities and installation semantics

## 17. Dependency Gaps Identified During Spec

The following areas should be tracked outside `packages/cloud` implementation:

1. `agent-mux-gateway` needs a bootstrap admin/password-based auth story suitable for cloud deployments.
   Tracking: `ACA-234`
2. `kanban` needs cloud bootstrap behavior so it can connect to a provisioned gateway without manual local-storage token pasting as the only path.
   Tracking: `ACA-235`
3. `babysitter-agent` and/or `agent-mux` need stronger non-interactive provider/model and harness/plugin installation/configuration surfaces.
   Tracking: `ACA-236`
4. Root CI/release automation needs explicit support for the new cloud workspace.
   Tracking: `ACA-237`

## 18. Implementation Phasing

### Phase 1

- create package workspace
- implement config loader and plan model
- support Minikube and existing-cluster render-only/install flows
- deploy gateway + kanban

### Phase 2

- add managed cluster Terraform for EKS, AKS, GKE
- add upgrade and smoke-check flows
- add auth bootstrap integration

### Phase 3

- add optional babysitter-agent provider/model setup
- add optional harness/plugin install flow
- wire staging/prod pipelines

## 19. Acceptance Criteria

The package is ready for initial rollout when all of the following are true:

1. A user can create or reuse a Minikube cluster and install kanban + gateway with one CLI command.
2. A user can target an existing cluster with a declarative config file and get an idempotent install/upgrade.
3. A user can create an EKS, AKS, or GKE cluster and deploy the app stack from the same package.
4. Non-local installs have an explicit bootstrap admin password flow.
5. CI runs unit tests plus coverage checks for the workspace.
6. Staging and production automation can invoke the package without manual command editing.
