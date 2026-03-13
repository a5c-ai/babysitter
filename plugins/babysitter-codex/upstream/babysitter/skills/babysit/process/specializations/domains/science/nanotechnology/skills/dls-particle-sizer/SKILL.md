---
name: dls-particle-sizer
description: Dynamic Light Scattering skill for hydrodynamic size distribution and polydispersity analysis
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
    - Malvern Zetasizer software
    - ALV correlator
    - CONTIN algorithm
---

# DLS Particle Sizer

## Purpose

The DLS Particle Sizer skill provides dynamic light scattering analysis for nanoparticle hydrodynamic size determination, enabling rapid, non-destructive measurement of size distributions and stability assessment.

## Capabilities

- Hydrodynamic diameter measurement
- Polydispersity index (PDI) calculation
- Size distribution analysis (intensity, volume, number)
- Temperature-dependent measurements
- Multi-angle DLS analysis
- Particle concentration estimation

## Usage Guidelines

### DLS Measurement

1. **Sample Preparation**
   - Dilute to appropriate concentration
   - Filter to remove dust
   - Equilibrate temperature

2. **Data Analysis**
   - Use cumulants for monomodal samples
   - Apply CONTIN for multimodal
   - Report intensity-weighted Z-average

3. **Quality Metrics**
   - PDI < 0.1: Monodisperse
   - PDI 0.1-0.3: Narrow distribution
   - PDI > 0.3: Broad distribution

## Process Integration

- Statistical Particle Size Distribution Analysis
- Nanoparticle Synthesis Protocol Development
- Nanoparticle Drug Delivery System Development

## Input Schema

```json
{
  "sample_id": "string",
  "solvent": "string",
  "temperature": "number (C)",
  "refractive_index": "number",
  "viscosity": "number (cP)"
}
```

## Output Schema

```json
{
  "z_average": "number (nm)",
  "pdi": "number",
  "distribution": {
    "intensity": {"peaks": [{"size": "number", "percent": "number"}]},
    "volume": {"peaks": [{"size": "number", "percent": "number"}]},
    "number": {"peaks": [{"size": "number", "percent": "number"}]}
  },
  "quality_metrics": {
    "intercept": "number",
    "baseline": "number"
  }
}
```
