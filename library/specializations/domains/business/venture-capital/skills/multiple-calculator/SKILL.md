---
name: multiple-calculator
description: Calculates valuation multiples (EV/Revenue, EV/EBITDA, P/E) with sector adjustments
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: venture-capital
  domain: business
  skill-id: vc-skill-022
---

# Multiple Calculator

## Overview

The Multiple Calculator skill calculates valuation multiples for comparable analysis and valuation work. It computes standard multiples with appropriate sector adjustments and supports both private transaction and public company comparables.

## Capabilities

### Revenue Multiples
- Calculate EV/Revenue multiples
- Apply growth rate adjustments
- Compute ARR and NTM multiples
- Handle recurring vs. non-recurring revenue

### Profitability Multiples
- Calculate EV/EBITDA multiples
- Compute EV/EBIT and P/E ratios
- Handle negative earnings appropriately
- Apply margin adjustments

### Sector Adjustments
- Apply sector-specific premiums/discounts
- Adjust for growth rate differences
- Factor in margin profile differences
- Consider market positioning

### Multiple Analysis
- Calculate median and mean multiples
- Identify outliers and reasons
- Track multiple trends over time
- Build multiple ranges for valuation

## Usage

### Calculate Transaction Multiples
```
Input: Transaction data, financial metrics
Process: Calculate multiples, apply adjustments
Output: Multiple calculations, adjustment notes
```

### Calculate Trading Multiples
```
Input: Public company data, metrics
Process: Compute trading multiples
Output: Public company multiple analysis
```

### Apply Sector Adjustments
```
Input: Raw multiples, sector characteristics
Process: Apply appropriate adjustments
Output: Adjusted multiples, methodology notes
```

### Build Multiple Range
```
Input: Comparable set, weighting criteria
Process: Aggregate and weight multiples
Output: Valuation multiple range, application guidance
```

## Common Multiples

| Multiple | Use Case | Typical Range (SaaS) |
|----------|----------|---------------------|
| EV/Revenue | Growth companies | 3x - 15x+ |
| EV/ARR | Subscription businesses | 5x - 20x+ |
| EV/EBITDA | Profitable companies | 10x - 25x |
| P/E | Public companies | 15x - 50x |
| EV/Gross Profit | Marketplace businesses | 2x - 8x |

## Integration Points

- **Comparable Analysis Process**: Core multiple calculations
- **DCF Analysis**: Terminal value multiples
- **Comparable Transaction Finder**: Calculate found comparables
- **Valuation Specialist (Agent)**: Support valuation work

## Adjustment Factors

| Factor | Impact on Multiple |
|--------|-------------------|
| Growth Rate | Higher growth = higher multiple |
| Margin Profile | Higher margins = higher multiple |
| Retention (NRR) | Higher retention = higher multiple |
| TAM | Larger market = higher multiple |
| Competition | Less competition = higher multiple |
| Switching Costs | Higher costs = higher multiple |

## Best Practices

1. Use NTM (next twelve months) for forward multiples
2. Adjust for one-time items and normalization
3. Consider growth-adjusted multiples (EV/Revenue/Growth)
4. Document all adjustments clearly
5. Use multiple types appropriate to business stage
