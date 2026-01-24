---
name: acmg-variant-classifier
description: ACMG/AMP variant classification skill for systematic pathogenicity assessment
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
    - variant-analysis
    - acmg
    - clinical
    - pathogenicity
---

# ACMG Variant Classifier Skill

## Purpose
Enable ACMG/AMP variant classification for systematic pathogenicity assessment following clinical guidelines.

## Capabilities
- Automated evidence criteria application
- Population frequency filtering
- In silico prediction integration
- Literature evidence curation
- Inheritance pattern analysis
- Classification report generation

## Usage Guidelines
- Apply ACMG criteria systematically
- Document evidence for each criterion
- Consider inheritance patterns in assessment
- Review literature for supporting evidence
- Generate clear classification reports
- Track classification changes over time

## Dependencies
- InterVar
- VarSome API
- ClinVar

## Process Integration
- Clinical Variant Interpretation (clinical-variant-interpretation)
- Rare Disease Diagnostic Pipeline (rare-disease-diagnostics)
- Newborn Screening Genomics (newborn-screening-genomics)
