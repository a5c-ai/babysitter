---
name: delphes-fast-simulator
description: Delphes fast detector simulation skill for phenomenological studies and BSM searches
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

# Delphes Fast Simulator

## Purpose

Provides expert guidance on Delphes fast detector simulation for phenomenological studies, including detector card configuration and object reconstruction.

## Capabilities

- Detector card configuration (ATLAS, CMS, custom)
- Jet reconstruction algorithms
- Object efficiency parameterization
- Pile-up simulation
- Trigger emulation
- ROOT/Delphes tree output

## Usage Guidelines

1. **Detector Cards**: Configure or customize detector response cards
2. **Jet Algorithms**: Select appropriate jet reconstruction algorithms
3. **Efficiencies**: Model object reconstruction efficiencies
4. **Pile-up**: Add pile-up simulation when needed
5. **Output**: Generate ROOT trees for analysis

## Tools/Libraries

- Delphes
- FastJet
- ROOT
