---
name: escrow-tracker
description: Tracks escrow releases, holdbacks, earnout milestones
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
  skill-id: vc-skill-042
---

# Escrow Tracker

## Overview

The Escrow Tracker skill manages post-closing escrow releases, holdbacks, and earnout milestones from M&A exits. It ensures proper tracking and timely collection of deferred consideration from portfolio company exits.

## Capabilities

### Escrow Management
- Track escrow amounts and terms
- Monitor release schedules
- Track claims and deductions
- Manage escrow agent communications

### Holdback Tracking
- Track indemnity holdbacks
- Monitor release conditions
- Track claims against holdbacks
- Calculate expected releases

### Earnout Monitoring
- Track earnout milestone definitions
- Monitor milestone achievement
- Calculate earnout payments
- Manage earnout disputes

### Release Processing
- Process escrow releases
- Allocate releases to partners
- Track partial releases
- Document release history

## Usage

### Set Up Escrow Tracking
```
Input: Exit terms, escrow provisions
Process: Create escrow tracking record
Output: Escrow tracking setup
```

### Monitor Release Schedule
```
Input: Escrow portfolio
Process: Track upcoming releases
Output: Release schedule report
```

### Track Milestone Progress
```
Input: Earnout milestones, company data
Process: Assess milestone status
Output: Milestone tracking report
```

### Process Release
```
Input: Release notification
Process: Verify, allocate, distribute
Output: Release processing record
```

## Escrow Types

| Type | Typical Terms |
|------|---------------|
| General Indemnity | 12-24 months, 10-20% of deal |
| Special Indemnity | Tied to specific risks |
| Working Capital | 60-90 days adjustment |
| Earnout | 1-3 years, milestone-based |
| Tax Indemnity | Statute of limitations |

## Integration Points

- **Distribution Waterfall Calculation**: Release distributions
- **Waterfall Calculator**: Allocation calculations
- **Distribution Manager (Agent)**: Support distributions
- **Fund Accountant (Agent)**: Accounting integration

## Tracking Elements

| Element | Details |
|---------|---------|
| Principal Amount | Original escrow/holdback |
| Release Schedule | Timing of releases |
| Claims | Amounts claimed against |
| Net Releases | Expected net amounts |
| Earnout Triggers | Milestone definitions |

## Best Practices

1. Track all deferred consideration carefully
2. Monitor claims and dispute processes
3. Maintain relationships with escrow agents
4. Project releases for fund planning
5. Document all releases and allocations
