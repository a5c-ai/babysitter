---
name: reputation-intelligence
description: Reputation measurement and benchmarking platform integration
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: public-relations
  domain: business
  category: Reputation Management
  skill-id: SK-006
  dependencies:
    - RepTrak API
    - YouGov API
    - Review platform APIs
---

# Reputation Intelligence Skill

## Overview

The Reputation Intelligence skill provides reputation measurement and benchmarking platform integration capabilities. This skill enables comprehensive reputation tracking, competitive benchmarking, and stakeholder perception analysis across multiple data sources.

## Capabilities

### Reputation Measurement
- RepTrak reputation data integration
- YouGov brand tracking data access
- Brand health index calculation
- Reputation driver analysis
- Trend tracking over time

### Employer Reputation
- Glassdoor employer reputation monitoring
- Indeed company reviews tracking
- Comparably ratings integration
- Employee sentiment analysis
- Employer brand health metrics

### Product/Service Reputation
- G2/Capterra review monitoring
- Trust Pilot integration
- Product review aggregation
- Service quality tracking
- Feature sentiment analysis

### Competitive Benchmarking
- Competitive reputation benchmarking
- Share of reputation analysis
- Relative strength identification
- Gap analysis vs. competitors
- Industry positioning

### Stakeholder Insights
- Net Promoter Score tracking
- Stakeholder perception surveys
- Customer satisfaction correlation
- Investor perception analysis
- Community sentiment tracking

## Usage

### Reputation Dashboard
```javascript
const reputationDashboard = {
  overall: {
    reputationScore: 72.5,
    trend: '+2.3 vs. prior quarter',
    industryRank: 3,
    industryAverage: 68.2
  },
  dimensions: {
    products: { score: 78, trend: '+1.5' },
    innovation: { score: 75, trend: '+3.2' },
    workplace: { score: 71, trend: '+0.8' },
    governance: { score: 70, trend: '-1.2' },
    citizenship: { score: 69, trend: '+2.1' },
    leadership: { score: 73, trend: '+1.8' },
    performance: { score: 74, trend: '+2.5' }
  },
  stakeholders: {
    customers: { nps: 45, satisfaction: 82 },
    employees: { engagement: 75, glassdoor: 4.2 },
    investors: { confidence: 78, recommendation: 68 },
    community: { favorability: 72, awareness: 65 }
  },
  competitive: {
    'Company': 72.5,
    'Competitor A': 75.2,
    'Competitor B': 68.9,
    'Competitor C': 71.3
  }
};
```

### Reputation Alert Configuration
```javascript
const reputationAlerts = {
  thresholds: {
    overallScore: {
      decline: 5,
      action: 'Review and investigate causes'
    },
    glassdoorRating: {
      minimum: 3.5,
      action: 'Employee relations review'
    },
    nps: {
      decline: 10,
      action: 'Customer experience investigation'
    },
    competitiveGap: {
      maximum: 5,
      action: 'Competitive response planning'
    }
  },
  monitoring: {
    frequency: 'daily',
    sources: ['reptrak', 'glassdoor', 'g2', 'trustpilot', 'surveys'],
    recipients: ['cco', 'pr-director', 'hr-director']
  },
  reporting: {
    weekly: ['reputation-summary'],
    monthly: ['competitive-benchmark', 'stakeholder-analysis'],
    quarterly: ['board-reputation-report']
  }
};
```

## Process Integration

This skill integrates with the following PR processes:

| Process | Integration Points |
|---------|-------------------|
| reputation-monitoring.js | Ongoing tracking |
| reputation-risk-identification.js | Risk detection |
| reputation-recovery-strategy.js | Recovery planning |
| executive-visibility-program.js | Leadership reputation |

## Best Practices

1. **Multi-Source Tracking**: Use multiple data sources for comprehensive view
2. **Stakeholder Segmentation**: Track reputation by stakeholder group
3. **Competitive Context**: Always benchmark against competitors
4. **Driver Analysis**: Understand what drives reputation scores
5. **Action Orientation**: Connect metrics to improvement actions
6. **Long-Term View**: Focus on trends, not just point-in-time

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Reputation Score | Overall reputation index | Above industry average |
| NPS | Net Promoter Score | >40 |
| Glassdoor Rating | Employee review average | >4.0 |
| Competitive Position | Rank vs. competitors | Top quartile |
| Dimension Balance | Scores across all dimensions | No dimension below 65 |

## Related Skills

- SK-001: Media Monitoring (media reputation)
- SK-002: Social Listening (social reputation)
- SK-012: Stakeholder CRM (stakeholder tracking)
