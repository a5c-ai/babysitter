---
name: dcf-valuation-modeler
description: Discounted Cash Flow model builder for comprehensive company valuations with WACC calculation, terminal value estimation, and sensitivity analysis
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
  priority: high
---

# DCF Valuation Modeler

## Overview

The DCF Valuation Modeler skill provides comprehensive Discounted Cash Flow analysis capabilities for company valuations. It combines free cash flow projections with weighted average cost of capital (WACC) calculations and terminal value estimation to produce robust enterprise valuations.

## Capabilities

### Free Cash Flow Projection
- Revenue and expense forecasting models
- Working capital requirement projections
- Capital expenditure modeling
- Depreciation and amortization schedules
- Tax effect calculations
- Unlevered free cash flow computation

### WACC Calculation
- Cost of equity via Capital Asset Pricing Model (CAPM)
- Cost of debt determination with tax shield
- Capital structure weighting
- Beta estimation and adjustment
- Risk-free rate selection
- Equity risk premium calculation

### Terminal Value Estimation
- Perpetuity growth method implementation
- Exit multiple methodology
- Terminal value reasonability checks
- Fade period modeling
- Long-term growth rate validation

### Sensitivity Analysis
- Two-variable sensitivity tables
- Tornado chart generation
- Key driver identification
- Break-even analysis
- Scenario comparison matrices

### Monte Carlo Simulation
- Probability distribution assignment
- Correlation matrix handling
- Convergence analysis
- Confidence interval generation
- Value at Risk integration

### Multi-Scenario Analysis
- Base, bull, and bear case modeling
- Probability-weighted valuation
- Scenario documentation
- Assumption tracking
- Version control

## Usage

### Basic DCF Model
```
Input: Company financials, growth assumptions, discount rate parameters
Process: Project cash flows, calculate WACC, determine terminal value, discount to present
Output: Enterprise value, equity value per share, sensitivity analysis
```

### Valuation with Scenarios
```
Input: Historical data, management guidance, market conditions
Process: Develop multiple scenarios, probability weight outcomes
Output: Probability-weighted valuation range with confidence intervals
```

## Integration

### Used By Processes
- Discounted Cash Flow (DCF) Valuation
- Capital Investment Appraisal
- M&A Financial Due Diligence

### Tools and Libraries
- Excel/Python financial libraries
- numpy-financial
- scipy
- pandas for data manipulation

## Best Practices

1. Validate assumptions against historical performance
2. Cross-check terminal value against comparable transactions
3. Ensure WACC inputs are internally consistent
4. Document all key assumptions and sources
5. Perform sanity checks on implied multiples
6. Consider stage-of-cycle adjustments
