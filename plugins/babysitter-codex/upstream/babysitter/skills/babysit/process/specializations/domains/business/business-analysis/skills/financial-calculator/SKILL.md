---
name: financial-calculator
description: Automated calculation of business case financial metrics including NPV, IRR, ROI, and TCO
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: business-analysis
  domain: business
  id: SK-003
  category: Financial Analysis
---

# Financial Calculator

## Overview

The Financial Calculator skill provides specialized capabilities for computing business case financial metrics. This skill enables accurate calculation of investment returns, cost projections, and financial viability assessments essential for business case development and solution options analysis.

## Capabilities

### Net Present Value (NPV) Analysis
- Calculate NPV with configurable discount rates
- Support multiple cash flow scenarios
- Handle irregular cash flow timing
- Calculate NPV sensitivity to discount rate changes

### Internal Rate of Return (IRR)
- Calculate IRR for investment scenarios
- Handle multiple IRR solutions
- Calculate Modified IRR (MIRR)
- Compare IRR against hurdle rates

### Return on Investment (ROI)
- Calculate simple ROI percentages
- Calculate Return on Marketing Investment (ROMI)
- Annualized ROI calculations
- Risk-adjusted ROI calculations

### Payback Period Analysis
- Calculate simple payback period
- Calculate discounted payback period
- Identify break-even timing
- Generate payback curves

### Sensitivity Analysis
- Perform Monte Carlo simulation for uncertainty modeling
- Generate tornado diagrams for variable sensitivity
- Calculate confidence intervals
- Identify critical variables affecting outcomes

### Cash Flow Projections
- Generate multi-year cash flow projections
- Model recurring vs one-time costs
- Include inflation adjustments
- Handle currency considerations

### Total Cost of Ownership (TCO)
- Calculate comprehensive TCO
- Include direct and indirect costs
- Model maintenance and support costs
- Compare TCO across alternatives

### Break-Even Analysis
- Calculate break-even point in units/revenue
- Model contribution margin
- Analyze fixed vs variable cost structures
- Generate break-even charts

## Usage

### Calculate NPV
```
Calculate the NPV for this investment:
- Initial investment: $500,000
- Year 1 cash flow: $150,000
- Year 2 cash flow: $200,000
- Year 3 cash flow: $250,000
- Year 4 cash flow: $200,000
- Year 5 cash flow: $150,000
- Discount rate: 10%
```

### Calculate ROI and Payback
```
Calculate ROI and payback period:
- Total investment: $1,000,000
- Annual benefits: $350,000
- Project duration: 5 years
```

### Perform Sensitivity Analysis
```
Perform sensitivity analysis on this business case:
[Business case parameters]

Vary discount rate, benefits, and costs by +/- 20% and show impact on NPV.
```

### Calculate TCO
```
Calculate 5-year TCO for these options:

Option A: [Cost breakdown]
Option B: [Cost breakdown]

Include implementation, licensing, support, and operational costs.
```

## Process Integration

This skill integrates with the following business analysis processes:
- business-case-development.js - Core financial analysis for business cases
- solution-options-analysis.js - Cost comparison across alternatives
- solution-performance-assessment.js - ROI tracking and benefit realization

## Dependencies

- Numerical computation libraries
- Statistical analysis for Monte Carlo simulation
- Financial modeling formulas
- Visualization for charts and graphs

## Financial Formulas Reference

### NPV Formula
```
NPV = Sum of [Cash Flow(t) / (1 + r)^t] for t = 0 to n
Where: r = discount rate, t = time period, n = total periods
```

### IRR Definition
```
IRR = discount rate where NPV = 0
```

### ROI Formula
```
ROI = (Net Benefit - Cost) / Cost * 100%
```

### Payback Period
```
Simple Payback = Initial Investment / Annual Cash Flow
Discounted Payback = Time when cumulative discounted cash flows = 0
```

### TCO Components
- Acquisition costs (hardware, software, implementation)
- Operating costs (maintenance, support, utilities)
- Personnel costs (training, salaries, contractors)
- Opportunity costs (downtime, productivity loss)
- End-of-life costs (decommissioning, migration)
