---
name: market-research-platform
description: Integration with market research platforms and survey tools for primary and secondary research
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: marketing
  domain: business
  category: Market Research
  skill-id: SK-001
  dependencies:
    - Qualtrics API
    - SurveyMonkey API
    - Panel provider APIs
---

# Market Research Platform Skill

## Overview

The Market Research Platform skill provides integration with market research platforms and survey tools for conducting primary and secondary research. This skill enables comprehensive research design, deployment, and analysis for marketing insights.

## Capabilities

### Survey Design
- Qualtrics survey design and deployment
- SurveyMonkey campaign management
- Survey logic and branching
- Question library management
- Mobile-optimized surveys

### Panel Management
- Panel provider integrations (Prolific, MTurk)
- Sample size calculation
- Quota management
- Panel quality monitoring
- Respondent screening

### Advanced Research
- Conjoint analysis setup
- MaxDiff analysis configuration
- Focus group recruitment and scheduling
- In-depth interview coordination
- Diary study management

### Analysis and Reporting
- Statistical analysis (SPSS, R integration)
- Survey response analysis and reporting
- Cross-tabulation and segmentation
- Data visualization
- Executive summaries

## Usage

### Survey Configuration
```javascript
const surveyConfig = {
  platform: 'Qualtrics',
  study: {
    name: 'Q1 2026 Brand Health Study',
    type: 'brand-tracking',
    methodology: 'quantitative'
  },
  sample: {
    size: 1000,
    panel: 'Prolific',
    criteria: {
      geography: 'United States',
      age: '25-54',
      demographics: 'nationally-representative'
    },
    quotas: {
      gender: { male: 50, female: 50 },
      region: { northeast: 20, south: 35, midwest: 22, west: 23 }
    }
  },
  survey: {
    estimatedLength: '12 minutes',
    sections: ['screener', 'awareness', 'perception', 'usage', 'nps', 'demographics'],
    branching: true,
    randomization: true
  },
  analysis: {
    tracking: true,
    priorWaves: ['Q4-2025', 'Q3-2025'],
    benchmarks: 'industry-standard'
  }
};
```

## Process Integration

| Process | Integration Points |
|---------|-------------------|
| customer-segmentation-analysis.js | Research execution |
| customer-persona-development.js | Persona research |
| voice-of-customer-program.js | VoC studies |
| brand-health-assessment.js | Brand tracking |

## Best Practices

1. **Clear Objectives**: Define research questions before designing
2. **Sample Quality**: Ensure representative, quality samples
3. **Survey Length**: Keep surveys focused and respondent-friendly
4. **Statistical Rigor**: Use appropriate analysis methods
5. **Actionable Insights**: Focus on findings that drive decisions

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Response Rate | Survey completion rate | >70% |
| Data Quality | Responses passing quality checks | >95% |
| Sample Match | Demographics matching quotas | Within 5% |
| Insight Utilization | Research findings used in decisions | High |

## Related Skills

- SK-002: Competitive Intelligence (market analysis)
- SK-004: Brand Tracking (brand research)
- SK-020: Journey Mapping (customer research)
