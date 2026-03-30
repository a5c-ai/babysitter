---
name: clinvar-querier
description: ClinVar database query skill for clinical variant interpretation and pathogenicity lookup
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
    - clinvar
    - pathogenicity
    - database
---

# ClinVar Querier Skill

## Purpose
Enable ClinVar database queries for clinical variant interpretation and pathogenicity lookup.

## Capabilities
- Variant significance lookup
- Submission history retrieval
- Condition association queries
- Evidence level assessment
- Batch variant queries
- VCF annotation integration

## Usage Guidelines
- Query variants with standard nomenclature
- Review submission history for context
- Consider evidence levels in interpretation
- Batch query for efficiency
- Integrate with VCF annotation
- Document ClinVar version dates

## Dependencies
- ClinVar API
- VarSome API
- OMIM

## Process Integration
- Clinical Variant Interpretation (clinical-variant-interpretation)
- Rare Disease Diagnostic Pipeline (rare-disease-diagnostics)
- Tumor Molecular Profiling (tumor-molecular-profiling)
