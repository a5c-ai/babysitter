---
name: pressure-vessel
description: Skill for pressure vessel design and analysis per ASME BPVC
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: mechanical-engineering
  domain: science
  category: structural-analysis
  priority: medium
  phase: 5
  tools-libraries:
    - COMPRESS
    - PVElite
    - ANSYS
    - ASME BPVC
---

# Pressure Vessel Design Skill

## Purpose

The Pressure Vessel Design skill provides capabilities for designing and analyzing pressure vessels per ASME Boiler and Pressure Vessel Code, ensuring code compliance and safe operation.

## Capabilities

- ASME Section VIII Division 1/2 compliance
- Shell and head thickness calculations
- Nozzle reinforcement analysis
- Flange rating and selection
- Hydrostatic test specification
- MDMT (Minimum Design Metal Temperature) determination
- Stress classification and evaluation
- U-stamp documentation support

## Usage Guidelines

### ASME Section VIII Overview

#### Division Comparison

| Aspect | Division 1 | Division 2 |
|--------|------------|------------|
| Design basis | Design-by-rule | Design-by-analysis |
| Allowable stress | Lower | Higher |
| Safety factor | 3.5 (UTS) | 2.4 (UTS) |
| Analysis required | Limited | Detailed FEA |
| Typical application | General service | High pressure, critical |

### Shell and Head Design

#### Cylindrical Shell (Division 1)

```
Internal pressure:
t = (P * R) / (S * E - 0.6 * P)

External pressure:
t = iterative based on L/D_o and D_o/t

Where:
t = required thickness
P = design pressure
R = inside radius
S = allowable stress
E = joint efficiency
```

#### Head Types

| Type | Stress Ratio | Application |
|------|--------------|-------------|
| Hemispherical | 0.5 | High pressure |
| 2:1 Elliptical | 1.0 | General purpose |
| Torispherical | 1.77 | Low pressure |
| Flat | Variable | Limited pressure |
| Conical | Variable | Transitions |

#### 2:1 Elliptical Head

```
t = (P * D) / (2 * S * E - 0.2 * P)

Where:
D = inside diameter
S = allowable stress
E = joint efficiency
```

### Nozzle Reinforcement

#### Area Replacement Method

```
Required reinforcement area:
A = d * t_r * F

Where:
d = finished nozzle diameter
t_r = required shell thickness
F = correction factor for plane

Available area from:
- Excess shell thickness (A1)
- Excess nozzle thickness (A2)
- Reinforcing pad (A3)
- Weld area (A4, A5)

Criterion: A1 + A2 + A3 + A4 + A5 >= A
```

#### Reinforcement Limits

```
Horizontal limit: d or R + t_n + t
Vertical limit (shell): d or R + t_n + t
Vertical limit (nozzle): 2.5 * t_n or 2.5 * t + t_e
```

### Flange Design

#### Flange Types

| Type | Rating | Application |
|------|--------|-------------|
| Slip-on | 150-600 lb | General, lower pressure |
| Weld neck | 150-2500 lb | High pressure, critical |
| Socket weld | 150-600 lb | Small bore |
| Blind | 150-2500 lb | Closures |
| Lap joint | 150-600 lb | Corrosive service |

#### Flange Rating

```
ASME B16.5 pressure-temperature ratings:
- Class 150, 300, 600, 900, 1500, 2500

Select class where:
P_design <= P_rating at T_design
```

### MDMT Determination

#### Impact Test Exemption

```
Impact test required if:
T_design < MDMT

MDMT determination:
1. Base MDMT from UCS-66 curves
2. Adjust for actual stress ratio
3. Consider coincident ratio
4. Apply Table UCS-66.1 reduction

Stress ratio reduction:
MDMT_adjusted = MDMT - temperature credit
```

#### Impact Test Requirements

```
If impact testing required:
- Test temperature <= MDMT - 30 F (typical)
- Minimum energy: 15 ft-lb (full size Charpy)
- Average of 3 specimens
- Single specimen minimum: 10 ft-lb
```

### Hydrostatic Test

#### Test Pressure

```
Division 1:
P_test = 1.3 * MAWP * (S_test / S_design)

Division 2:
P_test = 1.43 * MAWP * (S_test / S_design)

Where:
MAWP = Maximum Allowable Working Pressure
S_test = allowable stress at test temperature
S_design = allowable stress at design temperature
```

#### Test Procedure

```
1. Fill vessel completely with water
2. Remove all air pockets
3. Apply test pressure slowly
4. Hold for minimum 10 minutes
5. Reduce to MAWP for inspection
6. Inspect all welds and connections
7. Document results
```

### Stress Classification (Division 2)

#### Stress Categories

| Category | Symbol | Limit |
|----------|--------|-------|
| General membrane | Pm | S |
| Local membrane | PL | 1.5S |
| Bending | Pb | 1.5S |
| Secondary | Q | 3S |
| Peak | F | Fatigue analysis |

#### Stress Combinations

```
Primary stress:
Pm <= S
PL <= 1.5S
PL + Pb <= 1.5S

Primary + Secondary:
PL + Pb + Q <= 3S

Fatigue:
Use peak stress F in fatigue curves
```

### Code Compliance Documentation

#### U-1 Data Report

```
Required information:
- Manufacturer identification
- Vessel description and design data
- Material specifications
- Joint efficiencies
- Inspection data
- Test data
- Stamping information
```

## Process Integration

- Related to structural analysis processes for pressure equipment

## Input Schema

```json
{
  "vessel_type": "pressure|vacuum|combined",
  "design_conditions": {
    "pressure": "number (psig or barg)",
    "temperature": "number (F or C)",
    "MDMT": "number (F or C)"
  },
  "geometry": {
    "diameter": "number",
    "length": "number",
    "head_type": "elliptical|hemispherical|torispherical|flat"
  },
  "material": {
    "shell": "string (SA-XXX)",
    "heads": "string",
    "nozzles": "string"
  },
  "code_edition": "string",
  "division": "1|2"
}
```

## Output Schema

```json
{
  "design_summary": {
    "MAWP": "number",
    "required_thicknesses": {
      "shell": "number",
      "heads": "number"
    },
    "selected_thicknesses": "object"
  },
  "nozzle_schedule": [
    {
      "size": "string",
      "purpose": "string",
      "reinforcement": "object"
    }
  ],
  "MDMT_evaluation": {
    "MDMT": "number",
    "impact_test_required": "boolean"
  },
  "hydrostatic_test": {
    "test_pressure": "number",
    "test_procedure": "string"
  },
  "code_compliance": {
    "paragraph_references": "array",
    "calculation_summary": "object"
  },
  "drawings_required": "array"
}
```

## Best Practices

1. Always use current code edition
2. Verify material availability and certification
3. Consider corrosion allowance
4. Check MDMT early in design
5. Coordinate with authorized inspector
6. Document all design decisions

## Integration Points

- Connects with Material Selection for appropriate materials
- Feeds into FEA Structural for Division 2 analysis
- Supports Welding Qualification for weld procedures
- Integrates with FAI Inspection for verification
