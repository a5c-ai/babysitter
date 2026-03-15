# Data Migration Validator Skill

## Overview

The Data Migration Validator skill ensures data integrity during migration. It performs comprehensive validation checks and generates audit-ready reconciliation reports.

## Quick Start

### Prerequisites

- Source and target database access
- Validation rules defined
- Comparison tooling

### Basic Usage

1. **Run row counts**
   ```sql
   -- Compare counts
   SELECT 'source', COUNT(*) FROM source.table
   UNION ALL
   SELECT 'target', COUNT(*) FROM target.table;
   ```

2. **Verify checksums**
   - Calculate per-table hashes
   - Compare values
   - Investigate differences

3. **Generate report**
   - Document all checks
   - Note exceptions
   - Provide sign-off

## Features

### Validation Types

| Type | Method | Confidence |
|------|--------|------------|
| Row Count | Full count | High |
| Checksum | Hash comparison | High |
| Sampling | Statistical | Medium |
| Business Rules | Custom queries | High |

### Reporting

- Pass/fail summary
- Detailed discrepancies
- Audit trail
- Sign-off documentation

## Configuration

```json
{
  "validation": {
    "rowCounts": true,
    "checksums": true,
    "sampling": {
      "enabled": true,
      "rate": 0.01
    },
    "businessRules": "./rules/*.sql"
  },
  "reporting": {
    "format": "html",
    "includeDetails": true
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [Great Expectations](https://greatexpectations.io/)
