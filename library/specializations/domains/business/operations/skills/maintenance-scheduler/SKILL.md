---
name: maintenance-scheduler
description: Maintenance planning and scheduling skill with TPM integration and predictive maintenance support
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: workflow-automation
---

# Maintenance Scheduler

## Overview

The Maintenance Scheduler skill provides comprehensive capabilities for planning and scheduling maintenance activities. It supports preventive maintenance scheduling, autonomous maintenance checklists, predictive maintenance integration, and TPM pillar support.

## Capabilities

- Preventive maintenance scheduling
- Autonomous maintenance checklists
- Predictive maintenance integration
- Spare parts planning
- Work order management
- MTBF/MTTR tracking
- Maintenance backlog management
- TPM pillar support

## Used By Processes

- LEAN-005: Standard Work Documentation
- CAP-002: Production Scheduling Optimization
- QMS-001: ISO 9001 Implementation

## Tools and Libraries

- CMMS systems (Maximo, SAP PM, Fiix)
- IoT sensors
- Predictive analytics platforms
- Mobile maintenance apps

## Usage

```yaml
skill: maintenance-scheduler
inputs:
  equipment_list:
    - equipment_id: "CNC-001"
      name: "CNC Machine 1"
      criticality: "high"
      current_runtime: 4500  # hours
      last_pm: "2025-12-15"
    - equipment_id: "CONV-002"
      name: "Conveyor System 2"
      criticality: "medium"
      current_runtime: 8000
      last_pm: "2025-11-30"
  maintenance_tasks:
    - task_id: "PM-001"
      description: "Lubrication"
      frequency: "weekly"
      duration: 30  # minutes
      skills: ["mechanic"]
    - task_id: "PM-002"
      description: "Filter replacement"
      frequency: "monthly"
      duration: 60
      skills: ["mechanic"]
  production_schedule:
    - date: "2026-01-25"
      available_window: 2  # hours
  technicians:
    - name: "Tech A"
      skills: ["mechanic", "electrical"]
      availability: "day_shift"
outputs:
  - maintenance_schedule
  - work_orders
  - parts_requirements
  - resource_allocation
  - backlog_report
  - reliability_metrics
```

## Maintenance Types

| Type | Description | Trigger |
|------|-------------|---------|
| Reactive | Fix after failure | Breakdown |
| Preventive | Scheduled based on time/usage | Calendar/runtime |
| Predictive | Based on condition monitoring | Sensor data |
| Proactive | Eliminate failure modes | Root cause |
| Autonomous | Operator-performed | Daily/shift |

## TPM Eight Pillars

| Pillar | Focus Area |
|--------|------------|
| Autonomous Maintenance | Operator ownership |
| Planned Maintenance | Scheduled PM |
| Quality Maintenance | Zero defects |
| Focused Improvement | Eliminate losses |
| Early Equipment Management | Design for reliability |
| Training | Skills development |
| Safety/Environment | Zero accidents |
| Office TPM | Administrative efficiency |

## Reliability Metrics

### MTBF (Mean Time Between Failures)
```
MTBF = Total Operating Time / Number of Failures

Example: 1000 hours / 5 failures = 200 hours
```

### MTTR (Mean Time To Repair)
```
MTTR = Total Repair Time / Number of Repairs

Example: 25 hours / 5 repairs = 5 hours
```

### Availability
```
Availability = MTBF / (MTBF + MTTR)

Example: 200 / (200 + 5) = 97.6%
```

## Maintenance Scheduling Rules

| Priority | Criteria | Scheduling |
|----------|----------|------------|
| Critical | Safety or production stop | Immediate |
| High | Affects quality or capacity | Next available window |
| Medium | Preventive maintenance | Scheduled window |
| Low | Nice to have | When convenient |

## Predictive Maintenance Signals

| Technology | Monitors | Detects |
|------------|----------|---------|
| Vibration | Rotating equipment | Bearing wear, imbalance |
| Thermography | All equipment | Hot spots, electrical |
| Oil Analysis | Lubricated systems | Wear particles, contamination |
| Ultrasound | All equipment | Leaks, electrical arcing |

## Integration Points

- CMMS/EAM systems
- Production scheduling
- Spare parts inventory
- IoT/sensor platforms
