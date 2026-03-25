# Kubernetes Expert Agent

## Overview

The `kubernetes-expert` agent is a specialized AI agent embodying the expertise of a Senior Kubernetes Platform Engineer. It provides deep knowledge for complex cluster operations, troubleshooting, performance optimization, and security configuration.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior Kubernetes Platform Engineer |
| **Experience** | 7+ years container orchestration |
| **Certifications** | CKA, CKAD, CKS equivalent |
| **Background** | Production K8s at scale, multi-cluster |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Architecture** | Control plane, node components, API resources, CRDs |
| **Troubleshooting** | Pod debugging, node issues, network problems |
| **Performance** | Resource optimization, HPA/VPA, scheduling |
| **Security** | PSS, RBAC, network policies, secrets |
| **Networking** | Services, ingress, DNS, CNI |
| **Storage** | PV/PVC, StatefulSets, storage classes |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(kubernetesExpertTask, {
  agentName: 'kubernetes-expert',
  prompt: {
    role: 'Kubernetes Platform Engineer',
    task: 'Analyze cluster health and recommend improvements',
    context: {
      clusterInfo: await getClusterInfo(),
      issues: reportedIssues
    },
    instructions: [
      'Review cluster configuration',
      'Identify security gaps',
      'Recommend performance optimizations',
      'Provide implementation steps'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Troubleshoot a crashlooping pod
/agent kubernetes-expert troubleshoot \
  --pod myapp-abc123 \
  --namespace production

# Security review
/agent kubernetes-expert security-review \
  --namespace production \
  --scope rbac,pss,network-policies

# Performance optimization
/agent kubernetes-expert optimize \
  --deployment myapp \
  --namespace production
```

## Common Tasks

### 1. Cluster Health Analysis

The agent can analyze overall cluster health:

```bash
/agent kubernetes-expert analyze-cluster \
  --include nodes,pods,services,storage \
  --output-format report
```

Output includes:
- Node status and resource utilization
- Pod health and scheduling issues
- Service connectivity verification
- Storage provisioning status

### 2. Troubleshooting Workflow

Systematic problem resolution:

1. **Gather Information**
   - Pod status, events, logs
   - Node conditions
   - Resource metrics

2. **Identify Root Cause**
   - Pattern recognition
   - Historical comparison
   - Dependency analysis

3. **Recommend Solution**
   - Immediate remediation
   - Long-term fixes
   - Prevention measures

### 3. Security Hardening

```bash
/agent kubernetes-expert harden \
  --namespace production \
  --level restricted \
  --generate-policies
```

Reviews and generates:
- Pod Security Standards compliance
- RBAC configurations
- Network policies
- Secret management

### 4. Performance Tuning

```bash
/agent kubernetes-expert tune-performance \
  --deployment api-server \
  --namespace production \
  --target-metrics latency,throughput
```

Provides:
- Resource right-sizing recommendations
- HPA/VPA configurations
- Scheduling optimizations
- Cache and connection tuning

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `kubernetes-setup.js` | Cluster configuration, namespace setup |
| `service-mesh.js` | Sidecar injection, mTLS configuration |
| `auto-scaling.js` | HPA design, scaling policies |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const clusterAnalysisTask = defineTask({
  name: 'cluster-analysis',
  description: 'Analyze Kubernetes cluster health',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: 'Kubernetes Cluster Health Analysis',
      agent: {
        name: 'kubernetes-expert',
        prompt: {
          role: 'Senior Kubernetes Platform Engineer',
          task: 'Perform comprehensive cluster health analysis',
          context: {
            cluster: inputs.clusterName,
            namespaces: inputs.namespaces,
            focusAreas: inputs.focusAreas || ['health', 'security', 'performance']
          },
          instructions: [
            'Check node status and resource utilization',
            'Identify pods with issues (crashloops, pending, etc.)',
            'Review security configurations',
            'Analyze resource efficiency',
            'Provide prioritized recommendations'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['status', 'findings', 'recommendations'],
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'critical'] },
            findings: { type: 'array', items: { type: 'object' } },
            recommendations: { type: 'array', items: { type: 'object' } }
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

## Knowledge Base

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Pod Lifecycle** | Pending, Running, Succeeded, Failed, Unknown |
| **Deployment Strategies** | RollingUpdate, Recreate, Blue/Green, Canary |
| **Service Discovery** | ClusterIP, DNS, Headless services |
| **Storage Classes** | Provisioners, reclaim policies, volume modes |

### Troubleshooting Decision Tree

```
Pod Issue
├── Not Scheduled (Pending)
│   ├── Resource constraints → Increase node capacity
│   ├── Node selector mismatch → Update selectors
│   └── PVC pending → Check storage class
├── Not Running (CrashLoopBackOff)
│   ├── Exit code 137 → OOMKilled, increase memory
│   ├── Exit code 1 → Application error, check logs
│   └── Liveness probe failed → Adjust probe settings
└── Not Ready
    ├── Readiness probe failed → Check probe endpoint
    └── Init containers pending → Check init container logs
```

## Interaction Guidelines

### What to Expect

- **Detailed analysis** with evidence and reasoning
- **Production-safe recommendations**
- **Step-by-step implementation guidance**
- **Verification procedures**

### Best Practices

1. Always provide cluster context
2. Include relevant error messages
3. Specify environment (dev/staging/prod)
4. Mention any constraints or requirements

## Related Resources

- [kubernetes-ops skill](../skills/kubernetes-ops/) - Operational commands
- [service-mesh skill](../skills/service-mesh/) - Service mesh operations
- [helm-charts skill](../skills/helm-charts/) - Helm chart management

## References

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Kubernetes Patterns](https://k8spatterns.io/)
- [Production Kubernetes](https://tanzu.vmware.com/content/ebooks/production-kubernetes)
- [CKA/CKAD Study Guide](https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-001
**Category:** Container Orchestration
**Status:** Active
