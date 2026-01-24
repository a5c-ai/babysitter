---
name: ftir-analyzer
description: Fourier Transform Infrared spectroscopy skill for molecular identification and surface functional group analysis
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
    - OMNIC
    - OPUS
    - PerkinElmer Spectrum software
---

# FTIR Analyzer

## Purpose

The FTIR Analyzer skill provides molecular characterization of nanomaterials through infrared spectroscopy, enabling identification of functional groups, surface modifications, and chemical bonding.

## Capabilities

- ATR-FTIR for nanoparticle surfaces
- Functional group identification
- Surface modification verification
- Gas-phase FTIR for reactions
- Diffuse reflectance (DRIFTS)
- Spectral library searching

## Usage Guidelines

### FTIR Analysis

1. **Sample Preparation**
   - Use ATR for nanoparticles
   - Ensure good contact for ATR
   - Consider KBr pellet for transmission

2. **Spectrum Analysis**
   - Identify characteristic bands
   - Compare to reference spectra
   - Quantify using Beer-Lambert

3. **Surface Chemistry**
   - Monitor ligand exchange
   - Verify functionalization
   - Detect degradation products

## Process Integration

- Multi-Modal Nanomaterial Characterization Pipeline
- Nanomaterial Surface Functionalization Pipeline

## Input Schema

```json
{
  "spectrum_file": "string",
  "technique": "atr|transmission|drifts",
  "analysis_type": "identification|quantification|comparison"
}
```

## Output Schema

```json
{
  "identified_bands": [{
    "wavenumber": "number (cm-1)",
    "assignment": "string",
    "intensity": "string (strong|medium|weak)"
  }],
  "functional_groups": ["string"],
  "library_matches": [{
    "compound": "string",
    "match_score": "number"
  }]
}
```
