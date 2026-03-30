---
name: multi-cloud-security-posture
description: Unified cloud security posture management across AWS, Azure, and GCP with normalized metrics and CIS benchmark comparison
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - WebFetch
---

# Multi-Cloud Security Posture Skill

## Purpose

Unified cloud security posture management (CSPM) across AWS, Azure, and GCP to aggregate findings, normalize security metrics, compare against CIS benchmarks, and provide a consolidated view of multi-cloud security.

## Capabilities

### Cross-Cloud Finding Aggregation
- Collect findings from AWS, Azure, and GCP
- Aggregate results from cloud-native security tools
- Import findings from third-party CSPM tools
- Deduplicate findings across environments
- Correlate related issues across clouds

### Metric Normalization
- Standardize severity ratings across clouds
- Normalize finding categories
- Create unified compliance metrics
- Calculate aggregate risk scores
- Generate comparable security ratings

### CIS Benchmark Comparison
- Apply CIS benchmarks across all clouds
- Compare security posture against benchmarks
- Track benchmark compliance over time
- Identify benchmark drift
- Generate benchmark compliance reports

### Remediation Status Tracking
- Track remediation across all clouds
- Monitor fix verification status
- Calculate mean time to remediate (MTTR)
- Generate remediation progress reports
- Prioritize cross-cloud remediation efforts

### Unified Reporting
- Generate executive dashboards
- Create technical detail reports
- Produce compliance comparison matrices
- Build trend analysis reports
- Export data for external tools

### Drift Detection and Alerting
- Monitor configuration drift
- Alert on security posture degradation
- Detect new non-compliant resources
- Track policy violations
- Send real-time notifications

## Normalized Categories

| Category | AWS | Azure | GCP |
|----------|-----|-------|-----|
| Identity | IAM | Azure AD | Cloud IAM |
| Compute | EC2, Lambda | VMs, Functions | Compute, Functions |
| Storage | S3, EBS | Storage Accounts | Cloud Storage |
| Network | VPC, SGs | VNet, NSGs | VPC, Firewall |
| Database | RDS, DynamoDB | SQL, Cosmos | Cloud SQL, Spanner |
| Encryption | KMS | Key Vault | Cloud KMS |
| Logging | CloudTrail | Activity Log | Audit Logs |

## Compliance Frameworks

- CIS Benchmarks (AWS, Azure, GCP)
- SOC 2 Type II
- PCI DSS v4.0
- HIPAA Security Rule
- ISO 27001
- NIST 800-53
- FedRAMP

## Integrations

- **Cloud Provider APIs**: AWS, Azure, GCP native tools
- **Wiz**: Cloud security platform
- **Orca Security**: Agentless cloud security
- **Prisma Cloud**: Multi-cloud CSPM
- **Lacework**: Cloud security and compliance
- **Cloud Custodian**: Cloud governance as code

## Target Processes

- Cloud Security Architecture Review
- Continuous Compliance Monitoring
- Multi-Cloud Governance
- Security Posture Reporting

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "cloudProviders": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["AWS", "Azure", "GCP"]
      },
      "description": "Cloud providers to include"
    },
    "awsAccounts": {
      "type": "array",
      "items": { "type": "string" }
    },
    "azureSubscriptions": {
      "type": "array",
      "items": { "type": "string" }
    },
    "gcpProjects": {
      "type": "array",
      "items": { "type": "string" }
    },
    "complianceFrameworks": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["CIS", "SOC2", "PCI-DSS", "HIPAA", "ISO27001", "NIST", "FedRAMP"]
      }
    },
    "reportingPeriod": {
      "type": "object",
      "properties": {
        "startDate": { "type": "string", "format": "date" },
        "endDate": { "type": "string", "format": "date" }
      }
    },
    "severityThreshold": {
      "type": "string",
      "enum": ["critical", "high", "medium", "low"]
    },
    "includeRemediationStatus": {
      "type": "boolean"
    }
  },
  "required": ["cloudProviders"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "reportId": {
      "type": "string"
    },
    "reportTimestamp": {
      "type": "string",
      "format": "date-time"
    },
    "cloudsCovered": {
      "type": "array"
    },
    "overallPosture": {
      "type": "object",
      "properties": {
        "aggregateScore": { "type": "number" },
        "riskLevel": { "type": "string" },
        "trend": { "type": "string", "enum": ["improving", "stable", "degrading"] }
      }
    },
    "postureByCloud": {
      "type": "object",
      "properties": {
        "AWS": {
          "type": "object",
          "properties": {
            "score": { "type": "number" },
            "findings": { "type": "integer" },
            "criticalFindings": { "type": "integer" }
          }
        },
        "Azure": { "type": "object" },
        "GCP": { "type": "object" }
      }
    },
    "findingsByCategory": {
      "type": "object",
      "properties": {
        "identity": { "type": "integer" },
        "compute": { "type": "integer" },
        "storage": { "type": "integer" },
        "network": { "type": "integer" },
        "encryption": { "type": "integer" },
        "logging": { "type": "integer" }
      }
    },
    "complianceStatus": {
      "type": "object"
    },
    "topFindings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "cloud": { "type": "string" },
          "category": { "type": "string" },
          "severity": { "type": "string" },
          "count": { "type": "integer" },
          "description": { "type": "string" }
        }
      }
    },
    "remediationProgress": {
      "type": "object",
      "properties": {
        "totalFindings": { "type": "integer" },
        "remediated": { "type": "integer" },
        "inProgress": { "type": "integer" },
        "pending": { "type": "integer" },
        "mttr": { "type": "string" }
      }
    },
    "recommendations": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```

## Usage Example

```javascript
skill: {
  name: 'multi-cloud-security-posture',
  context: {
    cloudProviders: ['AWS', 'Azure', 'GCP'],
    awsAccounts: ['123456789012'],
    azureSubscriptions: ['sub-id-1'],
    gcpProjects: ['my-project'],
    complianceFrameworks: ['CIS', 'SOC2'],
    includeRemediationStatus: true
  }
}
```
