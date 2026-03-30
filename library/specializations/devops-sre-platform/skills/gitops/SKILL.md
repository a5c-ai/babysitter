---
name: gitops
description: GitOps tooling expertise for Argo CD and Flux-based continuous delivery
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# GitOps Skill

## Overview

Specialized skill for GitOps-based continuous delivery using Argo CD and Flux. Provides deep expertise in declarative, Git-driven infrastructure and application deployment.

## Capabilities

### Argo CD Configuration
- Create and manage Application resources
- Configure ApplicationSet for multi-cluster/multi-tenant
- Set up AppProject for access control
- Implement sync policies and strategies
- Configure resource hooks and waves

### Flux Configuration
- Set up GitRepository and HelmRepository sources
- Create Kustomization and HelmRelease resources
- Configure ImageUpdateAutomation
- Implement multi-tenancy with namespaces
- Set up Flux notifications

### Sync Strategies
- Configure automatic vs manual sync
- Implement sync windows and freezes
- Set up health checks and degraded detection
- Handle sync failures and retries
- Design progressive delivery patterns

### Drift Detection
- Configure drift detection and reconciliation
- Set up resource diffing and comparison
- Implement self-healing policies
- Handle out-of-band changes
- Configure pruning strategies

### Secret Management
- Integrate SOPS for encrypted secrets
- Configure Sealed Secrets
- Set up External Secrets Operator
- Implement Vault integration
- Handle secret rotation in GitOps

### Multi-Cluster Setup
- Configure multi-cluster deployments
- Implement cluster generators
- Set up cross-cluster sync
- Handle cluster credentials securely
- Design hub-spoke architectures

## Target Processes

- `cicd-pipeline-setup.js` - GitOps-based deployment pipelines
- `kubernetes-setup.js` - Declarative cluster management
- `idp-setup.js` - Platform self-service deployment

## Usage Context

This skill is invoked when processes require:
- Setting up GitOps-based continuous delivery
- Configuring Argo CD or Flux
- Implementing drift detection and reconciliation
- Managing secrets in GitOps workflows
- Multi-cluster GitOps architectures

## Dependencies

- argocd CLI (for Argo CD)
- flux CLI (for Flux)
- kubectl for verification
- Git repository access
- SOPS/Sealed Secrets for secret management

## Output Formats

- Argo CD Application/ApplicationSet manifests
- Flux GitRepository/Kustomization/HelmRelease manifests
- Sync policy configurations
- Multi-cluster setup guides
- Secret management configurations
