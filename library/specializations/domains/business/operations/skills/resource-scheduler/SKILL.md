---
name: resource-scheduler
description: Resource scheduling and assignment optimization skill for personnel and equipment allocation
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: workflow-automation
---

# Resource Scheduler

## Overview

The Resource Scheduler skill provides comprehensive capabilities for optimizing resource scheduling and assignment. It supports skill-based assignment, shift scheduling, overtime optimization, and equipment allocation.

## Capabilities

- Skill-based assignment
- Shift scheduling
- Overtime optimization
- Cross-training utilization
- Equipment allocation
- Maintenance window scheduling
- Conflict resolution
- Schedule publication

## Used By Processes

- CAP-002: Production Scheduling Optimization
- CAP-001: Capacity Requirements Planning
- TOC-002: Drum-Buffer-Rope Scheduling

## Tools and Libraries

- Workforce management systems
- Scheduling optimization algorithms
- HR systems integration
- Communication platforms

## Usage

```yaml
skill: resource-scheduler
inputs:
  scheduling_horizon: 7  # days
  resources:
    - name: "John Smith"
      type: "operator"
      skills: ["assembly", "welding", "inspection"]
      shift_preference: "day"
      max_hours: 50
    - name: "Jane Doe"
      type: "operator"
      skills: ["assembly", "packaging"]
      shift_preference: "flexible"
      max_hours: 45
  requirements:
    - date: "2026-01-25"
      shift: "day"
      skill: "assembly"
      count: 3
    - date: "2026-01-25"
      shift: "day"
      skill: "welding"
      count: 2
  constraints:
    - "No consecutive night shifts"
    - "Minimum 8 hours between shifts"
    - "Maximum 10 hours per shift"
outputs:
  - schedule_assignments
  - coverage_report
  - overtime_forecast
  - skill_gaps
  - conflict_resolutions
```

## Scheduling Objectives

| Objective | Priority | Metric |
|-----------|----------|--------|
| Coverage | High | % requirements filled |
| Skill Match | High | Qualified for assignment |
| Fairness | Medium | Balanced distribution |
| Cost | Medium | Overtime minimization |
| Preference | Low | Employee satisfaction |

## Shift Patterns

| Pattern | Description | Use Case |
|---------|-------------|----------|
| Fixed | Same schedule weekly | Stable demand |
| Rotating | Shifts rotate | 24/7 operations |
| Compressed | Longer days, fewer days | Employee preference |
| Flexible | Variable start/end | Demand variation |
| Split | Two shifts per day | Peak periods |

## Skill Matrix

| Resource | Skill 1 | Skill 2 | Skill 3 |
|----------|---------|---------|---------|
| Operator A | Expert | Competent | Training |
| Operator B | Training | Expert | None |
| Operator C | Competent | Training | Expert |

## Assignment Algorithm

```
1. Identify requirements
2. Match skills to requirements
3. Apply availability constraints
4. Optimize for objectives
5. Resolve conflicts
6. Publish schedule
```

## Overtime Management

| Hours | Rate | Threshold |
|-------|------|-----------|
| 0-40 | 1.0x | Standard |
| 40-50 | 1.5x | Overtime |
| 50+ | 2.0x | Double-time |

## Cross-Training Strategy

1. Identify critical skills
2. Assess current coverage
3. Identify training candidates
4. Develop training plan
5. Track progress
6. Update skill matrix

## Integration Points

- HR/payroll systems
- Time and attendance
- ERP systems
- Communication platforms
