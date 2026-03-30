# CI/CD Pipelines Skill

## Overview

The `cicd-pipelines` skill provides multi-platform CI/CD pipeline expertise. It enables AI-powered pipeline generation, optimization, and troubleshooting for GitHub Actions, GitLab CI, Jenkins, and Azure Pipelines.

## Quick Start

### Prerequisites

1. **Repository Access** - Write access to workflow/pipeline files
2. **Platform CLI** (optional):
   - GitHub: `gh` CLI
   - GitLab: `glab` CLI
   - Azure: `az` CLI

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

For enhanced integration:

```bash
# GitHub CLI
gh auth login

# GitLab CLI
glab auth login

# Azure CLI
az login
```

## Usage

### Basic Operations

```bash
# Generate a GitHub Actions workflow
/skill cicd-pipelines generate --platform github-actions --type nodejs

# Analyze pipeline failure
/skill cicd-pipelines analyze-failure --run-id 12345 --platform github-actions

# Optimize existing pipeline
/skill cicd-pipelines optimize --file .github/workflows/ci.yml
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(cicdTask, {
  operation: 'generate',
  platform: 'github-actions',
  template: 'nodejs-docker',
  features: ['testing', 'docker-build', 'deploy-k8s'],
  outputPath: '.github/workflows/ci.yml'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Pipeline Generation** | Create workflows for multiple platforms |
| **Failure Analysis** | Diagnose and fix pipeline failures |
| **Optimization** | Improve execution time and resource usage |
| **Syntax Validation** | Validate workflow configuration |
| **Matrix Builds** | Configure parallel test execution |
| **Caching** | Set up dependency and build caching |

## Supported Platforms

| Platform | Config File | Features |
|----------|-------------|----------|
| GitHub Actions | `.github/workflows/*.yml` | Matrix, OIDC, reusable workflows |
| GitLab CI | `.gitlab-ci.yml` | DAG, rules, includes |
| Jenkins | `Jenkinsfile` | Declarative, shared libraries |
| Azure Pipelines | `azure-pipelines.yml` | Templates, environments |

## Examples

### Example 1: Node.js Application Pipeline

```bash
# Generate a complete pipeline for a Node.js app
/skill cicd-pipelines generate \
  --platform github-actions \
  --language nodejs \
  --features test,lint,build,docker,deploy \
  --test-framework jest \
  --deploy-target kubernetes
```

Generated workflow includes:
- Dependency caching
- Parallel testing with matrix
- Docker build with layer caching
- Kubernetes deployment
- Slack notifications

### Example 2: Monorepo Pipeline

```bash
# Generate pipeline for monorepo with path filtering
/skill cicd-pipelines generate-monorepo \
  --platform github-actions \
  --packages "apps/api,apps/web,packages/shared" \
  --shared-deps "packages/shared"
```

### Example 3: Pipeline Migration

```bash
# Migrate from Jenkins to GitHub Actions
/skill cicd-pipelines migrate \
  --source Jenkinsfile \
  --target github-actions \
  --output .github/workflows/ci.yml
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GITHUB_TOKEN` | GitHub authentication | - |
| `GITLAB_TOKEN` | GitLab authentication | - |
| `AZURE_DEVOPS_PAT` | Azure DevOps PAT | - |

### Skill Configuration

```yaml
# .babysitter/skills/cicd-pipelines.yaml
cicd-pipelines:
  defaultPlatform: github-actions
  templates:
    nodejs:
      nodeVersions: [18, 20, 22]
      testCommand: "npm test"
      buildCommand: "npm run build"
  optimization:
    enableCaching: true
    parallelization: auto
  security:
    enableDependencyScanning: true
    enableImageScanning: true
```

## Pipeline Templates

### Standard Templates

| Template | Description |
|----------|-------------|
| `nodejs` | Node.js with npm/yarn/pnpm |
| `python` | Python with pip/poetry |
| `java` | Java with Maven/Gradle |
| `go` | Go modules |
| `docker` | Docker build and push |
| `kubernetes` | K8s deployment |

### Template Customization

```javascript
// Custom template in process
const result = await ctx.task(cicdTask, {
  operation: 'generate',
  platform: 'github-actions',
  template: 'custom',
  stages: [
    { name: 'lint', commands: ['npm run lint'] },
    { name: 'test', commands: ['npm test'], parallel: true },
    { name: 'build', commands: ['npm run build'], needs: ['lint', 'test'] },
    { name: 'deploy', commands: ['./deploy.sh'], environment: 'production' }
  ]
});
```

## Process Integration

### Processes Using This Skill

1. **cicd-pipeline-setup.js** - Initial pipeline configuration
2. **pipeline-optimization.js** - Performance improvements
3. **security-scanning.js** - Security tool integration
4. **container-image-management.js** - Image build pipelines

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const setupCICDTask = defineTask({
  name: 'setup-cicd',
  description: 'Set up CI/CD pipeline for repository',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Setup CI/CD for ${inputs.repository}`,
      skill: {
        name: 'cicd-pipelines',
        context: {
          operation: 'setup',
          platform: inputs.platform,
          repository: inputs.repository,
          features: inputs.features,
          environments: inputs.environments,
          notifications: {
            slack: inputs.slackChannel
          }
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## MCP Server Reference

### GitHub MCP Server (Official)

Official GitHub integration for repository and workflow management.

**Features:**
- Repository operations
- PR management
- Workflow run inspection
- Issue tracking

**GitHub:** https://github.com/github/github-mcp-server

### Azure DevOps MCP (Microsoft)

Official Azure DevOps integration.

**Features:**
- Pipeline management
- Build agent status
- Queue management
- Artifact operations

**GitHub:** https://github.com/microsoft/azure-devops-mcp

### claude-code-for-gitlab

GitLab CI/CD integration with Claude Code.

**Features:**
- Native GitLab support
- Self-hosted compatibility
- Pipeline execution

**GitHub:** https://github.com/RealMikeChong/claude-code-for-gitlab

## Optimization Strategies

### Caching

```yaml
# NPM caching
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: npm-${{ hashFiles('package-lock.json') }}

# Docker layer caching
- uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### Parallelization

```yaml
# Matrix strategy
strategy:
  matrix:
    node: [18, 20]
    os: [ubuntu-latest, windows-latest]

# Test sharding
- run: npm test -- --shard=${{ matrix.shard }}/4
```

### Conditional Execution

```yaml
# Path filtering
on:
  push:
    paths:
      - 'src/**'
      - 'package.json'

# Branch filtering
if: github.ref == 'refs/heads/main'
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Permission denied` | Check GITHUB_TOKEN permissions |
| `Cache miss` | Verify cache key includes lock file hash |
| `Timeout` | Increase job timeout or optimize steps |
| `Parallel job conflicts` | Use concurrency groups |

### Debug Mode

```bash
# Enable debug logging
/skill cicd-pipelines analyze-failure \
  --run-id 12345 \
  --debug \
  --include-logs
```

## Related Skills

- **container-images** - Docker build optimization
- **gitops** - GitOps deployment workflows
- **security-scanning** - Security pipeline integration

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
- [Jenkins Pipeline Syntax](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Azure Pipelines Documentation](https://learn.microsoft.com/en-us/azure/devops/pipelines/)
- [GitHub MCP Server](https://github.com/github/github-mcp-server)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-004
**Category:** CI/CD
**Status:** Active
