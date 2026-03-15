---
name: three-statement-model-builder
description: Integrated three-statement financial model builder linking income statement, balance sheet, and cash flow statement with circular reference handling
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
  priority: medium
---

# Three-Statement Model Builder

## Overview

The Three-Statement Model Builder skill creates fully integrated financial models that dynamically link the income statement, balance sheet, and cash flow statement. It handles complex circular references between debt, interest expense, and cash balances while maintaining model integrity.

## Capabilities

### Income Statement Projection
- Revenue drivers and growth modeling
- Cost structure analysis (fixed vs. variable)
- Gross margin forecasting
- Operating expense projections
- Interest expense calculation
- Tax expense computation
- EPS and diluted EPS calculation

### Balance Sheet Forecasting
- Working capital modeling (AR, AP, inventory)
- Fixed asset roll-forward
- Debt schedule construction
- Equity account tracking
- Deferred tax assets/liabilities
- Goodwill and intangibles

### Cash Flow Statement Derivation
- Operating cash flow from net income
- Working capital changes
- Investing activities (capex, acquisitions)
- Financing activities (debt, dividends, buybacks)
- Beginning and ending cash reconciliation
- Free cash flow calculation

### Circular Reference Resolution
- Debt/interest iterative calculation
- Cash sweep mechanisms
- Revolver draws and paydowns
- Interest income on excess cash
- Convergence verification

### Working Capital Modeling
- Days sales outstanding (DSO) analysis
- Days payable outstanding (DPO) modeling
- Inventory turnover projections
- Prepaid and accrued expense forecasting
- Seasonal adjustment factors

### Capital Expenditure and Depreciation
- Capex as percentage of revenue
- Asset category breakdowns
- Depreciation method selection
- Useful life assumptions
- Asset retirement modeling

## Usage

### Model Construction
```
Input: Historical financials (3-5 years), business assumptions
Process: Build integrated statements with driver-based forecasts
Output: Multi-year projections with automatic balance sheet balancing
```

### Scenario Development
```
Input: Base case assumptions, scenario parameters
Process: Create linked scenarios with consistent assumptions
Output: Comparable financial projections across scenarios
```

## Integration

### Used By Processes
- Financial Statement Preparation
- Financial Modeling and Scenario Planning
- Annual Budget Development

### Tools and Libraries
- Python pandas
- openpyxl
- Financial modeling templates
- xlwings for Excel automation

## Best Practices

1. Establish clear historical period and projection period boundaries
2. Use driver-based assumptions rather than hard-coded values
3. Implement error checks and balance verification
4. Maintain assumption documentation separate from calculations
5. Build in flexibility for scenario switching
6. Use consistent sign conventions throughout
