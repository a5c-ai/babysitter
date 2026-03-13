---
name: competitive-intelligence
description: Integration with competitive intelligence tools for monitoring and analysis
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
  skill-id: SK-002
  dependencies:
    - Semrush API
    - SimilarWeb API
    - Crayon API
---

# Competitive Intelligence Platform Skill

## Overview

The Competitive Intelligence Platform skill provides integration with competitive intelligence tools for comprehensive competitor monitoring and analysis. This skill enables systematic tracking of competitor activities, market positioning, and strategic insights.

## Capabilities

### Digital Intelligence
- Semrush competitor tracking
- SimilarWeb traffic analysis
- SEO competitive analysis
- Paid media monitoring
- Content performance tracking

### Strategic Intelligence
- Crayon competitive intelligence
- Klue battlecard management
- Win/loss analysis tracking
- Competitive positioning maps
- Strategy change detection

### Market Monitoring
- Owler company monitoring
- Press release tracking
- Patent and trademark monitoring
- Job posting analysis
- M&A activity tracking

### Pricing and Product
- Pricing intelligence gathering
- Feature comparison tracking
- Product launch monitoring
- Roadmap intelligence
- Review mining

## Usage

### Competitive Dashboard
```javascript
const competitiveDashboard = {
  competitors: ['Competitor A', 'Competitor B', 'Competitor C'],
  monitoring: {
    digital: {
      traffic: { source: 'SimilarWeb', frequency: 'monthly' },
      seo: { source: 'Semrush', frequency: 'weekly' },
      paidMedia: { source: 'Semrush', frequency: 'weekly' }
    },
    strategic: {
      news: { source: 'Crayon', frequency: 'real-time' },
      product: { source: 'Crayon', frequency: 'real-time' },
      pricing: { source: 'manual + Crayon', frequency: 'quarterly' }
    },
    content: {
      blog: { source: 'Semrush', frequency: 'weekly' },
      socialMedia: { source: 'Sprout Social', frequency: 'weekly' }
    }
  },
  outputs: {
    battlecards: { frequency: 'quarterly', tool: 'Klue' },
    newsletter: { frequency: 'monthly', recipients: 'sales + marketing' },
    alerts: { frequency: 'real-time', criteria: 'major-changes' }
  }
};
```

## Process Integration

| Process | Integration Points |
|---------|-------------------|
| competitive-analysis-research.js | Full workflow |
| brand-positioning-development.js | Competitive positioning |
| customer-segmentation-analysis.js | Market analysis |

## Best Practices

1. **Systematic Tracking**: Monitor competitors consistently
2. **Multiple Sources**: Triangulate from various data sources
3. **Actionable Outputs**: Create usable battlecards and briefs
4. **Timely Updates**: Keep intelligence current
5. **Ethical Boundaries**: Stay within legal and ethical limits

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Coverage | Competitors monitored | All major competitors |
| Freshness | Age of competitive data | <30 days |
| Win Rate | Competitive win rate improvement | Increasing |
| Sales Utilization | Battlecard usage by sales | >80% |

## Related Skills

- SK-001: Market Research Platform (primary research)
- SK-010: Social Listening (social competitive)
- SK-007: SEO Tools (SEO competitive)
