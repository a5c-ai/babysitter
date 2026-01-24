---
name: saxs-waxs-analyzer
description: Small/Wide Angle X-ray Scattering skill for nanostructure size, shape, and organization analysis
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: nanotechnology
  domain: science
  category: spectroscopy
  priority: medium
  phase: 6
  tools-libraries:
    - ATSAS
    - SasView
    - Irena
    - RAW
---

# SAXS-WAXS Analyzer

## Purpose

The SAXS-WAXS Analyzer skill provides structural characterization of nanomaterials through small and wide angle X-ray scattering, enabling determination of size, shape, and spatial organization at the nanoscale.

## Capabilities

- SAXS data reduction and analysis
- Form factor fitting
- Guinier and Kratky analysis
- Pair distance distribution function
- WAXS crystallinity assessment
- Self-assembly structure determination

## Usage Guidelines

### SAXS Analysis

1. **Data Reduction**
   - Subtract background
   - Apply transmission correction
   - Merge multiple detector regions

2. **Form Factor Analysis**
   - Fit to sphere, cylinder, or other models
   - Extract size distribution
   - Determine shape parameters

3. **Structural Analysis**
   - Calculate P(r) function
   - Determine Rg from Guinier
   - Assess folding from Kratky

## Process Integration

- Statistical Particle Size Distribution Analysis
- Directed Self-Assembly Process Development
- Structure-Property Correlation Analysis

## Input Schema

```json
{
  "data_file": "string",
  "technique": "saxs|waxs|combined",
  "analysis_type": "guinier|form_factor|pdf",
  "expected_shape": "sphere|cylinder|disk|ellipsoid"
}
```

## Output Schema

```json
{
  "guinier": {
    "Rg": "number (nm)",
    "I0": "number",
    "qRg_range": "string"
  },
  "form_factor": {
    "model": "string",
    "radius": "number (nm)",
    "polydispersity": "number",
    "chi_squared": "number"
  },
  "pdf": {
    "Dmax": "number (nm)",
    "p_r_function": {"r": [], "p": []}
  }
}
```
