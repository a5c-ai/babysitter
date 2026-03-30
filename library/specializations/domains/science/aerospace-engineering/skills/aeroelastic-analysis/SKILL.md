---
name: aeroelastic-analysis
description: Skill for flutter, divergence, and aeroelastic response analysis
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
    - structural-analysis
    - aeroelasticity
    - flutter
    - dynamics
---

# Aeroelastic Analysis Skill

## Purpose
Provide comprehensive aeroelastic analysis capabilities for flutter prevention, divergence assessment, and dynamic response prediction.

## Capabilities
- Flutter analysis (p-k, PKNL methods)
- Divergence speed determination
- Control reversal analysis
- Gust response analysis
- Ground vibration test correlation
- Aeroelastic tailoring assessment
- Structural coupling analysis
- Flight envelope clearance documentation

## Usage Guidelines
- Validate structural modes against GVT data before flutter analysis
- Use appropriate aerodynamic theories for the flight regime
- Include control system effects in flutter predictions
- Apply required flutter margins per certification requirements
- Consider fuel state and payload variations in analysis matrix
- Document all modeling assumptions and uncertainties

## Dependencies
- MSC NASTRAN (SOL 144/145/146)
- ZAERO
- FlightLoads

## Process Integration
- AE-010: Aeroelastic Analysis
