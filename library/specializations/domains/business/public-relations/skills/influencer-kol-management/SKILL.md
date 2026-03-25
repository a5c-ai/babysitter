---
name: influencer-kol-management
description: Industry influencer and key opinion leader relationship management
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
  skill-id: SK-010
  dependencies:
    - Analyst relations platforms
    - CRM systems
---

# Influencer and KOL Management Skill

## Overview

The Influencer and KOL Management skill provides industry influencer and key opinion leader relationship management capabilities. This skill enables identification, engagement tracking, and strategic relationship management with analysts, academics, thought leaders, and industry influencers.

## Capabilities

### Analyst Relations
- Industry analyst database (Gartner, Forrester, IDC)
- Analyst report tracking
- Briefing scheduling and management
- Inquiry management
- Magic Quadrant/Wave preparation

### Academic and Expert KOLs
- Academic KOL identification
- Research collaboration tracking
- Advisory board management
- Expert quote sourcing
- Peer review facilitation

### Thought Leader Engagement
- Thought leader mapping
- Social influencer identification
- Podcast host relationships
- Newsletter writer tracking
- Industry award judges

### Relationship Management
- Influencer CRM integration
- Engagement tracking and scoring
- Relationship health monitoring
- Interaction history logging
- Preference documentation

### Program Management
- Briefing program management
- Advisory program coordination
- Podcast guest coordination
- Industry awards nomination tracking
- Event engagement planning

## Usage

### KOL Database
```javascript
const kolDatabase = {
  categories: {
    industryAnalysts: [
      {
        name: 'Jane Analyst',
        firm: 'Gartner',
        coverage: ['AI', 'Enterprise Software'],
        reports: ['Magic Quadrant - AI Platforms'],
        relationshipOwner: 'AR Director',
        lastBriefing: '2025-12-15',
        nextScheduled: '2026-03-20',
        status: 'strong',
        notes: 'Key influencer on AI MQ, prefers technical depth'
      }
    ],
    academicExperts: [
      {
        name: 'Dr. Research Expert',
        institution: 'MIT',
        expertise: ['Machine Learning', 'Ethics in AI'],
        publications: 45,
        citations: 12000,
        engagement: 'advisory-board',
        status: 'active'
      }
    ],
    socialInfluencers: [
      {
        name: 'Tech Influencer',
        platforms: ['Twitter', 'LinkedIn', 'Substack'],
        followers: 250000,
        topics: ['Enterprise Tech', 'AI'],
        engagement: 'briefings-and-content',
        sentiment: 'positive'
      }
    ],
    podcastHosts: [
      {
        name: 'Podcast Host',
        show: 'Tech Industry Podcast',
        audience: 50000,
        guestOpportunity: true,
        lastAppearance: '2025-10-01',
        status: 'warm'
      }
    ]
  }
};
```

### Engagement Program
```javascript
const engagementProgram = {
  program: 'Q1 2026 Analyst Relations',
  objectives: [
    'Maintain positive positioning in Gartner MQ',
    'Secure inclusion in Forrester Wave',
    'Build relationships with 3 new analysts'
  ],
  activities: {
    briefings: [
      { analyst: 'Jane Analyst', firm: 'Gartner', date: '2026-02-15', topic: 'Product Roadmap' },
      { analyst: 'John Researcher', firm: 'Forrester', date: '2026-02-20', topic: 'Customer Success Stories' }
    ],
    inquiries: {
      scheduled: 5,
      topics: ['Competitive positioning', 'Market strategy']
    },
    events: [
      { event: 'Gartner Symposium', activities: ['1:1 meetings', 'Executive roundtable'] }
    ],
    content: [
      { type: 'Research note response', count: 10 },
      { type: 'Citation in reports', target: 5 }
    ]
  },
  metrics: {
    briefingsCompleted: 8,
    analystSentiment: 'positive',
    reportMentions: 12,
    mqPositionChange: '+1 quadrant position'
  }
};
```

## Process Integration

This skill integrates with the following PR processes:

| Process | Integration Points |
|---------|-------------------|
| media-relations-strategy.js | Analyst strategy |
| executive-visibility-program.js | Thought leadership |
| stakeholder-mapping.js | Influencer mapping |
| influencer-relationship.js | Relationship management |

## Best Practices

1. **Relationship Focus**: Build genuine, long-term relationships
2. **Regular Engagement**: Maintain consistent touchpoints
3. **Provide Value**: Share insights and exclusive access
4. **Track Carefully**: Document all interactions and preferences
5. **Prepare Thoroughly**: Research before every interaction
6. **Follow Through**: Always deliver on commitments

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Analyst Sentiment | Overall analyst sentiment | Positive |
| Report Mentions | Citations in analyst reports | Growing |
| Briefing Cadence | Regular briefing completion | Quarterly minimum |
| Influencer Reach | Total influencer audience | Expanding |
| Relationship Health | Active positive relationships | >80% |

## Related Skills

- SK-003: Media Database (journalist relationships)
- SK-008: Speaking Events (event meetings)
- SK-012: Stakeholder CRM (relationship tracking)
