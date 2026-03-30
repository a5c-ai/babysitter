---
name: star-rnaseq-aligner
description: STAR alignment skill for splice-aware RNA-seq read mapping with comprehensive QC metrics
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
    - alignment
    - rna-seq
    - splice-aware
---

# STAR RNA-seq Aligner Skill

## Purpose
Provide STAR alignment for splice-aware RNA-seq read mapping with comprehensive QC metrics.

## Capabilities
- Splice junction detection
- Two-pass alignment mode
- Chimeric read detection (fusions)
- Gene quantification (--quantMode)
- Custom genome index generation
- Output in multiple formats

## Usage Guidelines
- Generate genome indices with annotation
- Use two-pass mode for novel junction discovery
- Enable chimeric read detection for fusion analysis
- Generate quantification in addition to alignments
- Optimize parameters for read length
- Document STAR version and parameters

## Dependencies
- STAR
- HISAT2
- kallisto

## Process Integration
- RNA-seq Differential Expression Analysis (rnaseq-differential-expression)
- Single-Cell RNA-seq Analysis (scrnaseq-analysis)
- Spatial Transcriptomics Analysis (spatial-transcriptomics)
