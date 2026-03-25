---
name: nanocatalyst-performance-analyzer
description: Nanocatalysis skill for evaluating catalytic activity, selectivity, and stability of nanomaterial catalysts
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
  priority: medium
  phase: 6
  tools-libraries:
    - Reaction kinetics analyzers
    - BET surface area tools
---

# Nanocatalyst Performance Analyzer

## Purpose

The Nanocatalyst Performance Analyzer skill provides comprehensive evaluation of nanomaterial catalyst performance, enabling systematic assessment of activity, selectivity, and stability for catalytic applications.

## Capabilities

- Turnover frequency (TOF) calculation
- Selectivity analysis
- Activation energy determination
- Stability and recyclability testing
- Surface area normalization (BET)
- Reaction mechanism investigation

## Usage Guidelines

### Catalyst Evaluation

1. **Activity Assessment**
   - Measure conversion vs time
   - Calculate TOF
   - Normalize to surface area

2. **Selectivity Analysis**
   - Identify products
   - Calculate selectivities
   - Map reaction pathways

3. **Stability Testing**
   - Run recyclability tests
   - Monitor deactivation
   - Characterize spent catalyst

## Process Integration

- Nanocatalyst Development and Performance Optimization

## Input Schema

```json
{
  "catalyst_id": "string",
  "reaction": "string",
  "reactants": [{"name": "string", "concentration": "number"}],
  "temperature": "number (C)",
  "pressure": "number (atm)",
  "catalyst_mass": "number (mg)"
}
```

## Output Schema

```json
{
  "activity": {
    "conversion": "number (%)",
    "tof": "number (1/s)",
    "specific_activity": "number (mol/g/s)"
  },
  "selectivity": [{
    "product": "string",
    "selectivity": "number (%)"
  }],
  "kinetics": {
    "activation_energy": "number (kJ/mol)",
    "rate_law": "string"
  },
  "stability": {
    "cycles_tested": "number",
    "activity_retention": "number (%)"
  }
}
```
