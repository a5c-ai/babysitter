---
name: creative-testing
description: Creative asset testing and optimization tools
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
  category: Campaign Management
  skill-id: SK-016
  dependencies:
    - Creative testing platform APIs
---

# Creative Testing Platform Skill

## Overview

The Creative Testing Platform skill provides creative asset testing and optimization capabilities. This skill enables data-driven creative development, testing, and optimization across marketing channels.

## Capabilities

### Pre-Launch Testing
- Creative effectiveness testing
- Attention prediction (Neurons, Tobii)
- Brand safety scoring
- Message comprehension testing
- Emotional response analysis

### Performance Testing
- Multivariate creative testing
- Dynamic creative optimization
- Ad creative benchmarking
- Landing page testing
- Video creative testing

### Ongoing Optimization
- Creative fatigue monitoring
- Performance trending
- Creative refresh recommendations
- Winning creative scaling
- Cross-channel creative learning

### Analytics
- Creative performance analytics
- Element-level analysis
- Thumbnail and image testing
- Copy variation analysis
- Visual attention mapping

## Usage

### Creative Test Configuration
```javascript
const creativeTest = {
  campaign: 'Q1 2026 Brand Campaign',
  channel: 'paid-social',
  testType: 'multivariate',
  elements: {
    headlines: [
      'Transform Your Business Today',
      'The Future of Work is Here',
      'Unlock Your Team\'s Potential'
    ],
    images: [
      'hero-product-shot.jpg',
      'lifestyle-office.jpg',
      'abstract-tech.jpg'
    ],
    ctas: [
      'Learn More',
      'Get Started',
      'Try Free'
    ]
  },
  setup: {
    platform: 'Meta Ads',
    budget: 5000,
    duration: '14 days',
    audience: 'prospecting-lookalike',
    objective: 'conversions',
    minimumSampleSize: 1000
  },
  metrics: {
    primary: 'conversion-rate',
    secondary: ['ctr', 'cpc', 'video-completion'],
    confidence: 0.95
  },
  results: {
    winner: {
      headline: 'Transform Your Business Today',
      image: 'lifestyle-office.jpg',
      cta: 'Get Started'
    },
    improvement: {
      conversionRate: '+23%',
      ctr: '+15%',
      cpc: '-12%'
    }
  }
};
```

## Process Integration

| Process | Integration Points |
|---------|-------------------|
| campaign-creative-development.js | Creative testing |
| ab-testing-program.js | Testing methodology |
| campaign-performance-analysis.js | Performance tracking |

## Best Practices

1. **Statistical Significance**: Wait for sufficient data
2. **Isolate Variables**: Test one element at a time when possible
3. **Document Learnings**: Build creative knowledge base
4. **Apply Learnings**: Scale winning creative
5. **Monitor Fatigue**: Refresh creative proactively

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Test Velocity | Tests run per month | >4 |
| Win Rate | Tests producing winners | >30% |
| Lift | Average improvement | >15% |
| Learning Rate | Insights documented | All tests |

## Related Skills

- SK-008: Paid Media Platforms (ad deployment)
- SK-013: Email Marketing (email creative)
- SK-003: Brand Asset Management (brand compliance)
