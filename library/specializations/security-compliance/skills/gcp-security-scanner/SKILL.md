---
name: gcp-security-scanner
description: GCP security configuration scanning and hardening using Security Command Center, Forseti, and ScoutSuite
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - WebFetch
---

# GCP Security Scanner Skill

## Purpose

Automated Google Cloud Platform security configuration scanning and hardening to identify misconfigurations, compliance violations, and security risks across GCP projects and organizations.

## Capabilities

### Security Command Center Integration
- Leverage GCP Security Command Center findings
- Review vulnerability and threat findings
- Check Security Health Analytics results
- Monitor Event Threat Detection alerts
- Track Container Threat Detection findings
- Generate compliance reports

### IAM Security Analysis
- Analyze IAM policies for over-permissive access
- Check service account key usage and rotation
- Identify excessive permissions
- Review organization policy constraints
- Detect cross-project access
- Audit IAM recommender suggestions

### VPC Firewall Analysis
- Review firewall rules for overly permissive access
- Check for open management ports
- Validate VPC Service Controls
- Review Shared VPC configurations
- Check Private Google Access settings
- Analyze VPC flow logs configuration

### Cloud Storage Security
- Identify publicly accessible buckets
- Check bucket IAM policies
- Validate uniform bucket-level access
- Review bucket encryption settings
- Check access logging configuration
- Verify retention policies

### Cloud KMS Configuration
- Review key ring and key configurations
- Check key rotation policies
- Validate IAM policies on keys
- Review HSM key protection levels
- Check external key manager usage
- Audit key access patterns

### Audit Logging Verification
- Validate Cloud Audit Logs configuration
- Check data access logging
- Review admin activity logging
- Verify log export configuration
- Check Cloud Logging retention
- Validate alert policies

### Organization Policy Assessment
- Review organization policy constraints
- Check service restriction policies
- Validate resource location constraints
- Review VM external IP restrictions
- Check service account creation policies

## GCP Services Covered

| Category | Services |
|----------|----------|
| Identity | IAM, Cloud Identity, Workforce Identity |
| Compute | Compute Engine, GKE, Cloud Run, Functions |
| Storage | Cloud Storage, Persistent Disks |
| Database | Cloud SQL, Spanner, BigQuery, Firestore |
| Network | VPC, Firewall, Cloud Armor, Cloud CDN |
| Security | Security Command Center, Cloud KMS, BeyondCorp |
| Monitoring | Cloud Logging, Cloud Monitoring, Cloud Audit Logs |

## Integrations

- **Security Command Center**: GCP native CSPM
- **Forseti Security**: Open-source GCP security toolkit
- **ScoutSuite**: Multi-cloud security auditing
- **Cloud Asset Inventory**: Resource visibility
- **IAM Recommender**: Permission optimization

## Target Processes

- Cloud Security Architecture Review
- Compliance Monitoring
- GCP Project Hardening
- Security Posture Assessment

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "scanType": {
      "type": "string",
      "enum": ["full", "cis", "pci", "hipaa", "iso27001", "custom"],
      "description": "Type of security scan"
    },
    "projects": {
      "type": "array",
      "items": { "type": "string" },
      "description": "GCP project IDs to scan"
    },
    "organization": {
      "type": "string",
      "description": "GCP organization ID for org-wide scanning"
    },
    "services": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Specific services to scan"
    },
    "severityThreshold": {
      "type": "string",
      "enum": ["critical", "high", "medium", "low"]
    },
    "complianceFrameworks": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["CIS", "PCI-DSS", "HIPAA", "ISO27001", "SOC2", "NIST"]
      }
    },
    "includeSCC": {
      "type": "boolean",
      "description": "Include Security Command Center findings"
    }
  },
  "required": ["scanType"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "scanId": {
      "type": "string"
    },
    "scanTimestamp": {
      "type": "string",
      "format": "date-time"
    },
    "projectsScanned": {
      "type": "array"
    },
    "organizationId": {
      "type": "string"
    },
    "summary": {
      "type": "object",
      "properties": {
        "totalChecks": { "type": "integer" },
        "passed": { "type": "integer" },
        "failed": { "type": "integer" },
        "warnings": { "type": "integer" }
      }
    },
    "findingsBySeverity": {
      "type": "object",
      "properties": {
        "critical": { "type": "integer" },
        "high": { "type": "integer" },
        "medium": { "type": "integer" },
        "low": { "type": "integer" }
      }
    },
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "checkId": { "type": "string" },
          "severity": { "type": "string" },
          "service": { "type": "string" },
          "project": { "type": "string" },
          "resourceName": { "type": "string" },
          "description": { "type": "string" },
          "remediation": { "type": "string" },
          "complianceMapping": { "type": "array" }
        }
      }
    },
    "sccFindings": {
      "type": "array"
    },
    "organizationPolicyStatus": {
      "type": "object"
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
  name: 'gcp-security-scanner',
  context: {
    scanType: 'cis',
    projects: ['my-project-id'],
    complianceFrameworks: ['CIS', 'SOC2'],
    includeSCC: true,
    severityThreshold: 'medium'
  }
}
```
