---
name: cap-table-validator
description: Validates cap table accuracy, identifies issues, models option pool impact
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: venture-capital
  domain: business
  skill-id: vc-skill-017
---

# Cap Table Validator

## Overview

The Cap Table Validator skill provides systematic validation of capitalization tables during due diligence. It verifies ownership accuracy, identifies potential issues, and models the impact of option pools and future financing on ownership structure.

## Capabilities

### Cap Table Verification
- Verify share counts against stock ledger
- Reconcile against Articles/Charter documents
- Check convertible instrument calculations
- Validate vesting schedules and exercise prices

### Issue Identification
- Identify missing or incorrect 83(b) elections
- Flag accelerated vesting provisions
- Detect anti-dilution trigger scenarios
- Identify founder equity concentration issues

### Option Pool Modeling
- Model option pool expansion impact
- Calculate fully diluted ownership
- Analyze option overhang and burn rate
- Project pool runway based on hiring plans

### Convertible Modeling
- Model SAFE and note conversions
- Calculate pre-money vs. post-money impacts
- Analyze discount and cap mechanics
- Model multiple conversion scenarios

## Usage

### Validate Cap Table
```
Input: Cap table, supporting documents
Process: Verify calculations, reconcile documents
Output: Validation report, discrepancies found
```

### Identify Issues
```
Input: Cap table, charter documents
Process: Check for common issues, flag concerns
Output: Issue list, severity assessment
```

### Model Option Pool
```
Input: Current pool, hiring plan, grant guidelines
Process: Project pool usage, calculate dilution
Output: Pool projection, ownership impact
```

### Model Convertibles
```
Input: Convertible instruments, conversion scenarios
Process: Calculate conversion outcomes
Output: Conversion analysis, ownership projections
```

## Validation Checklist

| Category | Key Checks |
|----------|------------|
| Shares Outstanding | Match charter, stock ledger, cap table |
| Options | Verify grants, vesting, exercise prices |
| Convertibles | Terms accuracy, conversion mechanics |
| Documents | Board approvals, stock certificates |
| Tax | 83(b) elections, ISO limits, AMT |

## Integration Points

- **Legal Due Diligence**: Core cap table review
- **Cap Table Modeler (Agent)**: Support agent analysis
- **Dilution Analyzer**: Feed validated data for analysis
- **Waterfall Calculator**: Provide ownership for waterfall

## Common Issues

- Outstanding convertibles not reflected
- Vesting calculation errors
- Exercise price discrepancies
- Missing or late 83(b) elections
- ISO/NSO classification errors
- Incorrect anti-dilution provisions
- Conflicting document versions

## Best Practices

1. Request source documents, not just spreadsheets
2. Verify against Carta, Pulley, or stock admin system
3. Model all outstanding convertibles
4. Check for pending but unexecuted grants
5. Review recent charter amendments
