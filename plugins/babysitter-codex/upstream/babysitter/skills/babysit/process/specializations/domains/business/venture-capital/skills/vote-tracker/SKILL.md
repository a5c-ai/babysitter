---
name: vote-tracker
description: Tracks IC voting, approvals, conditions, follow-up items
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
  skill-id: vc-skill-032
---

# Vote Tracker

## Overview

The Vote Tracker skill manages Investment Committee voting processes, tracking approvals, conditions, and follow-up items. It ensures proper documentation of IC decisions and completion of required follow-up actions.

## Capabilities

### Vote Recording
- Record IC votes by partner
- Track approval, conditional approval, rejection
- Document abstentions and recusals
- Maintain voting history

### Condition Tracking
- Track conditions attached to approvals
- Monitor condition satisfaction
- Flag overdue condition items
- Document condition waivers

### Follow-Up Management
- Track IC-requested follow-up items
- Assign ownership and deadlines
- Monitor completion status
- Escalate overdue items

### Decision Documentation
- Document IC meeting minutes
- Record discussion points
- Capture key concerns raised
- Maintain decision audit trail

## Usage

### Record IC Vote
```
Input: Deal, meeting date, votes
Process: Record votes, tally results
Output: Vote record, decision outcome
```

### Track Conditions
```
Input: Conditional approval, conditions
Process: Set up condition tracking
Output: Condition checklist, deadlines
```

### Monitor Follow-Ups
```
Input: Action items, assignments
Process: Track completion progress
Output: Follow-up status report
```

### Generate IC Report
```
Input: Reporting period
Process: Compile IC activity
Output: IC activity summary report
```

## Vote Categories

| Vote Type | Description |
|-----------|-------------|
| Approve | Full approval to proceed |
| Conditional | Approval with conditions |
| Request More Info | Hold pending additional work |
| Decline | Decision not to invest |
| Recuse | Partner conflict/recusal |

## Integration Points

- **Investment Committee Process**: Core voting skill
- **IC Memo Generator**: Link to memo decisions
- **IC Presenter (Agent)**: Support IC coordination
- **Deal Flow Tracker**: Update deal status

## Condition Types

| Condition | Example |
|-----------|---------|
| Additional DD | Complete customer references |
| Term Negotiation | Achieve board seat |
| Price Condition | Not above $X valuation |
| Syndicate | Secure lead co-investor |
| Legal | Clear IP assignment |

## Best Practices

1. Record votes promptly after IC meetings
2. Document conditions clearly and specifically
3. Assign clear ownership for follow-ups
4. Set realistic deadlines
5. Escalate missed deadlines appropriately
