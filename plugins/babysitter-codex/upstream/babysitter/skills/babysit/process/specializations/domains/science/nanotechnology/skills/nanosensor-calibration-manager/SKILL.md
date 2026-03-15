---
name: nanosensor-calibration-manager
description: Nanosensor characterization skill for calibration, sensitivity analysis, and selectivity validation
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
    - Sensor calibration software
    - Data analysis tools
---

# Nanosensor Calibration Manager

## Purpose

The Nanosensor Calibration Manager skill provides comprehensive characterization of nanomaterial-based sensors, enabling systematic calibration, sensitivity optimization, and selectivity validation for analytical applications.

## Capabilities

- Calibration curve generation
- Limit of detection (LOD) calculation
- Sensitivity and dynamic range analysis
- Selectivity and interference testing
- Response time characterization
- Long-term stability assessment

## Usage Guidelines

### Sensor Calibration

1. **Calibration Curve**
   - Prepare standard solutions
   - Measure sensor response
   - Fit calibration model

2. **Performance Metrics**
   - Calculate LOD (3 sigma method)
   - Determine linear range
   - Assess sensitivity (slope)

3. **Selectivity Testing**
   - Test interferents
   - Calculate selectivity coefficients
   - Validate in complex matrices

## Process Integration

- Nanosensor Development and Validation Pipeline

## Input Schema

```json
{
  "sensor_id": "string",
  "analyte": "string",
  "concentration_range": {"min": "number", "max": "number", "unit": "string"},
  "interferents": ["string"],
  "matrix": "buffer|serum|environmental"
}
```

## Output Schema

```json
{
  "calibration": {
    "equation": "string",
    "r_squared": "number",
    "linear_range": {"min": "number", "max": "number"}
  },
  "performance": {
    "lod": "number",
    "loq": "number",
    "sensitivity": "number",
    "response_time": "number (seconds)"
  },
  "selectivity": [{
    "interferent": "string",
    "selectivity_coefficient": "number"
  }]
}
```
