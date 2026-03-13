---
name: k1-generator
description: Generates K-1 schedules for partner distributions with tax allocations
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
  skill-id: vc-skill-041
---

# K1 Generator

## Overview

The K1 Generator skill produces Schedule K-1 tax documents for limited partners, handling complex tax allocations including carried interest treatment under IRC Section 1061. It ensures accurate, timely tax reporting for fund distributions.

## Capabilities

### K-1 Preparation
- Generate Schedule K-1 forms
- Calculate partner tax allocations
- Handle tiered partnership structures
- Support state K-1 requirements

### Tax Allocation
- Allocate income by character (ordinary, capital gains)
- Handle qualified opportunity zone provisions
- Apply Section 1061 carried interest rules
- Manage tax basis tracking

### Distribution Reporting
- Report distributions to partners
- Track return of capital vs. gains
- Handle installment sale treatments
- Manage escrow release allocations

### Compliance Support
- Generate required tax schedules
- Support LP tax planning
- Provide allocation explanations
- Track filing deadlines

## Usage

### Generate K-1s
```
Input: Fund activity, partner data
Process: Calculate allocations, generate forms
Output: K-1 documents by partner
```

### Calculate Tax Allocations
```
Input: Fund income/loss, allocation provisions
Process: Apply allocation methodology
Output: Partner allocation schedules
```

### Handle Distribution Reporting
```
Input: Distribution data
Process: Classify and allocate
Output: Distribution reporting schedules
```

### Prepare State K-1s
```
Input: State allocation data
Process: Generate state-specific K-1s
Output: State K-1 documents
```

## K-1 Components

| Component | Description |
|-----------|-------------|
| Box 1-3 | Ordinary income/loss |
| Box 8-10 | Capital gains/losses |
| Box 11 | Section 1231 gains/losses |
| Box 13-20 | Other items |
| Schedules | Supporting detail |

## Integration Points

- **Distribution Waterfall Calculation**: Allocation basis
- **Waterfall Calculator**: Distribution data
- **Tax Coordinator (Agent)**: Support tax work
- **Fund Accountant (Agent)**: Coordinate accounting

## Tax Considerations

| Consideration | Treatment |
|---------------|-----------|
| Section 1061 | 3-year hold for LTCG on carry |
| QSBS | Section 1202 exclusion tracking |
| State Taxes | State-specific allocations |
| Foreign Partners | Withholding requirements |

## Best Practices

1. Start K-1 preparation early in year-end
2. Coordinate with fund tax advisors
3. Provide LP tax planning estimates
4. Document allocation methodology
5. Track basis and capital accounts accurately
