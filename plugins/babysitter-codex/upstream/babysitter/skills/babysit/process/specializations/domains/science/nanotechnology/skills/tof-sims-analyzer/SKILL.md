---
name: tof-sims-analyzer
description: Time-of-Flight Secondary Ion Mass Spectrometry skill for molecular surface analysis and imaging
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: nanotechnology
  domain: science
  category: surface-analysis
  priority: medium
  phase: 6
  tools-libraries:
    - ION-TOF software
    - SurfaceLab
    - NESAC/BIO tools
---

# ToF-SIMS Analyzer

## Purpose

The ToF-SIMS Analyzer skill provides molecular-level surface analysis capabilities for nanomaterials, enabling identification of surface species, chemical imaging, and depth profiling with high sensitivity.

## Capabilities

- Molecular ion identification
- Surface contamination analysis
- 2D and 3D chemical imaging
- Isotope labeling detection
- Depth profiling
- Principal component analysis of spectra

## Usage Guidelines

### ToF-SIMS Analysis

1. **Spectral Analysis**
   - Identify characteristic fragments
   - Build peak lists for materials
   - Apply multivariate analysis

2. **Imaging Mode**
   - Optimize spatial resolution
   - Generate chemical maps
   - Correlate with topography

3. **Depth Profiling**
   - Select appropriate sputter source
   - Monitor interface sharpness
   - Account for matrix effects

## Process Integration

- Multi-Modal Nanomaterial Characterization Pipeline
- Nanomaterial Surface Functionalization Pipeline

## Input Schema

```json
{
  "sample_id": "string",
  "analysis_mode": "spectral|imaging|depth_profile",
  "primary_ion": "Bi3+|Bi1+|C60+",
  "polarity": "positive|negative",
  "area_of_interest": {"x": "number", "y": "number"}
}
```

## Output Schema

```json
{
  "identified_species": [{
    "mass": "number (amu)",
    "assignment": "string",
    "intensity": "number"
  }],
  "chemical_maps": [{
    "species": "string",
    "image_path": "string"
  }],
  "pca_results": {
    "principal_components": "number",
    "variance_explained": ["number"]
  }
}
```
