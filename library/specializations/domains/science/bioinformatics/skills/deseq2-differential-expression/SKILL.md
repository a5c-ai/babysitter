---
name: deseq2-differential-expression
description: DESeq2 differential expression analysis skill with normalization, statistical modeling, and visualization
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
    - transcriptomics
    - differential-expression
    - statistics
    - rna-seq
graph:
  domains: [domain:bioinformatics]
  specializations: [specialization:biomedical-informatics]
  skillAreas: [skill-area:statistical-analysis, skill-area:python-data-pipelines, skill-area:data-analysis]
  workflows: [workflow:experiment-design]
  roles: [role:research-scientist, role:biomedical-engineer]
---

# DESeq2 Differential Expression Skill

## Purpose
Provide DESeq2 differential expression analysis with normalization, statistical modeling, and visualization.

## Capabilities
- Size factor normalization
- Negative binomial modeling
- Shrinkage estimation
- Batch effect modeling
- Multi-factor designs
- Result visualization (MA plots, volcano plots)

## Usage Guidelines
- Design experiments with appropriate replication
- Include batch effects in model when present
- Apply appropriate shrinkage estimators
- Use multiple testing correction
- Generate publication-quality visualizations
- Document analysis parameters and thresholds

## Dependencies
- DESeq2
- edgeR
- limma-voom

## Process Integration
- RNA-seq Differential Expression Analysis (rnaseq-differential-expression)
- Single-Cell RNA-seq Analysis (scrnaseq-analysis)
- CRISPR Screen Analysis (crispr-screen-analysis)
