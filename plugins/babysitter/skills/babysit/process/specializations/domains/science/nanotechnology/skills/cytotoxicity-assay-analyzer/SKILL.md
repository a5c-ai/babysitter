---
name: cytotoxicity-assay-analyzer
description: Nanotoxicology skill for in vitro cytotoxicity assessment and cell viability analysis
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: nanotechnology
  domain: science
  category: applications
  priority: high
  phase: 6
  tools-libraries:
    - Plate reader analysis software
    - Cell imaging analysis
---

# Cytotoxicity Assay Analyzer

## Purpose

The Cytotoxicity Assay Analyzer skill provides comprehensive in vitro toxicity assessment of nanomaterials, enabling systematic evaluation of cell viability, determination of safe exposure levels, and identification of toxicity mechanisms.

## Capabilities

- MTT/MTS/WST assay analysis
- Live/dead staining quantification
- IC50/EC50 calculation
- Dose-response curve fitting
- Cell morphology analysis
- Apoptosis/necrosis detection

## Usage Guidelines

### Cytotoxicity Assessment

1. **Assay Selection**
   - Choose appropriate viability assay
   - Consider nanoparticle interference
   - Include proper controls

2. **Data Analysis**
   - Calculate percent viability
   - Fit dose-response curves
   - Determine IC50/EC50

3. **Result Interpretation**
   - Compare to benchmark materials
   - Assess mechanism of toxicity
   - Report with appropriate context

## Process Integration

- Nanomaterial Safety Assessment Pipeline
- Nanoparticle Drug Delivery System Development

## Input Schema

```json
{
  "nanomaterial": "string",
  "cell_line": "string",
  "assay_type": "mtt|mts|wst|live_dead|ldh",
  "concentrations": ["number"],
  "exposure_time": "number (hours)"
}
```

## Output Schema

```json
{
  "viability_data": [{
    "concentration": "number",
    "viability": "number (%)",
    "std_dev": "number"
  }],
  "dose_response": {
    "ic50": "number",
    "ic50_unit": "string",
    "hill_slope": "number",
    "r_squared": "number"
  },
  "toxicity_classification": "string",
  "mechanism_indicators": ["string"]
}
```
