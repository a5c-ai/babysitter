---
name: geant4-detector-simulator
description: Geant4 detector simulation skill for particle transport, detector geometry, and physics process modeling
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
metadata:
  specialization: physics
  domain: science
  category: particle-physics
  phase: 6
---

# Geant4 Detector Simulator

## Purpose

Provides expert guidance on Geant4 detector simulations, including geometry construction, physics list configuration, and particle transport modeling.

## Capabilities

- Geometry construction (GDML, C++)
- Physics list selection and customization
- Sensitive detector implementation
- Hit collection and digitization
- Visualization configuration
- Multi-threading optimization

## Usage Guidelines

1. **Geometry**: Define detector geometry using GDML or C++ code
2. **Physics Lists**: Select appropriate physics lists for the application
3. **Sensitive Detectors**: Implement hit collection in active volumes
4. **Digitization**: Convert hits to detector signals
5. **Optimization**: Enable multi-threading for performance

## Tools/Libraries

- Geant4
- GDML
- ROOT
