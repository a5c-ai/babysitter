---
name: critical-path-analyzer
description: Perform critical path method (CPM) analysis with forward/backward pass calculations
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: project-management
  domain: business
  category: Schedule Management
  id: SK-002
---

# Critical Path Analyzer

## Overview

The Critical Path Analyzer skill performs comprehensive Critical Path Method (CPM) analysis on project schedules. It calculates forward and backward passes to determine early/late dates, identifies float values, and highlights the critical path - the longest sequence of dependent activities that determines the minimum project duration.

## Capabilities

### Core CPM Calculations
- Calculate forward pass (early start/finish dates)
- Calculate backward pass (late start/finish dates)
- Determine total float and free float
- Identify critical path activities
- Detect near-critical paths (activities with low float)

### Advanced Analysis
- Perform what-if analysis for schedule compression
- Calculate schedule risk exposure
- Generate critical path reports and visualizations
- Support multiple calendar assignments
- Handle complex dependency relationships (FS, SS, FF, SF with lag/lead)

### Schedule Optimization
- Identify crashing candidates based on cost-duration tradeoffs
- Recommend fast-tracking opportunities
- Calculate compression costs and benefits
- Model resource-constrained critical path

## Usage

### Input Requirements
- Activity list with unique identifiers
- Activity durations
- Predecessor/successor relationships with dependency types
- Optional: Activity calendars
- Optional: Resource assignments for resource-constrained analysis

### Output Deliverables
- Critical path activity list
- Float analysis report (total float, free float per activity)
- Near-critical path identification
- Network diagram with critical path highlighted
- Schedule risk metrics

### Example Use Cases
1. **Schedule Development**: Identify critical path during initial planning
2. **Schedule Recovery**: Find compression opportunities when behind schedule
3. **Risk Assessment**: Analyze schedule risk through float analysis
4. **What-If Analysis**: Model schedule impacts of changes

## Process Integration

This skill integrates with the following processes:
- Schedule Development and Critical Path Analysis
- earned-value-management.js
- Program Dependency Management
- Risk Planning and Assessment

## Dependencies

- Network diagram algorithms
- Scheduling mathematics libraries
- Graph traversal algorithms
- Date/time calculation utilities

## Related Skills

- SK-001: Gantt Chart Generator
- SK-003: Resource Leveling Optimizer
- SK-019: Dependency Mapper
