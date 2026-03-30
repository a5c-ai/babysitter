---
name: deal-scoring-engine
description: Automated deal scoring based on thesis alignment, market size, team, and traction metrics
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
  skill-id: vc-skill-003
---

# Deal Scoring Engine

## Overview

The Deal Scoring Engine skill provides automated, consistent evaluation of investment opportunities against defined criteria. It generates composite scores based on thesis alignment, market opportunity, team quality, and business traction to support pipeline prioritization and investment decisions.

## Capabilities

### Thesis Alignment Scoring
- Match opportunities against fund investment thesis
- Sector, stage, and geography fit assessment
- Strategic priority alignment scoring
- Anti-thesis and exclusion criteria flagging

### Market Opportunity Assessment
- TAM/SAM/SOM scoring based on market data
- Market growth rate and timing assessment
- Competitive intensity evaluation
- Regulatory and macro environment scoring

### Team Evaluation Scoring
- Founder background and experience assessment
- Domain expertise and market knowledge scoring
- Team completeness and capability gaps
- Track record and references scoring

### Traction and Metrics Scoring
- Revenue and growth rate benchmarking
- Unit economics (LTV/CAC, margins) scoring
- Engagement and retention metrics assessment
- Capital efficiency and burn rate evaluation

### Composite Score Generation
- Weighted composite scoring with configurable weights
- Stage-appropriate scoring models (seed vs. growth)
- Sector-specific scoring adjustments
- Historical score calibration against outcomes

## Usage

### Score New Deal
```
Input: Company data, metrics, team information
Process: Apply scoring models across dimensions
Output: Composite score, dimension scores, flags, recommendations
```

### Configure Scoring Model
```
Input: Scoring criteria, weights, thresholds
Process: Update scoring model parameters
Output: Configured scoring model, validation results
```

### Benchmark Against Portfolio
```
Input: Deal scores, portfolio company scores
Process: Compare against portfolio at similar stage
Output: Relative ranking, percentile position, comparisons
```

### Calibrate Model
```
Input: Historical deals and outcomes
Process: Analyze predictive accuracy, adjust weights
Output: Calibration report, recommended adjustments
```

## Scoring Dimensions

| Dimension | Weight Range | Key Factors |
|-----------|--------------|-------------|
| Thesis Fit | 15-25% | Sector, stage, geography, strategy |
| Market | 20-30% | TAM, growth, competition, timing |
| Team | 25-35% | Experience, domain, completeness |
| Traction | 20-30% | Revenue, growth, unit economics |

## Integration Points

- **Deal Flow Tracker**: Embed scores in pipeline management
- **Proactive Deal Sourcing**: Score for outreach prioritization
- **IC Memo Generator**: Include scores in investment memos
- **Market Sizer**: Feed market data into scoring

## Best Practices

1. Calibrate scoring models quarterly against outcomes
2. Use stage-appropriate models (early vs. late stage)
3. Document override decisions when departing from scores
4. Maintain transparency on scoring methodology
5. Avoid over-reliance on scores for complex decisions
