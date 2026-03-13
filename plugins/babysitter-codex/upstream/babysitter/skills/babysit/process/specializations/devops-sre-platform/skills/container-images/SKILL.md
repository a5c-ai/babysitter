---
name: container-images
description: Docker and OCI container image expertise for building, optimizing, and securing container images
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Container Images Skill

## Overview

Specialized skill for Docker and OCI container image development, optimization, and security. Provides expert capabilities for building production-ready container images.

## Capabilities

### Dockerfile Development
- Analyze and optimize existing Dockerfiles
- Create multi-stage build configurations
- Implement build argument patterns
- Design base image hierarchies
- Handle platform-specific builds (multi-arch)

### Image Optimization
- Minimize image layer count and size
- Optimize layer caching strategies
- Implement .dockerignore patterns
- Remove unnecessary dependencies
- Use distroless/minimal base images

### Security Scanning
- Interpret vulnerability scan results (Trivy, Snyk, Grype)
- Prioritize CVE remediation
- Recommend secure base images
- Implement image signing (Cosign, Notary)
- Configure admission policies

### Registry Operations
- Push, pull, and tag images
- Configure registry authentication
- Implement image retention policies
- Handle multi-registry strategies
- Manage image manifests and indexes

### Build Integration
- Integrate with CI/CD pipelines
- Configure build caching (BuildKit)
- Implement remote builders
- Handle secrets during builds
- Set up automated builds

## Target Processes

- `container-image-management.js` - Container image lifecycle
- `security-scanning.js` - Image vulnerability scanning
- `cicd-pipeline-setup.js` - Build pipeline configuration

## Usage Context

This skill is invoked when processes require:
- Creating optimized Dockerfiles
- Reducing container image sizes
- Addressing security vulnerabilities in images
- Setting up container build pipelines
- Managing container registries

## Dependencies

- Docker CLI or compatible (Podman, nerdctl)
- Container registry access
- Vulnerability scanners (Trivy, Snyk)
- BuildKit for advanced builds

## Output Formats

- Dockerfile configurations
- Build optimization reports
- Vulnerability analysis reports
- Registry operation logs
- Multi-stage build templates
