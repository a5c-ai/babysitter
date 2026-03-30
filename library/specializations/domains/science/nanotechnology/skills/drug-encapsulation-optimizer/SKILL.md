---
name: drug-encapsulation-optimizer
description: Drug delivery formulation skill for optimizing drug loading, encapsulation efficiency, and release kinetics
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
    - Dissolution modeling software
    - Stability testing protocols
---

# Drug Encapsulation Optimizer

## Purpose

The Drug Encapsulation Optimizer skill provides systematic optimization of nanoparticle drug delivery formulations, enabling maximized drug loading, controlled release kinetics, and formulation stability.

## Capabilities

- Drug loading optimization
- Encapsulation efficiency calculation
- Release kinetics modeling (zero-order, Higuchi, Korsmeyer-Peppas)
- Stability testing protocols
- Size optimization for target application
- Payload-to-carrier ratio optimization

## Usage Guidelines

### Formulation Optimization

1. **Loading Optimization**
   - Screen loading methods
   - Optimize drug:carrier ratio
   - Maximize encapsulation efficiency

2. **Release Kinetics**
   - Characterize release profile
   - Fit to kinetic models
   - Design sustained release

3. **Stability Assessment**
   - Monitor size over time
   - Track drug leakage
   - Accelerated stability testing

## Process Integration

- Nanoparticle Drug Delivery System Development
- Nanomaterial Safety Assessment Pipeline

## Input Schema

```json
{
  "drug": "string",
  "carrier_type": "liposome|polymer|micelle|lipid_np",
  "target_loading": "number (wt%)",
  "release_target": "immediate|sustained|triggered",
  "route": "iv|oral|topical|inhalation"
}
```

## Output Schema

```json
{
  "optimized_formulation": {
    "drug_loading": "number (wt%)",
    "encapsulation_efficiency": "number (%)",
    "particle_size": "number (nm)",
    "pdi": "number"
  },
  "release_kinetics": {
    "model": "string",
    "parameters": {},
    "t50": "number (hours)",
    "t90": "number (hours)"
  },
  "stability": {
    "shelf_life": "number (months)",
    "storage_conditions": "string"
  }
}
```
