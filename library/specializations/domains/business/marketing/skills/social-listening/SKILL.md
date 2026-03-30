---
name: social-listening
description: Brand monitoring, sentiment analysis, and social intelligence
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
  skill-id: SK-010
  dependencies:
    - Brandwatch API
    - Sprinklr API
    - Mention API
---

# Social Listening Platform Skill

## Overview

The Social Listening Platform skill provides brand monitoring, sentiment analysis, and social intelligence capabilities. This skill enables comprehensive social conversation monitoring, trend detection, and competitive social analysis.

## Capabilities

### Brand Monitoring
- Brandwatch query building
- Sprinklr listening configuration
- Mention alert setup
- Real-time monitoring
- Crisis detection

### Sentiment Analysis
- Automated sentiment analysis
- Emotion detection
- Topic sentiment
- Trend sentiment tracking
- Comparative sentiment

### Intelligence
- Conversation clustering
- Trend detection
- Influencer identification
- Share of voice calculation
- Topic extraction

### Competitive Analysis
- Competitor social monitoring
- Competitive benchmarking
- Industry conversation tracking
- Campaign monitoring
- Market trend detection

## Usage

### Listening Configuration
```javascript
const listeningConfig = {
  platform: 'Brandwatch',
  queries: {
    brand: {
      terms: ['Company Name', '@CompanyHandle', '#CompanyHashtag'],
      excludes: ['job posting', 'stock price'],
      languages: ['en', 'es', 'fr']
    },
    products: {
      terms: ['Product Name', 'product feature'],
      context: 'product-discussion'
    },
    competitors: {
      terms: ['Competitor A', 'Competitor B'],
      purpose: 'competitive-intelligence'
    },
    industry: {
      terms: ['industry keyword', 'market trend'],
      purpose: 'trend-detection'
    }
  },
  alerts: {
    volumeSpike: { threshold: '200%', action: 'immediate-alert' },
    negativeSentiment: { threshold: '-30%', action: 'escalate' },
    influencerMention: { followerMin: 50000, action: 'alert-team' },
    crisisKeywords: { terms: ['lawsuit', 'recall', 'scandal'], action: 'crisis-protocol' }
  },
  reporting: {
    realtime: 'dashboard',
    daily: 'summary-email',
    weekly: 'comprehensive-report',
    monthly: 'executive-insights'
  }
};
```

## Process Integration

| Process | Integration Points |
|---------|-------------------|
| voice-of-customer-program.js | VoC insights |
| competitive-analysis-research.js | Competitive social |
| brand-health-assessment.js | Brand sentiment |

## Best Practices

1. **Comprehensive Coverage**: Monitor all relevant platforms
2. **Smart Alerts**: Configure meaningful alert thresholds
3. **Context Matters**: Understand context before acting
4. **Competitor Inclusion**: Always track competitors
5. **Actionable Insights**: Turn data into decisions

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Brand Sentiment | Overall sentiment score | >70% positive |
| Share of Voice | Social conversation share | Growing |
| Alert Response | Time to respond to alerts | <30 min |
| Insight Utilization | Insights acted upon | High |

## Related Skills

- SK-009: Social Media Management (engagement)
- SK-002: Competitive Intelligence (competitive)
- SK-004: Brand Tracking (brand health)
