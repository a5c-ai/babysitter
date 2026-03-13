---
name: metallurgical-analysis
description: Specialized skill for metallic materials analysis and metallography including grain size measurement, phase quantification, and inclusion rating
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
    - ImageJ
    - Clemex
    - ASTM E112
    - ASTM E45
---

# Metallurgical Analysis Skill

## Purpose

The Metallurgical Analysis skill provides specialized capabilities for characterizing metallic materials through metallographic techniques, enabling systematic evaluation of microstructure, grain size, phase distribution, and inclusion content per industry standards.

## Capabilities

- Metallographic preparation protocol selection
- Etching reagent selection for different alloys
- Grain size measurement (ASTM E112, intercept method)
- Phase fraction quantification (point count, image analysis)
- Inclusion rating (ASTM E45)
- Banding and segregation assessment
- Prior austenite grain boundary revelation
- Weld microstructure evaluation (HAZ mapping)

## Usage Guidelines

### Sample Preparation

1. **Sectioning**
   - Select appropriate cutting method (abrasive, EDM, precision saw)
   - Minimize heat input to prevent microstructural changes
   - Identify orientation relative to processing direction

2. **Mounting**
   - Choose mount type (hot compression, cold setting)
   - Add conductive filler for SEM/EBSD samples
   - Consider edge retention requirements

3. **Grinding and Polishing**
   - Follow systematic grit progression (120 to 1200 to diamond)
   - Use appropriate lubricant and rotation direction
   - Verify scratch-free surface before etching

### Etching Selection

| Alloy System | Etchant | Purpose |
|--------------|---------|---------|
| Carbon steels | 2% Nital | General microstructure |
| Stainless steel | Vilella's | Martensitic structures |
| Aluminum | Keller's | Grain boundaries, precipitates |
| Titanium | Kroll's | Alpha-beta microstructure |
| Copper | FeCl3/HCl | Grain boundaries |
| Nickel superalloys | Glyceregia | Gamma prime, carbides |

### Grain Size Measurement

1. **ASTM E112 Methods**
   - Comparison method: Match to standard charts
   - Planimetric method: Count grains in known area
   - Intercept method: Count grain boundary intersections

2. **Calculation**
   - Apply magnification correction
   - Use minimum 5 fields for statistical validity
   - Report ASTM grain size number with standard deviation

3. **Special Cases**
   - Duplex structures: Report both phases separately
   - Elongated grains: Measure aspect ratio
   - Prior austenite: Use specific etchants (picric acid based)

### Inclusion Rating (ASTM E45)

1. **Method Selection**
   - Method A: Worst field rating
   - Method D: Quantitative measurement
   - Specify inclusion type (A, B, C, D sulfides, oxides)

2. **Reporting**
   - Include severity (thin, heavy) and length
   - Note distribution (random, stringer, cluster)
   - Compare to specification limits

## Process Integration

- MS-002: Electron Microscopy Characterization
- MS-017: Root Cause Failure Analysis

## Input Schema

```json
{
  "sample_id": "string",
  "alloy_system": "steel|aluminum|titanium|copper|nickel",
  "alloy_grade": "string",
  "analysis_type": "grain_size|phase_fraction|inclusion|weld_eval",
  "magnification": "number",
  "etchant_used": "string"
}
```

## Output Schema

```json
{
  "sample_id": "string",
  "grain_size": {
    "astm_number": "number",
    "average_diameter": "number (microns)",
    "standard_deviation": "number",
    "method": "string"
  },
  "phase_fractions": [
    {
      "phase": "string",
      "fraction": "number (percent)",
      "morphology": "string"
    }
  ],
  "inclusion_rating": {
    "method": "string",
    "type_a": "number",
    "type_b": "number",
    "type_c": "number",
    "type_d": "number"
  },
  "observations": "string"
}
```

## Best Practices

1. Document complete preparation procedure for reproducibility
2. Use consistent magnification within a comparative study
3. Apply appropriate etching time - under-etched is better than over-etched
4. Verify grain boundaries are fully revealed before measurement
5. Use image analysis software for quantitative phase measurements
6. Include representative micrographs in reports

## Integration Points

- Connects with Electron Microscopy for high-resolution analysis
- Feeds into Failure Analysis for metallographic investigation
- Supports Mechanical Testing for structure-property correlation
- Integrates with Heat Treatment Optimization for process development
