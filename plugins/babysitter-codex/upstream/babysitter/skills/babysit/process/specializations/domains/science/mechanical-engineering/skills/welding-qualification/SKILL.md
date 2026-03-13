---
name: welding-qualification
description: Skill for welding procedure development and qualification per AWS and ASME codes
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: mechanical-engineering
  domain: science
  category: manufacturing
  priority: high
  phase: 3
  tools-libraries:
    - AWS D1.1
    - ASME Section IX
    - Welding calculators
---

# Welding Procedure Qualification Skill

## Purpose

The Welding Procedure Qualification skill provides capabilities for developing and qualifying welding procedures per AWS and ASME codes, enabling compliant welding documentation and welder certification.

## Capabilities

- WPS (Welding Procedure Specification) development
- PQR (Procedure Qualification Record) documentation
- Essential variable identification and ranges
- Welder qualification requirements
- Filler metal and consumable selection
- Preheat and interpass temperature specification
- NDT requirement specification
- Code compliance verification (AWS D1.1, ASME IX)

## Usage Guidelines

### Welding Process Selection

#### Common Processes

| Process | Designation | Applications | Advantages |
|---------|-------------|--------------|------------|
| SMAW | Shielded Metal Arc | Structural, maintenance | Portable, versatile |
| GMAW | Gas Metal Arc (MIG) | Production, sheet metal | High deposition |
| GTAW | Gas Tungsten Arc (TIG) | Precision, root passes | High quality |
| FCAW | Flux Cored Arc | Structural, shipbuilding | High deposition |
| SAW | Submerged Arc | Heavy plate, pipe | Very high deposition |

#### Process Selection Criteria

```
Consider:
- Base metal type and thickness
- Joint configuration
- Position requirements
- Production volume
- Quality requirements
- Welder skill availability
- Equipment availability
```

### WPS Development

#### Essential Variables (ASME IX)

| Variable | Effect | Requalification |
|----------|--------|-----------------|
| Base metal P-number | Change requires new PQR | Yes |
| Filler metal F-number | Change requires new PQR | Yes |
| Thickness range | Outside qualified range | Yes |
| Position | Change from qualified | Yes |
| Preheat | Decrease below minimum | Yes |
| PWHT | Change in requirements | Yes |
| Electrical characteristics | Change in polarity | Yes |

#### WPS Content Requirements

```
1. Identification
   - WPS number
   - Revision
   - Supporting PQR(s)

2. Joint Design
   - Type (butt, fillet, etc.)
   - Groove angle
   - Root opening
   - Root face
   - Backing (if used)

3. Base Metal
   - Specification
   - P-number/Group
   - Thickness range

4. Filler Metal
   - Specification
   - F-number
   - A-number
   - Size range

5. Position
   - Qualified positions
   - Progression (vertical)

6. Preheat/Interpass
   - Minimum preheat
   - Maximum interpass

7. Welding Parameters
   - Current type/polarity
   - Amperage range
   - Voltage range
   - Travel speed range

8. Technique
   - String vs weave
   - Single vs multi-pass
   - Cleaning method

9. PWHT
   - Temperature range
   - Time at temperature
   - Heating/cooling rates
```

### PQR Documentation

#### Required Testing

| Test | Code Reference | Acceptance Criteria |
|------|----------------|---------------------|
| Tensile | ASME IX QW-150 | >= Base metal minimum |
| Bend | ASME IX QW-160 | No cracks > 3mm |
| Impact | ASME IX QW-170 | Per design code |
| Macro | ASME IX QW-183 | Fusion, no defects |

#### Test Specimen Requirements

```
Groove Welds:
- 2 tensile specimens
- 4 bend specimens (2 face, 2 root or 4 side)
- Impact specimens (if required)

Fillet Welds:
- Macro examination
- Fillet weld break test
```

### Welder Qualification

#### WPQ Requirements

```
Welder Performance Qualification:
- Based on qualified WPS
- Position-specific
- Thickness range qualified
- Process-specific
- Maintenance requirements (typically 6 months)
```

#### Position Qualification

| Test Position | Qualifies Positions |
|---------------|---------------------|
| 1G (flat) | 1G only |
| 2G (horizontal) | 1G, 2G |
| 3G (vertical) | 1G, 2G, 3G |
| 4G (overhead) | 1G, 4G |
| 3G + 4G | All groove positions |
| 6G (pipe, 45 degree) | All positions |

### Filler Metal Selection

#### AWS Classification System

```
E70XX (SMAW):
E = Electrode
70 = Tensile strength (70 ksi)
XX = Position and coating type

ER70S-X (GMAW/GTAW):
E = Electrode
R = Rod
70 = Tensile strength
S = Solid wire
X = Specific chemistry
```

#### Common Filler Metals

| Base Metal | SMAW | GMAW | GTAW |
|------------|------|------|------|
| Carbon steel | E7018 | ER70S-6 | ER70S-2 |
| Low alloy | E8018-B2 | ER80S-B2 | ER80S-B2 |
| Stainless 304 | E308L-16 | ER308L | ER308L |
| Stainless 316 | E316L-16 | ER316L | ER316L |
| Aluminum | - | ER4043 | ER4043 |

### Preheat and PWHT

#### Preheat Requirements

```
Factors affecting preheat:
- Carbon equivalent
- Base metal thickness
- Hydrogen content
- Restraint level
- Ambient temperature

Carbon Equivalent (IIW):
CE = C + Mn/6 + (Cr+Mo+V)/5 + (Ni+Cu)/15

CE > 0.45: Preheat required
```

#### PWHT Requirements

| Code | When Required | Typical Range |
|------|---------------|---------------|
| AWS D1.1 | Thick sections, certain alloys | 1100-1200 F |
| ASME VIII | Per UCS-56 | Material dependent |
| ASME B31.3 | Per Table 331.1.1 | Material dependent |

## Process Integration

- ME-020: Welding Procedure Qualification

## Input Schema

```json
{
  "base_metal": {
    "specification": "string",
    "p_number": "number",
    "thickness": "number (mm)"
  },
  "joint_design": {
    "type": "butt|fillet|corner|tee",
    "groove_type": "V|U|J|bevel",
    "position": "1G|2G|3G|4G|5G|6G"
  },
  "applicable_code": "AWS_D1.1|ASME_IX|ASME_B31.3",
  "quality_requirements": {
    "ndt_required": "array",
    "impact_required": "boolean",
    "design_temperature": "number (C)"
  }
}
```

## Output Schema

```json
{
  "wps_draft": {
    "wps_number": "string",
    "process": "string",
    "joint_design": "object",
    "filler_metal": "object",
    "parameters": "object",
    "preheat": "object",
    "pwht": "object"
  },
  "pqr_requirements": {
    "test_specimens": "array",
    "acceptance_criteria": "object",
    "test_laboratory": "string"
  },
  "welder_qualification": {
    "wpq_required": "boolean",
    "positions": "array",
    "essential_skills": "array"
  },
  "code_references": "array"
}
```

## Best Practices

1. Always work from the applicable code requirements
2. Document all essential variables completely
3. Maintain traceability of filler metal certifications
4. Keep welder qualifications current
5. Review WPS before production welding
6. Archive all qualification records

## Integration Points

- Connects with Material Selection for weldability
- Feeds into FAI Inspection for weld inspection
- Supports Design Review for joint details
- Integrates with Quality for procedure control
