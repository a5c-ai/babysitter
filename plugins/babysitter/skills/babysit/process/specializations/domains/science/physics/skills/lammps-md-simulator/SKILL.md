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
  - Task
metadata:
  version: "1.0"
  category: numerical-simulation
  domain: physics
  tools:
    - LAMMPS
    - OVITO
    - MDAnalysis
  processes:
    - molecular-dynamics-simulation-setup
    - high-performance-computing-workflow
    - material-synthesis-and-characterization
---

# LAMMPS MD Simulator Skill

## Purpose

Provides comprehensive LAMMPS molecular dynamics simulation capabilities for atomistic simulations, enabling researchers to study materials properties, chemical reactions, and molecular behavior at the atomic scale.

## Capabilities

- **Input Script Generation**: Create and validate LAMMPS input scripts for various simulation types
- **Force Field Selection**: Guide selection and configuration of force fields (EAM, Tersoff, ReaxFF, OPLS, CHARMM)
- **Boundary Conditions**: Configure periodic, fixed, and shrink-wrapped boundary conditions
- **Ensemble Configuration**: Set up NVE, NVT, NPT, and NPH ensembles with appropriate thermostats/barostats
- **Thermodynamic Extraction**: Extract and analyze thermodynamic properties (temperature, pressure, energy, stress)
- **Trajectory Analysis**: Process and analyze trajectory files for structural and dynamical properties
- **Parallel Optimization**: Configure MPI and GPU acceleration for large-scale simulations

## Usage Guidelines

1. **Simulation Setup**
   - Define the atomic system geometry and composition
   - Select appropriate force field based on material type
   - Configure boundary conditions and ensemble
   - Set integration timestep appropriate for the physics

2. **Running Simulations**
   - Equilibrate system before production runs
   - Monitor thermodynamic quantities for stability
   - Use checkpointing for long simulations
   - Configure output frequencies appropriately

3. **Post-Processing**
   - Use OVITO for visualization and structural analysis
   - Use MDAnalysis for trajectory processing
   - Calculate relevant physical observables
   - Perform statistical analysis over multiple runs

4. **Best Practices**
   - Validate force field against experimental data
   - Perform convergence tests for system size and timestep
   - Document all simulation parameters
   - Archive input files and key outputs
