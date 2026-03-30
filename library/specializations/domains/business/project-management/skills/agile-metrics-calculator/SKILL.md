---
name: agile-metrics-calculator
description: Calculate and analyze Agile delivery metrics including velocity, burndown, and flow metrics
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: project-management
  domain: business
  category: Agile Management
  id: SK-005
---

# Agile Metrics Calculator

## Overview

The Agile Metrics Calculator skill provides comprehensive calculation and analysis of Agile delivery metrics. It supports Scrum, Kanban, and hybrid methodologies with velocity tracking, burndown/burnup charts, flow metrics, and predictive forecasting using statistical methods.

## Capabilities

### Velocity Metrics
- Calculate team velocity with running averages
- Track velocity trends and stability
- Compute velocity range (min, max, average)
- Factor in team capacity changes
- Calculate normalized velocity per team member

### Burndown and Burnup Charts
- Generate sprint burndown charts
- Generate release burnup charts
- Calculate ideal trendlines
- Show scope change impact
- Project completion dates

### Flow Metrics (Kanban)
- Calculate cycle time and lead time
- Analyze throughput trends
- Calculate flow efficiency
- Generate cumulative flow diagrams (CFD)
- Identify bottlenecks and blockers

### Forecasting
- Perform Monte Carlo forecasting
- Calculate probability distributions for completion
- Generate confidence intervals
- Compute predictability metrics
- Support "how many" and "when" forecasts

## Usage

### Input Requirements
- Sprint/iteration data with story points
- Work item history with state transitions
- Team capacity information
- Backlog with estimates
- Optional: Historical velocity data

### Output Deliverables
- Velocity charts and statistics
- Burndown/burnup visualizations
- Flow metrics report (cycle time, throughput)
- Cumulative flow diagram
- Monte Carlo forecast with confidence levels

### Example Use Cases
1. **Sprint Planning**: Use velocity for capacity planning
2. **Release Planning**: Forecast release dates with confidence
3. **Flow Optimization**: Analyze CFD to identify bottlenecks
4. **Team Improvement**: Track predictability trends

## Process Integration

This skill integrates with the following processes:
- agile-metrics-velocity.js
- Sprint Planning and Backlog Refinement
- Kanban Flow Optimization
- Release Forecasting

## Dependencies

- Statistical analysis libraries
- Time series analysis
- Probability calculations
- Visualization libraries

## Related Skills

- SK-010: Sprint Planning Calculator
- SK-015: Retrospective Facilitator
- SK-016: Kanban Board Analyzer
