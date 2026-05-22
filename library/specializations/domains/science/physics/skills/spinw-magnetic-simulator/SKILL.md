---
name: spinw-magnetic-simulator
description: SpinW spin wave simulation skill for magnetic materials, magnon dispersions, and neutron scattering analysis
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
metadata:
  specialization: physics
  domain: science
  category: condensed-matter
  phase: 6
graph:
  domains: [domain:physics]
  skillAreas: [skill-area:physics-simulation, skill-area:mathematical-reasoning, skill-area:statistical-analysis]
  workflows: [workflow:experiment-design, workflow:peer-review-cycle]
  roles: [role:computational-scientist, role:research-engineer]
---

# SpinW Magnetic Simulator

## Purpose

Provides expert guidance on SpinW spin wave calculations for magnetic materials, including magnon dispersions and neutron scattering cross-sections.

## Capabilities

- Magnetic structure definition
- Exchange coupling parameterization
- Linear spin wave theory calculations
- Neutron scattering cross-section computation
- Magnetic phase diagram exploration
- Powder averaging

## Usage Guidelines

1. **Structure Definition**: Define magnetic crystal structures
2. **Exchange Couplings**: Parameterize exchange interactions
3. **Spin Wave Theory**: Calculate magnon dispersions
4. **Neutron Scattering**: Compute cross-sections for comparison with experiments
5. **Phase Diagrams**: Explore magnetic phase transitions

## Tools/Libraries

- SpinW (MATLAB)
- magnopy
