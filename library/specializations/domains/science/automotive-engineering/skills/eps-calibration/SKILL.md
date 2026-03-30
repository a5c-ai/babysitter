---
name: eps-calibration
description: Electric power steering calibration and control development
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
    - chassis-systems
    - steering
    - eps
    - calibration
---

# Electric Power Steering Skill

## Purpose
Provide electric power steering calibration and control development capabilities for optimal steering feel and driver assistance integration.

## Capabilities
- Steering torque map calibration
- Return-to-center tuning
- On-center feel optimization
- Active return function design
- Lane keeping assist integration
- Steering angle sensor calibration
- Rack force estimation
- Steer-by-wire control design

## Usage Guidelines
- Calibrate torque maps for vehicle class and brand character
- Tune return-to-center for appropriate self-centering
- Optimize on-center feel for precision and confidence
- Integrate ADAS steering interventions smoothly
- Validate steering response across speed range
- Document calibration parameters and rationale

## Dependencies
- Steering test equipment
- CANape
- INCA

## Process Integration
- VDC-002: Steering System Development
- ADA-003: ADAS Feature Development
- PTE-004: Powertrain Calibration and Optimization
