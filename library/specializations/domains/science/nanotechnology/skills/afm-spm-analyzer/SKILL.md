---
name: afm-spm-analyzer
description: Atomic Force Microscopy and Scanning Probe Microscopy skill for nanoscale topography, mechanical, and electrical property mapping
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
    - Gwyddion
    - WSxM
    - NanoScope Analysis
    - SPIP
---

# AFM-SPM Analyzer

## Purpose

The AFM-SPM Analyzer skill provides comprehensive atomic force and scanning probe microscopy data analysis for nanoscale surface characterization, including topography, mechanical properties, and electrical measurements.

## Capabilities

- Topography imaging and analysis
- Surface roughness calculation (Ra, RMS)
- Force-distance curve analysis
- Nanoindentation and mechanical mapping
- Kelvin probe force microscopy (KPFM)
- Conductive AFM measurements

## Usage Guidelines

### AFM Analysis Workflow

1. **Topography Analysis**
   - Apply plane leveling corrections
   - Remove artifacts and noise
   - Calculate roughness parameters

2. **Mechanical Mapping**
   - Calibrate cantilever spring constant
   - Apply contact mechanics models
   - Generate modulus maps

3. **Electrical Measurements**
   - Calibrate work function reference
   - Map surface potential
   - Measure local conductivity

## Process Integration

- Multi-Modal Nanomaterial Characterization Pipeline
- In-Situ Characterization Experiment Design
- Thin Film Deposition Process Optimization

## Input Schema

```json
{
  "data_file": "string",
  "analysis_type": "topography|force_curves|mechanical|electrical",
  "cantilever_specs": {
    "spring_constant": "number (N/m)",
    "tip_radius": "number (nm)"
  }
}
```

## Output Schema

```json
{
  "topography": {
    "Ra": "number (nm)",
    "RMS": "number (nm)",
    "Rmax": "number (nm)",
    "image_path": "string"
  },
  "mechanical": {
    "modulus": "number (GPa)",
    "adhesion": "number (nN)",
    "deformation": "number (nm)"
  },
  "electrical": {
    "surface_potential": "number (mV)",
    "work_function": "number (eV)"
  }
}
```
