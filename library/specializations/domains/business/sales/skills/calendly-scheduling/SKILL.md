---
name: calendly-scheduling
description: Calendly meeting scheduling integration for sales workflows
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: sales
  domain: business
  priority: P2
  integration-points:
    - Calendly API
---

# Calendly Scheduling

## Overview

The Calendly Scheduling skill provides integration with Calendly for meeting scheduling automation, including meeting type management, availability optimization, round-robin assignment, and no-show tracking. This skill streamlines the scheduling process and maximizes meeting efficiency.

## Capabilities

### Meeting Type Management
- Create and configure meeting types
- Set duration and buffer times
- Define availability windows
- Manage location/video conferencing options

### Availability Optimization
- Analyze booking patterns
- Optimize availability windows
- Reduce scheduling conflicts
- Maximize meeting density

### Round-Robin Assignment
- Configure team round-robin rules
- Balance meeting distribution
- Handle availability exceptions
- Track assignment fairness

### No-Show Tracking
- Monitor no-show rates
- Identify patterns by segment or source
- Automate reminder sequences
- Track reschedule patterns

## Usage

### Booking Analysis
```
Analyze meeting booking patterns to identify optimal availability windows and reduce time-to-meeting.
```

### Team Distribution
```
Review round-robin performance to ensure equitable meeting distribution across the team.
```

### No-Show Reduction
```
Identify high no-show segments and implement targeted reminder strategies.
```

## Enhances Processes

- lead-routing-assignment
- qbr-process

## Dependencies

- Calendly subscription (Team or Enterprise)
- Calendar integration (Google, Outlook)
- CRM synchronization
