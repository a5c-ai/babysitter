---
name: driver-scheduling-optimizer
description: Automated driver assignment and hours of service compliance skill ensuring regulatory compliance and operational efficiency
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
  category: fleet-management
  priority: medium
---

# Driver Scheduling Optimizer

## Overview

The Driver Scheduling Optimizer automates driver assignment and ensures hours of service (HOS) compliance while maximizing operational efficiency. It matches drivers to loads based on qualifications, availability, and location while preventing regulatory violations and managing fatigue risk.

## Capabilities

- **HOS Compliance Monitoring**: Track and enforce hours of service regulations in real-time
- **Driver-Load Matching**: Match drivers to loads based on qualifications, location, and availability
- **Qualification Verification**: Verify driver certifications, endorsements, and training requirements
- **Fatigue Risk Assessment**: Assess driver fatigue risk based on work patterns and rest periods
- **Break and Rest Planning**: Plan mandatory breaks and rest periods into driver schedules
- **ELD Data Integration**: Integrate with electronic logging devices for accurate time tracking
- **Violation Prevention Alerting**: Alert dispatchers and drivers before potential violations occur

## Tools and Libraries

- ELD APIs
- FMCSA Compliance Databases
- Scheduling Optimization Libraries
- Driver Management Systems

## Used By Processes

- Driver Scheduling and Compliance
- Route Optimization
- Fleet Performance Analytics

## Usage

```yaml
skill: driver-scheduling-optimizer
inputs:
  drivers:
    - driver_id: "DRV001"
      name: "John Smith"
      current_location: "Chicago, IL"
      endorsements: ["hazmat", "tanker"]
      hos_status:
        driving_remaining_hours: 8.5
        duty_remaining_hours: 12.0
        cycle_remaining_hours: 55.0
        last_rest_end: "2026-01-25T06:00:00Z"
    - driver_id: "DRV002"
      name: "Jane Doe"
      current_location: "Indianapolis, IN"
      endorsements: []
      hos_status:
        driving_remaining_hours: 11.0
        duty_remaining_hours: 14.0
        cycle_remaining_hours: 60.0
        last_rest_end: "2026-01-25T05:00:00Z"
  loads:
    - load_id: "LOAD001"
      origin: "Chicago, IL"
      destination: "Columbus, OH"
      pickup_time: "2026-01-25T10:00:00Z"
      estimated_drive_time_hours: 5.5
      requirements:
        endorsements_required: []
        experience_years: 1
  scheduling_parameters:
    buffer_hours: 1.0
    prefer_home_time: true
outputs:
  driver_assignments:
    - load_id: "LOAD001"
      assigned_driver: "DRV002"
      assignment_rationale:
        - "Full HOS availability (11 hours driving)"
        - "Closer to pickup location"
        - "No endorsement requirements"
      schedule:
        deadhead_start: "2026-01-25T08:00:00Z"
        pickup: "2026-01-25T10:00:00Z"
        estimated_delivery: "2026-01-25T15:30:00Z"
        required_breaks:
          - type: "30_min_break"
            location: "Rest Area - I-70 Mile 85"
            time: "2026-01-25T12:30:00Z"
  hos_projections:
    DRV002:
      after_load:
        driving_remaining: 5.5
        duty_remaining: 7.5
        reset_required_by: "2026-01-26T19:00:00Z"
  compliance_alerts: []
```

## Integration Points

- Electronic Logging Devices (ELD)
- Fleet Management Systems
- Transportation Management Systems (TMS)
- Driver Mobile Apps
- FMCSA Systems

## Performance Metrics

- HOS violation rate
- Driver utilization rate
- Load acceptance rate
- On-time pickup percentage
- Driver satisfaction score
