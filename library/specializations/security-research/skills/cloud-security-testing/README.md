# Cloud Security Testing Skill

## Overview

The `cloud-security-testing` skill provides multi-cloud security assessment and authorized penetration testing capabilities across AWS, GCP, and Azure environments. It enables comprehensive security auditing, misconfiguration detection, and compliance verification.

## Quick Start

### Prerequisites

1. **Cloud CLI Tools** - Install AWS CLI, Azure CLI, and/or gcloud
2. **Assessment Tools** - Install Prowler and ScoutSuite
3. **Valid Credentials** - Configure cloud credentials with appropriate permissions
4. **Authorization** - Obtain written authorization for security testing

### Installation

The skill is included in the babysitter-sdk. Install required tools:

```bash
# Install Prowler
pip install prowler

# Install ScoutSuite
pip install scoutsuite

# Install Pacu (for authorized AWS pentesting)
pip install pacu

# Configure cloud credentials
aws configure
az login
gcloud auth login
```

To add MCP server integration:

```bash
# AWS MCP Server
claude mcp add aws -- npx aws-mcp-server

# Or via npm
npm install -g aws-mcp-server
```

## Usage

### Basic Operations

```bash
# Run Prowler assessment on AWS
/skill cloud-security-testing prowler --provider aws --compliance cis_2.0

# ScoutSuite multi-cloud audit
/skill cloud-security-testing scoutsuite --provider aws --report-dir ./reports

# IAM policy analysis
/skill cloud-security-testing analyze-iam --account-id 123456789012

# S3 bucket security check
/skill cloud-security-testing check-s3 --bucket my-bucket
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(cloudSecurityTask, {
  operation: 'prowler-assessment',
  provider: 'aws',
  compliance: 'cis_2.0',
  services: ['s3', 'iam', 'ec2'],
  outputFormat: 'json'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Prowler Assessment** | CIS, PCI-DSS, HIPAA compliance checks |
| **ScoutSuite Audit** | Multi-cloud security auditing |
| **IAM Analysis** | Policy misconfigurations, privilege escalation |
| **S3 Security** | Bucket permissions, public access, encryption |
| **Resource Enumeration** | Attack surface discovery |
| **Pacu Integration** | AWS penetration testing (authorized) |

## Examples

### Example 1: AWS Security Assessment

```bash
# Comprehensive AWS assessment with Prowler
/skill cloud-security-testing prowler \
  --provider aws \
  --compliance cis_2.0,pci_dss \
  --services iam,s3,ec2,rds,lambda \
  --output-format json,html \
  --severity critical,high

# Output: Security findings report with remediation steps
```

### Example 2: IAM Privilege Escalation Check

```bash
# Analyze IAM for privilege escalation paths
/skill cloud-security-testing analyze-iam \
  --check-privesc \
  --include-roles \
  --include-policies

# Output: Privilege escalation paths and overly permissive policies
```

### Example 3: Multi-Cloud Compliance Report

```bash
# ScoutSuite assessment across providers
/skill cloud-security-testing scoutsuite \
  --providers aws,azure,gcp \
  --generate-report \
  --report-format html
```

### Example 4: S3 Bucket Audit

```bash
# Check all S3 buckets for security issues
/skill cloud-security-testing audit-s3 \
  --check-public-access \
  --check-encryption \
  --check-logging \
  --check-versioning
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AWS_PROFILE` | AWS profile to use | `default` |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription | Current subscription |
| `GCP_PROJECT_ID` | GCP project | Current project |
| `PROWLER_OUTPUT_DIR` | Prowler output directory | `./prowler-output` |

### Skill Configuration

```yaml
# .babysitter/skills/cloud-security-testing.yaml
cloud-security-testing:
  defaultProvider: aws
  complianceFrameworks:
    - cis_2.0
    - pci_dss
  severityThreshold: medium
  outputFormats:
    - json
    - html
  mcpServers:
    aws:
      enabled: true
      provider: aws-mcp-server
```

## Process Integration

### Processes Using This Skill

1. **cloud-security-research.js** - Cloud security assessment workflows
2. **container-security-research.js** - Container and Kubernetes security
3. **bug-bounty-workflow.js** - Cloud-focused bug bounty programs
4. **red-team-operations.js** - Cloud attack simulations

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const cloudSecurityAssessmentTask = defineTask({
  name: 'cloud-security-assessment',
  description: 'Run comprehensive cloud security assessment',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Cloud Security Assessment - ${inputs.provider}`,
      skill: {
        name: 'cloud-security-testing',
        context: {
          operation: 'prowler-assessment',
          provider: inputs.provider,
          compliance: inputs.complianceFramework,
          services: inputs.targetServices,
          severity: 'critical,high,medium'
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

### AWS MCP Server (alexei-led)

Primary MCP server for AWS operations.

**Features:**
- AWS CLI command execution
- Resource enumeration
- IAM operations
- S3 management

**Installation:**
```bash
claude mcp add aws -- npx aws-mcp-server
```

**GitHub:** https://github.com/alexei-led/aws-mcp-server

### AWS MCP (RafalWilinski)

Alternative AWS MCP implementation.

**Features:**
- Natural language AWS queries
- Resource management
- Cost analysis

**GitHub:** https://github.com/RafalWilinski/aws-mcp

## Security Considerations

### Authorization Requirements

This skill requires explicit authorization before use:

1. **Written Permission** - Obtain documented approval from account owner
2. **Scope Definition** - Define clear boundaries for testing
3. **Time Constraints** - Agree on testing windows
4. **Data Handling** - Establish rules for any discovered data

### Best Practices

- Always verify you have proper authorization
- Document all testing activities
- Report findings through proper channels
- Follow responsible disclosure practices
- Do not access or exfiltrate sensitive data

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `AccessDenied` | Check IAM permissions for assessment tools |
| `Rate exceeded` | Add delays between API calls |
| `Invalid credentials` | Verify cloud CLI configuration |
| `Region not enabled` | Enable required regions or scope assessment |

### Debug Mode

Enable verbose output for troubleshooting:

```bash
PROWLER_DEBUG=true /skill cloud-security-testing prowler --provider aws
```

## Related Skills

- **container-security** - Kubernetes and Docker security
- **network-security** - Network penetration testing
- **iam-analyzer** - Deep IAM policy analysis

## References

- [Prowler Documentation](https://docs.prowler.com/)
- [ScoutSuite Wiki](https://github.com/nccgroup/ScoutSuite/wiki)
- [AWS Security Best Practices](https://docs.aws.amazon.com/security/)
- [Azure Security Benchmarks](https://docs.microsoft.com/security/benchmark/azure/)
- [GCP Security Foundations](https://cloud.google.com/architecture/security-foundations)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-012
**Category:** Cloud Security
**Status:** Active
