---
name: nextflow-pipeline-executor
description: Nextflow workflow management skill for reproducible bioinformatics pipelines
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
    - infrastructure
    - workflow
    - nextflow
    - reproducibility
---

# Nextflow Pipeline Executor Skill

## Purpose
Provide Nextflow workflow management for reproducible bioinformatics pipelines.

## Capabilities
- DSL2 workflow execution
- Container integration (Docker/Singularity)
- Cloud execution (AWS, GCP, Azure)
- Pipeline parameterization
- Resume and caching
- Execution reports and timelines

## Usage Guidelines
- Use DSL2 for modular pipelines
- Containerize processes for reproducibility
- Configure for target execution environment
- Enable resume for fault tolerance
- Generate execution reports
- Document pipeline versions

## Dependencies
- Nextflow
- nf-core
- Snakemake

## Process Integration
- Reproducible Research Workflow (reproducible-research)
- Analysis Pipeline Validation (pipeline-validation)
- All analysis pipelines
