---
name: meeting-scheduler
description: Intelligent scheduling with partner/associate availability and timezone management
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
  skill-id: vc-skill-006
---

# Meeting Scheduler

## Overview

The Meeting Scheduler skill provides intelligent meeting coordination for venture capital deal flow and portfolio management activities. It manages complex scheduling across partners, associates, founders, and external parties while handling timezone differences and availability constraints.

## Capabilities

### Calendar Integration
- Sync with Google Calendar, Outlook, and other calendar systems
- Real-time availability checking across team members
- Buffer time management between meetings
- Travel time consideration for in-person meetings

### Intelligent Scheduling
- Multi-party availability optimization
- Timezone-aware scheduling with clear communication
- Meeting type-based duration defaults
- Recurring meeting series management

### Deal Flow Coordination
- Partner pitch meeting scheduling
- Due diligence session coordination
- IC meeting scheduling with quorum requirements
- Closing and signing coordination

### Portfolio Meeting Management
- Board meeting scheduling across portfolio
- Quarterly review meeting coordination
- Portfolio company touchpoint scheduling
- LP meeting and annual meeting coordination

## Usage

### Schedule Deal Meeting
```
Input: Meeting type, required attendees, optional attendees, duration
Process: Find optimal slots, propose times, confirm booking
Output: Calendar invite, meeting details, attendee confirmations
```

### Find Availability
```
Input: Attendee list, date range, duration, constraints
Process: Query calendars, identify common availability
Output: Available time slots ranked by preference
```

### Reschedule Meeting
```
Input: Original meeting, new constraints or conflicts
Process: Find alternative slots, notify attendees
Output: Rescheduled meeting, update notifications
```

### Coordinate Multi-Meeting Series
```
Input: Meeting sequence (e.g., DD sessions), participants, timeline
Process: Schedule series optimizing for participant availability
Output: Coordinated meeting series, master schedule
```

## Meeting Types

| Meeting Type | Default Duration | Typical Attendees |
|--------------|------------------|-------------------|
| Intro Call | 30 min | Associate + Founder |
| Partner Pitch | 45-60 min | Partners + Founder team |
| DD Session | 60-90 min | DD lead + Functional experts |
| IC Meeting | 60-90 min | Full partnership |
| Board Meeting | 2-4 hours | Board members + Management |

## Integration Points

- **Deal Flow Tracker**: Log meetings as pipeline activities
- **Board Engagement Process**: Coordinate board-related scheduling
- **IC Process**: Schedule investment committee meetings
- **Outreach Sequencer**: Convert engagement to scheduled meetings

## Best Practices

1. Include buffer time between back-to-back meetings
2. Respect partner preferences for meeting-free time blocks
3. Provide clear timezone information in all communications
4. Send reminders and prep materials in advance
5. Track no-shows and reschedule patterns
