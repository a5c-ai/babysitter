---
name: action-item-tracker
description: Tracks board action items, follow-ups, commitments across companies
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
  skill-id: vc-skill-037
---

# Action Item Tracker

## Overview

The Action Item Tracker skill manages board-level action items, commitments, and follow-ups across portfolio companies. It ensures accountability and completion of important initiatives identified in board meetings.

## Capabilities

### Action Item Capture
- Capture items from board meetings
- Assign ownership and deadlines
- Categorize by type and priority
- Link to board meeting context

### Progress Tracking
- Monitor completion status
- Track deadline adherence
- Escalate overdue items
- Generate progress reports

### Cross-Company View
- View items across portfolio
- Identify patterns and themes
- Track investor commitments
- Monitor help-request fulfillment

### Reminder and Notification
- Send deadline reminders
- Notify on status changes
- Escalate delayed items
- Generate summary digests

## Usage

### Capture Action Items
```
Input: Board meeting notes, action items
Process: Record and assign items
Output: Tracked action items
```

### Update Item Status
```
Input: Item updates, status changes
Process: Update tracking, notify parties
Output: Updated status, notifications
```

### Generate Progress Report
```
Input: Company or portfolio scope
Process: Compile status summary
Output: Action item progress report
```

### Review Overdue Items
```
Input: Due date threshold
Process: Identify overdue items
Output: Overdue item list, escalations
```

## Action Item Categories

| Category | Examples |
|----------|----------|
| Strategic | Explore partnership, evaluate market |
| Hiring | Recruit CFO, build team |
| Operational | Implement process, launch feature |
| Financial | Complete audit, secure financing |
| Investor Help | Make introduction, provide resource |

## Integration Points

- **Board Engagement Process**: Capture and track items
- **Board Deck Analyzer**: Connect to meeting analysis
- **Board Member Assistant (Agent)**: Support follow-up
- **Portfolio Value Creation**: Track help requests

## Tracking Fields

| Field | Purpose |
|-------|---------|
| Description | What needs to be done |
| Owner | Who is responsible |
| Due Date | When it should be complete |
| Status | Open, In Progress, Complete |
| Priority | High, Medium, Low |
| Source | Which board meeting |

## Best Practices

1. Capture items immediately after meetings
2. Assign clear, single ownership
3. Set realistic deadlines
4. Review status before each board meeting
5. Hold owners accountable for completion
