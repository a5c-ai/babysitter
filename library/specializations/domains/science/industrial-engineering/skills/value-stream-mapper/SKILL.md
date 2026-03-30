---
name: value-stream-mapper
description: Value stream mapping skill for current state analysis, waste identification, and future state design.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: lean-manufacturing
  backlog-id: SK-IE-009
---

# value-stream-mapper

You are **value-stream-mapper** - a specialized skill for creating and analyzing value stream maps to identify waste and design improved future states.

## Overview

This skill enables AI-powered value stream mapping including:
- Current state map generation
- Process box data collection (C/T, C/O, uptime, etc.)
- Material flow visualization
- Information flow mapping
- Timeline calculation (lead time, process time)
- Seven wastes (TIMWOODS) identification
- Future state design with kaizen bursts
- Implementation roadmap generation

## Prerequisites

- Understanding of lean manufacturing principles
- Access to process data (times, inventory, etc.)
- Diagramming tools (draw.io, Visio, Lucidchart)

## Capabilities

### 1. Current State Data Collection

```python
class ProcessBox:
    """
    Data structure for VSM process box
    """
    def __init__(self, name):
        self.name = name
        self.cycle_time = None  # C/T in seconds
        self.changeover_time = None  # C/O in minutes
        self.uptime = None  # Percentage
        self.operators = None
        self.batch_size = None
        self.available_time = None  # seconds per shift
        self.shifts = None
        self.scrap_rate = None  # Percentage
        self.wip_before = None  # Inventory before process
        self.wip_after = None  # Inventory after process

    def calculate_metrics(self):
        """Calculate derived metrics"""
        # Effective cycle time
        if self.uptime:
            self.effective_ct = self.cycle_time / (self.uptime / 100)

        # Available production time
        if self.available_time and self.shifts:
            self.daily_available = self.available_time * self.shifts

        # Daily capacity
        if self.daily_available and self.cycle_time:
            self.daily_capacity = self.daily_available / self.cycle_time

        return self

class ValueStreamMap:
    """
    Complete value stream map data structure
    """
    def __init__(self, product_family, customer_demand):
        self.product_family = product_family
        self.customer_demand = customer_demand  # units per day
        self.processes = []
        self.suppliers = []
        self.customer = None
        self.information_flows = []

    def add_process(self, process_box):
        self.processes.append(process_box)

    def calculate_takt_time(self, available_time_per_day):
        """Takt time = available time / customer demand"""
        self.takt_time = available_time_per_day / self.customer_demand
        return self.takt_time
```

### 2. Timeline Calculation

```python
def calculate_timeline(vsm):
    """
    Calculate lead time and process time from VSM
    """
    process_time = 0
    lead_time = 0

    timeline = []

    for process in vsm.processes:
        # Process time (value-added time)
        pt = process.cycle_time
        process_time += pt

        # Lead time includes waiting (inventory)
        # Assume inventory in days
        wait_time = 0
        if process.wip_before:
            wait_time = process.wip_before / vsm.customer_demand

        lead_time += wait_time + (pt / 3600 / 8)  # Convert to days

        timeline.append({
            "process": process.name,
            "process_time_sec": pt,
            "wait_time_days": wait_time,
            "cumulative_lead_time": lead_time
        })

    return {
        "total_process_time_sec": process_time,
        "total_lead_time_days": lead_time,
        "pce": (process_time / 3600 / 8) / lead_time * 100,  # Process Cycle Efficiency
        "timeline": timeline
    }
```

### 3. Waste Identification (TIMWOODS)

```python
def identify_wastes(vsm, timeline):
    """
    Identify seven wastes + skills underutilization
    """
    wastes = {
        "transportation": [],
        "inventory": [],
        "motion": [],
        "waiting": [],
        "overproduction": [],
        "overprocessing": [],
        "defects": [],
        "skills_underutilization": []
    }

    # Inventory waste
    for process in vsm.processes:
        if process.wip_before and process.wip_before > vsm.customer_demand:
            wastes["inventory"].append({
                "location": f"Before {process.name}",
                "amount": process.wip_before,
                "days_supply": process.wip_before / vsm.customer_demand,
                "impact": "Excess inventory ties up capital"
            })

    # Waiting waste
    total_wait = sum(t['wait_time_days'] for t in timeline['timeline'])
    if total_wait > timeline['total_lead_time_days'] * 0.5:
        wastes["waiting"].append({
            "description": "Significant waiting time",
            "wait_percentage": total_wait / timeline['total_lead_time_days'] * 100,
            "impact": "Low process cycle efficiency"
        })

    # Defects
    for process in vsm.processes:
        if process.scrap_rate and process.scrap_rate > 1:
            wastes["defects"].append({
                "process": process.name,
                "scrap_rate": process.scrap_rate,
                "impact": f"Losing {process.scrap_rate}% of production"
            })

    # Overproduction (producing more than takt)
    for process in vsm.processes:
        if process.daily_capacity and process.daily_capacity > vsm.customer_demand * 1.2:
            wastes["overproduction"].append({
                "process": process.name,
                "capacity_vs_demand": process.daily_capacity / vsm.customer_demand,
                "risk": "May produce excess inventory"
            })

    return wastes
```

### 4. Future State Design

```python
class FutureStateDesign:
    """
    Design future state value stream
    """
    def __init__(self, current_vsm, target_improvements):
        self.current = current_vsm
        self.targets = target_improvements
        self.kaizen_bursts = []
        self.supermarket_locations = []
        self.pacemaker_process = None

    def design_pull_system(self):
        """Design supermarkets and pull signals"""
        # Identify pacemaker (process closest to customer that sets pace)
        self.pacemaker_process = self.current.processes[-1]

        # Supermarket locations - break continuous flow where needed
        for i, process in enumerate(self.current.processes[:-1]):
            next_process = self.current.processes[i+1]

            # Supermarket if: different cycle times, changeovers, reliability issues
            needs_supermarket = (
                abs(process.cycle_time - next_process.cycle_time) / process.cycle_time > 0.2 or
                (process.changeover_time and process.changeover_time > 10) or
                (process.uptime and process.uptime < 90)
            )

            if needs_supermarket:
                self.supermarket_locations.append({
                    "after_process": process.name,
                    "reason": "Decouple due to cycle time or reliability mismatch",
                    "kanban_quantity": self._calculate_kanban(process)
                })

    def _calculate_kanban(self, process):
        """Calculate kanban quantity for supermarket"""
        daily_demand = self.current.customer_demand
        lead_time_days = 1  # Replenishment lead time
        safety_factor = 1.5
        container_size = 50  # Typical container

        kanban_qty = (daily_demand * lead_time_days * safety_factor) / container_size
        return int(kanban_qty) + 1

    def add_kaizen_burst(self, location, description, target_improvement):
        """Add improvement opportunity"""
        self.kaizen_bursts.append({
            "location": location,
            "description": description,
            "target": target_improvement,
            "priority": None  # Set during implementation planning
        })
```

### 5. Implementation Roadmap

```python
def create_implementation_roadmap(future_state):
    """
    Create phased implementation plan
    """
    roadmap = {
        "phase_1_foundation": {
            "duration": "1-3 months",
            "activities": [
                "5S implementation at pacemaker",
                "Standard work documentation",
                "Basic visual management"
            ]
        },
        "phase_2_flow": {
            "duration": "3-6 months",
            "activities": [
                "Implement supermarkets",
                "Create kanban loops",
                "Level production schedule"
            ]
        },
        "phase_3_pull": {
            "duration": "6-12 months",
            "activities": [
                "Connect all pull signals",
                "SMED on changeovers",
                "TPM implementation"
            ]
        }
    }

    # Prioritize kaizen bursts
    for burst in future_state.kaizen_bursts:
        if "changeover" in burst['description'].lower():
            burst['priority'] = "phase_2_flow"
        elif "quality" in burst['description'].lower():
            burst['priority'] = "phase_1_foundation"
        else:
            burst['priority'] = "phase_3_pull"

    roadmap['kaizen_events'] = future_state.kaizen_bursts

    return roadmap
```

## VSM Symbols Reference

```
Process Box:          [========]     Contains C/T, C/O, Uptime
                      |  Name  |
                      [========]

Inventory Triangle:      /\          Shows quantity and days
                        /  \
                       /____\

Supermarket:           [===]         Pull inventory buffer
                       [===]
                       [===]

Kanban:                [K]           Pull signal

FIFO Lane:             >>>           First-in-first-out

Information Flow:      ------>       Electronic
                       ~~~~~~>       Manual

Push Arrow:            ===>          Push production

Kaizen Burst:          ***           Improvement opportunity
                       * K *
                       ***
```

## Process Integration

This skill integrates with the following processes:
- `value-stream-mapping-analysis.js`
- `kaizen-event-facilitation.js`
- `standard-work-development.js`

## Output Format

```json
{
  "vsm_summary": {
    "product_family": "Widget A",
    "customer_demand": 460,
    "takt_time_sec": 62,
    "total_processes": 5
  },
  "current_state": {
    "lead_time_days": 23.5,
    "process_time_min": 185,
    "pce_percent": 0.55
  },
  "wastes_identified": {
    "inventory": 3,
    "waiting": 2,
    "defects": 1
  },
  "future_state": {
    "target_lead_time": 5,
    "supermarkets": 2,
    "kaizen_bursts": 6
  },
  "implementation_timeline": "12 months"
}
```

## Best Practices

1. **Walk the process** - Go to gemba, observe actual flow
2. **Use pencil first** - Iterate on paper before digital
3. **Include all information flows** - Not just material
4. **Calculate timeline** - Lead time vs process time
5. **Involve the team** - Get operator input
6. **Start with current state** - Understand before improving

## Constraints

- Maps reflect actual state, not ideal
- Update maps as processes change
- Document all data sources
- Validate with process owners
