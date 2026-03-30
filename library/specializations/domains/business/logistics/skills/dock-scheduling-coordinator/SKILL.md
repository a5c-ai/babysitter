---
name: dock-scheduling-coordinator
description: Automated dock appointment scheduling skill with inbound flow optimization and receiving efficiency management
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
  category: warehouse
  priority: medium
---

# Dock Scheduling Coordinator

## Overview

The Dock Scheduling Coordinator is an automated skill that manages dock appointment scheduling, optimizes inbound flow, and improves receiving efficiency. It coordinates carrier appointments, manages dock door assignments, and integrates with yard management to ensure smooth inbound operations.

## Capabilities

- **Appointment Slot Optimization**: Intelligently schedule appointments to balance workload and maximize dock utilization
- **Carrier Compliance Tracking**: Monitor carrier adherence to scheduled appointments and track compliance metrics
- **Dock Door Assignment**: Assign appropriate dock doors based on trailer type, commodity, and unloading requirements
- **Unloading Time Estimation**: Predict unloading duration based on shipment characteristics and historical data
- **ASN Processing Automation**: Process advance shipment notices to prepare for inbound receipts
- **Yard Management Integration**: Coordinate with yard management for trailer spotting and dock door availability
- **Late Arrival Prediction**: Predict potential late arrivals and proactively adjust schedules

## Tools and Libraries

- Dock Scheduling Systems
- YMS APIs
- Carrier Portals
- GPS/Tracking Integration

## Used By Processes

- Receiving and Putaway Optimization
- Cross-Docking Operations
- Shipment Tracking and Visibility

## Usage

```yaml
skill: dock-scheduling-coordinator
inputs:
  facility:
    facility_id: "DC001"
    dock_doors: 20
    operating_hours: { start: "06:00", end: "22:00" }
    door_capabilities:
      - door_range: "1-10"
        type: "standard"
        equipment: ["forklift", "pallet_jack"]
      - door_range: "11-15"
        type: "refrigerated"
        equipment: ["forklift"]
      - door_range: "16-20"
        type: "cross_dock"
        equipment: ["conveyor"]
  appointment_request:
    carrier_id: "CARRIER001"
    po_numbers: ["PO001", "PO002"]
    trailer_type: "dry_van"
    estimated_pallets: 24
    requested_date: "2026-01-25"
    requested_time_window: { start: "08:00", end: "12:00" }
outputs:
  appointment:
    appointment_id: "APT-2026-12345"
    scheduled_date: "2026-01-25"
    scheduled_time: "09:30"
    dock_door: 5
    estimated_duration_minutes: 45
    status: "confirmed"
  schedule_summary:
    date: "2026-01-25"
    total_appointments: 35
    utilization_percent: 78
    available_slots:
      - time: "14:00"
        doors: [3, 7, 8]
      - time: "15:30"
        doors: [1, 2, 5, 7]
```

## Integration Points

- Warehouse Management Systems (WMS)
- Yard Management Systems (YMS)
- Transportation Management Systems (TMS)
- Carrier Portals
- ASN/EDI Systems

## Performance Metrics

- Dock door utilization rate
- Carrier on-time arrival rate
- Average wait time
- Appointment compliance rate
- Unloading time accuracy
