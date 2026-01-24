---
name: fastqc-quality-analyzer
description: Sequencing quality control skill for assessing read quality, adapter contamination, and sequence composition
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
    - quality-control
    - ngs
    - qc
---

# FastQC Quality Analyzer Skill

## Purpose
Enable sequencing quality control for assessing read quality, adapter contamination, and sequence composition metrics.

## Capabilities
- Per-base quality score analysis
- Sequence duplication detection
- Adapter content identification
- GC content analysis
- Overrepresented sequence detection
- MultiQC report aggregation

## Usage Guidelines
- Run FastQC on all raw sequencing data
- Review quality metrics before alignment
- Identify samples requiring additional QC
- Aggregate results with MultiQC for cohort overview
- Flag samples with quality issues
- Document QC decisions and thresholds

## Dependencies
- FastQC
- MultiQC
- fastp

## Process Integration
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)
- RNA-seq Differential Expression Analysis (rnaseq-differential-expression)
- Long-Read Sequencing Analysis (long-read-analysis)
- Analysis Pipeline Validation (pipeline-validation)
