---
name: material-testing
description: Skill for planning and specifying mechanical material tests per ASTM standards
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: mechanical-engineering
  domain: science
  category: materials-testing
  priority: medium
  phase: 8
  tools-libraries:
    - Instron
    - MTS
    - Universal testing machines
    - ASTM standards
---

# Material Testing Planning Skill

## Purpose

The Material Testing Planning skill provides capabilities for planning and specifying mechanical material tests per ASTM standards, enabling proper test specimen design, test matrix development, and data analysis for property determination.

## Capabilities

- Tensile testing specification (ASTM E8)
- Hardness testing methods (Rockwell, Brinell, Vickers)
- Impact testing (Charpy, Izod) per ASTM E23
- Fatigue testing (ASTM E466, E606)
- Test specimen design and preparation
- Test matrix development and optimization
- Data analysis and property determination
- Test report generation

## Usage Guidelines

### Tensile Testing (ASTM E8/E8M)

#### Specimen Design

1. **Standard Specimens**
   | Type | Gauge Length | Gauge Width | Application |
   |------|--------------|-------------|-------------|
   | Sheet (flat) | 50 mm | 12.5 mm | Sheet/plate < 6 mm |
   | Round | 50 mm | 12.5 mm dia | Bar/rod stock |
   | Subsize | 25 mm | 6 mm | Limited material |

2. **Specimen Preparation**
   - Machine finish on gauge section
   - Radius transitions per standard
   - Measure dimensions before test
   - Mark gauge length

#### Test Parameters

```
Strain rate: 0.015 mm/mm/min (yield)
            0.05-0.5 mm/mm/min (ultimate)
Temperature: Ambient (23 +/- 5 C) or specified
Extensometer: Class B-1 or better
```

#### Properties Determined

- Yield strength (0.2% offset method)
- Ultimate tensile strength
- Elongation at fracture
- Reduction of area
- Young's modulus

### Hardness Testing

#### Test Methods

| Method | Scale | Load | Application |
|--------|-------|------|-------------|
| Rockwell B | HRB | 100 kgf | Soft steel, copper |
| Rockwell C | HRC | 150 kgf | Hardened steel |
| Brinell | HB | 3000 kgf | Castings, forgings |
| Vickers | HV | 1-120 kgf | All materials |
| Knoop | HK | 10-1000 gf | Thin sections, coatings |

#### Test Considerations

1. **Surface Preparation**
   - Clean, flat surface
   - Minimum surface roughness
   - No decarburization

2. **Spacing Requirements**
   ```
   Minimum indent spacing: 3 x indent diameter
   Minimum edge distance: 2.5 x indent diameter
   Minimum thickness: 10 x indent depth
   ```

### Impact Testing (ASTM E23)

#### Charpy V-Notch

1. **Specimen Dimensions**
   ```
   Standard: 10 x 10 x 55 mm
   Subsize: 10 x 7.5/5/2.5 x 55 mm
   Notch: 45 degree V, 2 mm deep, 0.25 mm radius
   ```

2. **Test Temperature**
   - Room temperature
   - Transition curve (multiple temperatures)
   - Minimum design metal temperature

3. **Properties Determined**
   - Absorbed energy (Joules)
   - Lateral expansion (mm)
   - Percent shear fracture

### Fatigue Testing

#### High-Cycle Fatigue (ASTM E466)

1. **Test Types**
   - Rotating beam (R = -1)
   - Axial load (R = 0, R = -1, R = 0.1)
   - Strain-controlled (low cycle)

2. **S-N Curve Development**
   ```
   Minimum 12-15 specimens for S-N curve
   3 stress levels minimum
   Runout at 10^6 or 10^7 cycles
   ```

#### Strain-Controlled Fatigue (ASTM E606)

1. **Specimen Design**
   - Uniform gauge section
   - Anti-buckling for compression
   - Precise alignment

2. **Test Parameters**
   - Strain amplitude range
   - Strain rate
   - Mean strain (if applicable)

### Test Matrix Development

#### Statistical Considerations

| Purpose | Minimum Tests | Basis |
|---------|---------------|-------|
| Typical properties | 3 | Average |
| Design allowables (A-basis) | 100+ | 99%/95% confidence |
| Design allowables (B-basis) | 30+ | 90%/95% confidence |
| S-basis | 1 | Specification minimum |

#### Test Matrix Template

```
Material: ____________
Specification: ____________
Heat/Lot: ____________

| Test Type | Orientation | Temperature | Specimens | Standard |
|-----------|-------------|-------------|-----------|----------|
| Tensile   | L           | RT          | 3         | ASTM E8  |
| Tensile   | T           | RT          | 3         | ASTM E8  |
| Hardness  | Surface     | RT          | 5 loc     | ASTM E18 |
| Impact    | L-T         | -40 C       | 3         | ASTM E23 |
```

## Process Integration

- ME-015: Material Testing and Characterization

## Input Schema

```json
{
  "material": {
    "name": "string",
    "specification": "string",
    "heat_lot": "string",
    "form": "plate|bar|forging|casting"
  },
  "test_requirements": {
    "tensile": "boolean",
    "hardness": "boolean",
    "impact": "boolean",
    "fatigue": "boolean"
  },
  "orientations": ["L", "T", "S"],
  "temperatures": "array (C)",
  "basis": "typical|A-basis|B-basis|S-basis",
  "applicable_standards": "array"
}
```

## Output Schema

```json
{
  "test_plan": {
    "test_matrix": "array of test specifications",
    "specimen_drawings": "array of references",
    "total_specimens": "number",
    "estimated_material": "number (kg)"
  },
  "specimen_requirements": {
    "dimensions": "object",
    "quantity": "number",
    "preparation_notes": "string"
  },
  "test_procedures": "array of procedure references",
  "data_analysis_plan": {
    "properties_to_calculate": "array",
    "statistical_methods": "array"
  }
}
```

## Best Practices

1. Follow applicable ASTM standards exactly
2. Document specimen location and orientation
3. Calibrate equipment per standard requirements
4. Control test environment (temperature, humidity)
5. Maintain chain of custody for specimens
6. Archive raw data and specimens per requirements

## Integration Points

- Connects with Material Selection for property validation
- Feeds into Failure Analysis for reference data
- Supports Test Correlation for model validation
- Integrates with Quality for material certification
