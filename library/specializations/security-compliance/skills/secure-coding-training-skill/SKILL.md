---
name: secure-coding-training-skill
description: Developer security training and assessment for secure coding practices and vulnerability prevention
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - WebFetch
---

# Secure Coding Training Skill

## Purpose

Deliver and manage developer security training programs to improve secure coding practices, assess developer security knowledge, and track training effectiveness in reducing vulnerabilities.

## Capabilities

### Training Module Delivery
- Deliver language-specific secure coding modules
- Provide framework-specific security training
- Offer vulnerability-focused lessons (OWASP Top 10)
- Present hands-on coding challenges
- Assign interactive security labs
- Schedule training pathways by role

### Knowledge Assessment
- Generate skill assessment quizzes
- Create coding-based security challenges
- Measure comprehension through practical tests
- Track knowledge retention over time
- Compare against industry benchmarks
- Certify competency levels

### Gap Identification
- Analyze assessment results for knowledge gaps
- Correlate with actual vulnerability findings
- Identify team-level weaknesses
- Map gaps to training modules
- Prioritize training needs
- Track improvement over time

### Training Path Recommendations
- Recommend personalized learning paths
- Suggest role-appropriate modules
- Prioritize based on project needs
- Adapt to technology stack
- Consider compliance requirements
- Update based on threat landscape

### Certification Management
- Issue training completion certificates
- Track certification expiration
- Manage recertification requirements
- Generate compliance reports
- Maintain training transcripts
- Support audit requests

### Effectiveness Measurement
- Correlate training with vulnerability reduction
- Track secure code review metrics
- Measure time to remediation improvement
- Compare pre/post training assessments
- Generate ROI reports
- Monitor long-term behavior change

## Training Modules

### By Language
- Java security best practices
- Python secure coding
- JavaScript/Node.js security
- C/C++ memory safety
- Go security patterns
- .NET security guidelines

### By Vulnerability Type
- Injection prevention (SQL, XSS, LDAP)
- Authentication/authorization security
- Cryptographic best practices
- Input validation techniques
- Output encoding strategies
- Secure session management

### By Framework
- Spring Security
- Django security
- Express.js security
- ASP.NET Core security
- React security patterns
- Angular security best practices

## Integrations

- **Secure Code Warrior**: Interactive secure coding training
- **HackEDU**: Hands-on security training
- **OWASP WebGoat**: Deliberately insecure application
- **Kontra**: Application security training
- **Immersive Labs**: Cyber skills development
- **Security Journey**: Secure development training

## Target Processes

- Security Awareness Training Program
- Secure SDLC Implementation
- Developer Onboarding
- Compliance Training Requirements

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "trainingType": {
      "type": "string",
      "enum": ["assessment", "module-delivery", "certification", "gap-analysis", "path-recommendation"],
      "description": "Type of training activity"
    },
    "targetAudience": {
      "type": "object",
      "properties": {
        "developers": { "type": "array", "items": { "type": "string" } },
        "teams": { "type": "array", "items": { "type": "string" } },
        "roles": { "type": "array", "items": { "type": "string" } }
      }
    },
    "technologies": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Programming languages and frameworks"
    },
    "vulnerabilityFocus": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["injection", "broken-auth", "xss", "insecure-deserialization", "ssrf", "access-control", "crypto", "logging"]
      }
    },
    "complianceRequirements": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["PCI-DSS", "HIPAA", "SOC2", "GDPR", "FedRAMP"]
      }
    },
    "assessmentDifficulty": {
      "type": "string",
      "enum": ["beginner", "intermediate", "advanced", "expert"]
    }
  },
  "required": ["trainingType"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "activityId": {
      "type": "string"
    },
    "trainingType": {
      "type": "string"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "participantSummary": {
      "type": "object",
      "properties": {
        "totalParticipants": { "type": "integer" },
        "completedTraining": { "type": "integer" },
        "inProgress": { "type": "integer" },
        "notStarted": { "type": "integer" }
      }
    },
    "assessmentResults": {
      "type": "object",
      "properties": {
        "averageScore": { "type": "number" },
        "passingRate": { "type": "number" },
        "topPerformers": { "type": "array" },
        "needsImprovement": { "type": "array" }
      }
    },
    "knowledgeGaps": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "topic": { "type": "string" },
          "gapSeverity": { "type": "string" },
          "affectedDevelopers": { "type": "integer" },
          "recommendedModules": { "type": "array" }
        }
      }
    },
    "trainingPaths": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "developerId": { "type": "string" },
          "recommendedModules": { "type": "array" },
          "estimatedDuration": { "type": "string" },
          "priority": { "type": "string" }
        }
      }
    },
    "certifications": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "developerId": { "type": "string" },
          "certificationName": { "type": "string" },
          "issueDate": { "type": "string" },
          "expirationDate": { "type": "string" }
        }
      }
    },
    "effectivenessMetrics": {
      "type": "object",
      "properties": {
        "vulnerabilityReduction": { "type": "number" },
        "avgRemediationTimeImprovement": { "type": "string" },
        "secureCodeReviewPassRate": { "type": "number" }
      }
    }
  }
}
```

## Usage Example

```javascript
skill: {
  name: 'secure-coding-training-skill',
  context: {
    trainingType: 'assessment',
    targetAudience: {
      teams: ['backend-team', 'frontend-team']
    },
    technologies: ['Java', 'JavaScript', 'Python'],
    vulnerabilityFocus: ['injection', 'xss', 'broken-auth'],
    assessmentDifficulty: 'intermediate'
  }
}
```
