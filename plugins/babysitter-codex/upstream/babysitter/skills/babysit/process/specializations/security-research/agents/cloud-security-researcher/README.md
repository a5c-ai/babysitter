# Cloud Security Researcher Agent

## Overview

The `cloud-security-researcher` agent embodies the expertise of a Senior Cloud Security Researcher with deep knowledge of AWS, Azure, and GCP security. It provides expert guidance on cloud security assessments, IAM analysis, attack path identification, and remediation recommendations.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior Cloud Security Researcher |
| **Experience** | 6+ years in cloud security |
| **Background** | Cloud pentesting, bug bounty, enterprise security |
| **Certifications** | AWS Security Specialty, Azure Security Engineer, GCP Security |
| **Philosophy** | "Verify, don't trust" |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **AWS Security** | IAM, S3, EC2, Lambda, privilege escalation |
| **Azure Security** | Azure AD, RBAC, storage, networking |
| **GCP Security** | IAM, service accounts, GCE, GKE |
| **Container Security** | Kubernetes, EKS, AKS, GKE |
| **Serverless** | Lambda, Functions, Cloud Functions |
| **Compliance** | CIS benchmarks, SOC 2, PCI-DSS |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(cloudResearcherTask, {
  agentName: 'cloud-security-researcher',
  prompt: {
    role: 'Senior Cloud Security Researcher',
    task: 'Assess AWS account for security misconfigurations',
    context: {
      accountId: '123456789012',
      scope: ['iam', 's3', 'ec2', 'lambda'],
      prowlerResults: await loadProwlerResults(),
      complianceFramework: 'cis_2.0'
    },
    instructions: [
      'Analyze IAM policies for privilege escalation paths',
      'Review S3 bucket configurations',
      'Identify exposed resources',
      'Map potential attack chains',
      'Provide prioritized remediation'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# AWS security assessment
/agent cloud-security-researcher assess-aws \
  --account-id 123456789012 \
  --services iam,s3,ec2,lambda \
  --compliance cis_2.0

# Multi-cloud review
/agent cloud-security-researcher multi-cloud-review \
  --providers aws,azure,gcp \
  --focus-area identity

# Attack path analysis
/agent cloud-security-researcher attack-paths \
  --account-id 123456789012 \
  --starting-point compromised-developer

# IAM privilege escalation analysis
/agent cloud-security-researcher privesc-analysis \
  --provider aws \
  --role-arn arn:aws:iam::123456789012:role/DevRole
```

## Common Tasks

### 1. Cloud Security Assessment

```bash
/agent cloud-security-researcher comprehensive-assessment \
  --provider aws \
  --account-id 123456789012 \
  --scope full \
  --compliance cis_2.0,aws_well_architected \
  --output-format json
```

Output includes:
- Misconfiguration findings by severity
- IAM privilege escalation paths
- Network exposure analysis
- Compliance status
- Prioritized remediation

### 2. IAM Policy Review

```bash
/agent cloud-security-researcher iam-review \
  --provider aws \
  --account-id 123456789012 \
  --check-privesc \
  --check-overpermissive \
  --check-trust-relationships
```

Analyzes:
- Overly permissive policies
- Privilege escalation vectors
- Cross-account trust
- Service role configurations

### 3. Attack Path Mapping

```bash
/agent cloud-security-researcher map-attack-paths \
  --provider aws \
  --initial-access compromised-credentials \
  --target admin-access \
  --include-lateral-movement
```

Provides:
- Step-by-step attack chains
- Required permissions per step
- Detection opportunities
- Mitigation recommendations

### 4. Container Security Review

```bash
/agent cloud-security-researcher container-review \
  --platform eks \
  --cluster my-cluster \
  --check-rbac \
  --check-pod-security \
  --check-network-policies
```

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `cloud-security-research.js` | Full assessment lifecycle |
| `container-security-research.js` | K8s security review |
| `bug-bounty-workflow.js` | Cloud target analysis |
| `red-team-operations.js` | Cloud attack simulation |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const cloudSecurityAssessmentTask = defineTask({
  name: 'cloud-security-assessment',
  description: 'Comprehensive cloud security assessment',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `Cloud Security Assessment - ${inputs.provider}`,
      agent: {
        name: 'cloud-security-researcher',
        prompt: {
          role: 'Senior Cloud Security Researcher',
          task: 'Perform comprehensive cloud security assessment',
          context: {
            provider: inputs.provider,
            accountId: inputs.accountId,
            scope: inputs.services,
            scanResults: inputs.prowlerResults,
            complianceFramework: inputs.compliance
          },
          instructions: [
            'Review IAM configurations for privilege escalation',
            'Analyze storage security (S3/Blob/GCS)',
            'Assess network exposure and segmentation',
            'Identify data exposure risks',
            'Map potential attack paths',
            'Provide risk-prioritized remediation steps'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['findings', 'attackPaths', 'recommendations'],
          properties: {
            findings: { type: 'array' },
            attackPaths: { type: 'array' },
            recommendations: { type: 'object' }
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

## Cloud Security Framework

### Assessment Methodology

| Phase | Activities |
|-------|------------|
| **Reconnaissance** | Account enumeration, service discovery |
| **Configuration Review** | IAM, networking, storage, logging |
| **Vulnerability Assessment** | Misconfigurations, exposed resources |
| **Attack Path Analysis** | Privilege escalation, lateral movement |
| **Reporting** | Risk prioritization, remediation guidance |

### Compliance Frameworks

| Framework | Coverage |
|-----------|----------|
| CIS Benchmarks | AWS, Azure, GCP, Kubernetes |
| AWS Well-Architected | Security pillar |
| Azure Security Benchmark | Full coverage |
| GCP Security Foundations | Best practices |
| SOC 2 | Security controls |
| PCI-DSS | Cloud requirements |

## Knowledge Base

### Common Cloud Misconfigurations

| Category | Examples |
|----------|----------|
| **Identity** | Overpermissive policies, no MFA, root usage |
| **Storage** | Public buckets, unencrypted data |
| **Network** | Open security groups, public IPs |
| **Logging** | Disabled CloudTrail, missing logs |
| **Encryption** | Unencrypted volumes, weak KMS |

### Privilege Escalation Techniques

- IAM policy attachment
- Role assumption chains
- Lambda function role abuse
- EC2 instance profile exploitation
- Service-linked role manipulation

## Interaction Guidelines

### What to Expect

- **Comprehensive analysis** covering all cloud services
- **Risk-based prioritization** of findings
- **Practical remediation** with specific steps
- **Compliance mapping** to relevant frameworks

### Best Practices

1. Provide access to assessment tool results (Prowler, ScoutSuite)
2. Specify compliance frameworks of interest
3. Include scope limitations and testing windows
4. Share previous assessment findings for trending

## Related Resources

- [cloud-security-testing skill](../skills/cloud-security-testing/) - Assessment tools
- [container-security skill](../skills/container-security/) - K8s security
- [iam-analyzer skill](../skills/iam-analyzer/) - Deep IAM analysis

## References

- [AWS Security Best Practices](https://docs.aws.amazon.com/security/)
- [Azure Security Documentation](https://docs.microsoft.com/azure/security/)
- [GCP Security Foundations](https://cloud.google.com/architecture/security-foundations)
- [CIS Benchmarks](https://www.cisecurity.org/benchmark)
- [MITRE ATT&CK Cloud Matrix](https://attack.mitre.org/matrices/enterprise/cloud/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-013
**Category:** Cloud Security
**Status:** Active
