---
name: tem-image-analyzer
description: Transmission Electron Microscopy image analysis skill for nanoparticle size, morphology, and crystallography assessment
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: nanotechnology
  domain: science
  category: microscopy-characterization
  priority: high
  phase: 6
  tools-libraries:
    - ImageJ/Fiji
    - Gatan DigitalMicrograph
    - JEMS
    - CryoSPARC
---

# TEM Image Analyzer

## Purpose

The TEM Image Analyzer skill provides comprehensive analysis of transmission electron microscopy data for nanomaterial characterization, enabling automated particle detection, size distribution analysis, and crystallographic structure determination.

## Capabilities

- Automated particle detection and sizing
- Morphology classification
- Lattice fringe analysis
- Selected area electron diffraction (SAED) indexing
- High-resolution TEM (HRTEM) analysis
- STEM-HAADF imaging

## Usage Guidelines

### Image Analysis Workflow

1. **Particle Detection**
   - Apply appropriate thresholding
   - Use watershed for touching particles
   - Count minimum 200 particles for statistics

2. **Size Measurement**
   - Calibrate pixel size from scale bar
   - Measure Feret diameter or equivalent circular diameter
   - Report mean, standard deviation, distribution

3. **Crystallographic Analysis**
   - Index SAED patterns to phase
   - Measure d-spacings from lattice fringes
   - Identify zone axis from HRTEM

## Process Integration

- Multi-Modal Nanomaterial Characterization Pipeline
- Statistical Particle Size Distribution Analysis
- In-Situ Characterization Experiment Design

## Input Schema

```json
{
  "image_path": "string",
  "analysis_type": "sizing|morphology|crystallography",
  "scale_bar": {"length": "number", "pixels": "number"},
  "expected_material": "string (for indexing)"
}
```

## Output Schema

```json
{
  "particle_statistics": {
    "count": "number",
    "mean_size": "number (nm)",
    "std_dev": "number (nm)",
    "size_distribution": {"bins": [], "counts": []}
  },
  "morphology": {
    "shapes": [{"type": "string", "fraction": "number"}],
    "aspect_ratio": "number"
  },
  "crystallography": {
    "phase": "string",
    "d_spacings": ["number (nm)"],
    "zone_axis": "string"
  }
}
```
