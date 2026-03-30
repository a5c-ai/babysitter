---
name: speaking-events
description: Speaking opportunity discovery and conference management
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
  category: Executive Visibility
  skill-id: SK-008
  dependencies:
    - Event platform APIs
    - Webinar platform APIs
---

# Speaking and Events Skill

## Overview

The Speaking and Events skill provides speaking opportunity discovery and conference management capabilities. This skill enables identification of speaking opportunities, submission management, and post-event content leverage for executive visibility programs.

## Capabilities

### Opportunity Discovery
- Conference and event database access
- Call for proposals (CFP) tracking
- Award submission tracking
- Panel placement coordination
- Podcast and media appearance opportunities

### Speaking Submission
- Speaking submission management
- Abstract and bio preparation
- Deadline tracking
- Status monitoring
- Success rate tracking

### Event Management
- Event calendar aggregation
- Webinar platform integration (ON24, Zoom Events)
- Speaker bureau coordination
- Travel and logistics coordination
- On-site support planning

### Content Leverage
- Post-event content repurposing
- Presentation archiving
- Video recording management
- Social amplification
- Blog and article creation

### Analytics and Optimization
- Speaking opportunity scoring
- Event ROI tracking
- Audience reach analysis
- Follow-up lead tracking
- Speaker performance assessment

## Usage

### Speaking Opportunity Pipeline
```javascript
const speakingPipeline = {
  executive: 'CEO Name',
  topics: [
    'AI and the Future of Work',
    'Sustainable Business Innovation',
    'Leadership in Digital Transformation'
  ],
  targets: {
    tier1: ['Web Summit', 'Dreamforce', 'CES', 'SXSW'],
    tier2: ['Industry Conference 1', 'Industry Conference 2'],
    podcasts: ['How I Built This', 'Masters of Scale'],
    webinars: ['Partner webinars', 'Industry associations']
  },
  pipeline: [
    {
      event: 'Web Summit 2026',
      status: 'submitted',
      topic: 'AI and the Future of Work',
      deadline: '2026-03-15',
      format: 'keynote',
      estimatedAudience: 5000
    },
    {
      event: 'Industry Conference 2026',
      status: 'accepted',
      topic: 'Leadership in Digital Transformation',
      date: '2026-04-20',
      format: 'panel',
      estimatedAudience: 800
    }
  ],
  ytd: {
    submitted: 12,
    accepted: 8,
    completed: 5,
    audienceReach: 15000
  }
};
```

### Event Execution
```javascript
const eventExecution = {
  event: 'Industry Conference 2026',
  date: '2026-04-20',
  speaker: 'CEO Name',
  session: {
    title: 'Panel: Leadership in Digital Transformation',
    format: 'panel',
    duration: '45min',
    moderator: 'Industry Analyst',
    coPanelists: ['Competitor CEO', 'Partner CEO']
  },
  preparation: [
    { task: 'Messaging brief', owner: 'Comms', dueDate: '2026-04-01' },
    { task: 'Media interview prep', owner: 'Comms', dueDate: '2026-04-10' },
    { task: 'Talking points', owner: 'Comms', dueDate: '2026-04-15' },
    { task: 'Logistics confirmation', owner: 'EA', dueDate: '2026-04-18' }
  ],
  contentLeverage: [
    { content: 'Live tweet thread', channel: 'twitter', timing: 'during' },
    { content: 'Session recap blog', channel: 'blog', timing: 'within 48h' },
    { content: 'Video clips', channel: 'linkedin', timing: 'within 1 week' },
    { content: 'Podcast interview', channel: 'industry-podcast', timing: 'post-event' }
  ],
  outcomes: {
    audienceSize: 850,
    mediaInterviews: 3,
    socialEngagement: 450,
    followUpMeetings: 5
  }
};
```

## Process Integration

This skill integrates with the following PR processes:

| Process | Integration Points |
|---------|-------------------|
| executive-visibility-program.js | Opportunity pipeline |
| community-relations-program.js | Community events |
| town-hall-event-planning.js | Internal speaking |

## Best Practices

1. **Strategic Selection**: Choose events aligned with business objectives
2. **Early Submission**: Submit to top-tier events 6-12 months ahead
3. **Thorough Preparation**: Provide comprehensive speaker prep
4. **Content Maximization**: Extract maximum content value from each event
5. **Relationship Building**: Use events for relationship development
6. **Track and Optimize**: Measure ROI and improve targeting

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Submission Success Rate | Acceptances vs. submissions | >50% |
| Tier 1 Placements | Top-tier event acceptances | 4+ per year |
| Audience Reach | Total audience across events | Growing YoY |
| Content Produced | Pieces from each event | 3+ per event |
| Media Interviews | Interviews secured at events | 2+ per event |

## Related Skills

- SK-003: Media Database (journalist meetings at events)
- SK-010: Influencer KOL Management (analyst meetings)
- SK-013: Media Training Simulation (speaker preparation)
