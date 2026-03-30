---
name: alphafold-predictor
description: AlphaFold protein structure prediction skill with confidence assessment and model analysis
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
    - structure-prediction
    - alphafold
    - protein
---

# AlphaFold Predictor Skill

## Purpose
Enable AlphaFold protein structure prediction with confidence assessment and model analysis.

## Capabilities
- Structure prediction execution
- pLDDT confidence scoring
- PAE analysis
- Multi-chain complex prediction
- Template-based refinement
- ColabFold integration

## Usage Guidelines
- Review pLDDT scores for prediction confidence
- Analyze PAE for domain boundaries
- Predict complexes for multi-protein assemblies
- Use templates when homologs exist
- Validate predictions against experimental data
- Document model versions and parameters

## Dependencies
- AlphaFold2
- ColabFold
- RoseTTAFold

## Process Integration
- Protein Structure Prediction (protein-structure-prediction)
- Molecular Docking and Virtual Screening (molecular-docking)
