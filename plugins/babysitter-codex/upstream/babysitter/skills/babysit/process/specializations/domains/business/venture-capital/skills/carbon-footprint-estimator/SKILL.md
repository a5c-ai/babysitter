---
name: carbon-footprint-estimator
description: Estimates company carbon footprint and environmental impact
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
  skill-id: vc-skill-020
---

# Carbon Footprint Estimator

## Overview

The Carbon Footprint Estimator skill provides detailed estimation of company carbon footprints and environmental impact for ESG due diligence. It calculates Scope 1, 2, and 3 emissions and projects environmental impact trajectories.

## Capabilities

### Scope 1 Emissions (Direct)
- Estimate emissions from owned facilities
- Calculate fleet and vehicle emissions
- Assess process emissions from operations
- Account for fugitive emissions

### Scope 2 Emissions (Indirect - Energy)
- Calculate purchased electricity emissions
- Estimate heating and cooling emissions
- Assess renewable energy usage
- Apply location vs. market-based methods

### Scope 3 Emissions (Value Chain)
- Estimate supply chain emissions
- Calculate business travel impact
- Assess employee commuting
- Evaluate product use and end-of-life

### Impact Analysis
- Benchmark against industry standards
- Project emissions trajectory
- Model reduction scenarios
- Calculate carbon intensity metrics

## Usage

### Estimate Carbon Footprint
```
Input: Company operations data, energy usage
Process: Apply emission factors, calculate totals
Output: Carbon footprint by scope, total CO2e
```

### Benchmark Emissions
```
Input: Company footprint, industry sector
Process: Compare against benchmarks
Output: Benchmark comparison, percentile ranking
```

### Project Trajectory
```
Input: Current footprint, growth plans
Process: Model future emissions scenarios
Output: Trajectory projection, growth-adjusted
```

### Model Reduction Scenarios
```
Input: Current state, reduction initiatives
Process: Calculate reduction impact
Output: Scenario analysis, pathway to goals
```

## Emission Categories

| Scope | Categories | Data Sources |
|-------|------------|--------------|
| Scope 1 | Facilities, vehicles, processes | Fuel usage, fleet data |
| Scope 2 | Electricity, heating | Utility bills, provider mix |
| Scope 3 | Supply chain, travel, commuting | Spend data, travel records |

## Integration Points

- **ESG Scorer**: Feed emissions data into ESG scores
- **ESG Due Diligence**: Core environmental analysis
- **ESG Analyst (Agent)**: Support environmental assessment
- **Portfolio Value Creation**: Track reduction initiatives

## Calculation Standards

- Greenhouse Gas Protocol (GHG Protocol)
- Science Based Targets initiative (SBTi)
- CDP (Carbon Disclosure Project)
- ISO 14064 GHG accounting standards

## Best Practices

1. Prioritize Scope 1 and 2 for direct control
2. Use sector-appropriate emission factors
3. Distinguish location vs. market-based Scope 2
4. Focus Scope 3 on material categories
5. Track intensity metrics (per revenue, per employee)
