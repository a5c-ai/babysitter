---
name: mageck-crispr-analyzer
description: MAGeCK CRISPR screen analysis skill for gene essentiality scoring
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
    - specialized
    - crispr
    - screening
    - essentiality
---

# MAGeCK CRISPR Analyzer Skill

## Purpose
Provide MAGeCK CRISPR screen analysis for gene essentiality scoring.

## Capabilities
- Guide read counting
- Normalization and QC
- Gene-level analysis
- Pathway enrichment
- MLE model for complex designs
- Visualization outputs

## Usage Guidelines
- Count guides accurately from sequencing data
- Normalize counts appropriately
- Calculate gene-level scores
- Enrich for biological pathways
- Use MLE for complex experimental designs
- Generate informative visualizations

## Dependencies
- MAGeCK
- BAGEL
- CRISPResso2

## Process Integration
- CRISPR Screen Analysis (crispr-screen-analysis)
