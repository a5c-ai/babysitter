---
name: vendor-security-questionnaire
description: Automated vendor security assessment through questionnaire generation, response parsing, and risk scoring
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - WebFetch
---

# Vendor Security Questionnaire Skill

## Purpose

Automate vendor security assessment through standardized questionnaire generation, response parsing, security posture scoring, and risk report generation for third-party risk management programs.

## Capabilities

### Questionnaire Generation
- Generate industry-standard security questionnaires
- Create SIG (Standardized Information Gathering) questionnaires
- Build CAIQ (Consensus Assessment Initiative Questionnaire) forms
- Generate custom questionnaires based on risk tier
- Create vendor-type-specific assessments
- Support multiple response formats

### Response Parsing and Analysis
- Parse questionnaire responses from various formats
- Extract key security control information
- Identify missing or incomplete responses
- Flag concerning answers for review
- Compare responses against requirements
- Validate evidence attachments

### Security Posture Scoring
- Calculate vendor security scores
- Weight scores by control importance
- Compare against industry benchmarks
- Track score trends over time
- Generate risk-adjusted ratings
- Identify score improvement areas

### Assessment Status Tracking
- Track assessment workflow status
- Monitor response deadlines
- Send automated reminders
- Escalate overdue assessments
- Maintain assessment history
- Archive completed assessments

### Risk Report Generation
- Generate executive risk summaries
- Create detailed technical reports
- Produce comparison reports
- Build risk heat maps
- Generate board-level dashboards
- Export data for GRC systems

### Vendor Compliance Monitoring
- Track vendor compliance commitments
- Monitor remediation progress
- Verify evidence of compliance
- Alert on compliance drift
- Schedule periodic reassessments
- Maintain compliance documentation

## Questionnaire Standards

| Standard | Use Case | Questions |
|----------|----------|-----------|
| SIG Lite | Low-risk vendors | ~100 |
| SIG Core | Medium-risk vendors | ~300 |
| SIG Full | High-risk vendors | ~800+ |
| CAIQ | Cloud providers | ~300 |
| VSAQ | General vendors | Variable |
| Custom | Specific needs | Variable |

## Assessment Domains

- Information Security Management
- Access Control
- Data Protection
- Network Security
- Application Security
- Physical Security
- Business Continuity
- Incident Response
- Compliance and Legal
- Third-Party Management

## Integrations

- **OneTrust**: Third-party risk management
- **ProcessUnity**: Vendor risk management
- **SecurityScorecard**: Security ratings
- **BitSight**: Security ratings and benchmarks
- **Prevalent**: Third-party risk intelligence
- **Shared Assessments**: SIG questionnaire tools

## Target Processes

- Third-Party Vendor Security Assessment
- Vendor Onboarding Security Review
- Annual Vendor Reassessment
- Vendor Risk Management

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": ["generate", "parse", "score", "report", "track"],
      "description": "Questionnaire operation type"
    },
    "vendorInfo": {
      "type": "object",
      "properties": {
        "vendorName": { "type": "string" },
        "vendorId": { "type": "string" },
        "vendorType": { "type": "string" },
        "riskTier": { "type": "string", "enum": ["critical", "high", "medium", "low"] },
        "dataAccess": { "type": "array", "items": { "type": "string" } }
      }
    },
    "questionnaireType": {
      "type": "string",
      "enum": ["SIG-Lite", "SIG-Core", "SIG-Full", "CAIQ", "VSAQ", "custom"],
      "description": "Questionnaire standard to use"
    },
    "customDomains": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Specific domains to assess"
    },
    "responseFile": {
      "type": "string",
      "description": "Path to questionnaire response file"
    },
    "scoringCriteria": {
      "type": "object",
      "properties": {
        "minimumScore": { "type": "number" },
        "criticalControls": { "type": "array" },
        "weightings": { "type": "object" }
      }
    },
    "deadline": {
      "type": "string",
      "format": "date",
      "description": "Assessment completion deadline"
    }
  },
  "required": ["operation"]
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
    "operation": {
      "type": "string"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "vendorInfo": {
      "type": "object"
    },
    "questionnaire": {
      "type": "object",
      "properties": {
        "type": { "type": "string" },
        "totalQuestions": { "type": "integer" },
        "domains": { "type": "array" },
        "filePath": { "type": "string" }
      }
    },
    "responseAnalysis": {
      "type": "object",
      "properties": {
        "questionsAnswered": { "type": "integer" },
        "questionsSkipped": { "type": "integer" },
        "evidenceProvided": { "type": "integer" },
        "concerningResponses": { "type": "array" },
        "missingInformation": { "type": "array" }
      }
    },
    "securityScore": {
      "type": "object",
      "properties": {
        "overallScore": { "type": "number" },
        "riskRating": { "type": "string", "enum": ["low", "medium", "high", "critical"] },
        "domainScores": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "domain": { "type": "string" },
              "score": { "type": "number" },
              "findings": { "type": "array" }
            }
          }
        },
        "benchmarkComparison": { "type": "object" },
        "scoreHistory": { "type": "array" }
      }
    },
    "riskFindings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "findingId": { "type": "string" },
          "domain": { "type": "string" },
          "severity": { "type": "string" },
          "description": { "type": "string" },
          "recommendation": { "type": "string" }
        }
      }
    },
    "assessmentStatus": {
      "type": "object",
      "properties": {
        "status": { "type": "string" },
        "deadline": { "type": "string" },
        "daysRemaining": { "type": "integer" },
        "remindersent": { "type": "boolean" }
      }
    },
    "recommendations": {
      "type": "array",
      "items": { "type": "string" }
    },
    "reportPath": {
      "type": "string"
    }
  }
}
```

## Usage Example

```javascript
skill: {
  name: 'vendor-security-questionnaire',
  context: {
    operation: 'generate',
    vendorInfo: {
      vendorName: 'Cloud SaaS Provider',
      riskTier: 'high',
      dataAccess: ['PII', 'financial']
    },
    questionnaireType: 'SIG-Core',
    deadline: '2024-03-15'
  }
}
```
