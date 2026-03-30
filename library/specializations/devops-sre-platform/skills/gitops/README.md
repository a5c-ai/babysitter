# GitOps Skill

GitOps tooling expertise for Argo CD and Flux-based continuous delivery.

## ID
SK-010

## Category
Deployment

## Quick Reference

| Aspect | Details |
|--------|---------|
| Slug | `gitops` |
| Primary Use | GitOps-based continuous delivery setup and management |
| Dependencies | argocd/flux CLI, kubectl, Git access |
| Process Integration | cicd-pipeline-setup.js, kubernetes-setup.js, idp-setup.js |

## Key Capabilities

- **Argo CD**: Application, ApplicationSet, AppProject
- **Flux**: GitRepository, Kustomization, HelmRelease
- **Sync Strategies**: Auto/manual sync, health checks, pruning
- **Drift Detection**: Reconciliation, self-healing
- **Secret Management**: SOPS, Sealed Secrets, External Secrets

## When to Use

Use this skill when you need to:
- Set up GitOps-based continuous delivery
- Configure Argo CD or Flux
- Implement drift detection and reconciliation
- Manage secrets in GitOps workflows
- Design multi-cluster GitOps architectures

## Related

- **Skills**: cicd-pipelines (SK-004), helm-charts (SK-005), kubernetes-ops (SK-001)
- **Agents**: cicd-specialist (AG-005), platform-engineer (AG-008)
