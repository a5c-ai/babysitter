---
name: plasma-etch-controller
description: Plasma etching skill for anisotropic nanostructure patterning with selectivity and profile control
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
    - Etch simulators
    - OES/interferometry analysis
---

# Plasma Etch Controller

## Purpose

The Plasma Etch Controller skill provides comprehensive plasma etching process control for nanofabrication, enabling anisotropic pattern transfer with optimized selectivity, profile control, and minimal damage.

## Capabilities

- Etch chemistry selection
- Anisotropy and selectivity optimization
- Endpoint detection
- Profile and sidewall angle control
- Loading effect compensation
- Plasma damage assessment

## Usage Guidelines

### Plasma Etch Process

1. **Chemistry Selection**
   - Match chemistry to material
   - Consider selectivity requirements
   - Address sidewall passivation

2. **Profile Control**
   - Optimize ion energy
   - Balance chemical and physical
   - Control sidewall angle

3. **Endpoint Detection**
   - Use OES for species monitoring
   - Apply interferometry
   - Implement time-based backup

## Process Integration

- Nanolithography Process Development
- Nanodevice Integration Process Flow

## Input Schema

```json
{
  "material": "string",
  "mask_type": "string",
  "target_depth": "number (nm)",
  "feature_cd": "number (nm)",
  "selectivity_requirements": {
    "to_mask": "number",
    "to_underlayer": "number"
  }
}
```

## Output Schema

```json
{
  "etch_recipe": {
    "gases": [{"gas": "string", "flow": "number (sccm)"}],
    "pressure": "number (mTorr)",
    "rf_power": "number (W)",
    "bias_power": "number (W)"
  },
  "etch_rate": "number (nm/min)",
  "selectivity": {
    "to_mask": "number",
    "to_underlayer": "number"
  },
  "sidewall_angle": "number (degrees)",
  "uniformity": "number (%)"
}
```
