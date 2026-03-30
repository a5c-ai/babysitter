---
name: debt-covenant-monitor
description: Automated covenant compliance monitoring and calculation skill with early warning alerts
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

# Debt Covenant Monitor

## Overview

The Debt Covenant Monitor skill provides automated tracking and calculation of debt covenant compliance. It offers early warning capabilities and supports proactive management of covenant headroom across all credit facilities.

## Capabilities

### Financial Covenant Calculation
- Leverage ratio (Debt/EBITDA)
- Interest coverage ratio
- Fixed charge coverage ratio
- Current ratio
- Net worth requirements
- Capital expenditure limits

### Covenant Headroom Analysis
- Cushion calculation
- Trend analysis
- Sensitivity to performance changes
- Headroom visualization
- Multi-covenant dashboard
- Risk ranking

### Pro Forma Compliance Testing
- Acquisition impact modeling
- Disposition impact assessment
- Debt incurrence testing
- Restricted payment capacity
- Permitted investment availability
- Basket capacity tracking

### Early Warning Threshold Alerts
- Configurable warning levels
- Automatic notifications
- Escalation procedures
- Dashboard integration
- Historical trend comparison
- Projection-based alerts

### Compliance Certificate Generation
- Automated data population
- Calculation schedules
- Definition cross-references
- Officer certification language
- Delivery tracking
- Amendment tracking

### Cure Mechanism Modeling
- Equity cure availability
- Cure amount calculation
- Cure timing requirements
- Limitation tracking
- Pro forma impact
- Documentation requirements

## Usage

### Monthly Covenant Monitoring
```
Input: Financial statements, covenant definitions, threshold levels
Process: Calculate covenants, compare to requirements, assess headroom
Output: Covenant compliance report, headroom analysis, trend charts
```

### Transaction Covenant Testing
```
Input: Proposed transaction, covenant baskets, incurrence tests
Process: Model pro forma impact, test against covenants
Output: Pro forma compliance analysis, basket availability, recommendations
```

## Integration

### Used By Processes
- Debt Facility Management and Covenant Compliance
- Financial Statement Preparation
- Cash Flow Forecasting and Liquidity Management

### Tools and Libraries
- Loan agreement parsing
- Covenant templates
- Alerting platforms

## Best Practices

1. Maintain comprehensive covenant database
2. Build definition consistency across agreements
3. Track covenant calculation inputs to source
4. Establish regular covenant forecasting
5. Document EBITDA adjustments with support
6. Coordinate with lenders on interpretation issues
