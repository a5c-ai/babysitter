---
name: predictive-maintenance-scheduler
description: Predictive maintenance scheduling skill using telematics data and historical patterns to maximize fleet uptime
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
  priority: lower
---

# Predictive Maintenance Scheduler

## Overview

The Predictive Maintenance Scheduler uses telematics data and historical patterns to predict equipment failures and schedule maintenance proactively. It maximizes fleet uptime, reduces unplanned breakdowns, and optimizes maintenance costs through data-driven scheduling and parts inventory management.

## Capabilities

- **Failure Prediction Modeling**: Use machine learning to predict component failures before they occur
- **Maintenance Schedule Optimization**: Schedule maintenance during optimal windows to minimize operational disruption
- **Parts Inventory Forecasting**: Predict parts requirements and manage maintenance inventory
- **Cost vs. Risk Analysis**: Balance maintenance costs against breakdown risk and operational impact
- **Warranty Tracking Integration**: Track warranty coverage and ensure warranty claims are captured
- **Downtime Minimization**: Optimize maintenance timing to minimize vehicle downtime
- **Compliance Inspection Scheduling**: Schedule mandatory inspections and certifications

## Tools and Libraries

- Telematics APIs
- ML Libraries (scikit-learn, TensorFlow)
- CMMS Integration
- IoT Platforms

## Used By Processes

- Vehicle Maintenance Planning
- Fleet Performance Analytics
- Driver Scheduling and Compliance

## Usage

```yaml
skill: predictive-maintenance-scheduler
inputs:
  vehicle:
    vehicle_id: "VH001"
    make: "Freightliner"
    model: "Cascadia"
    year: 2022
    odometer_miles: 125000
    engine_hours: 4500
  telematics_data:
    engine_temperature_avg: 195
    oil_pressure_psi: 42
    brake_wear_percent: 65
    tire_tread_depth_mm: [8, 7, 9, 8]
    fault_codes: ["P0171"]
    fuel_efficiency_mpg: 6.8
  maintenance_history:
    - service_type: "oil_change"
      date: "2025-11-15"
      odometer: 115000
    - service_type: "brake_inspection"
      date: "2025-10-01"
      odometer: 108000
  operational_schedule:
    daily_miles: 350
    days_per_week: 5
outputs:
  maintenance_predictions:
    - component: "brakes"
      predicted_failure_miles: 145000
      confidence: 85
      urgency: "scheduled"
      recommended_action: "brake_service"
      recommended_date: "2026-02-15"
      estimated_cost: 1200
    - component: "fuel_system"
      fault_code: "P0171"
      predicted_issue: "lean_condition"
      urgency: "soon"
      recommended_action: "fuel_system_diagnostic"
      recommended_date: "2026-01-28"
      estimated_cost: 350
  maintenance_schedule:
    - date: "2026-01-28"
      service_type: "diagnostic"
      estimated_duration_hours: 2
      estimated_cost: 350
    - date: "2026-02-01"
      service_type: "oil_change"
      estimated_duration_hours: 1
      estimated_cost: 250
  parts_forecast:
    - part: "brake_pads_set"
      quantity: 1
      needed_by: "2026-02-15"
      estimated_cost: 400
  metrics:
    predicted_uptime_percent: 97.5
    maintenance_cost_forecast_monthly: 850
    unplanned_breakdown_risk: "low"
```

## Integration Points

- Fleet Management Systems
- Telematics Platforms
- CMMS (Computerized Maintenance Management System)
- Parts Inventory Systems
- Warranty Management Systems

## Performance Metrics

- Fleet uptime percentage
- Unplanned breakdown rate
- Maintenance cost per mile
- Prediction accuracy
- Mean time between failures
