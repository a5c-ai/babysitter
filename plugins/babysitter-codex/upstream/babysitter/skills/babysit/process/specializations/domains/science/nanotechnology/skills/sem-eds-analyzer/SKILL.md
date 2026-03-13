---
name: sem-eds-analyzer
description: Scanning Electron Microscopy with Energy Dispersive X-ray Spectroscopy skill for morphology and elemental analysis
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
    - AZtec
    - ESPRIT
    - NSS
    - Pathfinder
---

# SEM-EDS Analyzer

## Purpose

The SEM-EDS Analyzer skill provides comprehensive scanning electron microscopy and energy dispersive X-ray spectroscopy analysis for nanomaterial morphology and elemental composition characterization.

## Capabilities

- Automated SEM image analysis
- EDS spectrum acquisition and quantification
- Elemental mapping and line scans
- Particle size from SEM images
- Surface morphology characterization
- Cross-section analysis

## Usage Guidelines

### SEM-EDS Analysis

1. **Image Acquisition**
   - Optimize accelerating voltage for sample
   - Select appropriate detector (SE, BSE)
   - Minimize charging artifacts

2. **EDS Analysis**
   - Acquire spectra at appropriate kV
   - Apply ZAF corrections
   - Generate elemental maps

3. **Quantification**
   - Use standardless or standards-based
   - Report detection limits
   - Account for matrix effects

## Process Integration

- Multi-Modal Nanomaterial Characterization Pipeline
- Nanodevice Integration Process Flow
- Nanolithography Process Development

## Input Schema

```json
{
  "sample_id": "string",
  "analysis_type": "imaging|eds_point|eds_map|line_scan",
  "accelerating_voltage": "number (kV)",
  "elements_of_interest": ["string"]
}
```

## Output Schema

```json
{
  "morphology": {
    "features": ["string"],
    "measurements": [{"feature": "string", "value": "number", "unit": "string"}]
  },
  "composition": [{
    "element": "string",
    "weight_percent": "number",
    "atomic_percent": "number"
  }],
  "elemental_maps": [{
    "element": "string",
    "image_path": "string"
  }]
}
```
