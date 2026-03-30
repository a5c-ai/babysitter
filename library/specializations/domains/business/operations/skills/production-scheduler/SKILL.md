---
name: production-scheduler
description: Production scheduling optimization skill with constraint handling, changeover minimization, and due date management
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: capacity-planning
---

# Production Scheduler

## Overview

The Production Scheduler skill provides comprehensive capabilities for optimizing production schedules. It supports finite capacity scheduling, changeover optimization, due date prioritization, and real-time rescheduling to maximize throughput and on-time delivery.

## Capabilities

- Finite capacity scheduling
- Changeover sequence optimization
- Due date prioritization
- Machine assignment optimization
- Setup time reduction
- Order splitting strategies
- Schedule compression techniques
- Real-time rescheduling

## Used By Processes

- CAP-002: Production Scheduling Optimization
- TOC-002: Drum-Buffer-Rope Scheduling
- LEAN-004: Kanban System Design

## Tools and Libraries

- Scheduling algorithms
- Optimization solvers (Gurobi, CPLEX, OR-Tools)
- ERP scheduling modules
- APS systems

## Usage

```yaml
skill: production-scheduler
inputs:
  orders:
    - order_id: "ORD001"
      product: "Widget A"
      quantity: 500
      due_date: "2026-02-10"
      priority: "high"
    - order_id: "ORD002"
      product: "Widget B"
      quantity: 300
      due_date: "2026-02-12"
      priority: "normal"
  resources:
    - machine: "Press 1"
      available_hours: 16
      products: ["Widget A", "Widget B", "Widget C"]
    - machine: "Press 2"
      available_hours: 16
      products: ["Widget A", "Widget C"]
  changeover_matrix:
    "Widget A -> Widget B": 30  # minutes
    "Widget A -> Widget C": 45
    "Widget B -> Widget A": 25
  scheduling_rules:
    - "minimize_lateness"
    - "minimize_changeovers"
outputs:
  - production_schedule
  - machine_assignments
  - changeover_sequence
  - on_time_performance
  - utilization_metrics
```

## Scheduling Objectives

| Objective | Description | Metric |
|-----------|-------------|--------|
| On-time delivery | Meet customer due dates | % on-time |
| Throughput | Maximize output | Units/day |
| Utilization | Efficient resource use | % utilized |
| Changeover | Minimize setup time | Total setup hours |
| WIP | Minimize work in process | $ WIP value |

## Scheduling Rules

### Priority Rules
- **EDD** (Earliest Due Date) - Schedule by due date
- **SPT** (Shortest Processing Time) - Shortest jobs first
- **FCFS** (First Come First Served) - Order received
- **CR** (Critical Ratio) - Time remaining / work remaining

### Sequencing Rules
- **Grouping** - Similar products together
- **Optimal changeover** - Minimize total setup time
- **Color wheel** - Light to dark, small to large

## Schedule Optimization

```
Minimize: Total Lateness + (Changeover Time x Weight)

Subject to:
- Capacity constraints
- Due date requirements
- Material availability
- Resource skills
```

## Real-Time Rescheduling Triggers

1. Machine breakdown
2. Rush order arrival
3. Material shortage
4. Quality issue
5. Labor absence

## Integration Points

- ERP/MRP systems
- Manufacturing Execution Systems
- Order management systems
- Shop floor data collection
