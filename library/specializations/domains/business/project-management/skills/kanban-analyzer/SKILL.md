---
name: kanban-analyzer
description: Analyze Kanban flow metrics and identify bottlenecks
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
  id: SK-016
---

# Kanban Board Analyzer

## Overview

The Kanban Board Analyzer skill provides deep analysis of Kanban flow metrics to identify bottlenecks, optimize WIP limits, and improve flow efficiency. It generates cumulative flow diagrams, throughput analysis, and actionable recommendations for continuous flow improvement.

## Capabilities

### Flow Visualization
- Generate cumulative flow diagrams (CFD)
- Create throughput run charts
- Visualize cycle time distribution
- Show aging work item charts
- Display WIP trends over time

### Flow Metrics
- Calculate WIP (Work in Progress) statistics
- Calculate throughput variability
- Measure lead time and cycle time
- Calculate flow efficiency
- Analyze blocked time and wait states

### Bottleneck Analysis
- Identify bottlenecks and constraints
- Detect queue buildup patterns
- Analyze stage-to-stage flow rates
- Calculate constraint impact on throughput
- Identify flow leakage points

### Optimization Recommendations
- Recommend WIP limit adjustments
- Suggest process improvements
- Generate aging work item reports
- Calculate optimal batch sizes
- Model WIP limit scenarios

## Usage

### Input Requirements
- Kanban board state data
- Work item history with state transitions
- Current WIP limits
- Board configuration (columns, swimlanes)
- Historical flow data

### Output Deliverables
- Cumulative flow diagram
- Flow metrics report
- Bottleneck analysis
- WIP limit recommendations
- Aging items alert list

### Example Use Cases
1. **Daily Standup**: Review CFD for flow issues
2. **Process Review**: Analyze bottlenecks and constraints
3. **WIP Tuning**: Optimize WIP limits based on data
4. **Continuous Improvement**: Track flow improvement trends

## Process Integration

This skill integrates with the following processes:
- Kanban Flow Optimization
- agile-metrics-velocity.js
- Issue Management and Escalation
- Status Reporting and Communication Management

## Dependencies

- Flow metrics calculations
- Visualization libraries
- Statistical analysis utilities
- Board integration APIs

## Related Skills

- SK-005: Agile Metrics Calculator
- SK-010: Sprint Planning Calculator
- SK-014: Issue Tracker
