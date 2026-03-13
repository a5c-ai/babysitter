---
name: term-comparator
description: Compares term sheets against market standards, identifies outliers
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
  skill-id: vc-skill-028
---

# Term Comparator

## Overview

The Term Comparator skill analyzes term sheets against market standards and fund precedents to identify outliers and support negotiation strategy. It enables data-driven term negotiations and ensures consistency with market norms.

## Capabilities

### Market Standard Analysis
- Compare terms against market benchmarks
- Identify investor-favorable vs. founder-favorable terms
- Track market term evolution over time
- Analyze terms by stage and sector

### Precedent Comparison
- Compare against fund's historical terms
- Analyze co-investor standard terms
- Review competitor term patterns
- Build term precedent database

### Outlier Identification
- Flag unusual or non-standard provisions
- Identify terms outside normal ranges
- Highlight aggressive or founder-unfriendly terms
- Note missing standard protections

### Negotiation Support
- Suggest negotiation priorities
- Provide market data for negotiations
- Identify trade-off opportunities
- Model term package alternatives

## Usage

### Compare to Market
```
Input: Term sheet, market comparison parameters
Process: Analyze against benchmarks
Output: Market comparison report, variance analysis
```

### Compare to Precedent
```
Input: Term sheet, precedent set
Process: Compare against historical terms
Output: Precedent comparison, consistency analysis
```

### Identify Outliers
```
Input: Term sheet, outlier thresholds
Process: Flag unusual terms
Output: Outlier report, risk assessment
```

### Support Negotiation
```
Input: Current terms, priorities
Process: Analyze trade-offs, suggest approach
Output: Negotiation strategy, talking points
```

## Comparison Dimensions

| Dimension | Market Range | Notes |
|-----------|--------------|-------|
| Liquidation Preference | 1x non-participating standard | Participating increasingly rare |
| Anti-dilution | Broad-based weighted average | Full ratchet rare |
| Board Composition | Investor minority or balanced | Depends on stage |
| Protective Provisions | Standard set | Watch for unusual vetos |
| Option Pool | 10-15% refresh | Check pre vs. post |

## Integration Points

- **Term Sheet Drafting Process**: Validate generated terms
- **Definitive Document Negotiation**: Support doc negotiations
- **Term Sheet Generator**: Ensure generated terms are standard
- **Term Sheet Negotiator (Agent)**: Support agent negotiations

## Market Data Sources

- NVCA survey data
- Fund precedent database
- Co-investor term patterns
- Legal firm market reports
- Industry benchmarking services

## Best Practices

1. Maintain current market benchmark data
2. Consider stage and sector context
3. Weight precedent by recency
4. Distinguish must-haves from nice-to-haves
5. Consider full term package, not just individual terms
