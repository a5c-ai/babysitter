---
name: contact-angle-analyzer
description: Wettability analysis skill for surface energy characterization and hydrophobicity/hydrophilicity assessment
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: nanotechnology
  domain: science
  category: surface-analysis
  priority: medium
  phase: 6
  tools-libraries:
    - Contact angle goniometers
    - Surface energy calculators
---

# Contact Angle Analyzer

## Purpose

The Contact Angle Analyzer skill provides comprehensive wettability analysis for nanomaterial surfaces, enabling determination of surface energy components and characterization of hydrophobic/hydrophilic properties.

## Capabilities

- Static contact angle measurement
- Dynamic advancing/receding angles
- Surface energy calculation (Owens-Wendt, van Oss)
- Wilhelmy plate analysis
- Surface roughness correlation
- Superhydrophobic/superhydrophilic assessment

## Usage Guidelines

### Wettability Analysis

1. **Contact Angle Measurement**
   - Use consistent droplet volume (2-5 uL)
   - Allow equilibration before measurement
   - Report average of multiple measurements

2. **Surface Energy Calculation**
   - Use multiple probe liquids
   - Apply Owens-Wendt for dispersive/polar
   - Use van Oss for acid-base analysis

3. **Surface Classification**
   - Hydrophilic: theta < 90 degrees
   - Hydrophobic: theta > 90 degrees
   - Superhydrophobic: theta > 150 degrees

## Process Integration

- Nanomaterial Surface Functionalization Pipeline
- Thin Film Deposition Process Optimization

## Input Schema

```json
{
  "sample_id": "string",
  "probe_liquids": ["water", "diiodomethane", "formamide"],
  "measurement_type": "static|dynamic|wilhelmy",
  "surface_roughness": "number (nm, optional)"
}
```

## Output Schema

```json
{
  "contact_angles": [{
    "liquid": "string",
    "angle": "number (degrees)",
    "std_dev": "number"
  }],
  "surface_energy": {
    "total": "number (mJ/m2)",
    "dispersive": "number (mJ/m2)",
    "polar": "number (mJ/m2)"
  },
  "wettability_class": "string"
}
```
