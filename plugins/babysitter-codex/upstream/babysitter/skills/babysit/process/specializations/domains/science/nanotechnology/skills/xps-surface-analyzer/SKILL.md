---
name: xps-surface-analyzer
description: X-ray Photoelectron Spectroscopy analysis skill for surface composition, chemical state, and depth profiling
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
  priority: high
  phase: 6
  tools-libraries:
    - CasaXPS
    - XPSPeak
    - PHI MultiPak
    - Avantage
---

# XPS Surface Analyzer

## Purpose

The XPS Surface Analyzer skill provides comprehensive X-ray Photoelectron Spectroscopy data analysis for nanomaterial surface characterization, enabling quantitative determination of surface composition, chemical states, and depth-dependent composition profiles.

## Capabilities

- Survey and high-resolution spectra acquisition
- Peak fitting and deconvolution
- Chemical state identification
- Quantitative surface composition
- Depth profiling analysis
- Charge correction and calibration

## Usage Guidelines

### XPS Analysis Workflow

1. **Survey Spectra**
   - Identify all elements present
   - Check for unexpected contamination
   - Plan high-resolution scans

2. **Peak Fitting**
   - Apply appropriate background (Shirley, Tougaard)
   - Constrain FWHM within physical limits
   - Assign chemical states from binding energy

3. **Quantification**
   - Apply relative sensitivity factors
   - Account for matrix effects
   - Report with appropriate uncertainty

## Process Integration

- Multi-Modal Nanomaterial Characterization Pipeline
- Nanomaterial Surface Functionalization Pipeline
- Structure-Property Correlation Analysis

## Input Schema

```json
{
  "sample_id": "string",
  "elements_of_interest": ["string"],
  "analysis_type": "survey|high_resolution|depth_profile",
  "charge_reference": "C1s|Au4f|other"
}
```

## Output Schema

```json
{
  "composition": [{
    "element": "string",
    "concentration": "number (at%)",
    "uncertainty": "number"
  }],
  "chemical_states": [{
    "element": "string",
    "state": "string",
    "binding_energy": "number (eV)",
    "fraction": "number (%)"
  }],
  "depth_profile": {
    "depths": ["number (nm)"],
    "compositions": [{}]
  }
}
```
