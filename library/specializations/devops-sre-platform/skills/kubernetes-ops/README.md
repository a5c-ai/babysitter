# Kubernetes Operations Skill

## Overview

The `kubernetes-ops` skill provides deep integration with Kubernetes clusters for deployments, debugging, and operations. It enables AI-powered cluster management through kubectl commands, manifest generation, and intelligent troubleshooting.

## Quick Start

### Prerequisites

1. **kubectl CLI** - Install from [kubernetes.io](https://kubernetes.io/docs/tasks/tools/)
2. **Cluster Access** - Valid kubeconfig with appropriate permissions
3. **Optional MCP Server** - Enhanced capabilities with mcp-server-kubernetes

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

To add MCP server integration:

```bash
# Option 1: Via Claude MCP
claude mcp add kubernetes -- npx mcp-server-kubernetes

# Option 2: Direct installation
npm install -g mcp-server-kubernetes
```

## Usage

### Basic Operations

```bash
# Invoke the skill for cluster inspection
/skill kubernetes-ops inspect --namespace production

# Generate manifests
/skill kubernetes-ops generate-deployment --name myapp --image myapp:v1.0

# Debug pod issues
/skill kubernetes-ops debug-pod --pod myapp-xyz --namespace production
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(kubernetesOpsTask, {
  operation: 'apply',
  manifest: 'deployment.yaml',
  namespace: 'staging',
  dryRun: true
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **kubectl Execution** | Run and interpret kubectl commands |
| **Log Analysis** | Analyze pod logs for errors and patterns |
| **Manifest Generation** | Create K8s YAML following best practices |
| **Debugging** | Diagnose pod failures, crashloops, networking |
| **Resource Analysis** | Inspect quotas, limits, HPA metrics |
| **Validation** | Validate manifests before application |

## Examples

### Example 1: Diagnose Crashlooping Pod

```bash
# The skill will:
# 1. Get pod status and events
# 2. Check previous container logs
# 3. Analyze exit codes
# 4. Review resource constraints
# 5. Provide remediation steps

/skill kubernetes-ops diagnose-crashloop \
  --pod myapp-abc123 \
  --namespace production
```

### Example 2: Generate Deployment Manifest

```bash
# Generate a production-ready deployment
/skill kubernetes-ops generate-deployment \
  --name api-server \
  --image api:v2.0.0 \
  --replicas 3 \
  --cpu-request 100m \
  --memory-request 256Mi \
  --cpu-limit 500m \
  --memory-limit 512Mi \
  --port 8080 \
  --health-path /healthz
```

### Example 3: Validate Manifests

```bash
# Validate before applying
/skill kubernetes-ops validate \
  --file deployment.yaml \
  --namespace staging
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KUBECONFIG` | Path to kubeconfig file | `~/.kube/config` |
| `KUBECTL_CONTEXT` | Default context to use | Current context |
| `K8S_DEFAULT_NAMESPACE` | Default namespace | `default` |

### Skill Configuration

```yaml
# .babysitter/skills/kubernetes-ops.yaml
kubernetes-ops:
  defaultNamespace: production
  dryRunByDefault: true
  verboseLogging: false
  mcpServer:
    enabled: true
    provider: flux159
```

## Process Integration

### Processes Using This Skill

1. **kubernetes-setup.js** - Initial cluster and namespace configuration
2. **service-mesh.js** - Istio/Linkerd sidecar injection and configuration
3. **auto-scaling.js** - HPA and VPA setup and tuning
4. **container-image-management.js** - Deployment image updates

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const deployApplicationTask = defineTask({
  name: 'deploy-application',
  description: 'Deploy application to Kubernetes cluster',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Deploy ${inputs.appName} to ${inputs.namespace}`,
      skill: {
        name: 'kubernetes-ops',
        context: {
          operation: 'deploy',
          manifest: inputs.manifestPath,
          namespace: inputs.namespace,
          waitForReady: true,
          timeout: '5m'
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

### mcp-server-kubernetes (Flux159)

Primary MCP server for Kubernetes operations.

**Features:**
- kubectl operations
- Pod logs streaming
- Resource CRUD operations
- Namespace management

**Installation:**
```bash
claude mcp add kubernetes -- npx mcp-server-kubernetes
```

**GitHub:** https://github.com/Flux159/mcp-server-kubernetes

### kubernetes-mcp-server (containers)

Go-based native implementation.

**Features:**
- Direct Kubernetes API interaction
- No kubectl dependency
- Efficient resource handling

**GitHub:** https://github.com/containers/kubernetes-mcp-server

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `kubectl not found` | Install kubectl and add to PATH |
| `Connection refused` | Check kubeconfig and cluster accessibility |
| `Forbidden` | Verify RBAC permissions for the operation |
| `Context not found` | Run `kubectl config get-contexts` to list available |

### Debug Mode

Enable verbose output for troubleshooting:

```bash
KUBECTL_DEBUG=true /skill kubernetes-ops inspect --namespace kube-system
```

## Related Skills

- **helm-charts** - Helm chart management
- **gitops** - ArgoCD/Flux GitOps workflows
- **service-mesh** - Istio/Linkerd configuration

## References

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl Reference](https://kubernetes.io/docs/reference/kubectl/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [MCP Server - Flux159](https://github.com/Flux159/mcp-server-kubernetes)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-001
**Category:** Container Orchestration
**Status:** Active
