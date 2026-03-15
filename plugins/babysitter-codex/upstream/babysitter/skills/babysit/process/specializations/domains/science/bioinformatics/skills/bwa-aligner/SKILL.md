---
name: bwa-aligner
description: BWA-MEM2 alignment skill for mapping sequencing reads to reference genomes with optimized parameter selection
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
    - sequence-analysis
    - alignment
    - genomics
    - ngs
---

# BWA Aligner Skill

## Purpose
Enable BWA-MEM2 alignment for mapping sequencing reads to reference genomes with optimized parameter selection and quality assessment.

## Capabilities
- Read alignment to reference genomes
- Parameter optimization for different read types
- Multi-threading configuration
- Index generation and management
- Alignment quality metrics reporting
- Support for paired-end and single-end reads

## Usage Guidelines
- Generate genome indices before alignment
- Select appropriate parameters for read length and type
- Use multi-threading for performance optimization
- Validate alignment quality metrics post-processing
- Document parameter choices and rationale
- Archive index files for reproducibility

## Dependencies
- BWA-MEM2
- minimap2
- samtools

## Process Integration
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)
- Long-Read Sequencing Analysis (long-read-analysis)
- Tumor Molecular Profiling (tumor-molecular-profiling)
