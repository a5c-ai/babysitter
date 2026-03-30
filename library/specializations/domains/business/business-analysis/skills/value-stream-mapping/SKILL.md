---
name: value-stream-mapping
description: Create and analyze value stream maps with waste identification and process efficiency metrics
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: business-analysis
  domain: business
  id: SK-008
  category: Lean Analysis
---

# Value Stream Mapping

## Overview

The Value Stream Mapping skill provides specialized capabilities for creating and analyzing value stream maps (VSM) using Lean principles. This skill enables visualization of material and information flows, identification of waste, and development of future-state improvements for process optimization.

## Capabilities

### Current-State Value Stream Maps
- Generate current-state value stream maps
- Document process steps with standard VSM icons
- Capture time metrics for each process step
- Map information and material flows

### Process Cycle Efficiency (PCE)
- Calculate process cycle efficiency
- Determine value-added vs non-value-added time
- Benchmark PCE against industry standards
- Track PCE improvement over time

### Eight Types of Waste (DOWNTIME)
- Identify Defects in processes
- Identify Overproduction waste
- Identify Waiting time waste
- Identify Non-utilized talent
- Identify Transportation waste
- Identify Inventory excess
- Identify Motion waste
- Identify Extra-processing waste

### Time Metrics Calculation
- Calculate lead time (total time from request to delivery)
- Calculate cycle time (time for one unit through process)
- Calculate takt time (pace of customer demand)
- Compare metrics to identify bottlenecks

### Future-State Value Stream Maps
- Generate future-state value stream maps
- Apply Lean principles to eliminate waste
- Design pull systems and flow
- Incorporate continuous flow where possible

### Kaizen Burst Prioritization
- Create kaizen burst prioritization lists
- Assign improvement ownership
- Estimate improvement impact
- Track kaizen implementation progress

### Improvement Progress Tracking
- Track improvement progress over time
- Compare current vs target state metrics
- Generate progress dashboards
- Report on waste reduction achievements

## Usage

### Create Current-State VSM
```
Create a current-state value stream map for:
[Process description with steps]

Include time metrics and identify waste at each step.
```

### Calculate PCE
```
Calculate process cycle efficiency:
[Process steps with value-added and non-value-added times]

Compare to industry benchmarks and recommend improvements.
```

### Identify Waste
```
Identify all eight types of waste in this process:
[Process description]

Quantify waste impact and prioritize elimination opportunities.
```

### Create Future-State VSM
```
Design a future-state value stream map:
Current State: [Current VSM details]
Improvement Goals: [Target metrics]

Apply Lean principles and show expected improvements.
```

## Process Integration

This skill integrates with the following business analysis processes:
- value-stream-mapping.js - Core VSM activities
- process-gap-analysis.js - Process improvement identification
- sipoc-process-definition.js - Process boundary definition

## Dependencies

- VSM templates and icons
- Lean metrics calculations
- Time study data structures
- Visualization libraries

## Value Stream Mapping Reference

### VSM Standard Icons
| Icon | Name | Description |
|------|------|-------------|
| Process Box | Process | Value-adding process step |
| Triangle | Inventory | Work-in-progress or finished goods |
| Arrow (push) | Push Flow | Material pushed to next step |
| Supermarket | Pull System | Controlled inventory buffer |
| FIFO Lane | FIFO | First-in-first-out flow |
| Kaizen Burst | Improvement | Identified improvement opportunity |
| Electronic Info | Information Flow | Electronic information transfer |

### DOWNTIME Waste Categories
| Letter | Waste Type | Examples |
|--------|-----------|----------|
| D | Defects | Rework, scrap, errors |
| O | Overproduction | Making more than needed |
| W | Waiting | Idle time, queue time |
| N | Non-utilized talent | Underused skills, ideas ignored |
| T | Transportation | Unnecessary movement of materials |
| I | Inventory | Excess stock, WIP buildup |
| M | Motion | Unnecessary movement of people |
| E | Extra-processing | Over-engineering, redundant steps |

### Key Time Metrics
| Metric | Definition | Formula |
|--------|------------|---------|
| Lead Time | Total time from order to delivery | Sum of all process and wait times |
| Cycle Time | Time to complete one unit | Processing time per unit |
| Takt Time | Rate of customer demand | Available time / Customer demand |
| PCE | Process Cycle Efficiency | Value-Added Time / Lead Time |

### PCE Benchmarks
| Industry | Typical PCE | World Class |
|----------|-------------|-------------|
| Manufacturing | 5-10% | 25%+ |
| Service | 1-5% | 15%+ |
| Healthcare | 1-3% | 10%+ |
| Software | 5-15% | 30%+ |

### Future-State Design Principles
1. Produce to takt time
2. Develop continuous flow where possible
3. Use supermarkets where continuous flow is not possible
4. Send customer schedule to one production process
5. Level the production mix
6. Create initial pull with small increments
7. Develop the ability to make every part every day
