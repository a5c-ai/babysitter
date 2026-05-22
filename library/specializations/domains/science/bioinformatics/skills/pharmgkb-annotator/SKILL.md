---
name: pharmgkb-annotator
description: PharmGKB pharmacogenomics annotation skill for drug-gene interaction assessment
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
    - clinical-genomics
    - pharmacogenomics
    - drug-response
    - cpic
graph:
  domains: [domain:bioinformatics]
  specializations: [specialization:biomedical-informatics]
  skillAreas: [skill-area:data-analysis, skill-area:statistical-analysis, skill-area:python-data-pipelines]
  workflows: [workflow:experiment-design]
  roles: [role:biomedical-engineer, role:research-scientist]
---

# PharmGKB Annotator Skill

## Purpose
Provide PharmGKB pharmacogenomics annotation for drug-gene interaction assessment.

## Capabilities
- Star allele calling (Stargazer)
- Diplotype determination
- CPIC guideline integration
- Drug recommendation generation
- Clinical annotation lookup
- Dosing guidance extraction

## Usage Guidelines
- Call star alleles accurately
- Determine diplotypes from genotypes
- Apply CPIC guidelines for dosing
- Generate actionable recommendations
- Review clinical annotations
- Document guideline versions

## Dependencies
- PharmGKB API
- Stargazer
- PharmCAT

## Process Integration
- Pharmacogenomics Analysis (pharmacogenomics-analysis)
- Clinical Variant Interpretation (clinical-variant-interpretation)
