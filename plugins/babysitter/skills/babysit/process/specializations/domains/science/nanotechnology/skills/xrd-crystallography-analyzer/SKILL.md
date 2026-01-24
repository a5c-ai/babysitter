---
name: xrd-crystallography-analyzer
description: X-ray Diffraction skill for crystal structure, phase identification, and crystallite size analysis of nanomaterials
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
    - HighScore
    - JADE
    - GSAS-II
    - FullProf
    - PDFgui
---

# XRD Crystallography Analyzer

## Purpose

The XRD Crystallography Analyzer skill provides crystallographic characterization of nanomaterials through X-ray diffraction analysis, enabling phase identification, crystallite size determination, and structural refinement.

## Capabilities

- Phase identification and Rietveld refinement
- Crystallite size (Scherrer equation)
- Lattice parameter calculation
- Preferred orientation analysis
- In-situ XRD capabilities
- PDF (Pair Distribution Function) analysis

## Usage Guidelines

### XRD Analysis

1. **Phase Identification**
   - Match peaks to database entries
   - Identify multiple phases
   - Assess phase purity

2. **Crystallite Size**
   - Apply Scherrer equation: D = Kl/(B cos theta)
   - Account for instrumental broadening
   - Use Williamson-Hall for strain

3. **Structural Refinement**
   - Perform Rietveld refinement
   - Extract lattice parameters
   - Quantify phase fractions

## Process Integration

- Multi-Modal Nanomaterial Characterization Pipeline
- Structure-Property Correlation Analysis
- Nanoparticle Synthesis Protocol Development

## Input Schema

```json
{
  "diffraction_file": "string",
  "analysis_type": "phase_id|crystallite_size|refinement|pdf",
  "wavelength": "number (Angstrom)",
  "expected_phases": ["string"]
}
```

## Output Schema

```json
{
  "phases": [{
    "name": "string",
    "pdf_number": "string",
    "weight_fraction": "number"
  }],
  "crystallite_size": {
    "value": "number (nm)",
    "method": "string"
  },
  "lattice_parameters": {
    "a": "number",
    "b": "number",
    "c": "number",
    "space_group": "string"
  },
  "refinement_quality": {
    "Rwp": "number",
    "chi_squared": "number"
  }
}
```
