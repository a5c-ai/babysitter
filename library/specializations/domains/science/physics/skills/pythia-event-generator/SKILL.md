---
name: pythia-event-generator
description: Pythia event generation skill for proton-proton and lepton collisions at high energies
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

# Pythia Event Generator

## Purpose

Provides expert guidance on Pythia event generation for high-energy physics, including process configuration, hadronization, and shower matching.

## Capabilities

- Process selection and configuration
- Parton distribution function management
- Hadronization and decay settings
- Underlying event tuning
- HepMC output generation
- Shower matching (MLM, CKKW)

## Usage Guidelines

1. **Process Configuration**: Select physics processes for event generation
2. **PDFs**: Configure parton distribution functions
3. **Hadronization**: Set hadronization and decay parameters
4. **Tuning**: Apply appropriate underlying event tunes
5. **Output**: Generate HepMC format for downstream analysis

## Tools/Libraries

- Pythia8
- HepMC
- LHAPDF
