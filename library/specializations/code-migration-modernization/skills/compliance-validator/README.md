# Compliance Validator Skill

## Overview

The Compliance Validator skill verifies compliance during migration. It checks against frameworks like SOC2, HIPAA, and PCI, generates audit trails, and validates security controls.

## Quick Start

### Prerequisites

- Compliance requirements defined
- Infrastructure access
- Policy definitions

### Basic Usage

1. **Define compliance scope**
   - Select frameworks
   - Map controls
   - Set policies

2. **Run validation**
   ```bash
   # Using InSpec
   inspec exec compliance-profile
   ```

3. **Generate reports**
   - Document findings
   - Track remediation
   - Provide evidence

## Features

### Compliance Frameworks

| Framework | Focus | Controls |
|-----------|-------|----------|
| SOC2 | Security/Availability | ~60 |
| HIPAA | Healthcare data | ~44 |
| PCI DSS | Payment data | ~300 |
| GDPR | Privacy | ~99 |

### Validation Types

- Infrastructure compliance
- Application security
- Data protection
- Access control

## Configuration

```json
{
  "frameworks": ["soc2", "hipaa"],
  "policies": {
    "encryption": {
      "atRest": true,
      "inTransit": true
    },
    "logging": {
      "enabled": true,
      "retention": "90d"
    },
    "accessControl": {
      "mfa": true,
      "rbac": true
    }
  },
  "reporting": {
    "format": "pdf",
    "includeEvidence": true
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [Chef InSpec](https://www.inspec.io/)
- [OPA](https://www.openpolicyagent.org/)
