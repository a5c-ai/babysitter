---
name: scale-up-process-analyzer
description: Process engineering skill for analyzing and optimizing nanomaterial synthesis scale-up from lab to production
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
    - Process simulation tools
    - Reactor design calculators
    - Microfluidics design tools
---

# Scale-Up Process Analyzer

## Purpose

The Scale-Up Process Analyzer skill provides systematic analysis of nanomaterial synthesis scale-up challenges, enabling successful transition from laboratory to production scale while maintaining product quality and reproducibility.

## Capabilities

- Heat and mass transfer scaling
- Reactor design recommendations
- Mixing efficiency analysis
- Continuous flow process design
- Batch consistency validation
- Cost-at-scale estimation

## Usage Guidelines

### Scale-Up Analysis

1. **Heat Transfer Scaling**
   - Calculate surface-to-volume ratio changes
   - Assess temperature uniformity
   - Design heat exchange systems

2. **Mixing Considerations**
   - Evaluate Reynolds number scaling
   - Assess mixing time vs reaction time
   - Consider impeller design changes

3. **Continuous Flow Options**
   - Evaluate microfluidic reactors
   - Design flow chemistry approaches
   - Assess residence time distributions

## Process Integration

- Nanomaterial Scale-Up and Process Transfer
- Nanoparticle Synthesis Protocol Development

## Input Schema

```json
{
  "lab_scale": {
    "volume": "number (mL)",
    "batch_time": "number (min)",
    "temperature": "number (C)",
    "mixing_speed": "number (rpm)"
  },
  "target_scale": {
    "volume": "number (L)",
    "production_rate": "number (kg/day)"
  },
  "product_specs": {
    "size": "number (nm)",
    "size_tolerance": "number (%)"
  }
}
```

## Output Schema

```json
{
  "scale_up_approach": "batch|continuous|hybrid",
  "reactor_recommendations": {
    "type": "string",
    "volume": "number",
    "configuration": "string"
  },
  "critical_parameters": [{
    "parameter": "string",
    "lab_value": "number",
    "scaled_value": "number",
    "scaling_rule": "string"
  }],
  "estimated_cost": "number ($/kg)",
  "risk_factors": ["string"]
}
```
