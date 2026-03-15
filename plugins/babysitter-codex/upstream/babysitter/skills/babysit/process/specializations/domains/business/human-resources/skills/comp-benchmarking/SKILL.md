---
name: comp-benchmarking
description: Analyze market compensation data and establish competitive pay structures
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: human-resources
  domain: business
  category: Compensation and Benefits
  skill-id: SK-013
  dependencies:
    - Compensation survey data
    - Market pricing tools
---

# Compensation Benchmarking Skill

## Overview

The Compensation Benchmarking skill provides capabilities for analyzing market compensation data and establishing competitive pay structures. This skill enables market percentile positioning, salary range development, and compensation competitiveness monitoring.

## Capabilities

### Survey Data Analysis
- Import and analyze salary survey data
- Blend multiple survey sources
- Age and trend data appropriately
- Handle different data cuts
- Validate data quality

### Market Positioning
- Calculate market percentiles and positioning
- Determine competitive positioning strategy
- Analyze positioning by job family
- Track positioning trends
- Compare against target percentile

### Salary Range Development
- Build salary range structures
- Calculate range spread and midpoint
- Design grade structures
- Create multiple range types (broad, narrow)
- Support geographic differentials

### Scenario Modeling
- Model compensation scenarios and costs
- Project budget impacts
- Analyze merit increase scenarios
- Model structure adjustments
- Calculate cost of living impacts

### Reporting
- Generate market pricing reports
- Create competitiveness summaries
- Build survey participation reports
- Document market data sources
- Track year-over-year trends

### Geographic Analysis
- Create geographic pay differentials
- Analyze location-based pay
- Support remote work pay strategies
- Map cost of labor differences
- Handle multi-location structures

## Usage

### Market Analysis
```javascript
const marketAnalysis = {
  surveys: [
    { source: 'Radford', weight: 40, year: 2026 },
    { source: 'Mercer', weight: 35, year: 2026 },
    { source: 'Compensation Surveys Inc', weight: 25, year: 2025 }
  ],
  aging: {
    rate: 3.5,
    targetDate: '2026-07-01'
  },
  cuts: {
    industry: 'Technology',
    companySize: '1000-5000',
    geography: 'US National'
  },
  jobs: [
    {
      internal: 'Senior Software Engineer',
      surveyMatch: 'Software Engineer IV',
      matchQuality: 'strong'
    }
  ],
  positioning: {
    targetPercentile: 50,
    hotJobs: ['Machine Learning Engineer', 'Security Engineer'],
    hotJobTarget: 75
  }
};
```

### Range Structure Design
```javascript
const rangeStructure = {
  type: 'traditional',
  grades: 10,
  midpointProgression: 12,
  rangeSpread: {
    byGrade: {
      '1-3': 40,
      '4-6': 45,
      '7-10': 50
    }
  },
  overlap: 35,
  anchoring: {
    method: 'market-midpoint',
    targetPercentile: 50
  },
  differentials: {
    geographic: {
      enabled: true,
      tiers: ['Tier 1', 'Tier 2', 'Tier 3']
    }
  }
};
```

## Process Integration

This skill integrates with the following HR processes:

| Process | Integration Points |
|---------|-------------------|
| salary-benchmarking.js | Full market pricing workflow |
| job-evaluation-leveling.js | Job matching |
| pay-equity-analysis.js | Market data input |

## Best Practices

1. **Multiple Sources**: Use at least 2-3 survey sources
2. **Quality Matching**: Ensure strong job matches to market data
3. **Regular Updates**: Refresh market data at least annually
4. **Consistent Methodology**: Apply aging and cuts consistently
5. **Documentation**: Document all assumptions and methodology
6. **Stakeholder Communication**: Explain positioning philosophy

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Compa-Ratio | Employee pay vs. range midpoint | 95-105% |
| Market Position | Actual percentile vs. target | Within 5 points |
| Range Penetration | Distribution within ranges | Normal distribution |
| External Competitiveness | Offer acceptance rate | >85% |
| Survey Participation | Surveys participated in | >3 annually |

## Related Skills

- SK-012: Job Evaluation (job matching)
- SK-014: Pay Equity (equity analysis)
