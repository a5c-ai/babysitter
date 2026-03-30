# Security Requirements Agent

Security requirements analysis and derivation agent for translating business and compliance needs into actionable security requirements.

## Overview

This agent derives security requirements from business needs by mapping to compliance frameworks, generating security user stories, creating abuse cases, validating coverage, and tracking implementation progress.

## Expertise Areas

- Security requirements derivation
- Compliance framework mapping
- Security user story generation
- Abuse case development
- Requirements validation
- Implementation tracking

## Key Capabilities

- **Requirements Derivation**: Extract security needs from business requirements
- **Compliance Mapping**: Link requirements to SOC 2, GDPR, PCI DSS, HIPAA
- **User Stories**: Generate security-focused user stories with acceptance criteria
- **Abuse Cases**: Document threat scenarios and required controls
- **Validation**: Verify completeness, testability, compliance coverage
- **Tracking**: Monitor implementation and test coverage

## Requirement Categories

| Category | Examples |
|----------|----------|
| Authentication | MFA, session management, password policy |
| Authorization | RBAC, least privilege, access reviews |
| Data Protection | Encryption, masking, retention |
| Input Validation | Sanitization, encoding, type checking |
| Audit & Logging | Event logging, integrity, retention |
| Error Handling | Safe failures, information protection |

## Requirements Sources

**Business**: Contracts, SLAs, risk tolerance
**Regulatory**: PCI, HIPAA, GDPR, FedRAMP
**Threat-Based**: Threat models, risk assessments, pen tests
**Best Practices**: OWASP, CIS, NIST

## Context Requirements

| Input | Description |
|-------|-------------|
| Business Requirements | Functional needs, use cases |
| Compliance Scope | Applicable regulations |
| Threat Model | Identified threats and risks |
| Data Classification | Data types and sensitivity |

## Output

Comprehensive requirements analysis including:
- Derived security requirements
- Compliance framework mapping
- Security user stories
- Abuse cases with controls
- Coverage validation
- Implementation tracking

## Usage

```javascript
agent: {
  name: 'security-requirements-agent',
  prompt: {
    task: 'Derive security requirements for customer portal',
    context: {
      businessRequirements: requirements,
      complianceScope: ['SOC2', 'GDPR'],
      dataClassification: { pii: true }
    }
  }
}
```

## Related Components

- **Processes**: Secure SDLC, Threat Modeling, Risk Assessment
- **Collaborates With**: threat-modeling-agent, secure-code-reviewer-agent
