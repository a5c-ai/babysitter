---
name: qiime2-microbiome-analyzer
description: QIIME2 microbiome analysis skill for 16S rRNA profiling and diversity analysis
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
    - metagenomics
    - microbiome
    - 16s
    - diversity
---

# QIIME2 Microbiome Analyzer Skill

## Purpose
Enable QIIME2 microbiome analysis for 16S rRNA profiling and diversity analysis.

## Capabilities
- Demultiplexing and denoising (DADA2)
- Taxonomic classification
- Alpha diversity metrics
- Beta diversity analysis
- Differential abundance testing
- Phylogenetic analysis

## Usage Guidelines
- Use DADA2 for denoising amplicon data
- Select appropriate taxonomic classifier
- Calculate diversity metrics with rarefaction
- Visualize beta diversity with ordination
- Test differential abundance appropriately
- Document pipeline parameters

## Dependencies
- QIIME2
- DADA2
- phyloseq

## Process Integration
- 16S rRNA Microbiome Analysis (16s-microbiome-analysis)
