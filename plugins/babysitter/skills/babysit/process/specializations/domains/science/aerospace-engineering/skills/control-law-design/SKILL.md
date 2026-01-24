---
name: control-law-design
description: Expert skill for flight control law development and tuning
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
    - flight-dynamics
    - control-systems
    - autopilot
    - stability
---

# Flight Control Law Design Skill

## Purpose
Enable expert flight control law development including classical and modern control design methods, stability analysis, and robustness verification.

## Capabilities
- MATLAB/Simulink control law implementation
- Classical control design (PID, lead-lag)
- Modern control methods (LQR, H-infinity)
- Gain scheduling implementation
- Stability margin analysis
- Robustness analysis
- Nonlinear simulation
- Pilot-in-the-loop simulation support

## Usage Guidelines
- Define clear control objectives and performance requirements
- Ensure adequate stability margins across the flight envelope
- Consider actuator dynamics and rate limits in design
- Verify robustness to modeling uncertainties and variations
- Test control laws with representative pilot inputs
- Document gain schedules and implementation details

## Dependencies
- MATLAB/Simulink
- Control System Toolbox
- Robust Control Toolbox

## Process Integration
- AE-011: Flight Control Law Development
- AE-012: Handling Qualities Assessment
