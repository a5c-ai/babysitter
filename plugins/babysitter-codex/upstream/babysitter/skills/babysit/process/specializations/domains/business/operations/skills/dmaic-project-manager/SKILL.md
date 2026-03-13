---
name: dmaic-project-manager
description: DMAIC methodology execution skill with tollgate reviews, documentation templates, and project tracking
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: six-sigma-spc
---

# DMAIC Project Manager

## Overview

The DMAIC Project Manager skill provides comprehensive capabilities for executing Six Sigma DMAIC (Define, Measure, Analyze, Improve, Control) projects. It supports tollgate reviews, documentation management, and benefit quantification throughout the improvement lifecycle.

## Capabilities

- Project charter development
- SIPOC diagram generation
- CTQ (Critical to Quality) tree construction
- Tollgate review facilitation
- Phase documentation management
- Deliverable tracking
- Benefit quantification

## Used By Processes

- SIX-001: DMAIC Project Execution
- CI-001: Operational Excellence Program Design
- SIX-005: Root Cause Analysis

## Tools and Libraries

- Project management platforms
- Six Sigma templates
- Tracking tools
- Statistical software integration

## Usage

```yaml
skill: dmaic-project-manager
inputs:
  project_name: "Reduce Defect Rate in Welding Process"
  business_case:
    current_defect_rate: 5.2
    target_defect_rate: 1.0
    estimated_savings: 250000
  phase: "measure"  # define | measure | analyze | improve | control
  team:
    champion: "VP Operations"
    black_belt: "Jane Smith"
    green_belts: ["John Doe", "Mary Johnson"]
outputs:
  - project_charter
  - sipoc_diagram
  - ctq_tree
  - phase_deliverables
  - tollgate_checklist
  - benefit_calculation
```

## Workflow

### Define Phase
1. Create project charter
2. Develop SIPOC diagram
3. Build CTQ tree
4. Define problem statement
5. Conduct tollgate review

### Measure Phase
1. Identify key metrics
2. Develop data collection plan
3. Validate measurement system
4. Establish baseline performance
5. Conduct tollgate review

### Analyze Phase
1. Identify potential root causes
2. Verify root causes with data
3. Determine critical Xs
4. Quantify opportunity
5. Conduct tollgate review

### Improve Phase
1. Generate solution alternatives
2. Select optimal solutions
3. Pilot improvements
4. Implement full-scale
5. Conduct tollgate review

### Control Phase
1. Develop control plan
2. Implement statistical controls
3. Document standard work
4. Transfer to process owner
5. Conduct tollgate review

## Integration Points

- Project management systems
- Statistical analysis software
- Document management systems
- Financial tracking systems
