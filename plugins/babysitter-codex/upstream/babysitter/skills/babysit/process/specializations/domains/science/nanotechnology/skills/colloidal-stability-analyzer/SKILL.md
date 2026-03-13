---
name: colloidal-stability-analyzer
description: Colloidal stability assessment skill for evaluating nanoparticle dispersion stability through zeta potential, aggregation kinetics, and shelf-life prediction
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: nanotechnology
  domain: science
  category: synthesis-materials
  priority: high
  phase: 6
  tools-libraries:
    - DLS analyzers
    - Zeta potential meters
    - Stability prediction models
---

# Colloidal Stability Analyzer

## Purpose

The Colloidal Stability Analyzer skill provides comprehensive assessment of nanoparticle dispersion stability, enabling prediction of aggregation behavior, shelf-life estimation, and optimization of stabilization strategies through DLVO theory and experimental validation.

## Capabilities

- Zeta potential analysis
- DLVO theory-based stability prediction
- Aggregation kinetics modeling
- pH and ionic strength effects
- Steric stabilization assessment
- Shelf-life prediction algorithms

## Usage Guidelines

### Stability Assessment

1. **Zeta Potential Analysis**
   - Measure at multiple pH values
   - Determine isoelectric point
   - Assess stability window (|zeta| > 30 mV)

2. **DLVO Theory Application**
   - Calculate van der Waals attraction
   - Estimate electrostatic repulsion
   - Determine energy barrier height

3. **Shelf-Life Prediction**
   - Monitor size over time
   - Apply accelerated aging protocols
   - Predict long-term stability

## Process Integration

- Nanoparticle Synthesis Protocol Development
- Nanomaterial Surface Functionalization Pipeline
- Nanoparticle Drug Delivery System Development

## Input Schema

```json
{
  "nanoparticle_type": "string",
  "size": "number (nm)",
  "surface_chemistry": "string",
  "dispersion_medium": "string",
  "pH_range": {"min": "number", "max": "number"},
  "ionic_strength": "number (mM)"
}
```

## Output Schema

```json
{
  "zeta_potential": "number (mV)",
  "stability_classification": "stable|marginally_stable|unstable",
  "aggregation_rate": "number (nm/day)",
  "predicted_shelf_life": "number (days)",
  "optimization_recommendations": ["string"]
}
```
