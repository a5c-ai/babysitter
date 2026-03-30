---
name: labor-productivity-optimizer
description: AI-powered workforce planning and task assignment skill to maximize warehouse labor efficiency
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

# Labor Productivity Optimizer

## Overview

The Labor Productivity Optimizer is an AI-powered skill that optimizes workforce planning and task assignment to maximize warehouse labor efficiency. It uses engineered labor standards, real-time workload analysis, and predictive models to balance resources, improve productivity, and support incentive programs.

## Capabilities

- **Engineered Labor Standards**: Establish and maintain time standards for warehouse tasks based on methods-time measurement
- **Task Interleaving Optimization**: Combine tasks intelligently to minimize non-productive travel and wait time
- **Real-Time Workload Balancing**: Dynamically redistribute work across resources to prevent bottlenecks
- **Productivity Tracking and Reporting**: Monitor individual and team productivity against standards in real-time
- **Incentive Program Calculation**: Calculate performance-based incentive payments tied to productivity metrics
- **Absenteeism Prediction**: Predict staffing shortfalls based on historical patterns and external factors
- **Training Needs Identification**: Identify skill gaps and training opportunities based on performance data

## Tools and Libraries

- LMS APIs
- Time and Motion Analysis Tools
- Workforce Management Platforms
- Scheduling Optimization Libraries

## Used By Processes

- Warehouse Labor Management
- Pick-Pack-Ship Operations
- Receiving and Putaway Optimization

## Usage

```yaml
skill: labor-productivity-optimizer
inputs:
  shift:
    date: "2026-01-25"
    shift: "first"
    start_time: "06:00"
    end_time: "14:30"
  workforce:
    - employee_id: "EMP001"
      skills: ["picking", "packing", "forklift"]
      productivity_rating: 105
    - employee_id: "EMP002"
      skills: ["picking", "packing"]
      productivity_rating: 98
  workload:
    picking_lines: 5000
    packing_orders: 800
    receiving_pallets: 150
  labor_standards:
    picking_lines_per_hour: 60
    packing_orders_per_hour: 25
    receiving_pallets_per_hour: 12
outputs:
  staffing_plan:
    picking:
      required_hours: 83.3
      assigned_employees: ["EMP001", "EMP002", "EMP003"]
      coverage_percent: 100
    packing:
      required_hours: 32.0
      assigned_employees: ["EMP004", "EMP005"]
      coverage_percent: 100
  productivity_forecast:
    expected_completion_time: "14:00"
    overtime_risk: "low"
  task_assignments:
    - employee_id: "EMP001"
      tasks:
        - type: "picking"
          zone: "ZONE_A"
          start: "06:00"
          expected_lines: 180
```

## Integration Points

- Warehouse Management Systems (WMS)
- Labor Management Systems (LMS)
- Time and Attendance Systems
- HRIS/Payroll Systems
- Training Management Systems

## Performance Metrics

- Units per labor hour
- Productivity to standard percentage
- Labor cost per unit
- Overtime percentage
- Employee utilization rate
