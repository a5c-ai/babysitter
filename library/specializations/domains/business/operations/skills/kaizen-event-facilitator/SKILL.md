---
name: kaizen-event-facilitator
description: Rapid improvement workshop planning and execution skill with team coordination, metrics tracking, and follow-up management
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

# Kaizen Event Facilitator

## Overview

The Kaizen Event Facilitator skill provides comprehensive capabilities for planning and executing rapid improvement workshops. It supports team coordination, problem-solving facilitation, countermeasure prioritization, and structured follow-up management to ensure sustainable results.

## Capabilities

- Event charter development
- Cross-functional team assembly
- Problem statement formulation
- Root cause analysis facilitation
- Countermeasure prioritization
- Implementation action tracking
- 30-60-90 day follow-up scheduling

## Used By Processes

- LEAN-003: Kaizen Event Facilitation
- CI-002: A3 Problem Solving
- SIX-005: Root Cause Analysis

## Tools and Libraries

- Collaboration platforms
- Project tracking tools
- Video conferencing APIs
- Workshop templates

## Usage

```yaml
skill: kaizen-event-facilitator
inputs:
  event_type: "3-day_kaizen"  # 2-hour | half-day | full-day | 3-day | week
  problem_area: "Changeover time reduction on Press Line 2"
  target_improvement: "50% reduction in changeover time"
  team_composition:
    - role: "facilitator"
    - role: "process_owner"
    - role: "operators"
      count: 3
    - role: "maintenance"
    - role: "engineering"
outputs:
  - event_charter
  - team_roster
  - current_state_analysis
  - root_cause_findings
  - countermeasure_plan
  - implementation_schedule
  - follow_up_checklist
```

## Workflow

1. **Pre-Event Planning** - Define scope, assemble team, prepare materials
2. **Day 1: Understand** - Map current state, identify wastes, gather data
3. **Day 2: Analyze** - Root cause analysis, brainstorm solutions
4. **Day 3: Implement** - Execute quick wins, plan remaining actions
5. **Follow-Up** - Track 30-60-90 day milestones, verify results

## Event Charter Template

| Element | Description |
|---------|-------------|
| Problem Statement | Clear description of the issue |
| Scope | Process boundaries |
| Target | Measurable improvement goal |
| Team | Cross-functional participants |
| Schedule | Event dates and milestones |
| Success Criteria | How results will be measured |

## Integration Points

- Calendar and scheduling systems
- Action tracking platforms
- Metrics dashboards
- Document management systems
