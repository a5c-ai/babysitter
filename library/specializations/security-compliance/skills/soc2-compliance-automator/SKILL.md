---
name: soc2-compliance-automator
description: SOC 2 Trust Services Criteria compliance automation for evidence collection, control mapping, and audit preparation
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - WebFetch
---

# SOC 2 Compliance Automator Skill

## Purpose

Automate SOC 2 Trust Services Criteria (TSC) compliance activities including control mapping, evidence collection, audit preparation, and continuous compliance monitoring.

## Capabilities

### Control Mapping
- Map organizational controls to SOC 2 TSC requirements
- Cover all five Trust Services Categories:
  - Security (Common Criteria)
  - Availability
  - Processing Integrity
  - Confidentiality
  - Privacy
- Generate control matrices with evidence requirements
- Identify control gaps and coverage

### Evidence Collection
- Automate evidence gathering from cloud providers
- Collect access control configurations (IAM, RBAC)
- Capture security configurations and policies
- Document change management processes
- Archive audit logs and monitoring data
- Screenshot automation for manual controls

### Audit Preparation
- Generate Type I and Type II audit packages
- Prepare management assertion documents
- Create system description documents
- Organize evidence by control objective
- Generate auditor-ready reports

### Control Effectiveness Tracking
- Monitor control implementation status
- Track control testing results
- Document control exceptions
- Manage remediation activities
- Calculate compliance scores

### Continuous Compliance
- Monitor control drift and changes
- Alert on compliance deviations
- Track evidence freshness
- Generate compliance dashboards
- Automate periodic control testing

## Trust Services Categories

### CC - Common Criteria (Security)
- CC1: Control Environment
- CC2: Communication and Information
- CC3: Risk Assessment
- CC4: Monitoring Activities
- CC5: Control Activities
- CC6: Logical and Physical Access Controls
- CC7: System Operations
- CC8: Change Management
- CC9: Risk Mitigation

### A - Availability
- System availability commitments
- Disaster recovery and business continuity
- Capacity planning and monitoring

### PI - Processing Integrity
- Data processing accuracy
- Completeness and timeliness
- Error handling procedures

### C - Confidentiality
- Data classification
- Encryption requirements
- Access restrictions

### P - Privacy
- Privacy notice and consent
- Data subject rights
- Data retention and disposal

## Integrations

- **Vanta**: Automated security and compliance
- **Drata**: Continuous compliance automation
- **Secureframe**: Security compliance platform
- **AWS/Azure/GCP APIs**: Cloud configuration evidence
- **Identity Providers**: Access control evidence
- **SIEM Systems**: Log and monitoring evidence

## Target Processes

- SOC 2 Compliance Audit Preparation
- Continuous Compliance Monitoring
- Security Control Assessment
- Audit Readiness Review

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "auditType": {
      "type": "string",
      "enum": ["Type1", "Type2"],
      "description": "SOC 2 audit type"
    },
    "trustCategories": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["Security", "Availability", "ProcessingIntegrity", "Confidentiality", "Privacy"]
      }
    },
    "auditPeriod": {
      "type": "object",
      "properties": {
        "startDate": { "type": "string", "format": "date" },
        "endDate": { "type": "string", "format": "date" }
      }
    },
    "cloudProviders": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["AWS", "Azure", "GCP"]
      }
    },
    "controlMatrix": {
      "type": "string",
      "description": "Path to existing control matrix"
    },
    "evidenceBasePath": {
      "type": "string",
      "description": "Base path for evidence storage"
    }
  },
  "required": ["auditType", "trustCategories"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "assessmentId": {
      "type": "string"
    },
    "auditType": {
      "type": "string"
    },
    "assessmentDate": {
      "type": "string",
      "format": "date-time"
    },
    "trustCategories": {
      "type": "array"
    },
    "controlSummary": {
      "type": "object",
      "properties": {
        "totalControls": { "type": "integer" },
        "implemented": { "type": "integer" },
        "partiallyImplemented": { "type": "integer" },
        "notImplemented": { "type": "integer" },
        "notApplicable": { "type": "integer" }
      }
    },
    "evidenceStatus": {
      "type": "object",
      "properties": {
        "collected": { "type": "integer" },
        "pending": { "type": "integer" },
        "missing": { "type": "integer" }
      }
    },
    "gapAnalysis": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "controlId": { "type": "string" },
          "gap": { "type": "string" },
          "remediation": { "type": "string" },
          "priority": { "type": "string" }
        }
      }
    },
    "auditPackage": {
      "type": "object",
      "properties": {
        "controlMatrix": { "type": "string" },
        "evidenceFolder": { "type": "string" },
        "systemDescription": { "type": "string" },
        "managementAssertion": { "type": "string" }
      }
    },
    "complianceScore": {
      "type": "number"
    }
  }
}
```

## Usage Example

```javascript
skill: {
  name: 'soc2-compliance-automator',
  context: {
    auditType: 'Type2',
    trustCategories: ['Security', 'Availability', 'Confidentiality'],
    auditPeriod: {
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    },
    cloudProviders: ['AWS', 'Azure']
  }
}
```
