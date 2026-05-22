# OAM and KubeVela Ontology Assimilation

Krate assimilates the Open Application Model as the application-delivery layer of the forge ontology. The OAM model gives Krate a vocabulary for app-centric delivery without replacing Kubernetes or Gitea.

## Concepts

| OAM concept | Krate ontology role | Kubernetes resource surface |
| --- | --- | --- |
| Application | Deployable application attached to a repository, branch, PR, or release | `applications.core.oam.dev` |
| Component | Reusable workload or service module | `componentdefinitions.core.oam.dev` plus Application components |
| Workload type | Runtime implementation selected by a component definition | `workloaddefinitions.core.oam.dev` when installed by KubeVela |
| Trait | Operational behavior attached to a component | `traitdefinitions.core.oam.dev` plus Application traits |
| Policy | Delivery rule such as topology, override, health, or security | `policydefinitions.core.oam.dev` plus Application policies |
| Workflow step | Ordered delivery action such as deploy, suspend, approve, promote, rollback | `workflowstepdefinitions.core.oam.dev`, `workflows.core.oam.dev`, plus Application workflow |
| Application revision | Concrete release/revision materialized by KubeVela | `applicationrevisions.core.oam.dev` |
| Resource tracker | Applied-resource ownership graph maintained by KubeVela | cluster-scoped `resourcetrackers.core.oam.dev` |
| Scope | Logical grouping boundary | `scopedefinitions.core.oam.dev` when installed plus Application component `scopes` maps |

## Assimilation Rules

- OAM `Application` is not a Git repository; it is a delivery object that references build/deploy intent derived from a repository.
- OAM components, workloads, traits, scopes, policies, and workflow steps are capability catalog entries, not hard-coded Krate forms.
- Krate UI must present simple forge tasks first: deploy from repo, preview PR, promote release, inspect rollout, rollback.
- Raw OAM YAML remains visible so operators can copy, review, and apply exact Kubernetes resources.
- KubeVela status, ApplicationRevisions, Workflows, Policies, and ResourceTrackers are authoritative for OAM delivery health; Krate may summarize but must not synthesize success.

## Validation Expectations

- Chart render includes an Argo CD Application for KubeVela when enabled.
- `/api/controller` exposes discovered KubeVela definition, application, revision, policy, workflow, and resource-tracker counts when KubeVela CRDs are installed.
- UI has an Applications surface that names OAM Applications, Components, Workloads, Traits, Scopes, Policies, Workflow Steps, and KubeVela installation status.
- Repository pages show how a repo/PR maps to an OAM Application and preview workflow.
