---
name: security-review
description: Security vulnerability assessment identifying OWASP risks, injection vectors, authentication issues, and data exposure with severity classification.
allowed-tools: Read, Bash, Grep, Glob, Agent, AskUserQuestion
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
---

- Before any code merge involving user-facing changes
- As part of the /review-security command
- Mandatory for high-stakes implementations

## Process

1. Identify modified files with security relevance
2. Scan for common vulnerability patterns
3. Assess authentication and authorization changes
4. Check for data exposure risks
5. Evaluate dependency security
6. Classify severity and provide recommendations

## Severity Levels

- **Critical**: Immediate exploitation risk
- **High**: Significant vulnerability requiring fix before merge
- **Medium**: Vulnerability that should be addressed soon
- **Low**: Minor security improvement opportunity

## Key Rules

- Security review failure halts implementation
- All findings must include file paths and line numbers
- Provide actionable remediation steps
- Reference OWASP categories where applicable

## Tool Use

Invoke via babysitter process: `methodologies/rpikit/rpikit-review`
