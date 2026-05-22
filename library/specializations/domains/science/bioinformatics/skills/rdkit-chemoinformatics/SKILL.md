---
name: rdkit-chemoinformatics
description: RDKit chemoinformatics skill for molecular property calculation and compound library management
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
  category: bioinformatics
  tags:
    - structural-biology
    - chemoinformatics
    - molecules
    - properties
graph:
  domains: [domain:bioinformatics]
  specializations: [specialization:biomedical-informatics]
  skillAreas: [skill-area:python-data-pipelines, skill-area:statistical-analysis, skill-area:data-analysis]
  workflows: [workflow:experiment-design]
  roles: [role:research-engineer, role:biomedical-engineer]
---

# RDKit Chemoinformatics Skill

## Purpose
Provide RDKit chemoinformatics for molecular property calculation and compound library management.

## Capabilities
- Molecular descriptor calculation
- SMILES/InChI handling
- Substructure searching
- Fingerprint generation
- ADMET property prediction
- Compound library filtering

## Usage Guidelines
- Standardize molecular representations
- Calculate relevant descriptors for analysis
- Use fingerprints for similarity searching
- Filter libraries by drug-like properties
- Predict ADMET properties for prioritization
- Document descriptor and fingerprint types

## Dependencies
- RDKit
- Open Babel
- ChEMBL

## Process Integration
- Molecular Docking and Virtual Screening (molecular-docking)
