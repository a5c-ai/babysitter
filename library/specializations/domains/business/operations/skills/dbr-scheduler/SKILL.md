---
name: dbr-scheduler
description: Drum-Buffer-Rope scheduling skill for constraint-based production pacing with buffer management
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

# DBR Scheduler

## Overview

The DBR (Drum-Buffer-Rope) Scheduler skill provides comprehensive capabilities for implementing constraint-based production scheduling. It supports drum schedule generation, buffer management, and rope release scheduling to maximize throughput while minimizing WIP.

## Capabilities

- Drum schedule generation
- Time buffer calculation
- Shipping buffer management
- Constraint buffer monitoring
- Rope release scheduling
- Buffer penetration tracking
- Schedule synchronization

## Used By Processes

- TOC-002: Drum-Buffer-Rope Scheduling
- CAP-002: Production Scheduling Optimization
- TOC-001: Constraint Identification and Exploitation

## Tools and Libraries

- Production scheduling systems
- ERP integration APIs
- Buffer management tools
- Real-time monitoring platforms

## Usage

```yaml
skill: dbr-scheduler
inputs:
  constraint_resource: "CNC Machine 3"
  constraint_capacity: 8  # hours per day
  orders:
    - order_id: "ORD001"
      quantity: 100
      due_date: "2026-02-15"
      constraint_time: 2.5  # hours
    - order_id: "ORD002"
      quantity: 50
      due_date: "2026-02-10"
      constraint_time: 1.5
  buffer_times:
    constraint_buffer: 2  # days
    shipping_buffer: 1    # day
    assembly_buffer: 0.5  # days
outputs:
  - drum_schedule
  - rope_release_schedule
  - buffer_status
  - order_priorities
  - shipping_dates
```

## DBR Components

### Drum
- The schedule for the constraint resource
- Sets the pace for entire system
- Based on customer due dates and constraint capacity

### Buffer
- Time protection before constraint (constraint buffer)
- Time protection before shipping (shipping buffer)
- Measured in time, not inventory

### Rope
- Release signal for raw materials
- Timed to constraint buffer length
- Prevents excess WIP release

## Buffer Management

| Buffer Penetration | Zone | Action |
|-------------------|------|--------|
| 0-33% | Green | Normal operation |
| 34-66% | Yellow | Monitor closely |
| 67-100% | Red | Expedite immediately |

## Buffer Sizing Guidelines

```
Constraint Buffer = Production Lead Time x Safety Factor

Where:
- Production Lead Time = Time from release to constraint
- Safety Factor = 1.0-2.0 based on variability
```

## Schedule Synchronization

1. Schedule constraint (drum)
2. Calculate release dates (rope)
3. Set buffer monitoring points
4. Communicate shipping commitments
5. Monitor buffer penetration

## Integration Points

- ERP/MRP systems
- Manufacturing Execution Systems
- Order management systems
- Real-time shop floor data
