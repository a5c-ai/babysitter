---
name: cash-flow-forecaster
description: Daily, weekly, and monthly cash forecasting skill with scenario analysis and liquidity stress testing
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: finance-accounting
  domain: business
  category: treasury
  priority: medium
---

# Cash Flow Forecaster

## Overview

The Cash Flow Forecaster skill provides comprehensive cash forecasting capabilities across multiple time horizons. It enables liquidity planning, stress testing, and working capital optimization through scenario-based analysis.

## Capabilities

### Direct Method Cash Forecasting
- Cash receipts projection
- Cash disbursements estimation
- Payroll timing
- Tax payment scheduling
- Debt service timing
- Capital expenditure planning

### Indirect Method Reconciliation
- Net income to cash flow bridge
- Non-cash item adjustments
- Working capital changes
- Accrual to cash conversion
- Deferred item treatment
- Cross-check validation

### Working Capital Optimization Modeling
- Days sales outstanding targets
- Days payable outstanding optimization
- Inventory turnover improvement
- Cash conversion cycle analysis
- Payment term negotiation impact
- Early payment discount analysis

### Liquidity Stress Scenarios
- Revenue decline scenarios
- Customer concentration risk
- Supply chain disruption
- Credit facility unavailability
- Rapid growth requirements
- Economic downturn modeling

### Bank Balance Aggregation
- Multi-bank connectivity
- Currency position consolidation
- Sweep account integration
- Concentration account tracking
- Notional pooling support
- Zero balance account management

### Cash Position Optimization
- Surplus investment strategies
- Deficit coverage planning
- Intercompany funding
- FX exposure netting
- Cash pool balancing
- Target balance maintenance

## Usage

### Short-Term Forecast (Daily/Weekly)
```
Input: Bank balances, expected receipts, planned disbursements
Process: Build detailed cash flow by day/week
Output: Daily cash position, funding requirements, investment opportunities
```

### Long-Term Forecast (Monthly/Quarterly)
```
Input: Budget, working capital assumptions, capital plans
Process: Project cash flows, identify liquidity needs
Output: Liquidity forecast, covenant compliance projection, funding plan
```

## Integration

### Used By Processes
- Cash Flow Forecasting and Liquidity Management
- Debt Facility Management and Covenant Compliance
- Annual Budget Development

### Tools and Libraries
- Treasury management system APIs
- Kyriba
- GTreasury
- Bank connectivity platforms

## Best Practices

1. Reconcile forecast to actual regularly
2. Measure and improve forecast accuracy
3. Build bottom-up forecasts from operating units
4. Maintain multiple scenario overlays
5. Establish liquidity thresholds and triggers
6. Integrate with FP&A processes
