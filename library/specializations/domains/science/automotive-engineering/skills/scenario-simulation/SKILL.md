---
name: scenario-simulation
description: Scenario-based simulation for ADAS/AD validation
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
    - simulation
    - validation
---

# Driving Scenario Simulation Skill

## Purpose
Enable scenario-based simulation for ADAS and autonomous driving validation including critical scenario generation and coverage analysis.

## Capabilities
- OpenSCENARIO/OpenDRIVE file creation
- Scenario database management
- Critical scenario generation
- Sensor model configuration
- Weather and lighting simulation
- Traffic participant modeling
- Scenario coverage analysis
- Regression test suite management

## Usage Guidelines
- Create scenarios following OpenSCENARIO standards
- Build comprehensive scenario database for validation
- Generate critical scenarios from real-world data
- Configure sensor models for realistic perception
- Include environmental variations in testing
- Track scenario coverage and completeness

## Dependencies
- CARLA
- dSPACE ASM
- IPG CarMaker
- VTD
- Foretellix

## Process Integration
- ADA-004: Simulation and Virtual Validation
- SAF-002: SOTIF Analysis and Validation
- ADA-003: ADAS Feature Development
