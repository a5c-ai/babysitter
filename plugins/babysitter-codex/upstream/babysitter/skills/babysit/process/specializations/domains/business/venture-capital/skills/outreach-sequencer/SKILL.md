---
name: outreach-sequencer
description: Manages multi-touch outreach sequences to founders and referral sources
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: venture-capital
  domain: business
  skill-id: vc-skill-005
---

# Outreach Sequencer

## Overview

The Outreach Sequencer skill manages systematic, multi-touch outreach campaigns to founders, referral sources, and ecosystem partners. It enables proactive relationship building while maintaining personalization and tracking engagement across the deal sourcing funnel.

## Capabilities

### Sequence Management
- Create multi-step outreach sequences with configurable timing
- Support multiple channels (email, LinkedIn, phone, intro requests)
- A/B testing of messaging and timing variations
- Conditional branching based on response patterns

### Personalization Engine
- Dynamic content insertion based on recipient data
- Company and founder research integration
- Sector-specific messaging templates
- Relationship context incorporation

### Engagement Tracking
- Open, click, and response tracking
- Meeting scheduling and conversion tracking
- Sequence completion and dropout analysis
- Attribution of sourced deals to sequences

### Contact Management
- De-duplication and contact enrichment
- Opt-out and preference management
- Cooling period enforcement
- Cross-team coordination to prevent overlapping outreach

## Usage

### Create Outreach Sequence
```
Input: Target list, sequence template, timing rules
Process: Configure sequence, personalize messages
Output: Ready-to-launch sequence, preview samples
```

### Launch Campaign
```
Input: Sequence ID, target segment, launch parameters
Process: Schedule messages, begin sequence execution
Output: Campaign status, initial send confirmations
```

### Track Engagement
```
Input: Campaign or sequence ID
Process: Aggregate engagement metrics
Output: Open rates, response rates, conversion metrics
```

### Manage Responses
```
Input: Response notifications
Process: Categorize responses, route to appropriate follow-up
Output: Response queue, suggested follow-up actions
```

## Sequence Templates

| Template Type | Use Case | Typical Steps |
|---------------|----------|---------------|
| Cold Founder | Proactive outreach to target companies | 4-6 touches over 3-4 weeks |
| Warm Intro Request | Requesting introductions from network | 2-3 touches over 2 weeks |
| Event Follow-up | Post-conference founder outreach | 3-4 touches over 2 weeks |
| Referral Source | Maintaining referral relationships | Monthly value-add touches |

## Integration Points

- **Deal Flow Tracker**: Log outreach as deal sourcing activity
- **Investor Network Mapper**: Leverage network for warm paths
- **Meeting Scheduler**: Convert engagement to scheduled meetings
- **Deal Scout (Agent)**: Inform targeting decisions

## Best Practices

1. Maintain high personalization - avoid generic spam
2. Respect opt-outs and cooling periods
3. Coordinate across team to prevent duplicate outreach
4. Focus on providing value, not just requesting meetings
5. Track and optimize based on conversion data
