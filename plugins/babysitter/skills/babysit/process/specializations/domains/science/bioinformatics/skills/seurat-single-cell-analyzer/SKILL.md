---
name: seurat-single-cell-analyzer
description: Seurat single-cell analysis skill for clustering, annotation, and trajectory analysis
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
    - single-cell
    - clustering
    - scrnaseq
---

# Seurat Single-Cell Analyzer Skill

## Purpose
Enable Seurat single-cell analysis for clustering, annotation, and trajectory analysis of scRNA-seq data.

## Capabilities
- Quality filtering and normalization
- Dimensionality reduction (PCA, UMAP)
- Graph-based clustering
- Marker gene identification
- Cell type annotation
- Integration across datasets
- Trajectory inference

## Usage Guidelines
- Apply quality filters appropriate for experiment
- Normalize data before dimensionality reduction
- Select clustering resolution based on biology
- Identify markers for cluster annotation
- Integrate datasets to remove batch effects
- Document analysis parameters

## Dependencies
- Seurat
- Scanpy
- CellRanger

## Process Integration
- Single-Cell RNA-seq Analysis (scrnaseq-analysis)
- Spatial Transcriptomics Analysis (spatial-transcriptomics)
