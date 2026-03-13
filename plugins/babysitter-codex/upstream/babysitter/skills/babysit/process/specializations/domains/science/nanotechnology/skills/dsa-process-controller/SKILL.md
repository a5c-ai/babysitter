---
name: dsa-process-controller
description: Directed Self-Assembly skill for block copolymer lithography and nanoparticle templating
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
  priority: medium
  phase: 6
  tools-libraries:
    - BCP simulation tools
    - SCFT (Self-Consistent Field Theory)
---

# DSA Process Controller

## Purpose

The DSA Process Controller skill provides directed self-assembly process control for block copolymer lithography and nanoparticle templating, enabling sub-lithographic patterning through controlled polymer phase separation.

## Capabilities

- Block copolymer selection and design
- Annealing protocol optimization
- Defect density analysis
- Pattern transfer protocols
- Graphoepitaxy and chemoepitaxy
- Long-range order characterization

## Usage Guidelines

### DSA Process Control

1. **BCP Selection**
   - Match pitch to target
   - Consider chi-N product
   - Select morphology (lamellar, cylindrical)

2. **Annealing Optimization**
   - Choose thermal vs solvent vapor
   - Optimize temperature/time
   - Achieve equilibrium morphology

3. **Defect Analysis**
   - Classify defect types
   - Quantify defect density
   - Identify root causes

## Process Integration

- Directed Self-Assembly Process Development
- Nanolithography Process Development

## Input Schema

```json
{
  "bcp_system": "string (e.g., PS-b-PMMA)",
  "target_pitch": "number (nm)",
  "morphology": "lamellar|cylindrical|spherical",
  "guiding_type": "graphoepitaxy|chemoepitaxy",
  "substrate_pattern": "string"
}
```

## Output Schema

```json
{
  "annealing_protocol": {
    "method": "thermal|svA",
    "temperature": "number (C)",
    "time": "number (hours)",
    "solvent": "string (optional)"
  },
  "achieved_pitch": "number (nm)",
  "defect_density": "number (defects/um2)",
  "correlation_length": "number (nm)",
  "pattern_quality": "string"
}
```
