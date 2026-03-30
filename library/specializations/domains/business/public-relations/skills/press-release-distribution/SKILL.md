---
name: press-release-distribution
description: Wire service integration and press release distribution management
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
  category: Media Relations
  skill-id: SK-004
  dependencies:
    - PR Newswire API
    - Business Wire API
    - GlobeNewswire API
---

# Press Release Distribution Skill

## Overview

The Press Release Distribution skill provides comprehensive wire service integration and press release distribution management capabilities. This skill enables efficient distribution planning, execution, and tracking across major wire services and distribution channels.

## Capabilities

### Wire Service Integration
- PR Newswire API integration
- Business Wire distribution management
- GlobeNewswire circuit selection
- Regional wire service access
- International distribution networks

### Distribution Planning
- Distribution circuit optimization
- Geographic targeting configuration
- Industry/sector targeting
- Outlet category selection
- Cost optimization

### Content Management
- Embargo management
- Multimedia asset attachment
- Photo and video embedding
- Infographic distribution
- Document attachments

### Compliance and Formatting
- SEC compliance for financial releases
- Regulatory disclosure requirements
- Wire service formatting standards
- Headline optimization
- Boilerplate management

### Tracking and Analytics
- Distribution tracking and reporting
- Pickup monitoring
- Engagement analytics
- Geographic reach analysis
- Outlet reach reporting

## Usage

### Distribution Configuration
```javascript
const distributionConfig = {
  wireService: 'PR Newswire',
  release: {
    headline: 'Company X Announces Revolutionary AI Platform',
    subheadline: 'New technology promises 10x productivity gains',
    body: '[Press release content]',
    boilerplate: 'standard-company-boilerplate',
    contact: {
      name: 'Media Relations',
      email: 'media@company.com',
      phone: '555-123-4567'
    }
  },
  distribution: {
    timing: {
      date: '2026-02-01',
      time: '09:00 ET',
      embargo: null
    },
    circuits: {
      primary: 'US1',
      additional: ['Technology', 'Artificial Intelligence']
    },
    geographic: {
      national: true,
      regions: ['Northeast', 'West Coast'],
      international: ['UK', 'Germany']
    },
    outlets: {
      includeTrades: true,
      includeFinancial: true,
      excludeList: []
    }
  },
  multimedia: {
    logo: 'company-logo.jpg',
    productImage: 'ai-platform-screenshot.png',
    video: 'product-demo.mp4'
  },
  tracking: {
    pickupMonitoring: true,
    engagementTracking: true,
    reportSchedule: ['immediate', '24h', '7d']
  }
};
```

### Distribution Report
```javascript
const distributionReport = {
  release: 'AI Platform Launch - 2026-02-01',
  wire: 'PR Newswire',
  distribution: {
    totalCircuits: 5,
    estimatedReach: 45000,
    geographicCoverage: ['US', 'UK', 'Germany']
  },
  pickups: {
    total: 245,
    tier1: 12,
    tier2: 45,
    online: 188,
    categories: {
      technology: 89,
      business: 67,
      financial: 34,
      regional: 55
    }
  },
  engagement: {
    views: 15000,
    downloads: 450,
    shares: 125,
    clickthroughs: 890
  },
  topPickups: [
    { outlet: 'Yahoo Finance', reach: 5000000 },
    { outlet: 'MarketWatch', reach: 3500000 },
    { outlet: 'TechCrunch', reach: 2000000 }
  ]
};
```

## Process Integration

This skill integrates with the following PR processes:

| Process | Integration Points |
|---------|-------------------|
| press-release-development.js | Distribution execution |
| investor-communications-support.js | Financial disclosures |
| csr-communications.js | CSR announcements |
| annual-report-production.js | Annual report distribution |

## Best Practices

1. **Timing Optimization**: Schedule releases for optimal pickup
2. **Circuit Selection**: Choose circuits aligned with target audience
3. **Multimedia Enhancement**: Include images and video for engagement
4. **Compliance First**: Ensure regulatory compliance for financial releases
5. **Monitor Pickups**: Track distribution success actively
6. **Post-Analysis**: Review pickup patterns to optimize future releases

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Total Pickups | News outlets carrying release | Industry benchmark |
| Tier 1 Pickups | Top-tier outlet coverage | Consistent presence |
| Engagement Rate | Views and interactions | Above average |
| Cost Efficiency | Cost per pickup | Optimizing |
| Geographic Reach | Coverage distribution | Target markets |

## Related Skills

- SK-003: Media Database (supplemental outreach)
- SK-011: AP Style Writing (release formatting)
- SK-016: Investor Relations Platform (IR releases)
