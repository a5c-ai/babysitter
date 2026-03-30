---
name: compliance-evidence-collector
description: Automated evidence collection across compliance frameworks from cloud providers, identity systems, and security tools
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - WebFetch
---

# Compliance Evidence Collector Skill

## Purpose

Automate compliance evidence collection across multiple frameworks by gathering configuration snapshots, access control evidence, logs, policies, and documentation from cloud providers, identity systems, and security tools.

## Capabilities

### Cloud Configuration Evidence
- Capture AWS, Azure, GCP configuration snapshots
- Document IAM policies and role configurations
- Export security group and network ACL settings
- Collect encryption settings and key management evidence
- Screenshot cloud console configurations
- Archive CloudTrail, Activity Logs, Audit Logs

### Access Control Evidence
- Export user and group listings
- Document role-based access control configurations
- Capture privileged access reviews
- Collect authentication policy evidence
- Document MFA enrollment status
- Archive access provisioning/deprovisioning records

### Log Collection and Verification
- Collect security event logs
- Verify log retention compliance
- Document log integrity mechanisms
- Export SIEM correlation rules
- Capture alerting configurations
- Archive incident response logs

### Policy Document Management
- Version control policy documents
- Track policy review and approval dates
- Document policy acknowledgments
- Archive superseded policies
- Generate policy compliance matrices

### Screenshot Automation
- Automate evidence screenshots for manual controls
- Capture UI-based configuration evidence
- Document workflow approvals
- Screenshot training completion records

### Evidence Chain of Custody
- Maintain evidence metadata and timestamps
- Track evidence collection dates
- Document evidence sources
- Generate evidence inventories
- Create audit-ready packages

## Evidence Categories

### Technical Evidence
- System configurations
- Security tool outputs
- Vulnerability scan results
- Penetration test reports
- Code analysis results

### Administrative Evidence
- Policies and procedures
- Training records
- Risk assessments
- Incident reports
- Change management records

### Physical Evidence
- Facility access logs
- Visitor records
- Asset inventories
- Environmental controls documentation

## Framework Mapping

| Framework | Evidence Types |
|-----------|---------------|
| SOC 2 | Technical, Administrative, Screenshots |
| GDPR | Data processing, Consent, Privacy |
| HIPAA | ePHI, Safeguards, BAAs |
| PCI DSS | CDE, Network, ASV scans |
| ISO 27001 | ISMS, Controls, Risk |
| NIST | Security controls, Risk management |
| FedRAMP | Cloud security, Continuous monitoring |

## Integrations

- **AWS**: Config, CloudTrail, IAM, Security Hub
- **Azure**: Policy, Activity Log, Azure AD, Defender
- **GCP**: Cloud Asset Inventory, Audit Logs, IAM
- **Identity Providers**: Okta, Azure AD, Google Workspace
- **SIEM Systems**: Splunk, Elastic, Sentinel, Chronicle
- **Security Tools**: Various vulnerability scanners, EDR

## Target Processes

- All compliance audit processes
- Continuous compliance monitoring
- Audit preparation
- Control validation

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "frameworks": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["SOC2", "GDPR", "HIPAA", "PCI-DSS", "ISO27001", "NIST", "FedRAMP"]
      },
      "description": "Target compliance frameworks"
    },
    "evidenceTypes": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["cloud-config", "access-control", "logs", "policies", "screenshots", "network", "encryption"]
      }
    },
    "cloudProviders": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["AWS", "Azure", "GCP"]
      }
    },
    "dateRange": {
      "type": "object",
      "properties": {
        "startDate": { "type": "string", "format": "date" },
        "endDate": { "type": "string", "format": "date" }
      }
    },
    "controlIds": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Specific control IDs to collect evidence for"
    },
    "outputPath": {
      "type": "string",
      "description": "Base path for evidence storage"
    }
  },
  "required": ["frameworks", "evidenceTypes"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "collectionId": {
      "type": "string"
    },
    "collectionDate": {
      "type": "string",
      "format": "date-time"
    },
    "frameworks": {
      "type": "array"
    },
    "evidenceSummary": {
      "type": "object",
      "properties": {
        "totalItems": { "type": "integer" },
        "collected": { "type": "integer" },
        "failed": { "type": "integer" },
        "pending": { "type": "integer" }
      }
    },
    "evidenceInventory": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "evidenceId": { "type": "string" },
          "controlId": { "type": "string" },
          "type": { "type": "string" },
          "source": { "type": "string" },
          "collectionTimestamp": { "type": "string" },
          "filePath": { "type": "string" },
          "hash": { "type": "string" },
          "status": { "type": "string" }
        }
      }
    },
    "chainOfCustody": {
      "type": "object",
      "properties": {
        "collector": { "type": "string" },
        "collectionMethod": { "type": "string" },
        "integrityVerification": { "type": "string" }
      }
    },
    "gaps": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "controlId": { "type": "string" },
          "missingEvidence": { "type": "string" },
          "reason": { "type": "string" }
        }
      }
    },
    "auditPackage": {
      "type": "object",
      "properties": {
        "basePath": { "type": "string" },
        "indexFile": { "type": "string" },
        "totalSize": { "type": "string" }
      }
    }
  }
}
```

## Usage Example

```javascript
skill: {
  name: 'compliance-evidence-collector',
  context: {
    frameworks: ['SOC2', 'ISO27001'],
    evidenceTypes: ['cloud-config', 'access-control', 'logs'],
    cloudProviders: ['AWS', 'Azure'],
    dateRange: {
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    }
  }
}
```
