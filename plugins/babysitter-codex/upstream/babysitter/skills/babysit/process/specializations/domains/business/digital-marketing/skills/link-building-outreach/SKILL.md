---
name: link-building-outreach
description: Link prospecting and outreach automation for SEO link building campaigns
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: digital-marketing
  domain: business
  category: SEO/SEM
  skill-id: SK-018
  dependencies:
    - BuzzStream API
    - Hunter.io API
---

# Link Building Outreach Skill

## Overview

The Link Building Outreach skill provides comprehensive capabilities for link prospecting, outreach automation, and link acquisition tracking. This skill enables efficient execution of link building campaigns through integration with major outreach platforms and email discovery tools, while maintaining high-quality prospecting standards and compliance with best practices.

## Capabilities

### BuzzStream Campaign Management
- Campaign creation and setup
- Contact list management
- Outreach sequence configuration
- Email template management
- Response tracking
- Link placement monitoring
- Team collaboration features
- Reporting and analytics

### Hunter.io Email Discovery
- Domain email search
- Email verification
- Email finder by name
- Bulk email discovery
- Confidence scoring
- Email pattern detection
- API integration
- Credit management

### Pitchbox Outreach Sequences
- Multi-step sequence creation
- Personalization tokens
- A/B testing setup
- Scheduling optimization
- Response handling
- Opportunity pipeline
- Team workflow management
- Performance analytics

### Link Prospect Qualification
- Domain authority scoring
- Traffic estimation
- Relevance scoring
- Spam score checking
- Link profile analysis
- Contact identification
- Historical outreach tracking
- Competitor backlink analysis

### Outreach Template Personalization
- Dynamic personalization fields
- Conditional content blocks
- Snippet libraries
- Subject line variations
- Signature management
- Attachment handling
- Preview and testing
- Performance tracking by template

### Follow-up Automation
- Automated follow-up sequences
- Response detection
- Timing optimization
- Conditional logic
- Out-of-office handling
- Bounce management
- Unsubscribe handling
- Sequence pause/resume

### Link Acquisition Tracking
- Link placement verification
- Anchor text monitoring
- DoFollow/NoFollow tracking
- Link attribute changes
- Lost link alerts
- Acquisition timeline
- ROI calculation
- Relationship value scoring

### Disavow File Generation
- Toxic link identification
- Disavow file creation
- Google format compliance
- Domain vs URL decisions
- Historical tracking
- Regular audits
- Submission tracking
- Recovery monitoring

### Backlink Monitoring
- New backlink discovery
- Lost backlink alerts
- Competitor backlink tracking
- Link quality changes
- Anchor text distribution
- Referring domain trends
- Link velocity monitoring
- Alert configuration

## Usage

### Campaign Setup
```javascript
const linkBuildingCampaign = {
  name: 'Q1 2026 Guest Posting Campaign',
  type: 'guest-post',
  targets: {
    linksPerMonth: 20,
    minimumDA: 40,
    relevanceCategories: ['digital-marketing', 'seo', 'content-marketing']
  },
  prospecting: {
    sources: [
      'competitor-backlinks',
      'guest-post-opportunities',
      'resource-page-links',
      'broken-link-building'
    ],
    qualificationCriteria: {
      minDA: 30,
      maxSpamScore: 3,
      trafficThreshold: 1000,
      relevanceScore: 0.7
    }
  },
  outreach: {
    platform: 'buzzstream',
    sequences: [
      {
        name: 'initial-outreach',
        steps: 3,
        timing: [0, 4, 7]
      }
    ]
  }
};
```

### Prospect Qualification
```javascript
const prospectQualification = {
  domain: 'example.com',
  metrics: {
    domainAuthority: 55,
    pageAuthority: 42,
    spamScore: 1,
    estimatedTraffic: 25000,
    referringDomains: 850,
    organicKeywords: 3200
  },
  relevance: {
    categoryMatch: 0.85,
    contentAlignment: 0.78,
    audienceOverlap: 0.72
  },
  contact: {
    name: 'John Editor',
    email: 'john@example.com',
    verificationStatus: 'verified',
    confidence: 0.95,
    role: 'Content Manager'
  },
  historicalOutreach: {
    previousContacts: 0,
    existingRelationship: false
  },
  qualificationScore: 82,
  status: 'qualified'
};
```

### Outreach Template
```javascript
const outreachTemplate = {
  name: 'Guest Post Pitch - Version A',
  subject: 'Content Idea for {{site_name}} Readers',
  body: `Hi {{first_name}},

I've been following {{site_name}} and really enjoyed your recent article on {{recent_article_topic}}.

I'm {{my_name}}, a {{my_role}} at {{company_name}}. I'd love to contribute a guest post for your readers on {{proposed_topic}}.

Here are a few angles I could cover:
{{topic_ideas}}

The piece would be original, well-researched, and include actionable takeaways your audience would find valuable.

Would you be interested in discussing this further?

Best,
{{my_name}}`,
  personalizationFields: [
    'first_name',
    'site_name',
    'recent_article_topic',
    'proposed_topic',
    'topic_ideas'
  ],
  followUpSequence: [
    {
      delay: 4,
      subject: 'Following up: Guest post for {{site_name}}',
      body: 'followup-template-1'
    },
    {
      delay: 7,
      subject: 'One more thought on that guest post',
      body: 'followup-template-2'
    }
  ]
};
```

### Link Tracking Configuration
```javascript
const linkTracking = {
  campaign: 'Q1 2026 Guest Posting',
  tracking: {
    checkFrequency: 'weekly',
    metrics: [
      'link-status',
      'anchor-text',
      'link-attributes',
      'page-traffic',
      'referring-page-authority'
    ],
    alerts: {
      linkLost: true,
      attributeChange: true,
      pageRemoved: true
    }
  },
  reporting: {
    frequency: 'weekly',
    metrics: [
      'links-acquired',
      'response-rate',
      'average-da',
      'cost-per-link',
      'estimated-traffic-value'
    ]
  }
};
```

### Disavow File Generation
```javascript
const disavowConfig = {
  analysis: {
    sources: ['ahrefs', 'semrush', 'gsc'],
    toxicityThreshold: 60,
    flags: [
      'high-spam-score',
      'pbn-indicators',
      'link-farm-patterns',
      'unrelated-content',
      'foreign-language-spam'
    ]
  },
  output: {
    format: 'google-disavow',
    granularity: 'domain',
    includeComments: true,
    dateStamp: true
  },
  review: {
    manualReviewRequired: true,
    approvalWorkflow: true
  }
};
```

## Process Integration

This skill integrates with the following digital marketing processes:

| Process | Integration Points |
|---------|-------------------|
| link-building.js | Prospecting, outreach, acquisition tracking |
| content-marketing-strategy.js | Linkable asset identification, promotion |

## Best Practices

1. **Quality Over Quantity**: Focus on high-quality, relevant links rather than volume
2. **Personalization**: Always personalize outreach emails beyond just the name
3. **Research First**: Thoroughly research prospects before outreach
4. **Value Proposition**: Lead with value you can provide, not what you want
5. **Follow-up Timing**: Space follow-ups appropriately (3-5 days)
6. **Relationship Building**: Focus on building long-term relationships
7. **Tracking**: Track all outreach in a centralized system
8. **Email Verification**: Always verify emails before sending
9. **Compliance**: Follow email regulations (CAN-SPAM, GDPR)
10. **Disavow Carefully**: Only disavow clearly toxic links after manual review

## Outreach Metrics

| Metric | Description | Benchmark |
|--------|-------------|-----------|
| Open Rate | Percentage of emails opened | 40-50% |
| Response Rate | Percentage of positive responses | 10-15% |
| Conversion Rate | Prospects to acquired links | 5-10% |
| Cost Per Link | Total cost divided by links | Varies by niche |
| Average DA | Mean domain authority of acquired links | >40 |
| Link Retention | Links still live after 12 months | >90% |

## Link Building Tactics Supported

### Guest Posting
- Prospect identification
- Pitch customization
- Content coordination
- Bio link placement

### Resource Page Link Building
- Resource page discovery
- Relevance assessment
- Addition request outreach
- Value demonstration

### Broken Link Building
- Broken link discovery
- Replacement content creation
- Webmaster notification
- Placement verification

### Skyscraper Technique
- Top content identification
- Superior content creation
- Linker outreach
- Link acquisition tracking

### Digital PR
- News angle development
- Journalist outreach
- Press coverage tracking
- Link monitoring

## Related Skills

- SK-005: SEO Tools (backlink analysis, competitor research)
- SK-013: Content Optimization (linkable content creation)
- SK-012: Content Management (content publication)
