---
name: capital-budgeting-analyzer
description: Capital investment appraisal skill with NPV, IRR, payback, and real options analysis
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: finance-accounting
  domain: business
  category: investment-analysis
  priority: medium
---

# Capital Budgeting Analyzer

## Overview

The Capital Budgeting Analyzer skill provides comprehensive investment appraisal capabilities. It enables systematic evaluation of capital projects using multiple methodologies including NPV, IRR, payback analysis, and real options valuation.

## Capabilities

### NPV Calculation
- Discounted cash flow analysis
- Multiple discount rate scenarios
- Terminal value inclusion
- Working capital considerations
- Tax impact modeling
- Salvage value treatment

### IRR and MIRR Computation
- Internal rate of return calculation
- Multiple IRR detection
- Modified IRR calculation
- Reinvestment rate specification
- Finance rate consideration
- IRR sensitivity analysis

### Payback and Discounted Payback
- Simple payback calculation
- Discounted payback analysis
- Payback distribution
- Cumulative cash flow tracking
- Break-even timing
- Cash flow velocity

### Profitability Index
- PI calculation methodology
- Capital rationing application
- Project ranking
- Scale-independent comparison
- Wealth maximization
- Resource allocation

### Real Options Valuation
- Option identification
- Deferral option valuation
- Expansion option analysis
- Abandonment option value
- Flexibility premium
- Decision tree integration

### Sensitivity and Break-Even Analysis
- Single variable sensitivity
- Multi-variable scenarios
- Break-even point determination
- Tornado diagrams
- Spider charts
- Critical success factors

## Usage

### Project Evaluation
```
Input: Project cash flows, investment amount, cost of capital
Process: Calculate NPV, IRR, payback, assess against hurdle rates
Output: Investment recommendation, risk analysis, approval documentation
```

### Portfolio Optimization
```
Input: Multiple project proposals, capital budget, strategic priorities
Process: Rank projects, optimize allocation, identify constraints
Output: Approved project portfolio, ranking rationale, resource plan
```

## Integration

### Used By Processes
- Capital Investment Appraisal
- Financial Modeling and Scenario Planning
- Annual Budget Development

### Tools and Libraries
- numpy-financial
- scipy
- Decision tree libraries
- Real options models

## Best Practices

1. Use consistent discount rates across comparable projects
2. Include all incremental cash flows
3. Consider project interdependencies
4. Document assumptions and risks
5. Perform post-implementation reviews
6. Adjust for project-specific risk
