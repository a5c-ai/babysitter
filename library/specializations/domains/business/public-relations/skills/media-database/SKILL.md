---
name: media-database
description: Journalist database access and media outreach automation
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
  skill-id: SK-003
  dependencies:
    - Cision API
    - Muck Rack API
    - Propel API
---

# Media Database and Outreach Skill

## Overview

The Media Database and Outreach skill provides access to journalist databases and media outreach automation capabilities. This skill enables efficient media list building, pitch tracking, and relationship management with journalists and media outlets.

## Capabilities

### Database Access
- Cision Connect journalist database access
- Muck Rack journalist search and monitoring
- Propel PRM media list management
- Contact information verification
- Coverage history tracking

### Journalist Intelligence
- Journalist beat and preference tracking
- Recent article and topic monitoring
- Social media activity tracking
- Response rate analytics
- Relationship health scoring

### List Management
- Media list segmentation
- Custom list creation and maintenance
- List sharing and collaboration
- Contact deduplication
- Export and integration capabilities

### Outreach Automation
- Pitch tracking and follow-up automation
- Email deliverability optimization
- Personalization at scale
- A/B testing for pitches
- Coverage linkage to outreach

### Relationship Tracking
- Interaction history logging
- Meeting and call tracking
- Preference documentation
- Exclusivity and embargo tracking
- Relationship tier management

## Usage

### Journalist Search
```javascript
const journalistSearch = {
  criteria: {
    beats: ['Technology', 'Artificial Intelligence', 'Enterprise Software'],
    outlets: {
      types: ['national', 'tech-trade', 'business'],
      tiers: ['tier1', 'tier2']
    },
    geography: ['United States', 'United Kingdom'],
    engagement: {
      activeInLast: '90d',
      minArticles: 5
    }
  },
  results: [
    {
      name: 'Jane Reporter',
      outlet: 'TechCrunch',
      beat: 'Enterprise Technology',
      email: 'jane@techcrunch.com',
      twitter: '@janereporter',
      recentTopics: ['AI', 'SaaS', 'Startups'],
      responseRate: 'high',
      preferredContact: 'email',
      notes: 'Prefers exclusive angles, responds within 24h'
    }
  ],
  listCreated: 'Enterprise AI Reporters',
  contactCount: 85
};
```

### Outreach Campaign
```javascript
const outreachCampaign = {
  campaign: 'Q1 Product Launch',
  lists: ['Enterprise AI Reporters', 'Business Tech Journalists'],
  pitch: {
    subject: 'Exclusive: Company X Launches AI Platform',
    template: 'product-launch-v1',
    personalization: ['recent_article', 'beat_relevance'],
    attachments: ['press-release.pdf', 'product-images.zip']
  },
  sequence: [
    { day: 0, action: 'initial-pitch' },
    { day: 3, action: 'follow-up-1', condition: 'no-response' },
    { day: 7, action: 'follow-up-2', condition: 'no-response' }
  ],
  tracking: {
    opens: true,
    clicks: true,
    replies: true,
    coverage: true
  },
  metrics: {
    sent: 85,
    opened: 62,
    replied: 18,
    coverage: 8
  }
};
```

## Process Integration

This skill integrates with the following PR processes:

| Process | Integration Points |
|---------|-------------------|
| media-relations-strategy.js | Media targeting |
| media-pitching-campaigns.js | Outreach execution |
| press-release-development.js | Distribution lists |
| executive-visibility-program.js | Journalist relationships |

## Best Practices

1. **Data Hygiene**: Regularly verify and update contact information
2. **Personalization**: Research journalists before outreach
3. **Preference Respect**: Honor communication preferences
4. **Tracking Discipline**: Log all interactions consistently
5. **List Segmentation**: Build targeted lists by topic and tier
6. **Relationship Focus**: Prioritize long-term relationships over transactions

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Database Accuracy | Contact info validity | >90% |
| Open Rate | Pitch email opens | >40% |
| Response Rate | Journalist replies | >20% |
| Coverage Rate | Pitches resulting in coverage | >10% |
| Relationship Health | Active journalist relationships | Growing |

## Related Skills

- SK-001: Media Monitoring (coverage tracking)
- SK-004: Press Release Distribution (wire distribution)
- SK-010: Influencer KOL Management (KOL outreach)
