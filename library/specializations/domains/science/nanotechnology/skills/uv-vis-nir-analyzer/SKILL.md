---
name: uv-vis-nir-analyzer
description: UV-Vis-NIR spectroscopy skill for optical property characterization including plasmon resonance and bandgap analysis
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
    - UV Probe
    - Lambda software
    - Custom analysis scripts
---

# UV-Vis-NIR Analyzer

## Purpose

The UV-Vis-NIR Analyzer skill provides optical characterization of nanomaterials, enabling analysis of electronic transitions, plasmon resonances, and optical bandgaps essential for photonic and optoelectronic applications.

## Capabilities

- Absorption/transmission/reflectance spectra
- Localized surface plasmon resonance (LSPR) analysis
- Bandgap determination (Tauc plot)
- Quantum dot emission characterization
- Beer-Lambert quantification
- Aggregation monitoring

## Usage Guidelines

### Optical Analysis

1. **LSPR Analysis**
   - Monitor peak position and width
   - Track sensitivity to environment
   - Assess size and shape effects

2. **Bandgap Determination**
   - Apply Tauc plot method
   - Select direct/indirect transition
   - Report with uncertainty

3. **Concentration Quantification**
   - Apply Beer-Lambert law
   - Verify linear range
   - Account for scattering

## Process Integration

- Multi-Modal Nanomaterial Characterization Pipeline
- Structure-Property Correlation Analysis
- Nanosensor Development and Validation Pipeline

## Input Schema

```json
{
  "spectrum_file": "string",
  "measurement_type": "absorbance|transmittance|reflectance",
  "analysis_type": "lspr|bandgap|concentration",
  "material_type": "metal_np|semiconductor|quantum_dot"
}
```

## Output Schema

```json
{
  "lspr": {
    "peak_position": "number (nm)",
    "fwhm": "number (nm)",
    "extinction_coefficient": "number"
  },
  "bandgap": {
    "value": "number (eV)",
    "transition_type": "direct|indirect"
  },
  "concentration": {
    "value": "number",
    "unit": "string",
    "extinction_used": "number"
  }
}
```
