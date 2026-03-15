---
name: kanban-system-designer
description: Pull-based production control system design skill with WIP limits, replenishment triggers, and visual management boards
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

# Kanban System Designer

## Overview

The Kanban System Designer skill provides comprehensive capabilities for designing and implementing pull-based production control systems. It supports kanban sizing, WIP limit determination, supermarket design, and electronic kanban configuration for efficient material flow.

## Capabilities

- Kanban sizing calculation
- WIP limit determination
- Supermarket design
- Signal mechanism configuration
- Pull system simulation
- Heijunka box design
- Electronic kanban (e-kanban) configuration

## Used By Processes

- LEAN-004: Kanban System Design
- TOC-002: Drum-Buffer-Rope Scheduling
- CAP-002: Production Scheduling Optimization

## Tools and Libraries

- Kanban software APIs
- Inventory management systems
- Simulation tools
- Visual board platforms

## Usage

```yaml
skill: kanban-system-designer
inputs:
  product_family: "Widget Assembly"
  demand_data:
    average_daily: 500
    peak_daily: 750
    variability: "medium"
  lead_time_data:
    replenishment_time: "4 hours"
    safety_factor: 1.5
  container_size: 50
outputs:
  - kanban_quantity_calculation
  - supermarket_layout
  - signal_card_design
  - wip_limits
  - implementation_plan
```

## Workflow

1. **Analyze Demand** - Review historical demand patterns and variability
2. **Calculate Kanban** - Determine number of kanbans needed
3. **Design Signals** - Create visual or electronic signal mechanisms
4. **Set WIP Limits** - Establish limits for each process step
5. **Configure Supermarkets** - Design inventory storage points
6. **Implement and Tune** - Deploy system and adjust parameters

## Kanban Calculation Formula

```
Number of Kanbans = (Daily Demand x Lead Time x Safety Factor) / Container Size

Where:
- Daily Demand = Average units consumed per day
- Lead Time = Time to replenish (in days)
- Safety Factor = Buffer for variability (typically 1.0-2.0)
- Container Size = Units per kanban container
```

## Integration Points

- ERP/MRP systems
- Manufacturing Execution Systems
- Inventory management platforms
- Visual management displays
