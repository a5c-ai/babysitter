---
name: gromacs-biosim-runner
description: GROMACS molecular dynamics skill specialized for biomolecular systems, protein simulations, and free energy calculations
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
  category: physics
  tags:
    - molecular-dynamics
    - biomolecular
    - proteins
    - free-energy
---

# GROMACS Biosim Runner Skill

## Purpose
Provide specialized integration with GROMACS for biomolecular simulations including protein dynamics, free energy calculations, and enhanced sampling methods.

## Capabilities
- Topology preparation and solvation
- Energy minimization workflows
- NPT/NVT equilibration protocols
- Free energy perturbation setup
- Trajectory analysis (RMSD, RMSF, RDF)
- Enhanced sampling methods (metadynamics, replica exchange)

## Usage Guidelines
- Use appropriate water models (TIP3P, TIP4P, SPC/E)
- Select force fields compatible with target biomolecules (AMBER, CHARMM, OPLS)
- Follow standard equilibration protocols
- Monitor system stability during production runs

## Dependencies
- GROMACS
- pdb2gmx
- MDAnalysis
- PLUMED (for enhanced sampling)

## Process Integration
- Molecular Dynamics Simulation Setup
- High-Performance Computing Workflow
