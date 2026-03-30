---
name: cicd-pipeline-generator
description: Generate CI/CD pipelines for SDK build and release
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# CI/CD Pipeline Generator Skill

## Overview

This skill generates CI/CD pipelines for SDK build, test, and release workflows across multiple languages and platforms.

## Capabilities

- Generate GitHub Actions workflows
- Generate GitLab CI/CD pipelines
- Configure multi-language build matrices
- Set up release automation
- Implement quality gates and checks
- Configure artifact publishing
- Support monorepo workflows
- Implement security scanning

## Target Processes

- SDK Versioning and Release Management
- SDK Code Generation Pipeline
- SDK Testing Strategy

## Integration Points

- GitHub Actions
- GitLab CI/CD
- CircleCI
- Jenkins
- Azure Pipelines

## Input Requirements

- Languages to build
- Testing requirements
- Release workflow
- Publishing targets
- Quality gate requirements

## Output Artifacts

- CI/CD workflow files
- Build configurations
- Release automation scripts
- Quality gate definitions
- Publishing configurations
- Security scan integration

## Usage Example

```yaml
skill:
  name: cicd-pipeline-generator
  context:
    platform: github-actions
    languages:
      - typescript
      - python
      - go
    stages:
      - lint
      - test
      - build
      - publish
    qualityGates:
      coverage: 80%
      linting: required
      security: required
    release:
      trigger: tags
      semantic: true
    publishing:
      npm: true
      pypi: true
      goModule: true
```

## Best Practices

1. Use matrix builds for efficiency
2. Implement proper quality gates
3. Automate releases with semantic versioning
4. Include security scanning
5. Cache dependencies appropriately
6. Use reusable workflow components
