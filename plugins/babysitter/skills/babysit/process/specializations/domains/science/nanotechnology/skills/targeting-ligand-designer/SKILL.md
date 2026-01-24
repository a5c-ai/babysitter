---
name: targeting-ligand-designer
description: Active targeting skill for designing and validating nanoparticle targeting strategies
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: nanotechnology
  domain: science
  category: applications
  priority: high
  phase: 6
  tools-libraries:
    - Binding kinetics analyzers
    - Molecular modeling tools
---

# Targeting Ligand Designer

## Purpose

The Targeting Ligand Designer skill provides systematic design of active targeting strategies for nanoparticle drug delivery, enabling selection and validation of targeting moieties for specific cellular or tissue targets.

## Capabilities

- Targeting ligand selection (antibodies, peptides, aptamers)
- Conjugation chemistry optimization
- Binding affinity assessment
- Biodistribution prediction
- Receptor expression analysis
- In vitro targeting validation

## Usage Guidelines

### Targeting Design

1. **Ligand Selection**
   - Identify target receptor
   - Evaluate ligand options
   - Consider size and stability

2. **Conjugation Optimization**
   - Select chemistry
   - Optimize ligand density
   - Preserve binding activity

3. **Validation**
   - Measure binding affinity
   - Test cellular uptake
   - Assess selectivity

## Process Integration

- Nanoparticle Drug Delivery System Development
- Nanosensor Development and Validation Pipeline

## Input Schema

```json
{
  "target_receptor": "string",
  "cell_type": "string",
  "nanoparticle_type": "string",
  "ligand_candidates": ["string"],
  "required_specificity": "number (fold)"
}
```

## Output Schema

```json
{
  "recommended_ligand": {
    "name": "string",
    "type": "antibody|peptide|aptamer|small_molecule",
    "Kd": "number (nM)"
  },
  "conjugation_strategy": {
    "chemistry": "string",
    "ligand_density": "number (ligands/NP)",
    "orientation": "string"
  },
  "predicted_performance": {
    "specificity": "number (fold)",
    "uptake_enhancement": "number (fold)"
  }
}
```
