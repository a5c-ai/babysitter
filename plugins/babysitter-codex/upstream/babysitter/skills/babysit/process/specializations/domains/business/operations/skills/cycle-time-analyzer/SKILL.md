---
name: cycle-time-analyzer
description: Cycle time analysis and reduction skill with process timing, bottleneck identification, and flow improvement
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: operational-analytics
---

# Cycle Time Analyzer

## Overview

The Cycle Time Analyzer skill provides comprehensive capabilities for analyzing and reducing cycle times. It supports time and motion studies, takt time comparison, line balancing, and value stream cycle efficiency calculations.

## Capabilities

- Time and motion study
- Cycle time distribution analysis
- Takt time comparison
- Line balancing analysis
- Bottleneck visualization
- Queue time identification
- Value stream cycle efficiency
- Improvement simulation

## Used By Processes

- LEAN-001: Value Stream Mapping
- LEAN-005: Standard Work Documentation
- TOC-001: Constraint Identification and Exploitation

## Tools and Libraries

- Time study software
- Process mining tools
- Simulation software
- Video analysis tools

## Usage

```yaml
skill: cycle-time-analyzer
inputs:
  process: "Assembly Line A"
  takt_time: 60  # seconds
  workstations:
    - name: "Station 1"
      cycle_times: [55, 58, 52, 60, 57]
    - name: "Station 2"
      cycle_times: [62, 65, 63, 61, 64]
    - name: "Station 3"
      cycle_times: [48, 50, 47, 52, 49]
  value_stream_data:
    total_lead_time: 10  # days
    value_added_time: 45  # minutes
outputs:
  - cycle_time_summary
  - bottleneck_analysis
  - line_balance_chart
  - improvement_recommendations
  - cycle_efficiency
```

## Cycle Time Components

| Component | Definition | Example |
|-----------|------------|---------|
| Cycle Time | Total time to complete one unit | 60 seconds |
| Process Time | Time spent processing | 45 seconds |
| Queue Time | Time waiting in queue | 2 hours |
| Move Time | Time spent moving | 5 minutes |
| Setup Time | Time to changeover | 30 minutes |

## Time Study Process

### Step 1: Preparation
- Select process to study
- Break down work elements
- Prepare observation form
- Train observer

### Step 2: Observation
- Multiple cycle observations
- Document each element
- Note abnormalities
- Capture variability

### Step 3: Analysis
- Calculate averages
- Identify variation sources
- Compare to takt time
- Identify improvement opportunities

## Line Balance Efficiency

```
Line Balance Efficiency = Sum of Cycle Times / (Number of Stations x Longest Cycle Time)

Example:
Station 1: 57 sec
Station 2: 63 sec
Station 3: 49 sec

Efficiency = (57 + 63 + 49) / (3 x 63) = 169 / 189 = 89.4%
```

## Value Stream Cycle Efficiency

```
Cycle Efficiency = Value-Added Time / Total Lead Time

Example:
Value-Added Time: 45 minutes
Total Lead Time: 10 days = 14,400 minutes

Cycle Efficiency = 45 / 14,400 = 0.31%
```

## Bottleneck Identification

Signs of a bottleneck:
- Longest cycle time
- WIP accumulation before station
- Downstream stations starved
- Overtime required

## Improvement Strategies

| Strategy | Application |
|----------|-------------|
| Eliminate | Remove non-value-added work |
| Combine | Merge small tasks |
| Rearrange | Optimize sequence |
| Simplify | Reduce complexity |
| Parallelize | Run tasks simultaneously |
| Automate | Use technology |

## Integration Points

- Manufacturing Execution Systems
- Time tracking systems
- Simulation software
- ERP systems
