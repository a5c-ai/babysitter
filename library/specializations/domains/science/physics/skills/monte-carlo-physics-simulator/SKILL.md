---
name: monte-carlo-physics-simulator
description: Monte Carlo simulation skill for statistical physics, particle transport, and stochastic processes
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
    - monte-carlo
    - statistical-physics
    - particle-transport
    - stochastic
graph:
  domains: [domain:physics]
  skillAreas: [skill-area:physics-simulation, skill-area:mathematical-reasoning, skill-area:statistical-analysis]
  workflows: [workflow:experiment-design, workflow:peer-review-cycle]
  roles: [role:computational-scientist, role:research-engineer]
---

# Monte Carlo Physics Simulator Skill

## Purpose
Provide Monte Carlo simulation capabilities for statistical physics, particle transport, and stochastic processes in physics applications.

## Capabilities
- Metropolis algorithm implementation
- Wang-Landau sampling
- Parallel tempering coordination
- Variance reduction techniques
- Autocorrelation analysis
- Error estimation and jackknife/bootstrap

## Usage Guidelines
- Choose appropriate sampling algorithms for the problem
- Implement variance reduction for rare events
- Monitor autocorrelation for independent samples
- Use proper error estimation techniques

## Dependencies
- Custom MC codes
- OpenMC
- Geant4

## Process Integration
- Monte Carlo Simulation Implementation
- Statistical Analysis Pipeline
- Monte Carlo Event Generation
