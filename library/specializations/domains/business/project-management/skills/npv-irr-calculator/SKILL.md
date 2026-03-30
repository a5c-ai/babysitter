---
name: npv-irr-calculator
description: Calculate project financial metrics for investment decision making
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: project-management
  domain: business
  category: Financial Analysis
  id: SK-009
---

# NPV/IRR Calculator

## Overview

The NPV/IRR Calculator skill provides comprehensive financial analysis for project investment decisions. It calculates key financial metrics including Net Present Value, Internal Rate of Return, payback periods, and profitability indices to support business case development and portfolio prioritization.

## Capabilities

### Core Financial Metrics
- Calculate Net Present Value (NPV) with configurable discount rates
- Calculate Internal Rate of Return (IRR)
- Calculate Modified Internal Rate of Return (MIRR)
- Calculate payback period (simple and discounted)
- Calculate Profitability Index (PI) / Benefit-Cost Ratio

### Cash Flow Analysis
- Generate cash flow projections
- Model operating vs. capital expenditures
- Calculate cumulative cash flows
- Support irregular cash flow timing
- Handle multiple currency conversions

### Sensitivity Analysis
- Perform sensitivity analysis on key assumptions
- Generate tornado diagrams
- Calculate break-even points
- Model scenario comparisons (base, optimistic, pessimistic)
- Assess assumption risk ranges

### Advanced Features
- Support weighted average cost of capital (WACC)
- Calculate economic value added (EVA)
- Model inflation adjustments
- Compare mutually exclusive projects
- Generate investment summary reports

## Usage

### Input Requirements
- Initial investment amounts
- Projected cash flows by period
- Discount rate(s)
- Project duration
- Optional: Inflation rates, tax considerations

### Output Deliverables
- NPV calculation with present value breakdown
- IRR and MIRR calculations
- Payback analysis (simple and discounted)
- Profitability Index
- Sensitivity analysis charts

### Example Use Cases
1. **Business Case**: Calculate project financial viability
2. **Portfolio Selection**: Compare project investments
3. **Go/No-Go Decision**: Evaluate investment threshold
4. **Budget Justification**: Demonstrate financial benefits

## Process Integration

This skill integrates with the following processes:
- Business Case Development
- budget-development.js
- portfolio-prioritization.js
- benefits-realization.js

## Dependencies

- Financial mathematics libraries
- Numerical computation utilities
- Visualization libraries
- Currency conversion services

## Related Skills

- SK-004: EVM Calculator
- SK-011: Benefits Tracking Dashboard
- SK-013: Portfolio Optimization
