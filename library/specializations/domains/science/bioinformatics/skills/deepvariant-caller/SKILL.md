---
name: deepvariant-caller
description: DeepVariant deep learning variant calling skill for high-accuracy SNV and indel detection
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
    - deep-learning
    - snv
    - indel
---

# DeepVariant Caller Skill

## Purpose
Enable DeepVariant deep learning variant calling for high-accuracy SNV and indel detection.

## Capabilities
- GPU-accelerated variant calling
- WGS/WES/PacBio mode selection
- Model customization and retraining
- Confidence calibration
- Multi-sample variant calling
- Docker/Singularity deployment

## Usage Guidelines
- Select appropriate model for sequencing type
- Use GPU acceleration when available
- Validate accuracy against benchmark datasets
- Consider container deployment for reproducibility
- Document model version and parameters
- Compare with traditional callers for validation

## Dependencies
- DeepVariant
- Parabricks

## Process Integration
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)
- Long-Read Sequencing Analysis (long-read-analysis)
- Analysis Pipeline Validation (pipeline-validation)
