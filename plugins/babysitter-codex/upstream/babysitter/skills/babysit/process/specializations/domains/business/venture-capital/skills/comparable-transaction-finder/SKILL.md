---
name: comparable-transaction-finder
description: Searches M&A and funding databases for relevant comparable transactions
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
  skill-id: vc-skill-021
---

# Comparable Transaction Finder

## Overview

The Comparable Transaction Finder skill searches M&A and funding databases to identify relevant comparable transactions for valuation analysis. It supports VC method valuations, exit analysis, and benchmarking by finding appropriate transaction comparables.

## Capabilities

### Funding Round Comparables
- Search for similar-stage funding rounds
- Filter by sector, geography, and size
- Analyze valuation multiples and terms
- Track round timing and market conditions

### M&A Transaction Comparables
- Search acquisition databases
- Identify strategic and financial acquirers
- Analyze deal multiples and structures
- Track earn-out and contingent payments

### Comparable Filtering
- Apply sector and sub-sector filters
- Filter by company stage and metrics
- Apply geographic and timing filters
- Screen for comparable business models

### Comparable Analysis
- Calculate relevant valuation multiples
- Adjust for differences in comparables
- Weight comparables by relevance
- Document selection rationale

## Usage

### Find Funding Comparables
```
Input: Target company profile, search criteria
Process: Search databases, filter results
Output: Comparable funding rounds, multiple analysis
```

### Find M&A Comparables
```
Input: Target profile, acquisition criteria
Process: Search M&A databases, analyze deals
Output: Comparable acquisitions, exit multiples
```

### Build Comparable Set
```
Input: Valuation context, comparability criteria
Process: Select and weight comparables
Output: Curated comparable set, adjustment factors
```

### Analyze Market Conditions
```
Input: Time period, sector focus
Process: Analyze transaction environment
Output: Market conditions assessment, trends
```

## Comparability Factors

| Factor | Importance | Considerations |
|--------|------------|----------------|
| Business Model | High | SaaS vs. marketplace vs. services |
| Stage/Scale | High | Revenue, growth rate, maturity |
| Sector | High | Direct vs. adjacent sector |
| Geography | Medium | US vs. global, regional markets |
| Timing | Medium | Market conditions, recent relevance |
| Profitability | Medium | Margin profile, path to profit |

## Integration Points

- **Comparable Analysis Process**: Core skill for comp analysis
- **VC Method Valuation**: Support exit multiple assumptions
- **Valuation Specialist (Agent)**: Support valuation work
- **Multiple Calculator**: Feed comparables for calculations

## Data Sources

- PitchBook for funding and M&A data
- CB Insights for market intelligence
- Capital IQ for transaction data
- Crunchbase for funding rounds
- SEC filings for public transactions
- Proprietary deal databases

## Best Practices

1. Select comparables thoughtfully, not just by sector
2. Document selection rationale clearly
3. Adjust for meaningful differences
4. Consider market timing and conditions
5. Use multiple comparable sets for triangulation
