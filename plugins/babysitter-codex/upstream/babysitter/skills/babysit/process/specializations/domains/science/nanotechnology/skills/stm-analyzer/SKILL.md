---
name: stm-analyzer
description: Scanning Tunneling Microscopy skill for atomic-resolution imaging and local density of states measurements
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
  priority: medium
  phase: 6
  tools-libraries:
    - WSxM
    - SPECS software
    - Custom STM analysis tools
---

# STM Analyzer

## Purpose

The STM Analyzer skill provides atomic-resolution surface analysis through scanning tunneling microscopy, enabling visualization of atomic structures and measurement of local electronic properties.

## Capabilities

- Atomic-resolution imaging
- STS (Scanning Tunneling Spectroscopy)
- Local density of states mapping
- Surface reconstruction analysis
- Molecular imaging
- Low-temperature operation protocols

## Usage Guidelines

### STM Analysis

1. **Imaging**
   - Optimize tunneling parameters
   - Apply drift correction
   - Identify atomic features

2. **Spectroscopy**
   - Acquire dI/dV spectra
   - Map electronic states
   - Identify band structure features

3. **Data Processing**
   - Apply Fourier filtering
   - Correct for thermal drift
   - Calibrate atomic distances

## Process Integration

- In-Situ Characterization Experiment Design
- Structure-Property Correlation Analysis

## Input Schema

```json
{
  "data_file": "string",
  "analysis_type": "imaging|spectroscopy|sts_mapping",
  "bias_voltage": "number (V)",
  "setpoint_current": "number (nA)"
}
```

## Output Schema

```json
{
  "imaging": {
    "atomic_structure": "string",
    "lattice_constant": "number (nm)",
    "defects_identified": ["string"]
  },
  "spectroscopy": {
    "band_gap": "number (eV)",
    "fermi_level": "number (eV)",
    "density_of_states": {"energy": [], "dos": []}
  }
}
```
