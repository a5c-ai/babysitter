---
name: gromacs-biosim-runner
description: GROMACS molecular dynamics skill specialized for biomolecular systems, protein simulations, and free energy calculations
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
    - GROMACS
    - pdb2gmx
    - MDAnalysis
  processes:
    - molecular-dynamics-simulation-setup
    - high-performance-computing-workflow
---

# GROMACS Biosim Runner Skill

## Purpose

Provides GROMACS molecular dynamics capabilities specialized for biomolecular systems including proteins, nucleic acids, lipids, and drug molecules, with support for enhanced sampling and free energy methods.

## Capabilities

- **Topology Preparation**: Generate topologies from PDB structures using pdb2gmx with various force fields
- **Solvation**: Add solvent boxes (water models: TIP3P, TIP4P, SPC/E) and ions for neutralization
- **Energy Minimization**: Configure steepest descent and conjugate gradient minimization workflows
- **Equilibration Protocols**: Set up proper NVT and NPT equilibration with position restraints
- **Free Energy Perturbation**: Configure lambda windows for FEP and thermodynamic integration
- **Trajectory Analysis**: Calculate RMSD, RMSF, RDF, hydrogen bonds, and other structural properties
- **Enhanced Sampling**: Configure metadynamics, replica exchange, and umbrella sampling

## Usage Guidelines

1. **System Preparation**
   - Start with clean PDB structure (check for missing atoms/residues)
   - Select appropriate force field (AMBER, CHARMM, OPLS-AA)
   - Define the simulation box with adequate buffer
   - Add counterions and physiological salt concentration

2. **Equilibration Protocol**
   - Energy minimize to remove bad contacts
   - Run NVT equilibration with position restraints (100 ps)
   - Run NPT equilibration with position restraints (100 ps)
   - Gradually release restraints before production

3. **Production Simulations**
   - Use appropriate timestep (2 fs with LINCS constraints)
   - Save coordinates/velocities at appropriate intervals
   - Monitor system stability throughout

4. **Analysis Best Practices**
   - Remove periodic boundary artifacts before analysis
   - Use appropriate reference structures
   - Calculate statistical uncertainties
   - Validate against experimental observables
