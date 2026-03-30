---
name: thermal-analysis
description: Skill for thermal characterization workflows including DSC, TGA, DTA, TMA, and DMA for phase transitions, decomposition, and viscoelastic property analysis
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: materials-science
  domain: science
  category: materials-characterization
  priority: high
  phase: 6
  tools-libraries:
    - TA Universal Analysis
    - Netzsch Proteus
    - STARe Software
    - TRIOS
---

# Thermal Analysis Skill

## Purpose

The Thermal Analysis skill provides comprehensive thermal characterization workflows for materials science applications, enabling systematic analysis of phase transitions, thermal stability, decomposition kinetics, and viscoelastic properties through DSC, TGA, DTA, TMA, and DMA techniques.

## Capabilities

- DSC baseline correction and peak integration
- Glass transition temperature (Tg) determination
- Crystallization and melting enthalpy calculation
- TGA decomposition kinetics analysis (Kissinger, FWO methods)
- DTA phase transformation identification
- TMA expansion coefficient calculation
- DMA viscoelastic property extraction (E', E'', tan delta)
- Multi-heating rate kinetic analysis

## Usage Guidelines

### Differential Scanning Calorimetry (DSC)

1. **Baseline Correction**
   - Select appropriate baseline type (linear, sigmoidal, spline)
   - Define integration limits for peak area calculation
   - Apply correction for instrument drift

2. **Glass Transition Analysis**
   - Use midpoint, onset, or inflection method consistently
   - Report heating rate used for measurement
   - Note fictive temperature for aging studies

3. **Enthalpy Calculation**
   - Integrate peak area with proper baseline
   - Apply calibration constant from standards
   - Report uncertainty based on baseline selection

### Thermogravimetric Analysis (TGA)

1. **Decomposition Analysis**
   - Identify mass loss steps and temperatures
   - Calculate derivative curves (DTG) for step resolution
   - Correlate with evolved gas analysis if available

2. **Kinetic Analysis**
   - Apply isoconversional methods (Kissinger, FWO, KAS)
   - Use multiple heating rates (5, 10, 20 K/min minimum)
   - Report activation energy with confidence intervals

### Dynamic Mechanical Analysis (DMA)

1. **Viscoelastic Properties**
   - Extract storage modulus (E'), loss modulus (E'')
   - Calculate loss tangent (tan delta)
   - Identify glass transition from tan delta peak or E' onset

2. **Frequency Dependence**
   - Perform temperature-frequency sweeps
   - Apply time-temperature superposition
   - Generate master curves for long-term prediction

## Process Integration

- MS-004: Thermal Analysis Protocol (all phases)
- MS-003: Spectroscopic Analysis Suite (thermal-spectroscopy correlation)

## Input Schema

```json
{
  "sample_id": "string",
  "technique": "DSC|TGA|DTA|TMA|DMA",
  "temperature_range": {
    "start": "number (C)",
    "end": "number (C)"
  },
  "heating_rate": "number (K/min) or array",
  "atmosphere": "nitrogen|air|argon|oxygen",
  "analysis_type": "transition|kinetics|modulus|expansion"
}
```

## Output Schema

```json
{
  "sample_id": "string",
  "technique": "string",
  "results": {
    "transitions": [
      {
        "type": "Tg|Tm|Tc|Td",
        "temperature": "number (C)",
        "enthalpy": "number (J/g)",
        "method": "string"
      }
    ],
    "kinetics": {
      "activation_energy": "number (kJ/mol)",
      "pre_exponential": "number",
      "method": "string"
    },
    "mechanical": {
      "storage_modulus": "number (Pa)",
      "loss_modulus": "number (Pa)",
      "tan_delta_peak": "number (C)"
    }
  }
}
```

## Best Practices

1. Calibrate with certified standards (indium, sapphire) before measurements
2. Use consistent sample mass and pan type within a study
3. Report all experimental parameters for reproducibility
4. Apply appropriate baseline corrections before integration
5. Use multiple heating rates for kinetic reliability
6. Consider thermal lag at high heating rates

## Integration Points

- Connects with Spectroscopy Analysis for coupled TGA-FTIR/MS
- Feeds into Polymer Characterization for comprehensive analysis
- Supports Mechanical Testing for property correlation
- Integrates with Materials Database for data archival
