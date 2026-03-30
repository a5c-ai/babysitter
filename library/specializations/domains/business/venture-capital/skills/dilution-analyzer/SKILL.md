---
name: dilution-analyzer
description: Models dilution impact across funding rounds, option pool expansions
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
  skill-id: vc-skill-026
---

# Dilution Analyzer

## Overview

The Dilution Analyzer skill models ownership dilution across funding rounds, option pool expansions, and other equity events. It helps investors understand dilution mechanics and project ownership evolution through future financing scenarios.

## Capabilities

### Round Dilution Modeling
- Calculate dilution from new financing rounds
- Model pre-money vs. post-money mechanics
- Handle pro-rata rights and super pro-rata
- Analyze pay-to-play implications

### Option Pool Analysis
- Model option pool expansions
- Calculate pool shuffle impacts
- Analyze pool placement (pre vs. post)
- Project pool runway and depletion

### Multi-Round Projections
- Model ownership through multiple rounds
- Project dilution across scenarios
- Calculate cumulative dilution impact
- Analyze path to exit ownership

### Anti-Dilution Modeling
- Model weighted average anti-dilution
- Calculate full-ratchet scenarios
- Analyze down-round impacts
- Assess anti-dilution protection value

## Usage

### Model Round Dilution
```
Input: Pre-money valuation, round size, pool
Process: Calculate post-money ownership
Output: Ownership table, dilution percentages
```

### Project Multi-Round Path
```
Input: Current cap table, round assumptions
Process: Model rounds through exit
Output: Ownership projection, cumulative dilution
```

### Analyze Option Pool Impact
```
Input: Pool expansion, placement assumptions
Process: Calculate ownership impact
Output: Pool dilution analysis, placement comparison
```

### Model Anti-Dilution
```
Input: Current terms, down-round scenario
Process: Calculate anti-dilution adjustments
Output: Adjusted ownership, conversion prices
```

## Dilution Components

| Component | Impact |
|-----------|--------|
| New Money | Primary dilution source |
| Option Pool | Often 15-20% pool target |
| Convertibles | SAFE/note conversion |
| Anti-dilution | Protection adjustments |
| Warrants | Additional dilution |

## Integration Points

- **Cap Table Modeling Process**: Core dilution analysis
- **Cap Table Validator**: Validate starting point
- **Scenario Modeler**: Feed dilution into scenarios
- **Cap Table Modeler (Agent)**: Support agent analysis

## Dilution Math

| Metric | Calculation |
|--------|-------------|
| Round Dilution | New Shares / Post-Money Shares |
| Cumulative Dilution | 1 - (Final Ownership / Initial Ownership) |
| Effective Price | Pre-Money / Pre-Money Shares |
| Pool Impact | Pool Shares / Pre-Money Shares |

## Best Practices

1. Understand pre-money vs. post-money pool dynamics
2. Model realistic round sizes and frequencies
3. Consider pro-rata participation assumptions
4. Account for convertible instruments
5. Validate anti-dilution terms carefully
