---
name: fea-structural
description: Expert FEA skill for aerospace structural analysis workflows
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - WebFetch
  - WebSearch
  - Bash
metadata:
  version: "1.0"
  category: aerospace-engineering
  tags:
    - structural-analysis
    - fea
    - stress-analysis
    - simulation
---

# Finite Element Analysis Skill

## Purpose
Provide expert finite element analysis capabilities for aerospace structural analysis including static stress, buckling, and dynamic response.

## Capabilities
- NASTRAN, ABAQUS, ANSYS model setup
- Mesh generation and quality metrics
- Element type selection and justification
- Load case definition and combination
- Boundary condition specification
- Static stress analysis execution
- Buckling and stability analysis
- Results post-processing and margin calculation

## Usage Guidelines
- Select appropriate element types based on structural geometry and loading
- Verify mesh quality metrics meet aerospace standards
- Apply proper load factors per certification requirements
- Use correct material allowables for temperature and environment
- Calculate margins of safety using appropriate failure criteria
- Document all modeling assumptions and simplifications

## Dependencies
- MSC NASTRAN
- ABAQUS
- ANSYS
- HyperMesh
- Femap

## Process Integration
- AE-007: Finite Element Analysis Workflow
- AE-008: Fatigue and Damage Tolerance
- AE-009: Composite Structure Design
