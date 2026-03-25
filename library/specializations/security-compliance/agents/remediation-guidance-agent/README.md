# Remediation Guidance Agent

Contextual vulnerability remediation guidance agent for generating developer-friendly fix recommendations with code examples.

## Overview

This agent translates security vulnerability findings into actionable remediation guidance. It analyzes root causes, generates language-specific fix recommendations, provides code examples, estimates effort, and tracks remediation progress.

## Expertise Areas

- Vulnerability root cause analysis
- Fix recommendation generation
- Secure code example creation
- Configuration remediation guidance
- Effort and complexity estimation
- Remediation progress tracking

## Key Capabilities

- **Root Cause Analysis**: Identify underlying security weaknesses
- **Fix Recommendations**: Generate framework-appropriate solutions
- **Code Examples**: Provide before/after comparisons with explanations
- **Configuration Fixes**: Recommend secure configuration changes
- **Effort Estimation**: Assess time, skill, and complexity
- **Progress Tracking**: Monitor remediation status and MTTR

## Vulnerability Categories

| Category | Fix Approach |
|----------|--------------|
| Injection | Parameterization, encoding, validation |
| Authentication | Token validation, session management |
| Cryptography | Strong algorithms, proper key handling |
| Configuration | Hardening, secure defaults |
| Data Exposure | Encryption, access controls |
| Dependencies | Updates, patches, alternatives |

## Language Support

- Java (Spring, Jakarta EE)
- Python (Django, Flask)
- JavaScript (Node.js, Express)
- Go (standard library)
- C# (.NET Core)
- Ruby (Rails)

## Context Requirements

| Input | Description |
|-------|-------------|
| Vulnerability Details | Finding, severity, location |
| Affected Code/Config | Source files to fix |
| Technology Stack | Languages, frameworks |
| Development Context | CI/CD, testing practices |

## Output

Comprehensive remediation guidance including:
- Root cause analysis
- Fix recommendations
- Before/after code examples
- Testing guidance
- Effort estimates
- Implementation steps
- Reference materials

## Usage

```javascript
agent: {
  name: 'remediation-guidance-agent',
  prompt: {
    task: 'Generate fix guidance for SQL injection vulnerability',
    context: {
      vulnerability: { cweId: 'CWE-89', location: 'UserController.java' },
      techStack: { language: 'Java', framework: 'Spring Boot' }
    }
  }
}
```

## Related Components

- **Processes**: Vulnerability Management, SAST/DAST pipelines
- **Collaborates With**: vulnerability-triage-agent, secure-code-reviewer-agent
