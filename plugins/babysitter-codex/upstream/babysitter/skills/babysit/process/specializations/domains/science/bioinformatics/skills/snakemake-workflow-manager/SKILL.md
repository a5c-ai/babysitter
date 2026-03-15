---
name: snakemake-workflow-manager
description: Snakemake workflow management skill for rule-based pipeline execution
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
    - snakemake
    - reproducibility
---

# Snakemake Workflow Manager Skill

## Purpose
Enable Snakemake workflow management for rule-based pipeline execution.

## Capabilities
- DAG-based workflow execution
- Cluster/cloud execution
- Conda environment management
- Checkpointing and resume
- Benchmark collection
- Report generation

## Usage Guidelines
- Define rules with clear inputs/outputs
- Use Conda for environment management
- Configure for cluster execution
- Enable checkpointing for large workflows
- Collect benchmarks for optimization
- Generate workflow reports

## Dependencies
- Snakemake
- Conda
- Bioconda

## Process Integration
- Reproducible Research Workflow (reproducible-research)
- Analysis Pipeline Validation (pipeline-validation)
