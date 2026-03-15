---
name: market-sizer
description: TAM/SAM/SOM calculation with data source integration (CB Insights, PitchBook, etc.)
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
  skill-id: vc-skill-007
---

# Market Sizer

## Overview

The Market Sizer skill provides systematic Total Addressable Market (TAM), Serviceable Addressable Market (SAM), and Serviceable Obtainable Market (SOM) calculations. It integrates with industry data sources to build defensible market sizing analyses for investment evaluation.

## Capabilities

### TAM/SAM/SOM Calculation
- Top-down market sizing from industry reports
- Bottom-up market sizing from unit economics
- Value theory sizing from willingness to pay analysis
- Triangulation across multiple methodologies

### Data Source Integration
- CB Insights market data and industry reports
- PitchBook market maps and sizing
- Gartner, Forrester, and industry analyst reports
- Government statistics and census data
- Public company filings and disclosures

### Market Segmentation
- Geographic market segmentation
- Customer segment sizing
- Use case and application segmentation
- Adjacent market opportunity mapping

### Growth Analysis
- Historical market growth rates
- Growth driver identification and analysis
- Market maturity assessment
- Disruption and substitution risk evaluation

## Usage

### Calculate Market Size
```
Input: Market definition, methodology preference, data sources
Process: Gather data, apply sizing methodology, triangulate
Output: TAM/SAM/SOM estimates with methodology documentation
```

### Validate Company Claims
```
Input: Company's market size claims, their methodology
Process: Independent sizing, compare against company claims
Output: Validation assessment, discrepancy analysis
```

### Map Adjacent Markets
```
Input: Core market definition, expansion vectors
Process: Size adjacent opportunities, assess accessibility
Output: Expansion opportunity matrix with sizes
```

### Forecast Market Growth
```
Input: Current market size, growth drivers, timeline
Process: Model growth scenarios with assumptions
Output: Market forecasts with confidence intervals
```

## Sizing Methodologies

| Methodology | Best For | Approach |
|-------------|----------|----------|
| Top-Down | Established markets | Industry reports, public data |
| Bottom-Up | New markets | Unit counts x pricing |
| Value Theory | Disruption plays | Value created x capture rate |
| Comparable | Adjacent markets | Analogy to similar markets |

## Integration Points

- **Commercial Due Diligence**: Feed market size into DD analysis
- **Deal Scoring Engine**: Incorporate market scores
- **VC Method Valuation**: Support exit multiple assumptions
- **IC Memo Generator**: Include market analysis in memos

## Best Practices

1. Always triangulate with multiple methodologies
2. Clearly document assumptions and data sources
3. Define market boundaries precisely
4. Distinguish between current and future market size
5. Account for market creation vs. capture scenarios
