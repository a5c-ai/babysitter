---
name: giab-benchmark-validator
description: Genome in a Bottle benchmark validation skill for pipeline accuracy assessment
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
    - validation
    - benchmark
    - giab
---

# GIAB Benchmark Validator Skill

## Purpose
Enable Genome in a Bottle benchmark validation for pipeline accuracy assessment.

## Capabilities
- Truth set comparison
- hap.py/vcfeval execution
- Sensitivity/specificity calculation
- Stratified performance metrics
- Difficult region analysis
- Validation report generation

## Usage Guidelines
- Use appropriate GIAB reference samples
- Compare against truth sets with hap.py
- Calculate sensitivity and specificity
- Stratify by region type and variant class
- Analyze performance in difficult regions
- Generate comprehensive validation reports

## Dependencies
- hap.py
- vcfeval
- GIAB resources

## Process Integration
- Analysis Pipeline Validation (pipeline-validation)
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)
