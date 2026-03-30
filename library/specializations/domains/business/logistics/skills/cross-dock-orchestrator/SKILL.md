---
name: cross-dock-orchestrator
description: Flow-through logistics process coordination skill to minimize storage time and accelerate product movement
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: logistics
  domain: business
  category: distribution
  priority: medium
---

# Cross-Dock Orchestrator

## Overview

The Cross-Dock Orchestrator coordinates flow-through logistics processes to minimize storage time and accelerate product movement through distribution facilities. It synchronizes inbound and outbound operations, manages floor staging, and optimizes the cross-docking workflow for maximum throughput.

## Capabilities

- **Inbound-Outbound Timing Synchronization**: Coordinate arrival and departure schedules to minimize dwell time
- **Floor Staging Optimization**: Manage staging areas efficiently to maintain product flow without congestion
- **Door-to-Door Mapping**: Optimize assignment of inbound doors to outbound doors based on product routing
- **Sort and Segregation Planning**: Plan sorting operations for efficient product separation and consolidation
- **Flow-Through Capacity Management**: Monitor and manage cross-dock throughput capacity in real-time
- **Break-Bulk Coordination**: Coordinate break-bulk operations for shipments requiring deconsolidation
- **Pre-Distribution Processing**: Manage value-added services performed during cross-dock operations

## Tools and Libraries

- WMS Cross-Dock Modules
- Sorting System APIs
- Flow Optimization Algorithms
- Real-Time Scheduling Tools

## Used By Processes

- Cross-Docking Operations
- Distribution Network Optimization
- Load Planning and Consolidation

## Usage

```yaml
skill: cross-dock-orchestrator
inputs:
  facility:
    facility_id: "XD001"
    inbound_doors: 15
    outbound_doors: 20
    staging_capacity_pallets: 500
  inbound_shipments:
    - shipment_id: "INB001"
      carrier: "CARRIER001"
      eta: "2026-01-25T08:00:00Z"
      pallets: 24
      destinations: ["STORE001", "STORE002", "STORE003"]
    - shipment_id: "INB002"
      carrier: "CARRIER002"
      eta: "2026-01-25T09:30:00Z"
      pallets: 36
      destinations: ["STORE002", "STORE004", "STORE005"]
  outbound_routes:
    - route_id: "OUT001"
      departure: "2026-01-25T12:00:00Z"
      destinations: ["STORE001", "STORE002"]
    - route_id: "OUT002"
      departure: "2026-01-25T14:00:00Z"
      destinations: ["STORE003", "STORE004", "STORE005"]
outputs:
  cross_dock_plan:
    inbound_assignments:
      - shipment_id: "INB001"
        door: 3
        scheduled_arrival: "2026-01-25T08:00:00Z"
        unload_complete: "2026-01-25T08:45:00Z"
      - shipment_id: "INB002"
        door: 5
        scheduled_arrival: "2026-01-25T09:30:00Z"
        unload_complete: "2026-01-25T10:30:00Z"
    staging_plan:
      - staging_zone: "A"
        route: "OUT001"
        pallets: 28
        sort_complete: "2026-01-25T11:00:00Z"
    outbound_assignments:
      - route_id: "OUT001"
        door: 18
        load_start: "2026-01-25T11:00:00Z"
        departure: "2026-01-25T12:00:00Z"
  metrics:
    average_dwell_time_hours: 3.5
    throughput_pallets_per_hour: 45
    staging_utilization_percent: 65
    on_time_departure_forecast: 100
```

## Integration Points

- Warehouse Management Systems (WMS)
- Transportation Management Systems (TMS)
- Yard Management Systems (YMS)
- Sorting/Conveyor Systems
- Carrier Scheduling Systems

## Performance Metrics

- Dwell time (average)
- Throughput (units per hour)
- On-time departure rate
- Staging utilization
- Door utilization
