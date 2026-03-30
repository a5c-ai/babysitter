---
name: cad-modeling
description: Expert skill for parametric 3D CAD model development with design intent and configuration management
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
    - SolidWorks
    - CATIA
    - Siemens NX
    - PTC Creo
    - Autodesk Inventor
---

# 3D CAD Modeling Skill

## Purpose

The 3D CAD Modeling skill provides expert capabilities for parametric 3D CAD model development with proper design intent, configuration management, and best practices for model quality and reusability.

## Capabilities

- SolidWorks, CATIA, NX, Creo workflow automation
- Parametric feature-based modeling best practices
- Assembly design and constraint management
- Design table and configuration creation
- Top-down and bottom-up assembly strategies
- Part family and library component creation
- Model validation and quality checking
- CAD data exchange and translation

## Usage Guidelines

### Part Modeling

#### Design Intent Capture

1. **Sketch Best Practices**
   - Fully constrain all sketches
   - Use construction geometry
   - Apply meaningful dimensions
   - Reference design features, not edges

2. **Feature Planning**
   ```
   Order of features:
   1. Primary form (base feature)
   2. Secondary forms
   3. Positioned features
   4. Detail features (rounds, chamfers)
   5. Reference geometry
   ```

3. **Parametric Relationships**
   - Link related dimensions
   - Use equations for complex relationships
   - Create global variables for key parameters
   - Document design equations

#### Feature Best Practices

| Feature Type | Best Practice |
|--------------|---------------|
| Extrude | Use mid-plane when symmetric |
| Revolve | Full 360 or symmetric angle |
| Sweep | Keep profile perpendicular to path |
| Loft | Match profile vertex count |
| Fillet | Apply late in feature tree |
| Pattern | Use linear/circular for regular arrays |

#### Model Quality

1. **Geometry Checks**
   - No self-intersecting geometry
   - Minimum wall thickness maintained
   - Draft analysis for molded parts
   - Undercut detection

2. **File Management**
   - Meaningful part names
   - Custom properties populated
   - Revision history maintained
   - Linked reference files documented

### Assembly Modeling

#### Assembly Strategies

1. **Bottom-Up Assembly**
   - Components modeled independently
   - Assembled using mates/constraints
   - Best for: Standard components, reusable parts

2. **Top-Down Assembly**
   - Layout sketch defines relationships
   - Parts reference assembly geometry
   - Best for: Highly integrated systems

3. **Hybrid Approach**
   - Combine strategies as appropriate
   - Use skeleton/layout for key interfaces
   - Independent modeling for standard parts

#### Mate/Constraint Best Practices

1. **Constraint Types**
   | Type | Use Case |
   |------|----------|
   | Coincident | Face-to-face contact |
   | Concentric | Shaft/hole alignment |
   | Distance | Offset positioning |
   | Angle | Angular relationship |
   | Tangent | Curved surface contact |

2. **Degree of Freedom**
   - Fully constrain or document remaining DOF
   - Use limit mates for motion range
   - Consider mechanism simulation needs

#### Large Assembly Management

1. **Performance Optimization**
   - Use lightweight/simplified representations
   - Create configurations for assembly states
   - Suppress unused components
   - Use envelope geometry for space claims

2. **Reference Management**
   - Minimize external references
   - Document all in-context relationships
   - Use published geometry when possible

### Configuration Management

1. **Part Configurations**
   - Variations: Sizes, materials, features
   - Design table for multiple configurations
   - Display states for visualization

2. **Assembly Configurations**
   - Bill of materials variations
   - Exploded views
   - Suppressed component states

## Process Integration

- ME-003: 3D CAD Model Development

## Input Schema

```json
{
  "part_type": "component|assembly|drawing",
  "design_requirements": {
    "function": "string",
    "envelope": {
      "length": "number (mm)",
      "width": "number (mm)",
      "height": "number (mm)"
    },
    "interfaces": "array of interface definitions",
    "material": "string"
  },
  "reference_geometry": "file path or description",
  "configurations_needed": "array of configuration names",
  "manufacturing_method": "machined|cast|molded|sheet_metal|additive"
}
```

## Output Schema

```json
{
  "model_info": {
    "file_path": "string",
    "file_format": "native|STEP|IGES",
    "revision": "string"
  },
  "geometry_summary": {
    "bounding_box": "object",
    "volume": "number (mm3)",
    "surface_area": "number (mm2)",
    "mass": "number (kg)"
  },
  "quality_check": {
    "fully_constrained": "boolean",
    "no_errors": "boolean",
    "rebuild_time": "number (s)"
  },
  "configurations": "array of config names",
  "custom_properties": "object"
}
```

## Best Practices

1. Plan feature order before modeling
2. Use symmetric features when design is symmetric
3. Avoid external references when possible
4. Create reusable part templates
5. Document design intent in model notes
6. Validate geometry before release

## Integration Points

- Connects with Requirements Flowdown for design inputs
- Feeds into GD&T Drawing for documentation
- Supports FEA Structural for analysis
- Integrates with DFM Review for manufacturability
