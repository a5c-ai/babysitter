---
name: social-media-management
description: Cross-platform social media operations and analytics
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
  skill-id: SK-009
  dependencies:
    - Sprout Social API
    - Hootsuite API
    - Native platform APIs
---

# Social Media Management Skill

## Overview

The Social Media Management skill provides cross-platform social media operations and analytics capabilities. This skill enables efficient social content scheduling, community management, and social performance analytics.

## Capabilities

### Content Publishing
- Sprout Social integration
- Hootsuite scheduling
- Buffer publishing
- Native platform posting
- Multi-platform coordination

### Content Management
- Content scheduling and publishing
- Content calendar management
- Asset library management
- Approval workflows
- Team collaboration

### Community Management
- Engagement monitoring
- Comment and message management
- Community response workflows
- Escalation protocols
- Sentiment tracking

### Analytics
- Social analytics aggregation
- Cross-platform reporting
- Engagement analytics
- Best time to post analysis
- Hashtag research

## Usage

### Social Management Configuration
```javascript
const socialConfig = {
  platform: 'Sprout Social',
  channels: [
    { platform: 'LinkedIn', handle: '@company', audience: 'b2b-professionals' },
    { platform: 'Twitter', handle: '@company', audience: 'industry-community' },
    { platform: 'Instagram', handle: '@company', audience: 'brand-enthusiasts' },
    { platform: 'Facebook', handle: '@company', audience: 'broad-consumers' }
  ],
  publishing: {
    calendar: {
      linkedIn: { frequency: '5x/week', bestTimes: ['Tuesday 10am', 'Wednesday 2pm'] },
      twitter: { frequency: '3x/day', bestTimes: ['8am', '12pm', '5pm'] },
      instagram: { frequency: '4x/week', bestTimes: ['Monday 11am', 'Thursday 7pm'] }
    },
    contentMix: {
      educational: 40,
      promotional: 20,
      engagement: 25,
      userGenerated: 15
    },
    approvalWorkflow: {
      drafters: ['social-team'],
      reviewers: ['marketing-manager'],
      approvers: ['brand-director']
    }
  },
  engagement: {
    responseTime: '<4 hours',
    escalation: ['negative-sentiment', 'customer-complaint', 'crisis-mention'],
    monitoring: '7am-9pm'
  }
};
```

## Process Integration

| Process | Integration Points |
|---------|-------------------|
| social-media-strategy-execution.js | Full workflow |
| editorial-calendar-management.js | Content scheduling |
| content-production-workflow.js | Content distribution |

## Best Practices

1. **Platform-Specific**: Tailor content to each platform
2. **Consistent Presence**: Maintain regular posting cadence
3. **Community Focus**: Prioritize engagement over broadcast
4. **Data-Driven**: Let analytics guide strategy
5. **Rapid Response**: Respond to engagement quickly

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Engagement Rate | Interactions per post | Above benchmark |
| Follower Growth | Net new followers | Growing |
| Response Time | Time to first response | <4 hours |
| Share of Voice | Social conversation share | Increasing |

## Related Skills

- SK-010: Social Listening (monitoring)
- SK-011: Content Management (content production)
- SK-017: Marketing Project Management (planning)
