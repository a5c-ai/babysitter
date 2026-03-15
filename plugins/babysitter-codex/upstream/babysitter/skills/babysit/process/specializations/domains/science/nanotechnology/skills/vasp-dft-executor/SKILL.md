---
name: vasp-dft-executor
description: VASP DFT calculation skill for electronic structure, geometry optimization, and property prediction of nanomaterials
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
  priority: high
  phase: 6
  tools-libraries:
    - VASP
    - VASPKIT
    - pymatgen
    - ASE
---

# VASP DFT Executor

## Purpose

The VASP DFT Executor skill provides density functional theory calculation capabilities using VASP for nanomaterial property prediction, enabling electronic structure analysis, geometry optimization, and materials property computation.

## Capabilities

- Input file generation (INCAR, POSCAR, KPOINTS, POTCAR)
- Geometry optimization
- Electronic band structure calculation
- Density of states analysis
- Formation energy calculation
- Optical property prediction

## Usage Guidelines

### DFT Calculation Workflow

1. **Input Preparation**
   - Generate structure files
   - Select appropriate pseudopotentials
   - Set convergence parameters

2. **Calculation Execution**
   - Monitor convergence
   - Check for errors
   - Manage computational resources

3. **Result Analysis**
   - Extract electronic properties
   - Analyze band structure
   - Calculate derived properties

## Process Integration

- DFT Calculation Pipeline for Nanomaterials
- Multiscale Modeling Integration
- Machine Learning Materials Discovery Pipeline

## Input Schema

```json
{
  "structure_file": "string (POSCAR/CIF)",
  "calculation_type": "relax|static|band|dos|optical",
  "functional": "PBE|HSE06|SCAN",
  "kpoint_density": "number",
  "encut": "number (eV)"
}
```

## Output Schema

```json
{
  "total_energy": "number (eV)",
  "bandgap": "number (eV)",
  "formation_energy": "number (eV/atom)",
  "optimized_structure": "string (CONTCAR)",
  "electronic_properties": {
    "dos_file": "string",
    "band_file": "string"
  },
  "convergence": {
    "energy_converged": "boolean",
    "force_converged": "boolean"
  }
}
```
