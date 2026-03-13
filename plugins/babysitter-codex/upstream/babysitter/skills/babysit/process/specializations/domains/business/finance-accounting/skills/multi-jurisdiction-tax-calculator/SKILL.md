---
name: multi-jurisdiction-tax-calculator
description: Multi-state and international tax calculation skill with nexus analysis
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
  priority: medium
---

# Multi-Jurisdiction Tax Calculator

## Overview

The Multi-Jurisdiction Tax Calculator skill provides comprehensive tax calculation capabilities across multiple states and countries. It handles nexus determination, apportionment, and compliance with varying jurisdictional requirements.

## Capabilities

### State Apportionment Calculation
- Single-factor sales apportionment
- Three-factor formula application
- Market-based sourcing
- Cost of performance rules
- Throwback/throwout rules
- Combined vs. separate filing

### Nexus Determination
- Physical presence analysis
- Economic nexus thresholds
- Affiliate nexus
- Agency nexus
- PL 86-272 protection
- Wayfair implications

### Treaty Benefit Analysis
- Permanent establishment review
- Treaty rate identification
- Limitation on benefits
- Treaty shopping prevention
- Competent authority procedures
- Treaty-based positions

### Withholding Tax Calculation
- Dividend withholding
- Interest withholding
- Royalty withholding
- Service payments
- Treaty rate application
- Form preparation support

### Indirect Tax (VAT/GST) Computation
- VAT/GST registration requirements
- Input tax recovery
- Output tax calculation
- Reverse charge mechanism
- Cross-border transactions
- Place of supply rules

### Tax Calendar Management
- Filing deadline tracking
- Extension management
- Estimated payment due dates
- Information return dates
- Audit milestone tracking
- Statute of limitations

## Usage

### State Tax Compliance
```
Input: Company activities by state, revenue allocation, expenses
Process: Determine nexus, calculate apportionment, compute liability
Output: State tax calculations, estimated payments, return preparation data
```

### International Structure Planning
```
Input: Proposed structure, transaction flows, jurisdictions
Process: Analyze tax implications, identify optimization opportunities
Output: Effective rate analysis, withholding impact, implementation steps
```

## Integration

### Used By Processes
- Tax Return Preparation and Filing
- Income Tax Provision and ASC 740
- Transfer Pricing Documentation

### Tools and Libraries
- Tax software APIs
- Jurisdiction databases
- Rate and rule libraries

## Best Practices

1. Maintain nexus tracking for all states
2. Monitor economic nexus threshold changes
3. Document treaty positions with analysis
4. Track foreign tax credit limitations
5. Implement withholding tax procedures
6. Build regulatory change monitoring process
