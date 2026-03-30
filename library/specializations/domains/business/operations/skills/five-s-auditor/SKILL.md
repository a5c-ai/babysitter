---
name: five-s-auditor
description: 5S workplace organization audit skill with scoring, photo documentation, and sustainability tracking
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: lean-operations
---

# Five-S Auditor

## Overview

The Five-S Auditor skill provides comprehensive workplace organization auditing capabilities following the 5S methodology (Sort, Set in Order, Shine, Standardize, Sustain). It supports audit scoring, trend analysis, and action item tracking for continuous workplace improvement.

## Capabilities

- Sort (Seiri) red tag analysis
- Set in Order (Seiton) layout optimization
- Shine (Seiso) cleanliness standards
- Standardize (Seiketsu) visual management
- Sustain (Shitsuke) audit scheduling
- Audit scoring with trend analysis
- Action item tracking

## Used By Processes

- LEAN-002: 5S Implementation
- QMS-003: Quality Audit Management
- CI-001: Operational Excellence Program Design

## Tools and Libraries

- Mobile audit apps
- Photo analysis tools
- Checklist generators
- Scoring dashboards

## Usage

```yaml
skill: five-s-auditor
inputs:
  area: "Assembly Line 3"
  audit_type: "monthly"  # daily | weekly | monthly | quarterly
  previous_scores:
    sort: 3.5
    set_in_order: 4.0
    shine: 3.0
    standardize: 3.5
    sustain: 3.0
outputs:
  - audit_scorecard
  - photo_documentation
  - action_items
  - trend_analysis
  - improvement_recommendations
```

## Workflow

1. **Schedule Audit** - Plan audit timing and notify area owners
2. **Conduct Assessment** - Evaluate each S category systematically
3. **Document Findings** - Capture photos and observations
4. **Score Results** - Apply standardized scoring criteria
5. **Identify Actions** - Create improvement action items
6. **Track Progress** - Monitor trends and verify completions

## Scoring Criteria

| Score | Description |
|-------|-------------|
| 5 | World-class, benchmark level |
| 4 | Exceeds expectations, minor improvements possible |
| 3 | Meets basic expectations |
| 2 | Below expectations, significant gaps |
| 1 | Major issues, requires immediate attention |

## Integration Points

- Digital audit platforms
- Action tracking systems
- Visual management displays
- Training management systems
