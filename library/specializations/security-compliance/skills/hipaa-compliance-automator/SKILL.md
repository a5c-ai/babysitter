---
name: hipaa-compliance-automator
description: HIPAA security and privacy compliance automation for ePHI protection, safeguards assessment, and audit preparation
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - WebFetch
---

# HIPAA Compliance Automator Skill

## Purpose

Automate Health Insurance Portability and Accountability Act (HIPAA) compliance activities including ePHI inventory, safeguards assessment, risk analysis, Business Associate Agreement management, and breach notification procedures.

## Capabilities

### ePHI Inventory and Tracking
- Discover and catalog electronic Protected Health Information
- Map ePHI data flows between systems
- Identify ePHI storage locations
- Track ePHI access and usage
- Document minimum necessary standards

### Administrative Safeguards Assessment
- Security management process evaluation
- Workforce security procedures review
- Information access management assessment
- Security awareness training tracking
- Security incident procedures review
- Contingency plan evaluation
- Business associate oversight

### Technical Safeguards Validation
- Access control verification
- Audit controls assessment
- Integrity controls validation
- Transmission security review
- Encryption verification (at rest and in transit)
- Authentication mechanisms review

### Physical Safeguards Assessment
- Facility access controls review
- Workstation use and security
- Device and media controls
- Physical security documentation

### Business Associate Management
- BAA inventory and tracking
- BAA compliance monitoring
- Subcontractor BAA tracking
- BAA renewal management
- Risk assessment for BAs

### Breach Notification Procedures
- Breach assessment and documentation
- Risk assessment for notification determination
- HHS notification tracking (60-day rule)
- Individual notification management
- Media notification for large breaches (500+)

### Risk Analysis
- Comprehensive risk assessment
- Threat and vulnerability identification
- Risk level determination
- Safeguard recommendations
- Risk treatment tracking

## HIPAA Rules Coverage

### Privacy Rule
- Use and disclosure limitations
- Minimum necessary standard
- Patient rights
- Notice of Privacy Practices
- Authorization requirements

### Security Rule
- Administrative safeguards (164.308)
- Physical safeguards (164.310)
- Technical safeguards (164.312)
- Policies and procedures (164.316)

### Breach Notification Rule
- Discovery and notification timelines
- Risk assessment methodology
- Notification content requirements
- Documentation requirements

## Integrations

- **Compliancy Group**: HIPAA compliance platform
- **HIPAA One**: Compliance management
- **Accountable HQ**: HIPAA compliance software
- **Custom audit tools**: Organization-specific solutions
- **EHR Systems**: Electronic health records integration

## Target Processes

- HIPAA Security and Privacy Compliance
- Security Risk Analysis
- Business Associate Compliance
- Breach Response Process
- Compliance Audit Preparation

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "assessmentType": {
      "type": "string",
      "enum": ["full", "security", "privacy", "risk", "breach", "baa"],
      "description": "Type of HIPAA assessment"
    },
    "entityType": {
      "type": "string",
      "enum": ["covered_entity", "business_associate", "hybrid"],
      "description": "HIPAA entity classification"
    },
    "scope": {
      "type": "object",
      "properties": {
        "systems": { "type": "array", "items": { "type": "string" } },
        "facilities": { "type": "array", "items": { "type": "string" } },
        "businessAssociates": { "type": "array", "items": { "type": "string" } }
      }
    },
    "breachDetails": {
      "type": "object",
      "properties": {
        "discoveryDate": { "type": "string", "format": "date" },
        "description": { "type": "string" },
        "affectedIndividuals": { "type": "integer" },
        "phiCategories": { "type": "array" }
      }
    },
    "existingDocumentation": {
      "type": "string",
      "description": "Path to existing HIPAA documentation"
    }
  },
  "required": ["assessmentType", "entityType"]
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
    "assessmentType": {
      "type": "string"
    },
    "entityType": {
      "type": "string"
    },
    "assessmentDate": {
      "type": "string",
      "format": "date-time"
    },
    "ephiInventory": {
      "type": "object",
      "properties": {
        "systems": { "type": "array" },
        "dataFlows": { "type": "array" },
        "storageLocations": { "type": "array" }
      }
    },
    "safeguardsAssessment": {
      "type": "object",
      "properties": {
        "administrative": {
          "type": "object",
          "properties": {
            "implemented": { "type": "integer" },
            "partiallyImplemented": { "type": "integer" },
            "notImplemented": { "type": "integer" }
          }
        },
        "technical": { "type": "object" },
        "physical": { "type": "object" }
      }
    },
    "riskAnalysis": {
      "type": "object",
      "properties": {
        "threats": { "type": "array" },
        "vulnerabilities": { "type": "array" },
        "riskLevel": { "type": "string" }
      }
    },
    "gapAnalysis": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "standard": { "type": "string" },
          "requirement": { "type": "string" },
          "currentState": { "type": "string" },
          "gap": { "type": "string" },
          "remediation": { "type": "string" },
          "priority": { "type": "string" }
        }
      }
    },
    "breachAssessment": {
      "type": "object"
    },
    "complianceScore": {
      "type": "number"
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
  name: 'hipaa-compliance-automator',
  context: {
    assessmentType: 'full',
    entityType: 'covered_entity',
    scope: {
      systems: ['EHR', 'Patient Portal', 'Billing System'],
      facilities: ['Main Hospital', 'Outpatient Clinic']
    }
  }
}
```
