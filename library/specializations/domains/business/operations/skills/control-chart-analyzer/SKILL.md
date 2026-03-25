---
name: control-chart-analyzer
description: Statistical process control chart creation and analysis skill with control limit calculation and special cause detection
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: six-sigma-spc
---

# Control Chart Analyzer

## Overview

The Control Chart Analyzer skill provides comprehensive capabilities for creating and analyzing statistical process control charts. It supports multiple chart types, control limit calculation, and automated detection of special cause variation using industry-standard rules.

## Capabilities

- X-bar and R chart creation
- Individual and Moving Range (I-MR) charts
- p-chart and np-chart generation
- c-chart and u-chart analysis
- Control limit calculation
- Nelson rules application
- Western Electric rules detection
- Out-of-control signal alerting

## Used By Processes

- SIX-002: Statistical Process Control Implementation
- SIX-003: Process Capability Analysis
- QMS-003: Quality Audit Management

## Tools and Libraries

- Minitab API
- JMP
- Python scipy/statsmodels
- R quality packages

## Usage

```yaml
skill: control-chart-analyzer
inputs:
  data_type: "continuous"  # continuous | attribute
  chart_type: "xbar_r"  # xbar_r | xbar_s | imr | p | np | c | u
  subgroup_size: 5
  data:
    - subgroup: [10.2, 10.1, 10.3, 10.0, 10.2]
    - subgroup: [10.4, 10.3, 10.2, 10.5, 10.3]
  specification_limits:
    usl: 10.8
    lsl: 9.2
    target: 10.0
outputs:
  - control_chart
  - control_limits
  - out_of_control_signals
  - rule_violations
  - recommendations
```

## Chart Selection Guide

| Data Type | Subgroup Size | Recommended Chart |
|-----------|---------------|-------------------|
| Continuous | 1 | I-MR |
| Continuous | 2-10 | X-bar & R |
| Continuous | >10 | X-bar & S |
| Attribute (defectives) | Variable | p-chart |
| Attribute (defectives) | Constant | np-chart |
| Attribute (defects) | Variable area | u-chart |
| Attribute (defects) | Constant area | c-chart |

## Western Electric Rules

1. One point beyond 3 sigma
2. Two of three consecutive points beyond 2 sigma (same side)
3. Four of five consecutive points beyond 1 sigma (same side)
4. Eight consecutive points on one side of center line

## Nelson Rules

1. One point beyond Zone A (3 sigma)
2. Nine points in a row on same side of center line
3. Six points in a row, all increasing or decreasing
4. Fourteen points in a row, alternating up and down
5. Two of three points in Zone A or beyond (same side)
6. Four of five points in Zone B or beyond (same side)
7. Fifteen points in a row in Zone C
8. Eight points in a row on both sides with none in Zone C

## Integration Points

- Manufacturing Execution Systems
- Quality Management Systems
- Real-time data platforms
- Alerting systems
