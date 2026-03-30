---
name: value-stream-mapper
description: Value stream mapping skill for current state analysis, waste identification, and future state design with implementation roadmaps
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

# Value Stream Mapper

## Overview

The Value Stream Mapper skill provides comprehensive capabilities for mapping, analyzing, and improving value streams. It supports current state process flow mapping, material and information flow visualization, and future state design with actionable implementation roadmaps.

## Capabilities

- Current state process flow mapping
- Material and information flow visualization
- Lead time and cycle time calculation
- Value-added vs. non-value-added time analysis
- Seven wastes (TIMWOODS) identification
- Future state design with improvement targets
- Implementation roadmap generation

## Used By Processes

- LEAN-001: Value Stream Mapping
- LEAN-003: Kaizen Event Facilitation
- CI-001: Operational Excellence Program Design

## Tools and Libraries

- Process mining tools
- Visio/Lucidchart APIs
- VSM templates
- Data visualization libraries

## Usage

```yaml
skill: value-stream-mapper
inputs:
  process_scope: "Order-to-delivery for product line A"
  mapping_type: "current_state"  # current_state | future_state
  data_sources:
    - erp_system: "SAP"
    - mes_data: "production_logs"
outputs:
  - current_state_map
  - waste_analysis
  - lead_time_metrics
  - future_state_design
  - implementation_roadmap
```

## Workflow

1. **Define Scope** - Identify product family and process boundaries
2. **Gather Data** - Collect process times, inventory levels, and flow information
3. **Map Current State** - Document material and information flows
4. **Identify Wastes** - Categorize and quantify the seven wastes
5. **Design Future State** - Create improved process design
6. **Plan Implementation** - Develop prioritized action roadmap

## Integration Points

- ERP systems (SAP, Oracle, Microsoft Dynamics)
- Manufacturing Execution Systems (MES)
- Process mining tools
- Project management platforms
