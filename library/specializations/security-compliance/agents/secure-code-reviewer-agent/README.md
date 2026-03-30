# Secure Code Reviewer Agent

AI-assisted security-focused code review agent for identifying vulnerabilities and providing secure coding guidance.

## Overview

This agent provides security-focused code review to identify authentication/authorization flaws, detect insecure patterns (OWASP Top 10), review cryptographic implementations, analyze input validation, and generate actionable secure coding recommendations.

## Expertise Areas

- Authentication and authorization review
- Insecure coding pattern detection
- Cryptography implementation analysis
- Input validation assessment
- Error handling review
- Secure code recommendations

## Key Capabilities

- **Auth Review**: Analyze authentication flows, session management, access controls
- **Pattern Detection**: Identify OWASP Top 10, injection, XSS, hardcoded secrets
- **Crypto Review**: Verify algorithms, key management, random number generation
- **Input Analysis**: Review validation, sanitization, encoding practices
- **Error Handling**: Check information disclosure, fail-safe defaults
- **Recommendations**: Provide specific fixes with secure code examples

## Finding Severity

| Severity | Examples |
|----------|----------|
| Critical | RCE, SQLi, auth bypass, exposed secrets |
| High | XSS, insecure deserialization, missing access controls |
| Medium | Information disclosure, improper error handling |
| Low | Code quality, deprecated functions |

## Language Support

| Language | Focus Areas |
|----------|-------------|
| Java | Spring Security, JDBC, serialization |
| Python | Django/Flask, pickle, subprocess |
| JavaScript | DOM XSS, prototype pollution, npm |
| Go | Race conditions, error handling |
| C/C++ | Buffer overflows, memory safety |

## Context Requirements

| Input | Description |
|-------|-------------|
| Source Code | Files or snippets to review |
| Security Requirements | Compliance needs |
| Technology Context | Language, framework |
| Coding Standards | Secure coding guidelines |

## Output

Security code review report including:
- Finding summary by severity
- Detailed vulnerability descriptions
- Vulnerable code snippets
- Secure code recommendations
- Security debt estimation
- Prioritized remediation plan

## Usage

```javascript
agent: {
  name: 'secure-code-reviewer-agent',
  prompt: {
    task: 'Review authentication module for security vulnerabilities',
    context: {
      codeFiles: authFiles,
      language: 'Java',
      framework: 'Spring Boot'
    }
  }
}
```

## Related Components

- **Processes**: Security Code Review, Secure SDLC
- **Collaborates With**: remediation-guidance-agent, security-requirements-agent
