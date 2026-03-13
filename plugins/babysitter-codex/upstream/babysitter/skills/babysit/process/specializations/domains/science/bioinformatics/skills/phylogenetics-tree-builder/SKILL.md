---
name: phylogenetics-tree-builder
description: Phylogenetic analysis skill for constructing evolutionary trees and assessing relationships
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
    - phylogenetics
    - evolution
    - trees
---

# Phylogenetics Tree Builder Skill

## Purpose
Enable phylogenetic analysis for constructing evolutionary trees, performing multiple sequence alignments, and assessing phylogenetic relationships.

## Capabilities
- Multiple sequence alignment (MUSCLE, MAFFT)
- Maximum likelihood tree construction
- Bayesian phylogenetic inference
- Bootstrap support calculation
- Tree visualization and annotation
- Molecular clock analysis

## Usage Guidelines
- Align sequences before tree construction
- Select appropriate substitution models
- Calculate bootstrap support for branch confidence
- Visualize trees with meaningful annotations
- Consider molecular clock constraints when appropriate
- Document methodology and parameters

## Dependencies
- RAxML-NG
- IQ-TREE
- MrBayes
- MAFFT
- MUSCLE
- FigTree

## Process Integration
- 16S rRNA Microbiome Analysis (16s-microbiome-analysis)
- Shotgun Metagenomics Pipeline (shotgun-metagenomics)
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)
