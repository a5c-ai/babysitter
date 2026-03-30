---
name: flight-sim-model
description: Skill for creating and validating flight dynamics models
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
    - simulation
    - modeling
    - validation
---

# Flight Simulation Model Skill

## Purpose
Create and validate high-fidelity flight dynamics models for training simulators, engineering analysis, and flight test support.

## Capabilities
- Six-DOF equation of motion implementation
- Aerodynamic database integration
- Propulsion model integration
- Landing gear and ground dynamics
- Atmospheric modeling (ISA, GRAM)
- Sensor and actuator modeling
- Model validation against flight data
- Real-time simulation interface

## Usage Guidelines
- Use validated aerodynamic databases from CFD and wind tunnel data
- Implement accurate propulsion models for all operating conditions
- Include realistic actuator dynamics and limitations
- Validate model against flight test data where available
- Document model fidelity and limitations
- Ensure real-time performance for pilot-in-the-loop applications

## Dependencies
- MATLAB/Simulink
- JSBSim
- FlightGear
- X-Plane

## Process Integration
- AE-013: Flight Simulation Model Development
- AE-024: Flight Test Planning
