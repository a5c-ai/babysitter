---
name: stakeholder-matrix-generator
description: Generate stakeholder analysis matrices and visualizations including Power-Interest grids and RACI matrices
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: business-analysis
  domain: business
  id: SK-004
  category: Stakeholder Analysis
---

# Stakeholder Matrix Generator

## Overview

The Stakeholder Matrix Generator skill provides specialized capabilities for creating comprehensive stakeholder analysis matrices and visualizations. This skill enables systematic stakeholder mapping, engagement strategy development, and accountability assignment through standardized frameworks.

## Capabilities

### Power-Interest Grid Generation
- Generate Power-Interest grids with quadrant placement
- Classify stakeholders: Manage Closely, Keep Satisfied, Keep Informed, Monitor
- Calculate grid positions based on assessment inputs
- Create visual representations with stakeholder labels

### Mitchell-Agle-Wood Salience Model
- Create Salience diagrams with seven stakeholder types
- Assess Power, Legitimacy, and Urgency attributes
- Identify Definitive, Dominant, Dangerous, Dependent, Dormant, Discretionary, and Demanding stakeholders
- Generate Venn diagram representations

### Influence Network Visualization
- Build influence network visualizations
- Map relationships between stakeholders
- Identify key influencers and connectors
- Calculate network centrality metrics

### RACI Matrix Creation
- Generate RACI matrices with validation
- Ensure single Accountable per activity
- Validate completeness of assignments
- Identify gaps and overlaps in responsibilities

### Stakeholder Engagement Strategy
- Create stakeholder engagement strategy matrices
- Define engagement levels: Unaware, Resistant, Neutral, Supportive, Leading
- Map current vs desired engagement states
- Generate engagement action plans

### Multi-Format Export
- Export to Markdown tables
- Export to CSV for spreadsheet use
- Generate image visualizations
- Create interactive HTML versions

### Stakeholder Engagement Index
- Calculate stakeholder engagement index scores
- Track engagement changes over time
- Benchmark against project targets
- Generate engagement dashboards

## Usage

### Generate Power-Interest Grid
```
Create a Power-Interest grid for these stakeholders:
[List of stakeholders with power and interest assessments]

Place each stakeholder in the appropriate quadrant and recommend engagement strategies.
```

### Create RACI Matrix
```
Generate a RACI matrix for this project:

Deliverables: [List of deliverables/activities]
Stakeholders: [List of roles/individuals]

Ensure validation rules are applied.
```

### Build Influence Network
```
Map the influence network for these stakeholders:
[Stakeholder list with relationships]

Identify key influencers and communication paths.
```

### Calculate Engagement Index
```
Calculate the stakeholder engagement index:

Current engagement levels: [Stakeholder assessments]
Target engagement levels: [Desired states]

Generate gap analysis and action recommendations.
```

## Process Integration

This skill integrates with the following business analysis processes:
- stakeholder-analysis.js - Core stakeholder analysis activities
- raci-matrix-development.js - Responsibility assignment
- stakeholder-communication-planning.js - Engagement strategy
- consulting-engagement-planning.js - Client stakeholder mapping

## Dependencies

- Visualization libraries for grid and network diagrams
- Matrix generation templates
- Calculation algorithms for indices
- Export format generators

## Stakeholder Analysis Frameworks Reference

### Power-Interest Grid Quadrants
| Quadrant | Power | Interest | Strategy |
|----------|-------|----------|----------|
| Manage Closely | High | High | Engage deeply, regular communication |
| Keep Satisfied | High | Low | Keep informed, address concerns |
| Keep Informed | Low | High | Regular updates, involve in decisions |
| Monitor | Low | Low | Minimal effort, periodic checks |

### RACI Definitions
- **R** (Responsible): Does the work
- **A** (Accountable): Ultimately answerable (only one per activity)
- **C** (Consulted): Provides input (two-way communication)
- **I** (Informed): Kept updated (one-way communication)

### RACI Validation Rules
1. Every activity must have exactly one A
2. Every activity should have at least one R
3. Minimize C's to prevent bottlenecks
4. Not everyone needs to be involved in everything

### Mitchell-Agle-Wood Stakeholder Types
1. **Dormant**: Power only
2. **Discretionary**: Legitimacy only
3. **Demanding**: Urgency only
4. **Dominant**: Power + Legitimacy
5. **Dangerous**: Power + Urgency
6. **Dependent**: Legitimacy + Urgency
7. **Definitive**: Power + Legitimacy + Urgency
