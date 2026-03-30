---
name: comparable-company-analyzer
description: Public company comparable analysis skill with peer selection, multiple calculation, and football field visualization
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: finance-accounting
  domain: business
  category: investment-analysis
  priority: medium
---

# Comparable Company Analyzer

## Overview

The Comparable Company Analyzer skill provides comprehensive public company trading analysis capabilities. It enables peer universe selection, trading multiple calculation, and valuation benchmarking through systematic comparable analysis.

## Capabilities

### Peer Universe Selection
- Industry classification screening
- Size parameter filtering
- Geographic focus alignment
- Business model similarity
- Growth profile matching
- Margin profile comparison

### Trading Multiple Calculation
- Enterprise value multiples (EV/EBITDA, EV/Revenue)
- Price multiples (P/E, P/B, PEG)
- Industry-specific metrics
- Adjusted metrics calculation
- Diluted share counts
- Net debt calculation

### LTM and NTM Metric Normalization
- Last twelve months calculation
- Next twelve months estimates
- Calendarization adjustments
- Non-recurring item adjustment
- Stock compensation normalization
- Pro forma adjustments

### Outlier Identification
- Statistical outlier detection
- Interquartile range analysis
- Company-specific explanation
- Inclusion/exclusion rationale
- Sensitivity to outliers
- Documentation requirements

### Football Field Chart Generation
- Multiple methodology ranges
- Implied valuation bands
- Median and mean markers
- Current trading position
- Historical trading context
- Presentation formatting

### Equity Value Bridge
- Enterprise to equity value
- Debt deduction
- Cash addition
- Minority interest
- Preferred stock
- Other adjustments

## Usage

### Trading Comparables Analysis
```
Input: Target company, selection criteria, market data
Process: Build peer universe, calculate multiples, determine range
Output: Comparable company analysis, implied valuation, benchmark report
```

### Relative Valuation
```
Input: Target metrics, comparable multiples, adjustments
Process: Apply multiples, bridge to equity value
Output: Valuation range, sensitivity analysis, peer positioning
```

## Integration

### Used By Processes
- Comparable Company Analysis
- M&A Financial Due Diligence
- Discounted Cash Flow (DCF) Valuation

### Tools and Libraries
- Capital IQ API
- FactSet
- Bloomberg Terminal
- Financial databases

## Best Practices

1. Document peer selection rationale
2. Use consistent data sources across peers
3. Adjust for non-recurring items consistently
4. Consider trading liquidity in weighting
5. Update analysis for market movements
6. Cross-check against transaction multiples
