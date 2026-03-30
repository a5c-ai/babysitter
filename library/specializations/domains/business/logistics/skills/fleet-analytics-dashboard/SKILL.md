---
name: fleet-analytics-dashboard
description: Comprehensive fleet performance analytics skill tracking KPIs across fuel, utilization, maintenance, and driver performance
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

# Fleet Analytics Dashboard

## Overview

The Fleet Analytics Dashboard provides comprehensive fleet performance analytics tracking KPIs across fuel efficiency, utilization, maintenance, and driver performance. It consolidates data from multiple sources to provide actionable insights and benchmarking capabilities for fleet optimization.

## Capabilities

- **Fuel Efficiency Analysis**: Track and analyze fuel consumption patterns, identify inefficiencies, and benchmark performance
- **Utilization Rate Tracking**: Monitor vehicle utilization rates and identify underutilized assets
- **Cost Per Mile Calculation**: Calculate and track total cost per mile including fuel, maintenance, and labor
- **Driver Scorecard Generation**: Generate driver performance scorecards based on safety, efficiency, and compliance
- **Idle Time Monitoring**: Track idle time and identify opportunities for reduction
- **Benchmark Comparison**: Compare fleet performance against industry benchmarks and internal targets
- **Trend Analysis and Alerting**: Identify trends and generate alerts for performance deviations

## Tools and Libraries

- Telematics Platforms
- BI Tools (Tableau, Power BI)
- Fuel Card Integration
- Data Analytics Libraries

## Used By Processes

- Fleet Performance Analytics
- Vehicle Maintenance Planning
- Driver Scheduling and Compliance

## Usage

```yaml
skill: fleet-analytics-dashboard
inputs:
  fleet:
    fleet_id: "FLEET001"
    vehicles: 50
    analysis_period:
      start: "2026-01-01"
      end: "2026-01-24"
  data_sources:
    telematics: true
    fuel_cards: true
    maintenance_system: true
    eld_data: true
  benchmarks:
    fuel_efficiency_mpg: 7.0
    utilization_percent: 85
    cost_per_mile: 1.85
outputs:
  fleet_summary:
    total_miles: 875000
    total_fuel_gallons: 131250
    average_mpg: 6.67
    total_cost: 1575000
    cost_per_mile: 1.80
  utilization_analysis:
    average_utilization: 82.5
    vehicles_underutilized: 8
    idle_hours_total: 2500
    idle_cost_estimate: 12500
  fuel_analysis:
    average_mpg: 6.67
    mpg_trend: "improving"
    best_performing_vehicles: ["VH012", "VH023", "VH045"]
    worst_performing_vehicles: ["VH008", "VH031", "VH019"]
    fuel_cost_total: 525000
  driver_scorecards:
    - driver_id: "DRV001"
      overall_score: 92
      safety_score: 95
      efficiency_score: 88
      compliance_score: 94
      miles_driven: 8500
      mpg: 6.9
    - driver_id: "DRV002"
      overall_score: 78
      safety_score: 75
      efficiency_score: 82
      compliance_score: 78
      miles_driven: 7200
      mpg: 6.4
  alerts:
    - type: "utilization"
      message: "8 vehicles below 70% utilization target"
      severity: "warning"
    - type: "fuel"
      message: "Vehicle VH008 fuel efficiency 15% below fleet average"
      severity: "attention"
  benchmark_comparison:
    fuel_efficiency: { actual: 6.67, benchmark: 7.0, variance: -4.7 }
    utilization: { actual: 82.5, benchmark: 85, variance: -2.9 }
    cost_per_mile: { actual: 1.80, benchmark: 1.85, variance: 2.7 }
```

## Integration Points

- Telematics Systems
- Fuel Card Providers
- Maintenance Management Systems
- ELD Providers
- Business Intelligence Platforms

## Performance Metrics

- Fleet MPG
- Cost per mile
- Vehicle utilization rate
- Driver safety score
- Maintenance cost ratio
