---
name: ligand-exchange-protocol-manager
description: Surface chemistry skill for managing ligand exchange reactions, bioconjugation protocols, and functional group quantification
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: nanotechnology
  domain: science
  category: synthesis-materials
  priority: high
  phase: 6
  tools-libraries:
    - Bioconjugation reaction databases
    - Surface chemistry calculators
---

# Ligand Exchange Protocol Manager

## Purpose

The Ligand Exchange Protocol Manager skill provides systematic management of surface functionalization reactions for nanoparticles, enabling controlled ligand exchange, bioconjugation, and quantification of surface functional groups.

## Capabilities

- Ligand exchange reaction design
- Bioconjugation chemistry selection
- Click chemistry protocols
- Functional group quantification (TNBS, Ellman's)
- Conjugation efficiency optimization
- Surface coverage calculation

## Usage Guidelines

### Ligand Exchange Design

1. **Chemistry Selection**
   - Match incoming ligand affinity
   - Consider exchange kinetics
   - Optimize solvent system

2. **Bioconjugation Protocols**
   - EDC/NHS for carboxyl-amine coupling
   - Maleimide-thiol for cysteine targeting
   - Click chemistry for orthogonal conjugation

3. **Surface Coverage Quantification**
   - UV-Vis for chromophoric ligands
   - TGA for organic content
   - XPS for elemental analysis

## Process Integration

- Nanomaterial Surface Functionalization Pipeline
- Nanoparticle Drug Delivery System Development
- Nanosensor Development and Validation Pipeline

## Input Schema

```json
{
  "nanoparticle_type": "string",
  "current_ligand": "string",
  "target_ligand": "string",
  "target_functionality": "amine|carboxyl|thiol|azide|alkyne",
  "conjugation_target": "string (optional)"
}
```

## Output Schema

```json
{
  "exchange_protocol": {
    "solvent": "string",
    "temperature": "number (C)",
    "duration": "number (hours)",
    "ligand_excess": "number (equivalents)"
  },
  "expected_coverage": "number (molecules/nm2)",
  "verification_methods": ["string"],
  "stability_notes": "string"
}
```
