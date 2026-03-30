---
name: nanoimprint-process-controller
description: Nanoimprint Lithography skill for high-throughput nanopatterning with template management and demolding optimization
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
    - NIL process simulation
    - Template design tools
---

# Nanoimprint Process Controller

## Purpose

The Nanoimprint Process Controller skill provides comprehensive nanoimprint lithography process control, enabling high-throughput nanopatterning through template design, imprint optimization, and defect management.

## Capabilities

- Template design and fabrication
- Imprint pressure and temperature optimization
- UV-NIL and thermal NIL protocols
- Demolding force analysis
- Residual layer control
- Defect inspection and yield analysis

## Usage Guidelines

### NIL Process Control

1. **Template Preparation**
   - Design with demolding in mind
   - Apply anti-sticking treatment
   - Verify pattern fidelity

2. **Imprint Optimization**
   - Optimize pressure and temperature
   - Control residual layer thickness
   - Minimize defects

3. **Yield Improvement**
   - Track defect types
   - Optimize demolding conditions
   - Implement cleaning protocols

## Process Integration

- Nanolithography Process Development
- Directed Self-Assembly Process Development

## Input Schema

```json
{
  "template_id": "string",
  "resist_type": "thermal|uv_curable",
  "target_features": {
    "min_cd": "number (nm)",
    "pitch": "number (nm)",
    "aspect_ratio": "number"
  },
  "substrate": "string"
}
```

## Output Schema

```json
{
  "process_parameters": {
    "temperature": "number (C)",
    "pressure": "number (bar)",
    "time": "number (s)",
    "uv_dose": "number (mJ/cm2)"
  },
  "residual_layer": "number (nm)",
  "demolding_force": "number (N)",
  "defect_density": "number (defects/cm2)",
  "yield": "number (%)"
}
```
