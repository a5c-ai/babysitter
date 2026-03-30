---
name: helm-charts
description: Expert Helm chart development and management skill for Kubernetes package management
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Helm Charts Skill

## Overview

Specialized skill for Helm chart development, validation, and lifecycle management. Provides expert capabilities for Kubernetes application packaging using Helm.

## Capabilities

### Chart Development
- Generate Helm charts from existing Kubernetes manifests
- Create chart templates with proper parameterization
- Implement Helm hooks for lifecycle management
- Design reusable library charts

### Chart Validation
- Validate chart structure against Helm best practices
- Lint charts for syntax and semantic errors
- Test template rendering with different value sets
- Verify chart dependencies and requirements

### Template Management
- Debug template rendering issues
- Implement complex Go template logic
- Create helper templates (_helpers.tpl)
- Handle conditional resource generation

### Release Management
- Manage Helm releases (install, upgrade, rollback)
- Track release history and revisions
- Handle release values and secrets
- Implement atomic deployments

### Dependency Management
- Configure chart dependencies
- Manage dependency versions and constraints
- Handle sub-chart overrides
- Implement chart repositories

## Target Processes

- `kubernetes-setup.js` - Kubernetes cluster and workload deployment
- `service-mesh.js` - Service mesh installation via Helm
- `idp-setup.js` - Internal developer platform components

## Usage Context

This skill is invoked when processes require:
- Creating new Helm charts for applications
- Migrating Kubernetes manifests to Helm
- Validating and testing chart configurations
- Managing Helm releases across environments
- Troubleshooting chart template issues

## Dependencies

- Helm CLI (v3.x)
- kubectl for cluster validation
- Chart repository access (if using external charts)

## Output Formats

- Helm chart directories (Chart.yaml, templates/, values.yaml)
- Rendered Kubernetes manifests
- Helm lint/test reports
- Release status information
