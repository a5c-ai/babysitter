---
name: pii-redaction
description: PII detection and redaction utilities for privacy-compliant conversational AI
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
graph:
  domains: [domain:software-engineering]
  specializations: [specialization:ai-agents-conversational]
  skillAreas: [skill-area:data-protection-dlp, skill-area:natural-language-processing]
  roles: [role:ml-engineer, role:backend-engineer]
  workflows: [workflow:feature-development, workflow:ml-model-lifecycle]

---

# PII Redaction Skill

## Capabilities

- Detect personally identifiable information
- Implement redaction strategies
- Configure detection for various PII types
- Design reversible anonymization
- Implement compliance logging
- Create audit trails for PII handling

## Target Processes

- content-moderation-safety
- system-prompt-guardrails

## Implementation Details

### PII Types

1. **Names**: Person names, usernames
2. **Contact**: Email, phone, address
3. **Financial**: Credit cards, bank accounts
4. **Government IDs**: SSN, passport, driver's license
5. **Medical**: Health information
6. **Custom**: Organization-specific PII

### Redaction Methods

- Masking ([REDACTED])
- Pseudonymization (fake values)
- Tokenization (reversible)
- Encryption

### Configuration Options

- PII types to detect
- Detection sensitivity
- Redaction method
- Language support
- Custom patterns

### Best Practices

- Comprehensive PII coverage
- Regular pattern updates
- Audit logging
- Compliance alignment
- Testing with diverse data

### Dependencies

- presidio-analyzer
- presidio-anonymizer
- spacy
