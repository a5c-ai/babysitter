---
name: sotif-analysis
description: Safety of the Intended Functionality (ISO 21448) analysis support
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
    - safety
    - sotif
    - iso-21448
    - adas
---

# SOTIF Analysis Skill

## Purpose
Provide Safety of the Intended Functionality (ISO 21448) analysis support for ADAS and autonomous driving system validation.

## Capabilities
- Triggering condition identification
- Functional insufficiency analysis
- Known/unknown hazard scenario cataloging
- Sensor limitation analysis
- Algorithm edge case identification
- Validation strategy design for residual risk
- SOTIF argumentation structure
- Scenario coverage metrics

## Usage Guidelines
- Identify triggering conditions systematically
- Analyze functional insufficiencies in perception and planning
- Catalog known and unknown hazardous scenarios
- Assess sensor limitations across operational domain
- Design validation strategy to reduce unknown risks
- Document SOTIF argumentation with evidence

## Dependencies
- SOTIF analysis tools
- Scenario databases
- Simulation platforms

## Process Integration
- SAF-002: SOTIF Analysis and Validation
- ADA-001: Perception System Development
- ADA-002: Path Planning and Motion Control
- ADA-003: ADAS Feature Development
