---
name: marketing-analytics
description: Integration with marketing analytics and measurement platforms
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
  category: Marketing Analytics
  skill-id: SK-005
  dependencies:
    - GA4 API
    - Adobe Analytics API
    - Mixpanel API
---

# Marketing Analytics Platform Skill

## Overview

The Marketing Analytics Platform skill provides integration with marketing analytics and measurement platforms. This skill enables comprehensive marketing measurement, attribution modeling, and data-driven optimization.

## Capabilities

### Web Analytics
- Google Analytics 4 implementation
- Adobe Analytics configuration
- Event tracking setup
- Conversion tracking
- User journey analysis

### Product Analytics
- Mixpanel event tracking
- Amplitude product analytics
- Feature usage analysis
- User behavior tracking
- Retention analysis

### Attribution and Measurement
- Custom attribution modeling
- Multi-touch attribution
- Incrementality testing design
- Cohort analysis
- Customer lifetime value calculation

### Advanced Analytics
- Marketing mix modeling (MMM)
- Predictive modeling
- Propensity scoring
- Churn prediction
- Revenue forecasting

## Usage

### Analytics Configuration
```javascript
const analyticsConfig = {
  platforms: {
    web: {
      platform: 'GA4',
      propertyId: 'G-XXXXXXXXXX',
      tracking: {
        pageviews: true,
        scrollDepth: true,
        videoEngagement: true,
        downloads: true
      },
      conversions: [
        'lead_form_submission',
        'demo_request',
        'purchase_complete',
        'trial_start'
      ],
      audiences: [
        'high_intent_visitors',
        'trial_users',
        'engaged_blog_readers'
      ]
    },
    product: {
      platform: 'Mixpanel',
      events: [
        'feature_activated',
        'onboarding_completed',
        'subscription_upgraded'
      ],
      userProperties: [
        'plan_type',
        'company_size',
        'activation_date'
      ]
    }
  },
  attribution: {
    model: 'data-driven',
    lookbackWindow: '90-days',
    touchpoints: ['organic', 'paid', 'email', 'social', 'direct']
  },
  reporting: {
    dashboards: ['executive', 'channel-performance', 'conversion-funnel'],
    frequency: ['daily', 'weekly', 'monthly']
  }
};
```

## Process Integration

| Process | Integration Points |
|---------|-------------------|
| attribution-modeling-setup.js | Attribution configuration |
| marketing-roi-analysis.js | ROI measurement |
| marketing-dashboard-development.js | Dashboard creation |
| customer-journey-analytics.js | Journey analysis |

## Best Practices

1. **Data Quality First**: Ensure accurate tracking implementation
2. **Business Alignment**: Connect metrics to business outcomes
3. **Attribution Transparency**: Understand model limitations
4. **Privacy Compliance**: Respect user consent and privacy
5. **Continuous Optimization**: Use data to drive improvement

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Data Accuracy | Tracking accuracy | >99% |
| Attribution Coverage | Touchpoints tracked | All channels |
| Dashboard Utilization | Active dashboard users | High |
| Insight-to-Action | Data driving decisions | Regular |

## Related Skills

- SK-014: BI Dashboards (visualization)
- SK-015: Customer Data Platform (data unification)
- SK-019: Media Mix Modeling (MMM)
