---
name: vehicle-dynamics-sim
description: Deep integration with vehicle dynamics simulation tools for handling, ride, and stability analysis
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
    - simulation
    - vehicle-dynamics
    - handling
    - ride-comfort
---

# Vehicle Dynamics Simulation Skill

## Purpose
Provide deep integration with vehicle dynamics simulation tools for comprehensive handling, ride comfort, and stability analysis across various driving conditions.

## Capabilities
- Adams/Car, CarSim, IPG CarMaker model setup
- Suspension kinematics and compliance (K&C) analysis
- Tire model configuration (MF-Tyre, FTire, CDTire)
- Handling metrics calculation (understeer gradient, yaw gain)
- Ride comfort analysis (ISO 2631 comfort metrics)
- Stability control system simulation
- Driver model configuration and tuning
- Maneuver library execution (ISO lane change, steady-state cornering)

## Usage Guidelines
- Validate tire models against available test data before simulation
- Use appropriate road profiles for ride comfort analysis
- Configure driver models based on intended use case (normal, aggressive)
- Apply standard maneuvers for objective handling assessment
- Correlate simulation results with physical testing
- Document vehicle parameters and model assumptions

## Dependencies
- Adams/Car
- CarSim
- IPG CarMaker
- dSPACE ASM

## Process Integration
- VDC-001: Suspension System Development
- VDC-002: Steering System Development
- VDC-003: Brake System Development
- TVL-001: Vehicle-Level Validation Testing
