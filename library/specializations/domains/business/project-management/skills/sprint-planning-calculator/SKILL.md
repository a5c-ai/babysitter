---
name: sprint-planning-calculator
description: Calculate sprint capacity and support story point estimation
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
  id: SK-010
---

# Sprint Planning Calculator

## Overview

The Sprint Planning Calculator skill supports Agile teams in planning sprints effectively. It calculates team capacity based on availability, applies focus factors for realistic planning, and supports various estimation techniques including Planning Poker with multiple estimation scales.

## Capabilities

### Capacity Calculation
- Calculate team capacity based on availability
- Factor in focus factor for realistic planning
- Account for holidays, PTO, and meetings
- Support part-time team member calculations
- Handle team composition changes

### Estimation Support
- Support Planning Poker estimation sessions
- Provide reference story comparisons
- Support multiple estimation scales (Fibonacci, T-shirt, powers of 2)
- Track estimation accuracy over time
- Calculate estimate confidence levels

### Sprint Commitment
- Calculate velocity-based sprint commitment
- Apply capacity-to-velocity ratios
- Identify capacity risks and constraints
- Generate sprint goal recommendations
- Track commitment vs. completion ratios

### Analysis and Reporting
- Compare planned vs. actual capacity utilization
- Generate sprint planning reports
- Calculate sprint success probability
- Identify planning anti-patterns
- Produce retrospective input data

## Usage

### Input Requirements
- Team member list with availability
- Sprint duration and working days
- Historical velocity data
- Focus factor settings
- Backlog items with estimates

### Output Deliverables
- Team capacity calculation
- Recommended sprint commitment
- Capacity risk assessment
- Sprint planning summary
- Commitment vs. velocity comparison

### Example Use Cases
1. **Sprint Planning**: Calculate capacity and commitment
2. **Team Onboarding**: Adjust capacity for new members
3. **Vacation Planning**: Model capacity with PTO
4. **Process Improvement**: Analyze planning accuracy

## Process Integration

This skill integrates with the following processes:
- Sprint Planning and Backlog Refinement
- agile-metrics-velocity.js
- Resource Planning and Allocation
- Team Formation and Development

## Dependencies

- Estimation algorithms
- Capacity calculations
- Calendar integration
- Statistical analysis utilities

## Related Skills

- SK-005: Agile Metrics Calculator
- SK-015: Retrospective Facilitator
- SK-016: Kanban Board Analyzer
