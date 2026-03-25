---
name: internal-comms-platform
description: Employee communications platform integration and analytics
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
  category: Internal Communications
  skill-id: SK-007
  dependencies:
    - Staffbase API
    - Microsoft Graph API
    - Slack API
---

# Internal Communications Platform Skill

## Overview

The Internal Communications Platform skill provides employee communications platform integration and analytics capabilities. This skill enables multi-channel employee communications, engagement tracking, and internal communications optimization.

## Capabilities

### Intranet Integration
- Staffbase intranet integration
- Workplace by Meta management
- SharePoint intranet operations
- Content publishing and scheduling
- Site analytics and engagement

### Collaboration Platforms
- Viva Engage (Yammer) operations
- Microsoft Teams channel management
- Slack enterprise communications
- Channel and community management
- Cross-platform coordination

### Email Communications
- Email newsletter platforms (Poppulo, ContactMonkey)
- Email template management
- Distribution list management
- A/B testing for internal email
- Deliverability monitoring

### Video and Rich Media
- Internal video platform management
- Town hall streaming and recording
- Video analytics and engagement
- Podcast distribution
- Digital signage integration

### Measurement and Analytics
- Analytics and engagement tracking
- Content performance analysis
- Channel effectiveness comparison
- Employee reach and readership
- Pulse survey integration

## Usage

### Channel Configuration
```javascript
const internalChannelConfig = {
  channels: {
    intranet: {
      platform: 'Staffbase',
      purpose: 'Official news and resources',
      governance: 'comms-owned',
      frequency: 'daily'
    },
    teams: {
      platform: 'Microsoft Teams',
      purpose: 'Real-time collaboration and alerts',
      governance: 'distributed',
      frequency: 'real-time'
    },
    email: {
      platform: 'Poppulo',
      purpose: 'Important announcements and newsletters',
      governance: 'comms-approved',
      frequency: 'weekly-newsletter'
    },
    video: {
      platform: 'Stream',
      purpose: 'Town halls and leadership messages',
      governance: 'comms-produced',
      frequency: 'monthly'
    }
  },
  contentTypes: {
    companyNews: { channels: ['intranet', 'email'], approval: 'required' },
    executiveMessages: { channels: ['intranet', 'email', 'video'], approval: 'executive' },
    hrUpdates: { channels: ['intranet', 'teams'], approval: 'hr-comms' },
    crisisAlerts: { channels: ['all'], approval: 'crisis-team' }
  },
  analytics: {
    tracking: ['views', 'reads', 'engagement', 'shares'],
    reporting: 'weekly',
    benchmarks: 'internal-industry'
  }
};
```

### Communication Campaign
```javascript
const communicationCampaign = {
  campaign: 'Annual Benefits Enrollment 2026',
  objectives: [
    'Ensure all employees aware of enrollment period',
    'Drive completion of enrollment by deadline',
    'Reduce HR inquiries through clear information'
  ],
  audiences: {
    allEmployees: { count: 5000 },
    newHires: { count: 450, specialContent: true },
    managers: { count: 500, toolkitRequired: true }
  },
  channels: [
    { channel: 'email', content: 'enrollment-announcement', day: 1 },
    { channel: 'intranet', content: 'benefits-hub-launch', day: 1 },
    { channel: 'teams', content: 'reminder-post', day: 7 },
    { channel: 'email', content: 'deadline-reminder', day: 14 },
    { channel: 'video', content: 'benefits-overview-webinar', day: 5 }
  ],
  metrics: {
    emailOpenRate: 78,
    intranetPageViews: 12500,
    webinarAttendance: 1200,
    enrollmentCompletion: 94,
    hrInquiries: 'reduced 25%'
  }
};
```

## Process Integration

This skill integrates with the following PR processes:

| Process | Integration Points |
|---------|-------------------|
| internal-communications-strategy.js | Strategy execution |
| change-management-communications.js | Change communications |
| town-hall-event-planning.js | Event support |
| employee-advocacy-program.js | Content distribution |

## Best Practices

1. **Channel Purpose Clarity**: Define clear purpose for each channel
2. **Content Governance**: Establish approval workflows
3. **Measurement Discipline**: Track engagement consistently
4. **Audience Segmentation**: Tailor content to audiences
5. **Feedback Loops**: Create ways for employee input
6. **Mobile First**: Ensure mobile accessibility for all content

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Email Open Rate | Internal email opens | >70% |
| Intranet Engagement | Active users monthly | >60% |
| Content Readership | Articles read to completion | >40% |
| Channel Awareness | Employee awareness of channels | >90% |
| Satisfaction | Internal comms satisfaction | >75% |

## Related Skills

- SK-015: Employee Advocacy (social sharing)
- SK-013: Media Training Simulation (executive communications)
- SK-012: Stakeholder CRM (audience management)
