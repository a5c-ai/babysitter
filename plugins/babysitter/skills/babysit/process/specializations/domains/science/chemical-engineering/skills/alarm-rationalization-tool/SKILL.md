---
name: alarm-rationalization-tool
description: Alarm management skill for alarm rationalization, setpoint optimization, and ISA-18.2 compliance
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - Bash
metadata:
  specialization: chemical-engineering
  domain: science
  category: Process Control
  skill-id: CE-SK-022
---

# Alarm Rationalization Tool Skill

## Purpose

The Alarm Rationalization Tool Skill supports alarm management including alarm rationalization, setpoint optimization, and compliance with ISA-18.2 alarm management standards.

## Capabilities

- Alarm philosophy development
- Alarm rationalization worksheets
- Priority assignment
- Setpoint determination
- Deadband optimization
- Alarm flood analysis
- State-based alarming
- Suppression strategy design
- KPI monitoring

## Usage Guidelines

### When to Use
- Rationalizing existing alarms
- Designing new alarm systems
- Optimizing alarm performance
- Addressing alarm floods

### Prerequisites
- Alarm data available
- Process understanding
- Operating procedures defined
- Risk assessment complete

### Best Practices
- Follow ISA-18.2 lifecycle
- Involve operations
- Document rationalization
- Monitor KPIs continuously

## Process Integration

This skill integrates with:
- Alarm Rationalization
- Control Strategy Development
- Safety Instrumented System Design

## Configuration

```yaml
alarm-rationalization-tool:
  standards:
    - ISA-18.2
    - EEMUA-191
  priority-levels:
    - critical
    - high
    - medium
    - low
  kpis:
    - alarms-per-hour
    - chattering-alarms
    - stale-alarms
```

## Output Artifacts

- Rationalization worksheets
- Alarm philosophy
- Priority matrices
- KPI reports
- Improvement recommendations
