---
name: brand-tracking
description: Brand health measurement and tracking platform integration
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
  category: Brand Strategy
  skill-id: SK-004
  dependencies:
    - Qualtrics Brand XM
    - Latana API
    - Brand24 API
---

# Brand Tracking Platform Skill

## Overview

The Brand Tracking Platform skill provides brand health measurement and tracking capabilities. This skill enables comprehensive brand performance monitoring, competitive benchmarking, and brand equity analysis.

## Capabilities

### Awareness Tracking
- Brand awareness tracking (aided/unaided)
- Top-of-mind awareness
- Category awareness
- Competitor awareness tracking
- Awareness funnel analysis

### Brand Perception
- Brand attribute tracking
- Keller CBBE model measurement
- Brand personality assessment
- Emotional associations
- Competitive perception mapping

### Brand Performance
- Net Promoter Score (NPS) measurement
- Purchase consideration
- Brand preference
- Usage and loyalty
- Share of voice calculation

### Advanced Analysis
- Brand lift study design
- Brand equity valuation support
- Perceptual mapping
- Driver analysis
- Trend forecasting

## Usage

### Brand Health Dashboard
```javascript
const brandHealthDashboard = {
  metrics: {
    awareness: {
      unaided: { current: 45, prior: 42, target: 50 },
      aided: { current: 78, prior: 75, target: 85 },
      topOfMind: { current: 22, prior: 20, target: 25 }
    },
    perception: {
      favorability: { current: 68, prior: 65, target: 75 },
      consideration: { current: 42, prior: 38, target: 50 },
      preference: { current: 28, prior: 25, target: 35 }
    },
    loyalty: {
      nps: { current: 35, prior: 32, target: 45 },
      repeatPurchase: { current: 65, prior: 62, target: 70 },
      recommendation: { current: 55, prior: 52, target: 65 }
    }
  },
  attributes: {
    innovative: { score: 72, change: '+3' },
    trustworthy: { score: 68, change: '+1' },
    quality: { score: 75, change: '+2' },
    valueForMoney: { score: 62, change: '-1' }
  },
  competitive: {
    'Our Brand': { awareness: 45, favorability: 68, nps: 35 },
    'Competitor A': { awareness: 52, favorability: 65, nps: 38 },
    'Competitor B': { awareness: 38, favorability: 60, nps: 30 }
  },
  tracking: {
    frequency: 'quarterly',
    methodology: 'online-panel',
    sampleSize: 1000
  }
};
```

## Process Integration

| Process | Integration Points |
|---------|-------------------|
| brand-health-assessment.js | Full workflow |
| brand-positioning-development.js | Positioning tracking |
| voice-of-customer-program.js | Brand perception |

## Best Practices

1. **Consistent Methodology**: Use same methodology over time
2. **Sufficient Sample**: Ensure statistically valid samples
3. **Competitive Context**: Always track vs. competitors
4. **Action Orientation**: Connect metrics to strategy
5. **Long-Term View**: Focus on trends, not fluctuations

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Brand Awareness | Unaided brand recall | Growing |
| NPS | Net Promoter Score | Above industry |
| Consideration | Purchase consideration | Top 3 |
| Favorability | Brand favorability | >70% |

## Related Skills

- SK-001: Market Research Platform (research execution)
- SK-010: Social Listening (social brand sentiment)
- SK-003: Brand Asset Management (brand assets)
