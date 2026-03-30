---
name: lbo-model-builder
description: Leveraged Buyout model construction skill for private equity transaction analysis
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: finance-accounting
  domain: business
  category: financial-modeling
  priority: lower
---

# LBO Model Builder

## Overview

The LBO Model Builder skill creates comprehensive Leveraged Buyout models for private equity transaction analysis. It enables detailed modeling of debt structures, equity returns, and exit scenarios to evaluate potential acquisitions.

## Capabilities

### Sources and Uses of Funds
- Purchase price calculation
- Transaction fee estimation
- Financing fee capitalization
- Equity contribution sizing
- Debt quantum determination
- Working capital adjustments
- Balance sheet cash treatment

### Debt Schedule Construction
- Senior secured term loans
- Revolving credit facility
- Second lien debt
- Subordinated notes
- High yield bonds
- Mezzanine financing
- Amortization schedules

### PIK Toggle Modeling
- Payment-in-kind interest calculation
- PIK toggle conditions
- Accrued interest tracking
- Covenant considerations
- Tax treatment modeling
- Balloon payment timing

### Equity Waterfall Calculations
- Preferred equity treatment
- Common equity allocation
- Management equity pool
- Promote/carry structures
- Catch-up provisions
- Distribution priorities

### IRR and MOIC Computation
- Levered IRR calculation
- Unlevered IRR analysis
- Multiple of invested capital
- Cash-on-cash returns
- Time-weighted returns
- Gross vs. net returns

### Exit Scenario Analysis
- Exit multiple assumptions
- Strategic vs. financial buyer
- IPO exit modeling
- Dividend recapitalization
- Partial exit scenarios
- Hold period sensitivity

## Usage

### Transaction Evaluation
```
Input: Target financials, purchase price, debt terms, sponsor requirements
Process: Build LBO model with debt paydown and exit scenarios
Output: Returns analysis, debt capacity assessment, sensitivity tables
```

### Debt Capacity Analysis
```
Input: Cash flow projections, covenant requirements, market terms
Process: Optimize capital structure for returns while maintaining covenants
Output: Maximum debt capacity, recommended structure, covenant headroom
```

## Integration

### Used By Processes
- M&A Financial Due Diligence
- Capital Investment Appraisal
- Discounted Cash Flow (DCF) Valuation

### Tools and Libraries
- Python financial libraries
- Excel automation
- Private equity modeling templates

## Best Practices

1. Stress test debt paydown under downside scenarios
2. Validate exit assumptions against comparable transactions
3. Model realistic covenant cushion requirements
4. Include management equity and incentive impacts
5. Consider refinancing optionality
6. Build in flexibility for multiple exit pathways
