---
name: raman-spectroscopy-analyzer
description: Raman spectroscopy skill for molecular fingerprinting, structural characterization, and chemical identification of nanomaterials
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
  priority: high
  phase: 6
  tools-libraries:
    - WiRE
    - LabSpec
    - Renishaw software
    - Custom spectral databases
---

# Raman Spectroscopy Analyzer

## Purpose

The Raman Spectroscopy Analyzer skill provides molecular-level characterization of nanomaterials through vibrational spectroscopy, enabling structural identification, defect analysis, and chemical mapping.

## Capabilities

- Raman spectrum acquisition and processing
- Peak identification and assignment
- SERS (Surface-Enhanced Raman) analysis
- Raman mapping and imaging
- Resonance Raman analysis
- Graphene/CNT characterization (D/G ratio)

## Usage Guidelines

### Raman Analysis

1. **Spectrum Acquisition**
   - Select appropriate excitation wavelength
   - Optimize power to avoid damage
   - Apply baseline correction

2. **Peak Analysis**
   - Identify characteristic peaks
   - Calculate peak ratios (D/G for carbon)
   - Assess crystallinity

3. **Mapping**
   - Generate chemical maps
   - Identify phase distributions
   - Quantify heterogeneity

## Process Integration

- Multi-Modal Nanomaterial Characterization Pipeline
- In-Situ Characterization Experiment Design
- Structure-Property Correlation Analysis

## Input Schema

```json
{
  "spectrum_file": "string",
  "excitation_wavelength": "number (nm)",
  "material_type": "string",
  "analysis_type": "identification|mapping|sers"
}
```

## Output Schema

```json
{
  "identified_peaks": [{
    "position": "number (cm-1)",
    "assignment": "string",
    "intensity": "number"
  }],
  "structural_parameters": {
    "d_g_ratio": "number (for carbon)",
    "crystallinity": "string"
  },
  "chemical_map": {
    "species": "string",
    "image_path": "string"
  }
}
```
