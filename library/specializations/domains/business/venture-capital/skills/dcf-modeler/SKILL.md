---
name: dcf-modeler
description: Builds DCF models with terminal value, WACC calculation, sensitivity tables
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
  skill-id: vc-skill-023
---

# DCF Modeler

## Overview

The DCF Modeler skill builds Discounted Cash Flow valuation models for venture capital analysis. While DCF is less common for early-stage VC, it supports late-stage growth investments, exit analysis, and LP return modeling where cash flow projections are meaningful.

## Capabilities

### Cash Flow Projection
- Project operating cash flows
- Model capital expenditure requirements
- Estimate working capital changes
- Handle loss-making growth phase transitions

### Discount Rate Calculation
- Calculate WACC for appropriate structures
- Apply venture-appropriate discount rates
- Adjust for stage and risk profile
- Model cost of equity with VC premiums

### Terminal Value Estimation
- Calculate terminal value via exit multiple
- Apply perpetuity growth method
- Hybrid terminal value approaches
- Terminal value sanity checks

### Sensitivity Analysis
- Build sensitivity tables
- Model key assumption impacts
- Calculate value driver sensitivities
- Create scenario matrices

## Usage

### Build DCF Model
```
Input: Financial projections, assumptions
Process: Build cash flow model, calculate value
Output: DCF valuation, model outputs
```

### Calculate Discount Rate
```
Input: Company profile, capital structure
Process: Calculate appropriate discount rate
Output: WACC/discount rate, methodology notes
```

### Estimate Terminal Value
```
Input: Terminal year financials, exit assumptions
Process: Calculate terminal value
Output: Terminal value, percentage of total value
```

### Run Sensitivity Analysis
```
Input: Base case model, sensitivity parameters
Process: Calculate sensitivities across ranges
Output: Sensitivity tables, tornado charts
```

## DCF Components

| Component | VC Considerations |
|-----------|-------------------|
| Projection Period | 5-10 years to steady state |
| Discount Rate | 20-40%+ for early stage |
| Terminal Value | Often 60-80%+ of total value |
| Cash Flows | May be negative for years |
| Exit Multiple | Primary terminal method |

## Integration Points

- **DCF Analysis Process**: Core modeling skill
- **Financial Model Validator**: Validate model inputs
- **Multiple Calculator**: Terminal value multiples
- **Sensitivity Analyst (Agent)**: Support analysis

## Discount Rate Considerations

| Stage | Typical Discount Rate |
|-------|----------------------|
| Seed | 40-60% |
| Series A | 35-50% |
| Series B | 30-40% |
| Growth | 20-30% |
| Late Stage | 15-25% |

## Best Practices

1. DCF is supplementary for early-stage VC
2. Use realistic projections, not hockey sticks
3. Heavily weight terminal value sensitivities
4. Consider probability-weighted scenarios
5. Triangulate with VC method and comparables
