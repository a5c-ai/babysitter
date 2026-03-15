---
name: media-monitoring
description: Deep integration with media monitoring platforms for coverage tracking, sentiment analysis, and reporting
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
  category: Reputation Monitoring
  skill-id: SK-001
  dependencies:
    - Cision API
    - Meltwater API
    - Brandwatch API
---

# Media Monitoring Skill

## Overview

The Media Monitoring skill provides deep integration with media monitoring platforms for comprehensive coverage tracking, sentiment analysis, and PR measurement reporting. This skill enables real-time awareness of media mentions and brand coverage across all channels.

## Capabilities

### Platform Integration
- Cision API integration for media monitoring
- Meltwater API integration for global coverage
- Brandwatch media monitoring configuration
- Multi-platform data aggregation
- Real-time alert configuration

### Search and Query
- Boolean search query building and optimization
- Keyword and phrase tracking
- Competitor mention tracking
- Executive and spokesperson monitoring
- Industry topic monitoring

### Coverage Analysis
- Media clip aggregation and deduplication
- Outlet tiering and weighting
- Share of voice calculation
- Message pull-through tracking
- Coverage quality scoring

### Sentiment Analysis
- Automated sentiment classification
- Sentiment trend tracking
- Topic-based sentiment analysis
- Comparative sentiment benchmarking
- Alert on sentiment shifts

### Alerting and Reporting
- Coverage alert configuration
- Trend detection and spike alerts
- Automated report generation
- Executive dashboard feeds
- Custom report scheduling

## Usage

### Monitor Configuration
```javascript
const mediaMonitorConfig = {
  client: 'Cision',
  profile: {
    brandTerms: ['Company Name', 'CEO Name', 'Product Names'],
    competitors: ['Competitor A', 'Competitor B'],
    industryTopics: ['Industry Term 1', 'Industry Term 2']
  },
  sources: {
    tiers: {
      tier1: ['WSJ', 'NYT', 'Bloomberg', 'Reuters'],
      tier2: ['Industry Pub 1', 'Industry Pub 2'],
      tier3: ['Regional', 'Trade']
    },
    types: ['print', 'online', 'broadcast', 'podcast']
  },
  alerts: {
    tier1Coverage: { immediate: true, recipients: ['comms-team@company.com'] },
    negativeSentiment: { threshold: -0.5, immediate: true },
    volumeSpike: { multiplier: 2, immediate: true }
  },
  reports: {
    daily: ['coverage-summary'],
    weekly: ['share-of-voice', 'sentiment-trends'],
    monthly: ['comprehensive-analysis']
  }
};
```

### Coverage Analysis
```javascript
const coverageAnalysis = {
  period: 'monthly',
  metrics: {
    totalMentions: 245,
    uniqueOutlets: 87,
    estimatedReach: 45000000,
    shareOfVoice: {
      'Company': 35,
      'Competitor A': 28,
      'Competitor B': 22,
      'Other': 15
    },
    sentimentBreakdown: {
      positive: 45,
      neutral: 48,
      negative: 7
    },
    topOutlets: [
      { name: 'TechCrunch', mentions: 8, sentiment: 'positive' },
      { name: 'WSJ', mentions: 5, sentiment: 'neutral' }
    ],
    messagePullThrough: {
      'Key Message 1': 68,
      'Key Message 2': 45,
      'Key Message 3': 32
    }
  }
};
```

## Process Integration

This skill integrates with the following PR processes:

| Process | Integration Points |
|---------|-------------------|
| reputation-monitoring.js | Real-time coverage tracking |
| reputation-risk-identification.js | Early warning detection |
| media-coverage-analysis.js | Coverage measurement |
| pr-measurement-framework.js | Metrics and reporting |

## Best Practices

1. **Comprehensive Boolean**: Build thorough search queries to capture all relevant coverage
2. **Outlet Tiering**: Weight coverage by outlet quality and relevance
3. **Regular Review**: Monitor alerts and adjust queries as needed
4. **Sentiment Validation**: Periodically validate automated sentiment accuracy
5. **Competitive Context**: Always track competitors for benchmarking
6. **Spike Investigation**: Investigate volume spikes immediately

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Coverage Volume | Total media mentions | Trending upward |
| Share of Voice | % of industry coverage | Leading position |
| Sentiment Score | Average sentiment rating | >70% positive/neutral |
| Message Pull-Through | Key messages appearing | >50% of coverage |
| Tier 1 Coverage | Top-tier outlet mentions | Consistent presence |

## Related Skills

- SK-002: Social Listening (social channel monitoring)
- SK-009: PR Analytics (measurement integration)
- SK-006: Reputation Intelligence (reputation tracking)
