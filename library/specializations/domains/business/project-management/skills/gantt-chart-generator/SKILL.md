---
name: gantt-chart-generator
description: Generate and manage Gantt chart visualizations from schedule data with interactive timeline views
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
  id: SK-001
---

# Gantt Chart Generator

## Overview

The Gantt Chart Generator skill provides comprehensive capabilities for creating, managing, and visualizing project schedules using Gantt chart representations. This skill transforms task lists, dependencies, and resource assignments into professional timeline visualizations that support project planning, tracking, and communication.

## Capabilities

### Chart Generation
- Generate Gantt charts from task lists and dependencies
- Create milestone markers and summary tasks
- Display critical path highlighting
- Show resource assignments on tasks
- Generate baseline vs. actual comparison views

### Export and Formatting
- Export to multiple formats (SVG, PNG, HTML, MS Project XML)
- Create timeline views at different zoom levels (day, week, month, quarter)
- Support for multiple baselines tracking
- Generate print-ready layouts

### Advanced Features
- Automatic layout optimization
- Dependency line routing (FS, SS, FF, SF)
- Slack/float visualization
- Progress percentage display
- Resource histogram integration

## Usage

### Input Requirements
- Task list with unique identifiers
- Task durations and/or start/end dates
- Dependency relationships (predecessor/successor)
- Optional: Resource assignments
- Optional: Baseline data for comparison

### Output Formats
- **SVG**: Scalable vector graphics for web and print
- **PNG**: Raster image for presentations
- **HTML**: Interactive web-based view
- **MS Project XML**: Import to Microsoft Project

### Example Use Cases
1. **Project Kickoff**: Generate initial schedule visualization for stakeholder review
2. **Status Reporting**: Create baseline vs. actual comparisons
3. **Resource Planning**: Visualize resource loading across timeline
4. **Executive Presentations**: Generate high-level summary Gantt views

## Process Integration

This skill integrates with the following processes:
- Schedule Development and Critical Path Analysis
- earned-value-management.js
- agile-metrics-velocity.js
- Program Dependency Management

## Dependencies

- Visualization libraries for chart rendering
- Date/time libraries for calendar calculations
- Scheduling algorithms for layout optimization
- Export format converters

## Related Skills

- SK-002: Critical Path Analyzer
- SK-003: Resource Leveling Optimizer
- SK-019: Dependency Mapper
