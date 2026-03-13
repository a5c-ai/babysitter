---
name: valuation-updater
description: Marks portfolio positions to fair value per ASC 820/IPEV guidelines
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
  skill-id: vc-skill-035
---

# Valuation Updater

## Overview

The Valuation Updater skill supports periodic marking of portfolio positions to fair value in accordance with ASC 820 and IPEV guidelines. It ensures consistent, defensible valuations for fund reporting and LP communications.

## Capabilities

### Fair Value Assessment
- Assess fair value using multiple approaches
- Apply appropriate valuation methodologies
- Document valuation rationale
- Support valuation committee process

### Methodology Application
- Apply market approach (comparables, transactions)
- Apply income approach (DCF where appropriate)
- Use calibration from recent rounds
- Handle convertible instrument valuations

### Documentation Generation
- Generate valuation memos
- Document key assumptions
- Support audit requirements
- Maintain valuation audit trail

### Portfolio-Level Review
- Aggregate portfolio valuations
- Calculate NAV impacts
- Track valuation changes over time
- Identify outliers for review

## Usage

### Update Company Valuation
```
Input: Company data, recent developments
Process: Apply valuation methodology
Output: Fair value estimate, documentation
```

### Apply Calibration
```
Input: Recent transaction, prior valuation
Process: Calibrate to new price point
Output: Calibrated valuation, back-test
```

### Generate Valuation Memo
```
Input: Valuation analysis, assumptions
Process: Create documentation
Output: Valuation memo for audit/committee
```

### Review Portfolio Valuations
```
Input: Portfolio-wide valuation data
Process: Aggregate, identify issues
Output: Portfolio valuation summary
```

## Valuation Hierarchy

| Level | Inputs | Approach |
|-------|--------|----------|
| Level 1 | Quoted prices | Public market prices |
| Level 2 | Observable inputs | Comparable transactions |
| Level 3 | Unobservable inputs | DCF, option pricing |

## Integration Points

- **Quarterly Portfolio Reporting**: Valuation for reporting
- **Waterfall Calculator**: Values for distributions
- **KPI Aggregator**: Company data for valuation
- **Fund Accountant (Agent)**: Support accounting

## Valuation Methodologies

| Method | Application |
|--------|-------------|
| Calibration | Recent rounds, secondary transactions |
| Market Multiples | Comparable company/transaction |
| DCF | Cash flow positive companies |
| Option Pricing | Early stage, convertibles |
| Milestone | Pre-revenue companies |

## Best Practices

1. Follow ASC 820 and IPEV guidance
2. Use calibration as primary method where applicable
3. Document all significant assumptions
4. Maintain consistent methodology application
5. Support audit with complete documentation
