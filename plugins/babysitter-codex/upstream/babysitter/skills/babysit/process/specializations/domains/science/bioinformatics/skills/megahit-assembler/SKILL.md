---
name: megahit-assembler
description: MEGAHIT metagenomic assembly skill for reconstructing genomes from short reads
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
    - assembly
    - genomes
    - contigs
---

# MEGAHIT Assembler Skill

## Purpose
Enable MEGAHIT metagenomic assembly for reconstructing genomes from short reads.

## Capabilities
- Memory-efficient assembly
- Multiple k-mer strategies
- Contig quality assessment
- Large dataset handling
- Iterative assembly refinement
- Assembly graph analysis

## Usage Guidelines
- Select k-mer strategy based on coverage
- Assess contig quality metrics
- Handle large datasets efficiently
- Consider iterative refinement
- Bin contigs for MAG recovery
- Document assembly parameters

## Dependencies
- MEGAHIT
- metaSPAdes
- IDBA-UD

## Process Integration
- Shotgun Metagenomics Pipeline (shotgun-metagenomics)
