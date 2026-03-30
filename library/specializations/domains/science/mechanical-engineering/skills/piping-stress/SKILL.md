---
name: piping-stress
description: Skill for piping system stress analysis per ASME B31
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
    - CAESAR II
    - AutoPIPE
    - Bentley STAAD
---

# Piping Stress Analysis Skill

## Purpose

The Piping Stress Analysis skill provides capabilities for analyzing piping system stresses per ASME B31 codes, ensuring code compliance and equipment protection through proper flexibility analysis.

## Capabilities

- Piping flexibility analysis
- Thermal expansion stress calculation
- Support and restraint design
- Nozzle load verification
- Flange leakage assessment
- Code compliance verification (B31.1, B31.3)
- CAESAR II integration
- Piping isometric review

## Usage Guidelines

### ASME B31 Code Overview

#### Code Selection

| Code | Application |
|------|-------------|
| B31.1 | Power piping |
| B31.3 | Process piping |
| B31.4 | Liquid transportation |
| B31.5 | Refrigeration piping |
| B31.8 | Gas transmission |
| B31.9 | Building services |

#### Stress Categories

```
B31.3 Stress equations:

Sustained stress:
S_L = (P*D)/(4*t) + (0.75*i*M_A)/Z <= S_h

Expansion stress:
S_E = sqrt(S_b^2 + 4*S_t^2) <= S_A

Occasional stress:
S_L + S_occ <= k*S_h

Where:
P = pressure
D = outside diameter
t = wall thickness
i = stress intensification factor (SIF)
M_A = sustained moment
Z = section modulus
S_h = hot allowable stress
S_A = allowable stress range
k = occasional load factor
```

### Thermal Expansion Analysis

#### Thermal Movement

```
Linear expansion:
delta_L = alpha * L * (T2 - T1)

Where:
alpha = coefficient of thermal expansion
L = pipe length
T2 - T1 = temperature change

Typical alpha values (in/in/F):
Carbon steel: 6.5 x 10^-6
Stainless steel: 9.5 x 10^-6
Copper: 9.3 x 10^-6
```

#### Flexibility Analysis

```
Key principles:
1. Piping expands when heated
2. Expansion induces stress if restrained
3. Flexibility (bends, loops) reduces stress
4. Over-constrained systems have high stress
5. Under-constrained systems have excessive movement
```

### Stress Intensification Factors

#### Common SIF Values

| Component | i-factor (approx) |
|-----------|------------------|
| Straight pipe | 1.0 |
| Long radius elbow | 0.9/h^(2/3) |
| Short radius elbow | 0.75/h^(2/3) |
| Miter bend (1 cut) | 1.52/h^(5/6) |
| Welding tee | 0.9/h^(2/3) |
| Reinforced fabricated tee | Variable |
| Branch connection | Variable |

```
Flexibility characteristic:
h = t*R/(r^2)

Where:
t = wall thickness
R = bend radius
r = mean radius of pipe
```

### Support Design

#### Support Types

| Type | Restrains | Allows |
|------|-----------|--------|
| Rest (shoe) | Vertical down | Horizontal, vertical up |
| Guide | Lateral | Axial, vertical |
| Anchor | All directions | None |
| Rod hanger | Vertical | Horizontal |
| Spring hanger | Vertical (variable) | Horizontal |
| Constant hanger | Vertical (constant) | Horizontal |

#### Support Spacing

```
Suggested maximum spans (B31.1):

| Pipe Size | Water (ft) | Steam/Gas (ft) |
|-----------|------------|----------------|
| 1" | 7 | 9 |
| 2" | 10 | 13 |
| 4" | 14 | 17 |
| 6" | 17 | 21 |
| 8" | 19 | 24 |
| 12" | 23 | 30 |
```

### Nozzle Loads

#### Equipment Protection

```
Nozzle load limits:
- Equipment vendor provides allowables
- Common standards: API 610, API 617, NEMA SM23
- Consider sustained and thermal loads separately
- Combined loads may use interaction formula

Typical check:
sqrt((F_x^2 + F_y^2 + F_z^2)/(F_allow^2) +
     (M_x^2 + M_y^2 + M_z^2)/(M_allow^2)) <= 1.0
```

#### Load Combinations

```
Operating case:
W + P + T + D

Hydrotest case:
W + H + D

Where:
W = Weight
P = Pressure
T = Thermal
D = Displacement
H = Hydrotest pressure
```

### Flange Leakage

#### Assessment Methods

```
ASME B16.5 flange rating:
- Check P-T rating at operating conditions
- Include pressure equivalent from moments

Equivalent pressure method:
P_eq = P + (16*M)/(pi*G^3)

Where:
M = bending moment at flange
G = flange gasket diameter

NC(T)MF method:
Uses ASME VIII Appendix 2 calculations
More accurate for high moment cases
```

### Modeling Guidelines

#### Model Building

```
Key elements:
1. Include all pipe runs
2. Model equipment properly (rigid/flexible)
3. Define support locations accurately
4. Include all branch connections
5. Apply correct operating conditions
6. Model spring hangers if used
```

#### Operating Cases

| Case | Temperature | Pressure | Weight | Use |
|------|-------------|----------|--------|-----|
| Sustained | Ambient | Design | Full | Code check |
| Operating | Operating | Operating | Full | Equipment loads |
| Thermal | Operating-Ambient | None | None | Expansion stress |
| Hydrotest | Ambient | Test | Full + Water | Support design |

## Process Integration

- Related to structural analysis for piping systems

## Input Schema

```json
{
  "piping_system": {
    "line_number": "string",
    "code": "B31.1|B31.3",
    "material": "string",
    "size": "string (NPS)",
    "schedule": "string"
  },
  "operating_conditions": {
    "design_pressure": "number (psig)",
    "design_temperature": "number (F)",
    "operating_pressure": "number (psig)",
    "operating_temperature": "number (F)"
  },
  "geometry": {
    "isometric": "file reference",
    "length": "number (ft)",
    "elevation_change": "number (ft)"
  },
  "equipment_connections": [
    {
      "equipment": "string",
      "nozzle": "string",
      "allowable_loads": "object"
    }
  ]
}
```

## Output Schema

```json
{
  "stress_results": {
    "code_compliance": "pass|fail",
    "sustained_stress": {
      "max_value": "number (psi)",
      "allowable": "number (psi)",
      "location": "string",
      "ratio": "number"
    },
    "expansion_stress": {
      "max_value": "number (psi)",
      "allowable": "number (psi)",
      "location": "string",
      "ratio": "number"
    }
  },
  "nozzle_loads": [
    {
      "equipment": "string",
      "forces": "array [Fx, Fy, Fz]",
      "moments": "array [Mx, My, Mz]",
      "compliance": "pass|fail"
    }
  ],
  "support_schedule": [
    {
      "location": "string",
      "type": "string",
      "load": "number (lb)"
    }
  ],
  "thermal_movements": {
    "max_displacement": "number (in)",
    "location": "string"
  },
  "recommendations": "array"
}
```

## Best Practices

1. Start with proper piping layout for flexibility
2. Verify equipment nozzle allowables early
3. Include all weight loads (insulation, contents)
4. Model actual support conditions
5. Check flange ratings at all operating conditions
6. Document all assumptions and simplifications

## Integration Points

- Connects with Pressure Vessel Design for equipment interface
- Feeds into Support design for structural requirements
- Supports FAI Inspection for as-built verification
- Integrates with Design Review for approval
