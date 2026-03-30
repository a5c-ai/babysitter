---
name: transfer-pricing-analyzer
description: Intercompany transfer pricing analysis skill with benchmarking and documentation generation
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: finance-accounting
  domain: business
  category: tax
  priority: lower
---

# Transfer Pricing Analyzer

## Overview

The Transfer Pricing Analyzer skill provides comprehensive transfer pricing analysis capabilities. It supports arm's length pricing determination, benchmarking studies, and regulatory documentation requirements across multiple jurisdictions.

## Capabilities

### Comparable Company Search
- Industry classification criteria
- Geographic filtering
- Size parameters
- Functional comparability
- Independence screening
- Data availability assessment

### Arm's Length Price Determination
- Method selection analysis
- Best method rule application
- Comparable adjustments
- Working capital adjustments
- Risk adjustments
- Profit level indicators

### Profit Split Analysis
- Contribution analysis
- Residual profit split
- Comparable profit split
- Routine vs. non-routine returns
- Intangible allocation
- Synergy attribution

### TNMM/CPM Calculations
- Net margin analysis
- Berry ratio computation
- Operating margin calculations
- Return on assets
- Return on capital employed
- Interquartile range determination

### Documentation Template Generation
- Master file preparation
- Local file creation
- Industry analysis sections
- Functional analysis narrative
- Economic analysis write-up
- Financial data schedules

### Country-by-Country Reporting
- CbCR data collection
- Revenue allocation
- Profit allocation
- Tax paid tracking
- Employee counts
- Tangible asset allocation

## Usage

### Benchmarking Study
```
Input: Controlled transaction details, comparability criteria
Process: Search for comparables, apply adjustments, determine range
Output: Benchmarking report, arm's length range, documentation
```

### Policy Development
```
Input: Business model, value chain analysis, risk allocation
Process: Develop pricing methodology aligned with functions/risks
Output: Transfer pricing policy, implementation guidance
```

## Integration

### Used By Processes
- Transfer Pricing Documentation
- Intercompany Accounting and Consolidation
- Income Tax Provision and ASC 740

### Tools and Libraries
- TP databases (BvD Orbis, S&P Capital IQ)
- Benchmarking tools
- Statistical analysis software

## Best Practices

1. Update benchmarking studies on appropriate cycle
2. Align pricing with actual functions, assets, risks
3. Document business rationale for arrangements
4. Maintain contemporaneous documentation
5. Monitor regulatory changes across jurisdictions
6. Coordinate with business on intercompany agreements
