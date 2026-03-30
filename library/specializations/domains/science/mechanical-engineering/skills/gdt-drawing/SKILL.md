---
name: gdt-drawing
description: Specialized skill for geometric dimensioning and tolerancing specification per ASME Y14.5 and ISO 1101
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: mechanical-engineering
  domain: science
  category: design-development
  priority: high
  phase: 1
  tools-libraries:
    - SolidWorks Drawings
    - CATIA Drafting
    - NX Drafting
    - CETOL 6 Sigma
    - 3DCS
---

# GD&T and Drawing Creation Skill

## Purpose

The GD&T and Drawing Creation skill provides specialized capabilities for geometric dimensioning and tolerancing specification per ASME Y14.5 and ISO 1101, enabling proper documentation of design intent for manufacturing.

## Capabilities

- ASME Y14.5-2018 interpretation and application
- Datum feature selection and reference frame establishment
- Geometric tolerance specification and symbol usage
- Tolerance stack-up analysis (worst-case and statistical)
- Drawing view creation and annotation
- Bill of materials generation
- Revision control and ECO documentation
- Drawing checker automation

## Usage Guidelines

### Datum Reference Frame

#### Datum Selection Principles

1. **Primary Datum (A)**
   - Establishes orientation
   - Contacts 3 points minimum
   - Usually largest/most stable surface

2. **Secondary Datum (B)**
   - Establishes rotation lock
   - Contacts 2 points minimum
   - Perpendicular to primary

3. **Tertiary Datum (C)**
   - Establishes location
   - Contacts 1 point minimum
   - Completes coordinate system

#### Datum Feature Selection

| Function | Recommended Datum Features |
|----------|---------------------------|
| Mounting surface | Primary: Mounting face |
| Shaft alignment | Primary: Axis (A-B pattern) |
| Hole pattern | Secondary/Tertiary: Pattern center |
| Symmetric part | Primary: Plane of symmetry |

### Geometric Tolerances

#### Form Controls

| Symbol | Control | Datum Required |
|--------|---------|----------------|
| Straightness | Line element deviation | No |
| Flatness | Surface deviation | No |
| Circularity | Cross-section deviation | No |
| Cylindricity | Combined circularity + straightness | No |

#### Orientation Controls

| Symbol | Control | Datum Required |
|--------|---------|----------------|
| Perpendicularity | 90 degrees to datum | Yes |
| Parallelism | Parallel to datum | Yes |
| Angularity | Specified angle to datum | Yes |

#### Location Controls

| Symbol | Control | Datum Required |
|--------|---------|----------------|
| Position | True position from datums | Yes |
| Concentricity | Axis coincidence | Yes |
| Symmetry | Median plane coincidence | Yes |

#### Runout Controls

| Symbol | Control | Datum Required |
|--------|---------|----------------|
| Circular runout | Single revolution check | Yes (axis) |
| Total runout | Full surface check | Yes (axis) |

#### Profile Controls

| Symbol | Control | Datum Required |
|--------|---------|----------------|
| Profile of a line | 2D outline control | Optional |
| Profile of a surface | 3D surface control | Optional |

### Tolerance Specification

#### Position Tolerance Formula

```
Position tolerance = 2 * sqrt((dx)^2 + (dy)^2)

Where:
dx = deviation in X from true position
dy = deviation in Y from true position
```

#### MMC/LMC Modifiers

| Modifier | Effect | Application |
|----------|--------|-------------|
| MMC (M) | Bonus tolerance as size departs | Assembly clearance |
| LMC (L) | Bonus at LMC | Wall thickness control |
| RFS | No bonus | Default per Y14.5-2018 |

#### Tolerance Zone Shapes

```
Cylindrical: Position of holes (diameter symbol)
Rectangular: Position of slots
Spherical: Ball location (S diameter symbol)
```

### Drawing Creation

#### View Selection

1. **Standard Views**
   - Front view: Most descriptive
   - Top/side views: As needed
   - Isometric: For orientation

2. **Section Views**
   - Full section: Internal features
   - Half section: Symmetric parts
   - Broken-out: Local detail

3. **Detail Views**
   - Small features requiring enlargement
   - Complex tolerancing areas

#### Annotation Standards

1. **Dimension Placement**
   - Dimension in most descriptive view
   - Group related dimensions
   - Avoid crossing dimension lines
   - Reference features, not edges

2. **Notes**
   - General notes for common requirements
   - Local notes for specific features
   - Material and finish callouts

## Process Integration

- ME-004: GD&T Specification and Drawing Creation

## Input Schema

```json
{
  "part_model": "CAD file reference",
  "functional_requirements": {
    "assembly_interfaces": "array",
    "critical_features": "array",
    "fit_requirements": "clearance|transition|interference"
  },
  "manufacturing_method": "machined|cast|molded|sheet_metal",
  "inspection_method": "CMM|optical|manual",
  "standard": "ASME_Y14.5|ISO_1101"
}
```

## Output Schema

```json
{
  "drawing_info": {
    "drawing_number": "string",
    "revision": "string",
    "sheet_count": "number"
  },
  "datum_reference_frame": {
    "primary": "string",
    "secondary": "string",
    "tertiary": "string"
  },
  "geometric_tolerances": [
    {
      "feature": "string",
      "tolerance_type": "string",
      "value": "number (mm)",
      "datums": "string",
      "modifiers": "string"
    }
  ],
  "critical_dimensions": "array",
  "bom": "array of components"
}
```

## Best Practices

1. Select datums that reflect assembly function
2. Apply tolerances based on functional requirements
3. Use MMC where assembly fit is primary concern
4. Document datum feature simulators
5. Verify tolerance stack-ups for critical fits
6. Include inspection notes for complex features

## Integration Points

- Connects with CAD Modeling for geometry
- Feeds into Tolerance Stack-Up for analysis
- Supports FAI Inspection for verification
- Integrates with Manufacturing for process capability
