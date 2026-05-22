---
name: mission-trajectory
description: Expert skill for space mission design and trajectory analysis
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
    - space-systems
    - trajectory
    - orbital-mechanics
    - mission-design
graph:
  domains: [domain:aerospace-engineering]
  specializations: [specialization:aerospace-engineering]
  skillAreas: [skill-area:physics-simulation, skill-area:mathematical-reasoning, skill-area:computational-geometry]
  roles: [role:research-engineer, role:computational-scientist]
---

# Mission Design and Trajectory Skill

## Purpose
Enable comprehensive space mission design and trajectory analysis including orbital mechanics, launch window optimization, and maneuver planning.

## Capabilities
- Orbital mechanics calculations
- Launch window analysis
- Delta-V budgeting and optimization
- Transfer trajectory design
- Maneuver planning and sequencing
- Rendezvous and proximity operations
- Entry, descent, and landing analysis
- STK and GMAT integration

## Usage Guidelines
- Define clear mission objectives and constraints
- Optimize trajectories for propellant mass or time of flight
- Consider launch vehicle performance and constraints
- Account for perturbations in trajectory propagation
- Plan contingency maneuvers for off-nominal conditions
- Document trajectory design assumptions and margins

## Dependencies
- STK (Systems Tool Kit)
- GMAT
- MATLAB Aerospace Toolbox

## Process Integration
- AE-014: Mission Design and Analysis
