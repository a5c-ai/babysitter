---
name: nanoparticle-synthesis-optimizer
description: Synthesis parameter optimization skill for metal, semiconductor, and oxide nanoparticle production with automated protocol generation and reproducibility validation
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
    - Custom synthesis planners
    - Reaction kinetics models
    - DOE frameworks
---

# Nanoparticle Synthesis Optimizer

## Purpose

The Nanoparticle Synthesis Optimizer skill provides systematic optimization of synthesis parameters for metal, semiconductor, and oxide nanoparticle production, enabling reproducible synthesis protocols with controlled size, morphology, and surface chemistry.

## Capabilities

- Precursor stoichiometry calculation
- Reaction temperature/time optimization
- Surfactant and capping agent selection
- Nucleation and growth kinetics modeling
- Size distribution targeting
- Batch reproducibility assessment

## Usage Guidelines

### Synthesis Parameter Optimization

1. **Precursor Selection**
   - Match precursor reactivity to desired kinetics
   - Consider thermal decomposition temperatures
   - Evaluate purity requirements

2. **Temperature Programming**
   - Optimize nucleation temperature for burst nucleation
   - Control growth temperature for size focusing
   - Manage heating ramp rates

3. **Surfactant Systems**
   - Balance steric vs electrostatic stabilization
   - Consider binding affinity to specific facets
   - Optimize surfactant-to-precursor ratios

## Process Integration

- Nanoparticle Synthesis Protocol Development
- Nanomaterial Scale-Up and Process Transfer
- Green Synthesis Route Development

## Input Schema

```json
{
  "target_material": "string",
  "target_size": "number (nm)",
  "target_morphology": "sphere|rod|cube|plate",
  "size_tolerance": "number (%)",
  "synthesis_method": "thermal_decomposition|hot_injection|coprecipitation"
}
```

## Output Schema

```json
{
  "optimized_protocol": {
    "precursors": [{"name": "string", "concentration": "number"}],
    "temperature_profile": [{"temp": "number", "duration": "number"}],
    "surfactants": [{"name": "string", "ratio": "number"}]
  },
  "predicted_outcomes": {
    "size": "number (nm)",
    "size_distribution": "number (%)",
    "yield": "number (%)"
  }
}
```
