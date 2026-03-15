---
name: hpo-phenotype-matcher
description: Human Phenotype Ontology skill for phenotype-driven gene prioritization
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
    - phenotype
    - hpo
    - prioritization
---

# HPO Phenotype Matcher Skill

## Purpose
Provide Human Phenotype Ontology capabilities for phenotype-driven gene prioritization.

## Capabilities
- HPO term matching
- Gene-phenotype association scoring
- Semantic similarity analysis
- Phenotype-variant correlation
- Exomiser integration
- Prioritization reporting

## Usage Guidelines
- Map clinical phenotypes to HPO terms
- Calculate gene-phenotype associations
- Use semantic similarity for ranking
- Integrate with variant prioritization
- Generate prioritization reports
- Document phenotype encoding

## Dependencies
- HPO
- Exomiser
- Phen2Gene

## Process Integration
- Rare Disease Diagnostic Pipeline (rare-disease-diagnostics)
- Clinical Variant Interpretation (clinical-variant-interpretation)
