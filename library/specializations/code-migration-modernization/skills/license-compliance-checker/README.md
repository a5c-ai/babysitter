# License Compliance Checker Skill

## Overview

The License Compliance Checker skill verifies license compliance across all dependencies. It ensures legal compliance during migration by identifying license conflicts and tracking attribution requirements.

## Quick Start

### Prerequisites

- Package manager for your language
- Optional: FOSSA, WhiteSource, or license-checker

### Basic Usage

1. **Scan dependencies**
   ```bash
   # npm
   npx license-checker --json

   # Python
   pip-licenses --format=json

   # Go
   go-licenses csv ./...
   ```

2. **Review compliance status**
   - Check for copyleft licenses
   - Verify compatibility
   - Generate attribution file

## Features

### License Categories

| Category | Risk | Examples |
|----------|------|----------|
| Permissive | Low | MIT, Apache-2.0, BSD |
| Weak Copyleft | Medium | LGPL, MPL |
| Strong Copyleft | High | GPL, AGPL |
| Proprietary | Review | Custom licenses |

### Policy Enforcement

Define allowed/blocked licenses:
```json
{
  "allowed": ["MIT", "Apache-2.0", "BSD-3-Clause"],
  "blocked": ["GPL-3.0", "AGPL-3.0"],
  "reviewRequired": ["LGPL-3.0"]
}
```

## Configuration

```json
{
  "projectLicense": "MIT",
  "policyFile": "./license-policy.json",
  "generateSBOM": true,
  "sbomFormat": "SPDX",
  "attributionFile": "./THIRD-PARTY-LICENSES.txt"
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [SPDX License List](https://spdx.org/licenses/)
