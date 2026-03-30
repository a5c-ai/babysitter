---
name: thesis-matching
description: Matches inbound deals against investment thesis criteria and fund strategy
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
  skill-id: vc-skill-004
---

# Thesis Matching

## Overview

The Thesis Matching skill provides systematic matching of inbound investment opportunities against the fund's investment thesis, strategic priorities, and portfolio construction criteria. It enables rapid triage of deal flow while ensuring alignment with fund strategy.

## Capabilities

### Investment Thesis Encoding
- Encode multi-dimensional investment thesis criteria
- Define sector focus areas and exclusions
- Specify stage preferences and check size ranges
- Articulate strategic themes and conviction areas

### Deal Matching Analysis
- Match incoming deals against thesis dimensions
- Score alignment across criteria with weighted importance
- Identify thesis exceptions worth considering
- Flag anti-thesis or exclusion criteria matches

### Portfolio Construction Fit
- Assess portfolio concentration and diversification
- Check against sector and stage allocation targets
- Evaluate vintage year and deployment pacing
- Consider follow-on reserve requirements

### Thesis Evolution Tracking
- Track thesis adjustments over fund lifecycle
- Document thesis exceptions and rationale
- Analyze deal flow patterns vs. thesis alignment
- Support thesis refinement for successor funds

## Usage

### Match Deal to Thesis
```
Input: Deal summary, company data, sector classification
Process: Compare against thesis criteria, score alignment
Output: Thesis match score, alignment details, flags
```

### Triage Inbound Flow
```
Input: Batch of inbound deals
Process: Rapid thesis matching and prioritization
Output: Prioritized list, pass recommendations, review queue
```

### Analyze Portfolio Fit
```
Input: Potential investment, current portfolio
Process: Assess concentration, diversification, reserves
Output: Portfolio fit analysis, construction implications
```

### Update Thesis Definition
```
Input: Revised thesis criteria, rationale
Process: Update thesis model, recalculate pipeline matches
Output: Updated thesis, pipeline re-scoring results
```

## Thesis Dimensions

| Dimension | Typical Criteria |
|-----------|------------------|
| Sector | Software, Healthcare, Fintech, Consumer, etc. |
| Stage | Pre-seed, Seed, Series A, Growth |
| Geography | North America, Europe, Global |
| Business Model | SaaS, Marketplace, Consumer, Deep Tech |
| Check Size | $500K - $2M, $5M - $15M, etc. |
| Themes | AI/ML, Climate, Future of Work, etc. |

## Integration Points

- **Deal Flow Tracker**: Automatic thesis scoring on deal entry
- **Deal Scoring Engine**: Feed thesis match into composite score
- **Proactive Deal Sourcing**: Guide sourcing toward thesis areas
- **IC Memo Generator**: Include thesis alignment analysis

## Best Practices

1. Clearly document thesis with specific, measurable criteria
2. Define "core thesis" vs. "opportunistic" boundaries
3. Track and document all thesis exceptions
4. Review thesis alignment quarterly with deal flow patterns
5. Evolve thesis thoughtfully as market conditions change
