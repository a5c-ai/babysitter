---
name: perseus-statistical-analyzer
description: Perseus statistical analysis skill for proteomics data analysis and visualization
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
    - statistics
    - analysis
    - visualization
---

# Perseus Statistical Analyzer Skill

## Purpose
Enable Perseus statistical analysis for proteomics data analysis and visualization.

## Capabilities
- Missing value imputation
- Normalization strategies
- Statistical testing (t-test, ANOVA)
- Hierarchical clustering
- PCA and enrichment analysis
- Publication-quality plots

## Usage Guidelines
- Impute missing values appropriately
- Normalize data before statistical analysis
- Apply appropriate statistical tests
- Visualize results with clustering and PCA
- Generate publication-quality figures
- Document normalization and imputation methods

## Dependencies
- Perseus
- MSstats
- limma

## Process Integration
- Mass Spectrometry Proteomics Pipeline (ms-proteomics-pipeline)
- Multi-Omics Data Integration (multi-omics-integration)
