---
name: standard-work-documenter
description: Standardized work procedure documentation skill with time observations, work sequence analysis, and visual work instructions
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

# Standard Work Documenter

## Overview

The Standard Work Documenter skill provides comprehensive capabilities for creating and maintaining standardized work documentation. It supports time observation, work element breakdown, and visual work instruction creation to ensure consistent, efficient operations.

## Capabilities

- Time observation and measurement
- Takt time calculation
- Work element breakdown
- Standard work combination sheet
- Work sequence documentation
- Standard WIP calculation
- Visual work instruction creation

## Used By Processes

- LEAN-005: Standard Work Documentation
- LEAN-002: 5S Implementation
- QMS-001: ISO 9001 Implementation

## Tools and Libraries

- Time study software
- Video analysis tools
- Document management systems
- Visual instruction creators

## Usage

```yaml
skill: standard-work-documenter
inputs:
  process_name: "Final Assembly Station 5"
  takt_time: 60  # seconds
  observations:
    - cycle: 1
      time: 58
    - cycle: 2
      time: 62
    - cycle: 3
      time: 57
  work_elements:
    - element: "Pick part A"
      type: "manual"
    - element: "Install part A"
      type: "manual"
    - element: "Machine cycle"
      type: "machine"
outputs:
  - standard_work_combination_sheet
  - work_sequence_document
  - visual_work_instructions
  - standard_wip_calculation
  - training_materials
```

## Workflow

1. **Calculate Takt Time** - Determine customer demand rate
2. **Observe Work** - Conduct time studies of current methods
3. **Break Down Elements** - Identify individual work elements
4. **Sequence Work** - Determine optimal work sequence
5. **Document Standards** - Create combination sheets and instructions
6. **Train and Verify** - Ensure operators follow standards

## Standard Work Documents

| Document | Purpose |
|----------|---------|
| Standard Work Combination Sheet | Shows relationship between manual work, machine time, and walking |
| Standard Work Layout | Depicts physical movement and sequence |
| Job Element Sheet | Detailed breakdown of each work element |
| Visual Work Instruction | Step-by-step guidance with images |

## Takt Time Formula

```
Takt Time = Available Production Time / Customer Demand

Example:
- Available time: 8 hours = 28,800 seconds
- Customer demand: 480 units/day
- Takt time: 28,800 / 480 = 60 seconds
```

## Integration Points

- Document management systems
- Training platforms
- Quality management systems
- Manufacturing Execution Systems
