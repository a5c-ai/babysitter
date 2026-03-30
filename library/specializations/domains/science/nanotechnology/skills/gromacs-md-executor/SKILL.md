---
name: gromacs-md-executor
description: GROMACS molecular dynamics skill for nanoparticle-biomolecule interaction simulations
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: nanotechnology
  domain: science
  category: computational
  priority: medium
  phase: 6
  tools-libraries:
    - GROMACS
    - gmx_MMPBSA
    - MDAnalysis
---

# GROMACS MD Executor

## Purpose

The GROMACS MD Executor skill provides molecular dynamics simulation capabilities specialized for nanoparticle-biomolecule interactions, enabling investigation of drug delivery systems, protein-surface interactions, and membrane penetration.

## Capabilities

- Nanoparticle-protein simulations
- Membrane-nanoparticle interactions
- Coarse-grained modeling (Martini)
- Free energy calculations
- Enhanced sampling methods
- Trajectory analysis and visualization

## Usage Guidelines

### Bio-Nano MD Workflow

1. **System Preparation**
   - Parameterize nanoparticle
   - Solvate system
   - Add ions for neutralization

2. **Equilibration**
   - Minimize energy
   - NVT equilibration
   - NPT equilibration

3. **Production and Analysis**
   - Run appropriate sampling
   - Calculate binding energies
   - Analyze interactions

## Process Integration

- Molecular Dynamics Simulation Workflow
- Nanoparticle Drug Delivery System Development

## Input Schema

```json
{
  "nanoparticle_file": "string",
  "biomolecule_file": "string",
  "force_field": "CHARMM36|AMBER|Martini",
  "simulation_type": "binding|membrane|protein_corona",
  "temperature": "number (K)",
  "simulation_time": "number (ns)"
}
```

## Output Schema

```json
{
  "binding_energy": "number (kJ/mol)",
  "contact_residues": ["string"],
  "rmsd": "number (nm)",
  "interaction_analysis": {
    "hydrogen_bonds": "number",
    "hydrophobic_contacts": "number"
  },
  "trajectory_file": "string"
}
```
