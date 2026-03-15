---
name: tax-provision-calculator
description: ASC 740 income tax provision calculation skill with deferred tax analysis
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: finance-accounting
  domain: business
  category: tax
  priority: high
---

# Tax Provision Calculator

## Overview

The Tax Provision Calculator skill implements ASC 740 income tax accounting requirements. It calculates current and deferred tax provisions, analyzes temporary differences, and supports uncertain tax position assessment.

## Capabilities

### Current Tax Expense Calculation
- Book-to-tax adjustments
- Taxable income determination
- Applicable rate application
- Credit utilization
- NOL usage
- Estimated payment reconciliation

### Deferred Tax Asset/Liability Computation
- Temporary difference identification
- Tax basis determination
- Book basis tracking
- Rate change impacts
- Deferred tax rollforward
- Classification (current/non-current)

### Permanent vs. Temporary Difference Classification
- Permanent difference identification
- Book-only items
- Tax-only deductions
- Meals and entertainment
- Fines and penalties
- Stock compensation excess benefits

### Valuation Allowance Assessment
- Positive evidence analysis
- Negative evidence analysis
- Scheduling of reversals
- Tax planning strategies
- Historical profitability
- Future projections

### Rate Reconciliation
- Statutory to effective rate bridge
- State tax impact
- Foreign rate differential
- Permanent items impact
- Credits effect
- Discrete items

### FIN 48/ASC 740-10 Uncertain Tax Position Analysis
- Recognition threshold (more-likely-than-not)
- Measurement (largest amount >50% likely)
- Interest and penalty accrual
- Statute of limitations tracking
- Settlement consideration
- Disclosure requirements

## Usage

### Quarterly Provision
```
Input: Pre-tax book income, tax adjustments, rate assumptions
Process: Calculate current and deferred components, assess UTP
Output: Tax provision entries, effective rate reconciliation, disclosure support
```

### Return-to-Provision True-Up
```
Input: Filed tax returns, original provision, identified differences
Process: Reconcile provision to return, record true-up adjustments
Output: True-up entries, updated deferred tax schedules
```

## Integration

### Used By Processes
- Income Tax Provision and ASC 740
- Tax Return Preparation and Filing
- Financial Statement Preparation

### Tools and Libraries
- Tax provision software APIs
- ONESOURCE
- Corptax
- Longview

## Best Practices

1. Maintain detailed book-tax difference schedules
2. Document valuation allowance conclusions quarterly
3. Track UTP positions with supporting analysis
4. Reconcile deferred tax accounts to underlying schedules
5. Build rate reconciliation with granular detail
6. Establish tax accounting procedures manual
