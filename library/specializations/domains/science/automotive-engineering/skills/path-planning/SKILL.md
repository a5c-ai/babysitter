---
name: path-planning
description: Trajectory planning and motion control algorithm development
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
  category: automotive-engineering
  tags:
    - adas
    - autonomous-driving
    - path-planning
    - motion-control
---

# Path Planning Algorithm Skill

## Purpose
Enable trajectory planning and motion control algorithm development for autonomous driving applications including behavior planning and emergency maneuvers.

## Capabilities
- Behavior planning state machine design
- Trajectory optimization (polynomial, spline-based)
- Model Predictive Control (MPC) implementation
- Lattice planner implementation
- Collision checking algorithms
- Comfort and safety constraint handling
- Emergency maneuver planning
- Parking trajectory generation

## Usage Guidelines
- Design behavior planning for predictable driving patterns
- Optimize trajectories for comfort and efficiency
- Implement robust collision checking at all planning stages
- Handle edge cases and emergency situations
- Validate planning algorithms in simulation
- Document algorithm parameters and tuning

## Dependencies
- ROS/ROS2
- Apollo
- Autoware
- MATLAB/Simulink

## Process Integration
- ADA-002: Path Planning and Motion Control
- ADA-003: ADAS Feature Development
- ADA-004: Simulation and Virtual Validation
