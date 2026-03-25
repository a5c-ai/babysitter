---
name: gdpr-compliance-automator
description: GDPR compliance assessment and automation for data mapping, consent management, DSAR handling, and privacy impact assessments
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - WebFetch
---

# GDPR Compliance Automator Skill

## Purpose

Automate General Data Protection Regulation (GDPR) compliance activities including data mapping, consent management, Data Subject Access Request (DSAR) handling, privacy impact assessments, and breach notification procedures.

## Capabilities

### Data Mapping and Inventory
- Discover and catalog personal data across systems
- Map data flows between systems and third parties
- Identify data controllers and processors
- Document lawful basis for processing
- Track data retention periods
- Generate Records of Processing Activities (RoPA)

### Consent Management
- Track consent collection and withdrawal
- Manage granular consent preferences
- Document consent mechanisms
- Monitor consent validity and expiration
- Generate consent audit trails

### Data Subject Access Requests (DSAR)
- Intake and track DSAR requests
- Automate data discovery for subjects
- Generate subject access reports
- Manage request timelines (30-day deadline)
- Handle erasure requests (Right to be Forgotten)
- Process data portability requests

### Privacy Impact Assessments (PIA/DPIA)
- Generate DPIA templates for high-risk processing
- Assess necessity and proportionality
- Identify and mitigate privacy risks
- Document supervisory authority consultation
- Track DPIA approvals and reviews

### Breach Notification
- Document data breach incidents
- Assess breach severity and notification requirements
- Generate supervisory authority notifications (72-hour)
- Prepare data subject notifications
- Track breach response and remediation

### Cross-Border Transfer Compliance
- Document international data transfers
- Track transfer mechanisms (SCCs, BCRs, adequacy)
- Assess transfer impact assessments
- Monitor regulatory changes

## GDPR Articles Coverage

- **Article 5**: Principles of processing
- **Article 6**: Lawful basis for processing
- **Article 7**: Conditions for consent
- **Article 12-22**: Data subject rights
- **Article 25**: Data protection by design
- **Article 30**: Records of processing activities
- **Article 32**: Security of processing
- **Article 33-34**: Breach notification
- **Article 35**: Data protection impact assessment
- **Article 44-49**: International transfers

## Integrations

- **OneTrust**: Privacy management platform
- **TrustArc**: Privacy compliance automation
- **BigID**: Data discovery and privacy
- **Collibra**: Data governance platform
- **Custom GDPR tools**: Organization-specific solutions

## Target Processes

- GDPR Compliance Assessment
- Privacy Impact Assessments
- Data Subject Request Handling
- Breach Response Process
- Privacy by Design Implementation

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "assessmentType": {
      "type": "string",
      "enum": ["full", "gap", "dpia", "dsar", "breach"],
      "description": "Type of GDPR assessment"
    },
    "scope": {
      "type": "object",
      "properties": {
        "systems": { "type": "array", "items": { "type": "string" } },
        "dataCategories": { "type": "array", "items": { "type": "string" } },
        "processingActivities": { "type": "array", "items": { "type": "string" } }
      }
    },
    "dsarRequest": {
      "type": "object",
      "properties": {
        "requestType": { "type": "string", "enum": ["access", "erasure", "rectification", "portability", "restriction", "objection"] },
        "subjectIdentifier": { "type": "string" },
        "requestDate": { "type": "string", "format": "date" }
      }
    },
    "breachDetails": {
      "type": "object",
      "properties": {
        "discoveryDate": { "type": "string", "format": "date-time" },
        "description": { "type": "string" },
        "affectedSubjects": { "type": "integer" },
        "dataCategories": { "type": "array" }
      }
    },
    "existingRopa": {
      "type": "string",
      "description": "Path to existing Records of Processing Activities"
    }
  },
  "required": ["assessmentType"]
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
    "assessmentDate": {
      "type": "string",
      "format": "date-time"
    },
    "dataInventory": {
      "type": "object",
      "properties": {
        "personalDataCategories": { "type": "array" },
        "specialCategories": { "type": "array" },
        "processingActivities": { "type": "array" },
        "thirdParties": { "type": "array" }
      }
    },
    "complianceStatus": {
      "type": "object",
      "properties": {
        "articlesAssessed": { "type": "integer" },
        "compliant": { "type": "integer" },
        "partiallyCompliant": { "type": "integer" },
        "nonCompliant": { "type": "integer" }
      }
    },
    "gapAnalysis": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "article": { "type": "string" },
          "requirement": { "type": "string" },
          "currentState": { "type": "string" },
          "gap": { "type": "string" },
          "remediation": { "type": "string" },
          "priority": { "type": "string" }
        }
      }
    },
    "dsarResponse": {
      "type": "object"
    },
    "breachAssessment": {
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
  name: 'gdpr-compliance-automator',
  context: {
    assessmentType: 'full',
    scope: {
      systems: ['CRM', 'Marketing Platform', 'HR System'],
      dataCategories: ['customer', 'employee', 'prospect']
    }
  }
}
```
