---
name: phishing-simulation-skill
description: Phishing simulation campaign execution and analysis for security awareness assessment
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - WebFetch
---

# Phishing Simulation Skill

## Purpose

Execute and analyze phishing simulation campaigns to assess organizational security awareness, identify high-risk users, and measure the effectiveness of security training programs.

## Capabilities

### Campaign Template Generation
- Create realistic phishing email templates
- Design landing pages for credential harvesting simulations
- Generate attachment-based simulation scenarios
- Create spear-phishing templates using OSINT
- Develop pretexting scenarios
- Build multi-stage attack simulations

### Campaign Execution
- Schedule and launch simulation campaigns
- Manage target user groups
- Configure sending parameters (timing, throttling)
- Handle bounce and delivery tracking
- Implement safe landing pages
- Manage campaign duration and scope

### User Response Tracking
- Track email open rates
- Monitor link click rates
- Record credential submission attempts
- Track attachment opens
- Measure response times
- Identify repeat offenders

### Awareness Reporting
- Generate campaign summary reports
- Create department-level breakdowns
- Produce trend analysis over time
- Compare against industry benchmarks
- Generate executive dashboards
- Export data for further analysis

### Risk User Identification
- Identify users who clicked links
- Flag users who submitted credentials
- Track repeat high-risk behavior
- Score user security awareness
- Prioritize users for additional training

### Training Recommendations
- Recommend targeted training modules
- Suggest remedial training assignments
- Track training completion rates
- Correlate training with behavior improvement
- Generate training effectiveness reports

## Simulation Types

| Type | Description | Risk Level |
|------|-------------|------------|
| Mass Phishing | Broad awareness testing | Low |
| Spear Phishing | Targeted attacks | Medium |
| Whaling | Executive targeting | High |
| Vishing | Voice phishing | Medium |
| Smishing | SMS phishing | Medium |
| BEC | Business email compromise | High |

## Template Categories

- Password reset notifications
- IT support messages
- Package delivery notifications
- Invoice/payment requests
- HR communications
- Executive requests
- Cloud service notifications
- Social media alerts

## Integrations

- **KnowBe4**: Security awareness training platform
- **Proofpoint**: Security awareness and phishing simulation
- **GoPhish**: Open-source phishing framework
- **Cofense**: Phishing defense solutions
- **Microsoft Defender**: Attack simulation training

## Target Processes

- Security Awareness Training Program
- Human Risk Assessment
- Social Engineering Testing
- Compliance Training Verification

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "campaignType": {
      "type": "string",
      "enum": ["mass", "spear", "whaling", "department", "new-hire"],
      "description": "Type of phishing simulation"
    },
    "templateCategory": {
      "type": "string",
      "enum": ["password-reset", "it-support", "delivery", "invoice", "hr", "executive", "cloud-service"],
      "description": "Phishing template category"
    },
    "targetGroups": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Target user groups or departments"
    },
    "schedule": {
      "type": "object",
      "properties": {
        "startDate": { "type": "string", "format": "date-time" },
        "endDate": { "type": "string", "format": "date-time" },
        "sendingWindow": { "type": "string" }
      }
    },
    "difficulty": {
      "type": "string",
      "enum": ["easy", "medium", "hard", "expert"],
      "description": "Simulation difficulty level"
    },
    "landingPageAction": {
      "type": "string",
      "enum": ["awareness", "training-redirect", "credential-capture"],
      "description": "Action when user clicks link"
    },
    "customTemplate": {
      "type": "string",
      "description": "Path to custom template file"
    }
  },
  "required": ["campaignType", "targetGroups"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "campaignId": {
      "type": "string"
    },
    "campaignType": {
      "type": "string"
    },
    "executionPeriod": {
      "type": "object",
      "properties": {
        "startDate": { "type": "string" },
        "endDate": { "type": "string" }
      }
    },
    "targetSummary": {
      "type": "object",
      "properties": {
        "totalTargets": { "type": "integer" },
        "emailsSent": { "type": "integer" },
        "emailsDelivered": { "type": "integer" },
        "bounced": { "type": "integer" }
      }
    },
    "results": {
      "type": "object",
      "properties": {
        "emailsOpened": { "type": "integer" },
        "openRate": { "type": "number" },
        "linksClicked": { "type": "integer" },
        "clickRate": { "type": "number" },
        "credentialsSubmitted": { "type": "integer" },
        "submissionRate": { "type": "number" },
        "attachmentsOpened": { "type": "integer" },
        "reportedPhishing": { "type": "integer" },
        "reportRate": { "type": "number" }
      }
    },
    "departmentBreakdown": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "department": { "type": "string" },
          "clickRate": { "type": "number" },
          "riskScore": { "type": "number" }
        }
      }
    },
    "highRiskUsers": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "userId": { "type": "string" },
          "actions": { "type": "array" },
          "repeatOffender": { "type": "boolean" }
        }
      }
    },
    "trainingRecommendations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "userGroup": { "type": "string" },
          "recommendedModules": { "type": "array" },
          "priority": { "type": "string" }
        }
      }
    },
    "benchmarkComparison": {
      "type": "object",
      "properties": {
        "industryAvgClickRate": { "type": "number" },
        "organizationClickRate": { "type": "number" },
        "performanceRating": { "type": "string" }
      }
    }
  }
}
```

## Usage Example

```javascript
skill: {
  name: 'phishing-simulation-skill',
  context: {
    campaignType: 'mass',
    templateCategory: 'password-reset',
    targetGroups: ['all-employees'],
    difficulty: 'medium',
    landingPageAction: 'awareness'
  }
}
```
