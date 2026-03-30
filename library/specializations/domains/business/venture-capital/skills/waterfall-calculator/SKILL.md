---
name: waterfall-calculator
description: Calculates distribution waterfalls per LPA terms, carry, clawback
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
  skill-id: vc-skill-025
---

# Waterfall Calculator

## Overview

The Waterfall Calculator skill calculates distribution waterfalls according to Limited Partnership Agreement (LPA) terms. It models carried interest, clawback provisions, and LP/GP distributions across various waterfall structures common in venture capital.

## Capabilities

### Waterfall Structure Modeling
- Support American (deal-by-deal) waterfalls
- Support European (whole-fund) waterfalls
- Handle hybrid waterfall structures
- Model fund-of-funds structures

### Carried Interest Calculation
- Calculate GP carry based on LPA terms
- Model catch-up provisions
- Handle tiered carry structures
- Track crystallized vs. unrealized carry

### Clawback Modeling
- Calculate potential clawback obligations
- Model true-up scenarios
- Track escrow requirements
- Project final settlement amounts

### Distribution Modeling
- Calculate LP and GP distributions
- Model management fee offsets
- Handle recycling provisions
- Track return of capital vs. profits

## Usage

### Calculate Waterfall
```
Input: Fund terms, realized/unrealized values
Process: Apply waterfall mechanics
Output: Distribution allocation, carry calculation
```

### Model Distribution Scenario
```
Input: Exit scenario, fund status
Process: Calculate pro forma distributions
Output: LP/GP split, carry amount
```

### Calculate Clawback Exposure
```
Input: Fund history, projected outcomes
Process: Model potential clawback
Output: Clawback exposure, escrow adequacy
```

### Project Final Settlement
```
Input: Portfolio status, exit projections
Process: Model fund conclusion scenarios
Output: Projected final distributions
```

## Waterfall Components

| Component | Description |
|-----------|-------------|
| Return of Capital | LPs receive contributed capital first |
| Preferred Return | LPs receive hurdle (typically 8%) |
| GP Catch-up | GP catches up to carry percentage |
| Carried Interest | 80/20 split (typically) on remaining |

## Integration Points

- **Distribution Waterfall Calculation Process**: Core skill
- **Cap Table Modeler (Agent)**: Connect to ownership data
- **K1 Generator**: Feed into tax reporting
- **Fund Accountant (Agent)**: Support accounting work

## Waterfall Types

| Type | Carry Calculation Basis |
|------|-------------------------|
| American | Deal-by-deal, immediate carry |
| European | Whole fund, after capital return |
| Hybrid | Combination with clawback |

## Best Practices

1. Model precisely per LPA terms
2. Track management fee offsets
3. Maintain accurate capital account balances
4. Model clawback sensitivity
5. Reconcile with fund administrator
