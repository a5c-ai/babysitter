---
name: cvd-pvd-process-controller
description: Chemical/Physical Vapor Deposition skill for thin film and nanostructure deposition optimization
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: nanotechnology
  domain: science
  category: fabrication
  priority: high
  phase: 6
  tools-libraries:
    - Deposition rate calculators
    - Film thickness monitors
---

# CVD-PVD Process Controller

## Purpose

The CVD-PVD Process Controller skill provides comprehensive vapor deposition process control for thin film and nanostructure fabrication, enabling optimized growth conditions for various material systems.

## Capabilities

- CVD precursor chemistry selection
- Temperature and pressure optimization
- Plasma-enhanced CVD protocols
- PVD sputtering/evaporation control
- Film stress management
- Rate and uniformity optimization

## Usage Guidelines

### Deposition Process Control

1. **CVD Optimization**
   - Select precursor chemistry
   - Optimize flow rates
   - Control temperature profile

2. **PVD Control**
   - Optimize sputter power
   - Control deposition rate
   - Manage film stress

3. **Quality Assurance**
   - Monitor thickness in-situ
   - Characterize composition
   - Verify stoichiometry

## Process Integration

- Thin Film Deposition Process Optimization
- Nanodevice Integration Process Flow

## Input Schema

```json
{
  "deposition_type": "cvd|pecvd|sputtering|evaporation",
  "material": "string",
  "target_thickness": "number (nm)",
  "substrate": "string",
  "quality_requirements": {
    "uniformity": "number (%)",
    "stress": "string (tensile|compressive|neutral)"
  }
}
```

## Output Schema

```json
{
  "process_parameters": {
    "temperature": "number (C)",
    "pressure": "number (mTorr)",
    "power": "number (W)",
    "gas_flows": [{"gas": "string", "flow": "number (sccm)"}]
  },
  "deposition_rate": "number (nm/min)",
  "uniformity": "number (%)",
  "film_stress": "number (MPa)",
  "composition": [{"element": "string", "fraction": "number"}]
}
```
