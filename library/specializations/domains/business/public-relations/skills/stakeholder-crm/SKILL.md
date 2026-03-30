---
name: stakeholder-crm
description: Stakeholder relationship management and engagement tracking
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
  category: Stakeholder Communications
  skill-id: SK-012
  dependencies:
    - CRM APIs (Salesforce, HubSpot)
    - Specialized stakeholder platforms
---

# Stakeholder CRM Skill

## Overview

The Stakeholder CRM skill provides stakeholder relationship management and engagement tracking capabilities. This skill enables comprehensive stakeholder database management, engagement tracking, and relationship health monitoring across all stakeholder groups.

## Capabilities

### Database Management
- Stakeholder database management
- Contact information maintenance
- Organization and individual profiles
- Relationship hierarchy mapping
- Data quality and deduplication

### Engagement Tracking
- Engagement history tracking
- Meeting and interaction logging
- Communication preference management
- Multi-channel touchpoint tracking
- Response and sentiment tracking

### Relationship Analytics
- Relationship scoring
- Engagement frequency analysis
- Sentiment trending
- Risk indicator detection
- Relationship health dashboards

### Segmentation
- Stakeholder segmentation
- Interest and issue mapping
- Influence assessment
- Priority tier assignment
- Custom audience building

### Specialized Stakeholders
- Coalition partner management
- Government affairs contact management
- Investor relations contact management
- Community leader tracking
- Media relationship tracking

## Usage

### Stakeholder Database
```javascript
const stakeholderDatabase = {
  categories: {
    government: {
      count: 150,
      segments: ['federal', 'state', 'local', 'regulatory'],
      keyContacts: [
        {
          name: 'Sen. Jane Smith',
          office: 'US Senate',
          state: 'California',
          committees: ['Commerce', 'Technology'],
          issues: ['AI regulation', 'Data privacy'],
          relationship: 'positive',
          lastContact: '2026-01-15',
          owner: 'Government Affairs Director'
        }
      ]
    },
    investors: {
      count: 85,
      segments: ['institutional', 'retail', 'analysts'],
      keyContacts: [
        {
          name: 'John Investor',
          firm: 'Major Asset Management',
          aum: '$500B',
          holding: '2.5%',
          sentiment: 'supportive',
          lastMeeting: '2025-12-01',
          owner: 'VP Investor Relations'
        }
      ]
    },
    community: {
      count: 200,
      segments: ['local-government', 'ngos', 'community-leaders', 'neighbors'],
      keyContacts: [
        {
          name: 'Community Leader',
          organization: 'Local Chamber of Commerce',
          issues: ['Economic development', 'Job creation'],
          relationship: 'partner',
          engagementFrequency: 'quarterly'
        }
      ]
    },
    coalitions: {
      count: 25,
      segments: ['industry', 'advocacy', 'research'],
      keyContacts: [
        {
          name: 'Industry Association',
          type: 'trade-association',
          membershipLevel: 'board',
          activeIssues: ['Industry regulation', 'Standards'],
          representative: 'VP Public Affairs'
        }
      ]
    }
  },
  totals: {
    totalStakeholders: 460,
    activeRelationships: 380,
    atRisk: 15,
    newThisQuarter: 25
  }
};
```

### Engagement Dashboard
```javascript
const engagementDashboard = {
  period: 'Q1 2026',
  summary: {
    totalEngagements: 450,
    uniqueStakeholders: 280,
    meetingsHeld: 85,
    eventsAttended: 12,
    communicationsSent: 350
  },
  byCategory: {
    government: { engagements: 120, sentiment: 'positive', trend: 'improving' },
    investors: { engagements: 95, sentiment: 'stable', trend: 'stable' },
    community: { engagements: 150, sentiment: 'positive', trend: 'improving' },
    coalitions: { engagements: 85, sentiment: 'positive', trend: 'stable' }
  },
  relationshipHealth: {
    strong: 180,
    positive: 120,
    neutral: 50,
    atRisk: 15,
    negative: 5
  },
  actionItems: [
    { stakeholder: 'Key Legislator', action: 'Schedule follow-up meeting', due: '2026-02-01' },
    { stakeholder: 'Community Group', action: 'Respond to concerns', due: '2026-01-25' }
  ]
};
```

## Process Integration

This skill integrates with the following PR processes:

| Process | Integration Points |
|---------|-------------------|
| stakeholder-mapping.js | Database and mapping |
| government-affairs-communications.js | Government contacts |
| investor-communications-support.js | Investor contacts |
| community-relations-program.js | Community contacts |

## Best Practices

1. **Data Quality**: Maintain accurate, up-to-date contact information
2. **Relationship Ownership**: Assign clear ownership for each relationship
3. **Regular Engagement**: Maintain consistent touchpoints
4. **Track Everything**: Log all interactions and outcomes
5. **Segment Strategically**: Group stakeholders by influence and interest
6. **Monitor Health**: Watch for relationship deterioration early

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Database Completeness | Required fields populated | >95% |
| Engagement Frequency | Touches per key stakeholder | Quarterly minimum |
| Relationship Health | % positive relationships | >80% |
| Response Rate | Stakeholder responsiveness | >60% |
| Data Currency | Contacts updated annually | 100% |

## Related Skills

- SK-014: Government Affairs Intel (government stakeholders)
- SK-016: Investor Relations Platform (investor stakeholders)
- SK-010: Influencer KOL Management (influencer stakeholders)
