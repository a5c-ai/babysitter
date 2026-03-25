---
name: paid-media-platforms
description: Cross-platform paid advertising management and optimization
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
  category: Digital Marketing
  skill-id: SK-008
  dependencies:
    - Google Ads API
    - Meta Marketing API
    - LinkedIn Marketing API
---

# Paid Media Platform Skill

## Overview

The Paid Media Platform skill provides cross-platform paid advertising management and optimization capabilities. This skill enables comprehensive paid media campaign management across search, social, display, and programmatic channels.

## Capabilities

### Search Advertising
- Google Ads campaign management
- Microsoft Advertising integration
- Keyword strategy and bidding
- Ad copy optimization
- Quality Score improvement

### Social Advertising
- Meta Ads Manager integration
- LinkedIn Campaign Manager
- Twitter Ads API
- TikTok Ads management
- Platform-specific creative

### Programmatic
- Programmatic DSP operations
- Audience targeting configuration
- Retargeting campaigns
- Connected TV advertising
- Native advertising

### Optimization
- Bid strategy optimization
- Budget allocation and pacing
- Creative asset management
- Cross-channel budget allocation
- Performance forecasting

## Usage

### Campaign Configuration
```javascript
const campaignConfig = {
  platforms: {
    search: {
      platform: 'Google Ads',
      campaigns: [
        {
          name: 'Brand - Search',
          objective: 'conversions',
          budget: 5000,
          bidStrategy: 'target-cpa',
          targetCpa: 50
        },
        {
          name: 'Non-Brand - Search',
          objective: 'conversions',
          budget: 15000,
          bidStrategy: 'maximize-conversions'
        }
      ]
    },
    social: {
      platform: 'Meta Ads',
      campaigns: [
        {
          name: 'Prospecting - Lookalike',
          objective: 'lead-generation',
          budget: 10000,
          audience: 'lookalike-customers-1%',
          placements: ['facebook-feed', 'instagram-feed', 'instagram-stories']
        },
        {
          name: 'Retargeting - Website Visitors',
          objective: 'conversions',
          budget: 5000,
          audience: 'website-visitors-30d',
          excludeAudience: 'customers'
        }
      ]
    }
  },
  totalBudget: 50000,
  allocation: {
    search: 40,
    social: 35,
    programmatic: 15,
    linkedin: 10
  }
};
```

## Process Integration

| Process | Integration Points |
|---------|-------------------|
| sem-campaign-management.js | Search campaigns |
| paid-social-advertising.js | Social campaigns |
| integrated-campaign-planning.js | Full media planning |
| campaign-performance-analysis.js | Performance tracking |

## Best Practices

1. **Clear Objectives**: Define campaign goals upfront
2. **Audience Strategy**: Build sophisticated targeting
3. **Creative Testing**: Continuously test creative
4. **Budget Optimization**: Allocate based on performance
5. **Cross-Channel View**: Manage holistically

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| ROAS | Return on ad spend | >4x |
| CPA | Cost per acquisition | Below target |
| CTR | Click-through rate | Above benchmark |
| Conversion Rate | Ad conversion rate | Improving |

## Related Skills

- SK-005: Marketing Analytics (measurement)
- SK-016: Creative Testing (creative optimization)
- SK-019: Media Mix Modeling (channel optimization)
