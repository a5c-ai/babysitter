---
name: resource-leveling
description: Optimize resource allocation to eliminate overallocation while minimizing schedule impact
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: project-management
  domain: business
  category: Resource Management
  id: SK-003
---

# Resource Leveling Optimizer

## Overview

The Resource Leveling Optimizer skill resolves resource overallocation conflicts and optimizes resource utilization across project schedules. It applies intelligent algorithms to balance workloads, eliminate conflicts, and minimize schedule extension while respecting resource constraints and priorities.

## Capabilities

### Conflict Detection
- Detect resource overallocation conflicts
- Identify resource contention periods
- Calculate overallocation severity and duration
- Map resource conflicts to specific activities

### Leveling Algorithms
- Apply resource leveling algorithms (priority-based, min slack)
- Perform resource smoothing (within float only)
- Optimize multi-resource allocation
- Support skills-based resource assignment
- Handle part-time and split assignments

### Analysis and Reporting
- Calculate resource utilization histograms
- Generate resource loading reports
- Calculate resource costs by period
- Produce before/after comparison metrics
- Report schedule impact of leveling

### Advanced Features
- Multi-project resource leveling
- Resource pool optimization
- Skills matching and substitution
- Calendar-aware scheduling
- Overtime cost modeling

## Usage

### Input Requirements
- Activity list with durations and dependencies
- Resource assignments with effort/duration
- Resource availability calendars
- Resource capacity limits
- Optional: Resource costs and skill profiles

### Output Deliverables
- Leveled schedule with resolved conflicts
- Resource utilization histograms
- Overallocation resolution report
- Schedule impact analysis
- Resource cost projections

### Example Use Cases
1. **Schedule Finalization**: Level resources before baseline approval
2. **Resource Planning**: Optimize allocation across portfolio
3. **What-If Analysis**: Model resource constraint scenarios
4. **Cost Optimization**: Balance resource costs with schedule

## Process Integration

This skill integrates with the following processes:
- Resource Planning and Allocation
- budget-development.js
- portfolio-prioritization.js
- Team Formation and Development

## Dependencies

- Optimization algorithms
- Resource calendars and availability data
- Scheduling engine integration
- Cost calculation libraries

## Related Skills

- SK-001: Gantt Chart Generator
- SK-002: Critical Path Analyzer
- SK-004: EVM Calculator
