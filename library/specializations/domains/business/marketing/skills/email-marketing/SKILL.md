---
name: email-marketing
description: Email marketing platform operations and deliverability management
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
  skill-id: SK-013
  dependencies:
    - Mailchimp API
    - Klaviyo API
    - SendGrid API
---

# Email Marketing Platform Skill

## Overview

The Email Marketing Platform skill provides email marketing platform operations and deliverability management capabilities. This skill enables effective email campaign management, list management, and deliverability optimization.

## Capabilities

### Campaign Management
- Mailchimp campaign management
- Klaviyo flow builder
- Campaign creation and scheduling
- Template management
- Dynamic content personalization

### Email Development
- Email template creation (MJML/HTML)
- Responsive email design
- Email rendering testing
- Dark mode optimization
- Accessibility compliance

### List Management
- List segmentation and management
- Subscriber preference management
- List hygiene and cleaning
- Suppression management
- Data quality monitoring

### Deliverability
- SendGrid transactional setup
- Deliverability monitoring
- Spam score analysis
- Authentication (SPF, DKIM, DMARC)
- Inbox placement tracking

## Usage

### Email Campaign Configuration
```javascript
const emailCampaign = {
  platform: 'Klaviyo',
  campaign: {
    name: 'Product Launch - February 2026',
    type: 'promotional',
    audience: {
      list: 'engaged-subscribers',
      segment: 'opened-in-90-days',
      excludes: ['unsubscribed', 'hard-bounced']
    },
    content: {
      template: 'product-launch-v2',
      subject: {
        variants: [
          'Introducing Our Newest Innovation',
          'You\'re Going to Love This'
        ],
        testing: 'ab-test'
      },
      preheader: 'Be the first to experience our latest product',
      personalization: ['first_name', 'product_interest']
    },
    scheduling: {
      sendTime: 'optimal-time',
      timezone: 'recipient',
      throttle: false
    },
    tracking: {
      opens: true,
      clicks: true,
      conversions: true,
      utm: {
        source: 'email',
        medium: 'promotional',
        campaign: 'product-launch-feb-2026'
      }
    }
  },
  deliverability: {
    warmup: false,
    authentication: {
      spf: 'configured',
      dkim: 'configured',
      dmarc: 'configured'
    },
    reputation: {
      senderScore: 95,
      domainReputation: 'good'
    }
  }
};
```

## Process Integration

| Process | Integration Points |
|---------|-------------------|
| email-marketing-automation.js | Full workflow |
| campaign-creative-development.js | Email creative |
| ab-testing-program.js | Email testing |

## Best Practices

1. **Permission-Based**: Only email subscribers who opted in
2. **List Hygiene**: Regularly clean and maintain lists
3. **Mobile First**: Design for mobile email clients
4. **Test Everything**: A/B test subjects, content, timing
5. **Monitor Deliverability**: Track inbox placement actively

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Deliverability | Inbox placement rate | >95% |
| Open Rate | Email opens | >20% |
| Click Rate | Email clicks | >3% |
| Unsubscribe Rate | Unsubscribes | <0.5% |

## Related Skills

- SK-006: Marketing Automation (automation)
- SK-016: Creative Testing (creative optimization)
- SK-015: Customer Data Platform (segmentation)
