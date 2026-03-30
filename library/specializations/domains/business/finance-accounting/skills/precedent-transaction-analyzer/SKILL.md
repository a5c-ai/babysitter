---
name: precedent-transaction-analyzer
description: M&A precedent transaction analysis skill with deal sourcing and premium analysis
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
  priority: lower
---

# Precedent Transaction Analyzer

## Overview

The Precedent Transaction Analyzer skill provides comprehensive M&A transaction analysis capabilities. It enables deal sourcing, multiple extraction, and premium analysis to support valuation and negotiation in M&A contexts.

## Capabilities

### Transaction Database Search
- Deal database querying
- Industry filtering
- Date range selection
- Deal size parameters
- Transaction type filtering
- Geographic focus

### Deal Multiple Extraction
- Enterprise value calculation
- LTM multiple computation
- NTM multiple extraction
- Revenue multiple analysis
- EBITDA multiple calculation
- Transaction-specific metrics

### Control Premium Analysis
- Unaffected price determination
- Premium calculation methodology
- Time period selection
- Volume-weighted analysis
- 52-week high comparison
- Offer price evolution

### Synergy Consideration
- Announced synergy extraction
- Synergy multiple calculation
- Synergy-adjusted analysis
- Integration cost consideration
- Revenue synergy treatment
- Run-rate normalization

### Deal Structure Comparison
- Cash vs. stock consideration
- Collar mechanisms
- Earnout structures
- CVR analysis
- Break fee comparison
- Deal protection mechanisms

### Timeline and Sector Filtering
- Transaction timing
- Economic cycle consideration
- Sector-specific analysis
- Cross-border filtering
- Strategic vs. financial buyers
- Public vs. private targets

## Usage

### Precedent Analysis
```
Input: Target profile, transaction criteria, date range
Process: Search deals, extract multiples, calculate premiums
Output: Transaction analysis, comparable deals, valuation range
```

### Deal Benchmarking
```
Input: Proposed transaction terms, comparable deals
Process: Compare terms, analyze premiums, assess structure
Output: Deal benchmark analysis, negotiation points, market positioning
```

## Integration

### Used By Processes
- M&A Financial Due Diligence
- Comparable Company Analysis
- Capital Investment Appraisal

### Tools and Libraries
- M&A databases (Refinitiv)
- PitchBook
- Deal comps tools
- Press release parsing

## Best Practices

1. Use transactions from relevant time period
2. Adjust for market condition differences
3. Consider strategic rationale similarity
4. Account for synergy expectations
5. Document deal-specific circumstances
6. Cross-reference with trading analysis
