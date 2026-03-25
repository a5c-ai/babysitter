---
name: spacecraft-thermal
description: Skill for spacecraft thermal control system design and analysis
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
    - thermal-control
    - analysis
    - design
---

# Spacecraft Thermal Analysis Skill

## Purpose
Provide comprehensive spacecraft thermal control system design and analysis capabilities for component temperature prediction and thermal management.

## Capabilities
- Thermal Desktop and SINDA modeling
- Orbital environment definition
- Radiator sizing and placement
- Heater control logic design
- Thermal balance verification
- Hot/cold case analysis
- Component temperature prediction
- MLI and coating specification

## Usage Guidelines
- Define worst-case thermal environments for hot and cold cases
- Use appropriate view factors and orbital parameters
- Size radiators with adequate margin for degradation
- Design heater circuits with redundancy for critical components
- Validate thermal models against test data
- Document thermal control system design and operating procedures

## Dependencies
- Thermal Desktop
- SINDA/FLUINT
- ESATAN

## Process Integration
- AE-015: Spacecraft Thermal Analysis
