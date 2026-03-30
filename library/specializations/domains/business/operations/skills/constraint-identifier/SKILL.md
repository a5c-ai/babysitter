---
name: constraint-identifier
description: System bottleneck identification and exploitation skill with throughput analysis and five focusing steps implementation
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: theory-of-constraints
---

# Constraint Identifier

## Overview

The Constraint Identifier skill provides comprehensive capabilities for identifying and exploiting system constraints using Theory of Constraints (TOC) principles. It supports bottleneck identification, throughput analysis, and implementation of the five focusing steps.

## Capabilities

- Bottleneck identification algorithms
- Throughput rate analysis
- Constraint exploitation strategies
- Subordination planning
- Buffer sizing calculation
- Constraint elevation options
- Drum identification

## Used By Processes

- TOC-001: Constraint Identification and Exploitation
- TOC-002: Drum-Buffer-Rope Scheduling
- CAP-001: Capacity Requirements Planning

## Tools and Libraries

- Simulation software
- Throughput analysis tools
- Process mapping tools
- Data analytics platforms

## Usage

```yaml
skill: constraint-identifier
inputs:
  process_steps:
    - name: "Cutting"
      capacity: 120
      demand: 100
    - name: "Assembly"
      capacity: 80
      demand: 100
    - name: "Testing"
      capacity: 110
      demand: 100
    - name: "Packing"
      capacity: 150
      demand: 100
  current_throughput: 78
  target_throughput: 100
outputs:
  - constraint_identification
  - exploitation_strategies
  - subordination_plan
  - elevation_options
  - buffer_recommendations
```

## Five Focusing Steps

### Step 1: Identify the Constraint
- Analyze capacity vs. demand at each step
- Look for WIP accumulation points
- Identify resource with lowest throughput

### Step 2: Exploit the Constraint
- Ensure constraint never starves or blocks
- Eliminate waste at constraint
- Maximize constraint utilization

### Step 3: Subordinate Everything Else
- Pace non-constraints to constraint
- Implement pull system from constraint
- Don't overproduce at non-constraints

### Step 4: Elevate the Constraint
- Add capacity at constraint
- Reduce setup time
- Improve quality at constraint

### Step 5: Prevent Inertia
- Return to Step 1
- Find new constraint
- Continue improvement cycle

## Constraint Types

| Type | Description | Examples |
|------|-------------|----------|
| Physical | Resource limitation | Machine capacity, labor |
| Policy | Rule-based limitation | Batch sizes, schedules |
| Market | Demand limitation | Customer orders |
| Supplier | Input limitation | Raw material availability |

## Integration Points

- Manufacturing Execution Systems
- ERP systems
- Simulation software
- Production planning systems
