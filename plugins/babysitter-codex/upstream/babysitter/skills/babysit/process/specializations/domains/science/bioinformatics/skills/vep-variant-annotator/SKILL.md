---
name: vep-variant-annotator
description: Variant Effect Predictor skill for comprehensive variant annotation with clinical database integration
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
    - annotation
    - clinical
    - functional
---

# VEP Variant Annotator Skill

## Purpose
Provide comprehensive variant annotation using Variant Effect Predictor with clinical database integration.

## Capabilities
- Functional consequence prediction
- Population frequency annotation (gnomAD)
- Clinical database integration (ClinVar, COSMIC)
- Custom annotation plugins
- Pathogenicity score integration (CADD, REVEL)
- Regulatory region annotation

## Usage Guidelines
- Configure VEP with relevant annotation sources
- Include population frequency databases
- Add clinical databases for interpretation
- Use pathogenicity predictors for prioritization
- Document annotation database versions
- Update annotations regularly

## Dependencies
- Ensembl VEP
- ANNOVAR
- SnpEff

## Process Integration
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)
- Clinical Variant Interpretation (clinical-variant-interpretation)
- Pharmacogenomics Analysis (pharmacogenomics-analysis)
- Rare Disease Diagnostic Pipeline (rare-disease-diagnostics)
