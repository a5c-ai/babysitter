---
name: meep-fdtd-simulator
description: MEEP electromagnetic FDTD simulation skill for photonic devices, metamaterials, and waveguides
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
  category: optics-photonics
  phase: 6
---

# MEEP FDTD Simulator

## Purpose

Provides expert guidance on MEEP FDTD simulations for photonic devices, including geometry definition, source configuration, and field extraction.

## Capabilities

- Geometry definition with materials library
- Source configuration (dipole, Gaussian, plane wave)
- Absorbing boundary conditions (PML)
- Flux and field extraction
- Parameter sweeps and optimization
- Parallel domain decomposition

## Usage Guidelines

1. **Geometry**: Define device geometry with proper materials
2. **Sources**: Configure appropriate source types
3. **Boundaries**: Set up PML absorbing boundaries
4. **Monitors**: Place flux monitors and field probes
5. **Parallelization**: Use domain decomposition for large simulations

## Tools/Libraries

- MEEP
- MPB
- h5py
