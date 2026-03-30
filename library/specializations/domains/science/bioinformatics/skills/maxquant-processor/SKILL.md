---
name: maxquant-processor
description: MaxQuant mass spectrometry skill for protein identification and quantification
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
    - proteomics
    - mass-spectrometry
    - quantification
    - identification
---

# MaxQuant Processor Skill

## Purpose
Provide MaxQuant mass spectrometry analysis for protein identification and quantification.

## Capabilities
- Andromeda search engine execution
- Label-free quantification (LFQ)
- TMT/iTRAQ labeled quantification
- Match between runs
- FDR control and filtering
- PTM site localization

## Usage Guidelines
- Configure search parameters for experiment type
- Select appropriate quantification method
- Enable match between runs for improved quantification
- Apply FDR filtering at protein and peptide level
- Localize PTM sites accurately
- Document database and parameter versions

## Dependencies
- MaxQuant
- MSFragger
- Proteome Discoverer

## Process Integration
- Mass Spectrometry Proteomics Pipeline (ms-proteomics-pipeline)
- Multi-Omics Data Integration (multi-omics-integration)
