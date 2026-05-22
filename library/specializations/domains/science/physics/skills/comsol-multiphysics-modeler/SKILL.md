---
name: comsol-multiphysics-modeler
description: COMSOL finite element skill for multiphysics simulations including electromagnetics, heat transfer, and fluid dynamics
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
  category: physics
  tags:
    - finite-element
    - multiphysics
    - electromagnetics
    - heat-transfer
graph:
  domains: [domain:physics]
  skillAreas: [skill-area:physics-simulation, skill-area:mathematical-reasoning, skill-area:statistical-analysis]
  workflows: [workflow:experiment-design, workflow:peer-review-cycle]
  roles: [role:computational-scientist, role:research-engineer]
---

# COMSOL Multiphysics Modeler Skill

## Purpose
Provide integration with COMSOL Multiphysics for finite element simulations spanning electromagnetics, heat transfer, fluid dynamics, and coupled physics problems.

## Capabilities
- Geometry import and meshing
- Physics module configuration
- Boundary condition setup
- Parametric sweep automation
- Results extraction and post-processing
- LiveLink scripting (MATLAB/Python)

## Usage Guidelines
- Validate mesh quality before solving
- Use appropriate physics modules for coupled problems
- Configure solver settings for convergence
- Document model assumptions and simplifications

## Dependencies
- COMSOL Multiphysics
- LiveLink for MATLAB

## Process Integration
- Experiment Design and Planning
- Data Acquisition System Development
- Spectroscopy Measurement Campaign
