---
name: lammps-md-simulator
description: LAMMPS molecular dynamics simulation skill for atomistic simulations, force field setup, and large-scale parallel computations
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
  category: numerical-simulation
  phase: 6
---

# LAMMPS MD Simulator

## Purpose

Provides expert guidance on LAMMPS molecular dynamics simulations, including input script generation, force field selection, and parallel execution optimization.

## Capabilities

- Input script generation and validation
- Force field selection (EAM, Tersoff, ReaxFF)
- Boundary condition and ensemble configuration
- Thermodynamic property extraction
- Trajectory file analysis
- Parallel run optimization (MPI/GPU)

## Usage Guidelines

1. **Input Script Generation**: Create LAMMPS input files with proper syntax and structure
2. **Force Field Selection**: Choose appropriate interatomic potentials for the system
3. **Ensemble Configuration**: Set up NVT, NPT, or NVE ensembles correctly
4. **Output Analysis**: Process dump files and thermodynamic output
5. **Performance Optimization**: Configure parallel execution for HPC environments

## Tools/Libraries

- LAMMPS
- OVITO
- MDAnalysis
