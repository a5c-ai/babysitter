# KubeVela and OAM Integration

Krate expands from a Git forge into an application delivery forge by installing KubeVela as an optional-but-first-class control-plane dependency and by assimilating the Open Application Model (OAM) into the Krate ontology.

## Scope

Krate will install and manage KubeVela from the deployed stack when `kubevela.enabled=true`. The default deployment path uses Argo CD to install the upstream `vela-core` Helm chart into `vela-system`, keeping the dependency GitOps-managed beside the Krate chart. KubeVela remains the owner of OAM runtime reconciliation; Krate wraps the experience with forge-native repository, pull request, environment, and pipeline flows.

## OAM Concepts Assimilated

- **Application**: the deployable unit composed from components, traits, workflow, policies, and scopes.
- **Component**: the reusable workload module selected by a developer or platform team.
- **Trait**: operational behavior attached to a component, such as ingress, scaler, rollout, or service binding.
- **Scope**: grouping/boundary metadata for components, such as environment, network, or health grouping.
- **Workflow step**: ordered delivery operation; Krate maps PR checks, preview deployment, promotion, rollback, and teardown into workflow steps.
- **Definition**: platform capability catalog entry, exposed by KubeVela as component, trait, policy, and workflow step definitions.


## OAM Spec Traceability

Krate tracks the upstream OAM v0.3.0 model entities directly while using KubeVela's newer delivery extensions where available:

| OAM spec entity | KubeVela/Kubernetes surface | Krate UI responsibility |
| --- | --- | --- |
| `Application` | `applications.core.oam.dev` in the forge namespace | Create from a repository, show status, workflow, component, trait, and scope projection. |
| `ComponentDefinition` | `componentdefinitions.core.oam.dev` in `vela-system` | Populate component-type selectors instead of hard-coding only `webservice`. |
| `WorkloadDefinition` | `workloaddefinitions.core.oam.dev` in `vela-system` when installed | Explain the Kubernetes workload implementation behind a component. |
| `TraitDefinition` | `traitdefinitions.core.oam.dev` in `vela-system` | Attach operational overlays such as scaler, ingress, rollout, and service binding. |
| `ScopeDefinition` | `scopedefinitions.core.oam.dev` in `vela-system` when installed | Expose grouping boundaries such as health scopes or environment scopes. |
| KubeVela policy/workflow extensions | `policydefinitions.core.oam.dev`, `policies.core.oam.dev`, `workflowstepdefinitions.core.oam.dev`, and `workflows.core.oam.dev` | Wrap promotion, approval, rollback, topology, and override flows as forge actions. |
| KubeVela runtime graph | `applicationrevisions.core.oam.dev` and cluster-scoped `resourcetrackers.core.oam.dev` | Show revision success and applied-resource ownership without Krate owning reconciliation. |

The OAM spec notes that `Application` supersedes the earlier `ApplicationConfiguration` name. Krate uses `Application.core.oam.dev/v1beta1` for all generated manifests and keeps ApplicationConfiguration only as legacy terminology in documentation.

## Deployment Contract

Krate chart values define the KubeVela dependency:

```yaml
kubevela:
  enabled: true
  namespace: vela-system
  chart:
    repoURL: https://kubevela.github.io/charts
    chart: vela-core
    targetRevision: "1.10.8"
  addons:
    fluxcd:
      enabled: true
      onlyHelmComponents: true
```

The chart renders an Argo CD `Application` for KubeVela. The Krate controller discovers KubeVela CRDs through Kubernetes API discovery and exposes definition resources, OAM Applications, ApplicationRevisions, standalone Policy/Workflow resources, and cluster-scoped ResourceTrackers through the same `/api/controller` model used by repositories, issues, PRs, and pipelines.

## Forge Experience

Krate UI wraps KubeVela as an application delivery surface:

1. A repository page can propose an OAM Application from the repo, branch, image, Helm chart, or service template.
2. Pull requests can attach a preview OAM Application and show the KubeVela workflow status beside checks and reviews.
3. The Applications page lists OAM Applications, components, traits, policies, and workflow steps without requiring users to learn raw CRDs first.
4. YAML remains available for escape hatches: every generated OAM resource shows the Kubernetes object and `kubectl apply` equivalent.
5. Promotion and rollback are modeled as forge actions but delegated to KubeVela Application workflow/status reconciliation.

## Boundaries

- Krate owns forge UX, repository-to-application intent, GitOps handoff, PR annotations, and Kubernetes-native API projection.
- KubeVela owns OAM Application reconciliation, component/trait/policy/workflow definitions, and runtime status.
- Argo CD owns installing KubeVela and reconciling Krate chart manifests.
- Gitea owns Git hosting, SSH keys, repo permissions, issues, and pull requests.
