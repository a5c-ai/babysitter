---
name: dependency-mapper
description: Map and visualize cross-project dependencies in programs and portfolios
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: project-management
  domain: business
  category: Program Management
  id: SK-019
---

# Dependency Mapper

## Overview

The Dependency Mapper skill provides comprehensive capabilities for mapping, visualizing, and managing cross-project dependencies within programs and portfolios. It identifies critical dependencies, detects risks, and supports program-level coordination and decision-making.

## Capabilities

### Dependency Mapping
- Create dependency network diagrams
- Map dependencies across multiple projects
- Classify dependency types (finish-start, start-start, etc.)
- Document dependency owners and interfaces
- Track dependency commitments and agreements

### Dependency Analysis
- Identify critical cross-project dependencies
- Calculate dependency risk exposure
- Detect circular dependencies
- Analyze dependency chain length and complexity
- Model cascade impact of delays

### Visualization
- Generate program-level dependency views
- Create dependency matrices
- Visualize dependency timelines
- Show dependency status dashboards
- Produce stakeholder-specific views

### Risk and Resolution
- Track dependency resolution status
- Perform dependency impact analysis
- Recommend dependency mitigation strategies
- Alert on dependency risks and issues
- Generate program-level dependency reports

## Usage

### Input Requirements
- Project schedules and milestones
- Cross-project interface definitions
- Dependency relationships and commitments
- Dependency owner assignments
- Risk tolerance thresholds

### Output Deliverables
- Dependency network diagram
- Dependency risk assessment
- Circular dependency report
- Dependency status tracking
- Mitigation recommendations

### Example Use Cases
1. **Program Planning**: Map initial dependencies
2. **Integration Review**: Analyze cross-project interfaces
3. **Risk Assessment**: Identify dependency risks
4. **Governance Reporting**: Report dependency status

## Process Integration

This skill integrates with the following processes:
- Program Dependency Management
- portfolio-prioritization.js
- Schedule Development and Critical Path Analysis
- Risk Planning and Assessment

## Dependencies

- Network analysis libraries
- Graph algorithms
- Visualization utilities
- Scheduling integration APIs

## Related Skills

- SK-001: Gantt Chart Generator
- SK-002: Critical Path Analyzer
- SK-013: Portfolio Optimization
