---
name: gnc-simulation
description: Skill for guidance, navigation, and control system simulation and analysis
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
    - gnc
    - navigation
    - simulation
---

# GNC Simulation Skill

## Purpose
Provide guidance, navigation, and control system simulation and analysis capabilities including sensor modeling, filter design, and Monte Carlo analysis.

## Capabilities
- Navigation filter design (EKF, UKF)
- Sensor error modeling (IMU, GPS, star tracker)
- Guidance law implementation
- Monte Carlo simulation execution
- Covariance analysis
- Hardware-in-the-loop support
- Trajectory dispersion analysis
- Performance verification

## Usage Guidelines
- Model sensor errors accurately based on specifications
- Design navigation filters robust to expected error sources
- Implement guidance algorithms for mission requirements
- Run Monte Carlo simulations with realistic dispersions
- Verify GNC performance across operational envelope
- Document filter tuning and performance validation

## Dependencies
- MATLAB/Simulink
- GNC simulation frameworks
- HIL test systems

## Process Integration
- AE-011: Flight Control Law Development
- AE-014: Mission Design and Analysis
