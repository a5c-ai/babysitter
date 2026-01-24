---
name: hypersonic-aerothermo
description: Specialized skill for hypersonic vehicle aerodynamic and thermal analysis
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
    - aerodynamics
    - hypersonic
    - aerothermodynamics
    - thermal-protection
---

# Hypersonic Aerothermodynamics Skill

## Purpose
Provide specialized hypersonic vehicle aerodynamic and thermal analysis capabilities including real gas effects, aerodynamic heating, and thermal protection system design.

## Capabilities
- High-temperature gas dynamics
- Real gas effects modeling
- Aerodynamic heating prediction
- Thermal protection system sizing
- Shock-boundary layer interaction
- Ablation modeling
- Transition prediction (hypersonic)
- Chemically reacting flow analysis

## Usage Guidelines
- Account for real gas and chemical non-equilibrium effects
- Use appropriate turbulence models for hypersonic boundary layers
- Predict transition location and heating augmentation
- Size TPS with adequate margins for heating uncertainty
- Consider ablation effects on aerodynamic shape
- Validate predictions against ground test data where available

## Dependencies
- High-fidelity CFD codes
- Real-gas models
- Thermal protection system design tools

## Process Integration
- AE-001: CFD Analysis Workflow (hypersonic regime)
- Advanced hypersonic vehicle design processes
