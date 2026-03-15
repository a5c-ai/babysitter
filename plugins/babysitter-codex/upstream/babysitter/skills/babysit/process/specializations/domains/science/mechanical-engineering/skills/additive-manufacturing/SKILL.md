---
name: additive-manufacturing
description: Skill for additive manufacturing process selection, design optimization, and build preparation
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
    - Materialise Magics
    - Netfabb
    - nTopology
    - Autodesk Fusion 360
---

# Additive Manufacturing Skill

## Purpose

The Additive Manufacturing skill provides capabilities for AM process selection, design optimization, and build preparation, enabling effective use of additive technologies for prototyping and production applications.

## Capabilities

- AM technology selection (SLS, DMLS, FDM, SLA)
- Design for additive manufacturing (DfAM)
- Build orientation optimization
- Support structure design and minimization
- Part nesting and build volume optimization
- Post-processing procedure specification
- Surface finish and tolerance expectations
- AM-specific material properties and considerations

## Usage Guidelines

### Technology Selection

#### Metal AM Processes

| Process | Materials | Resolution | Applications |
|---------|-----------|------------|--------------|
| DMLS/SLM | Ti, Al, Steel, Inconel | 30-50 um layer | Aerospace, medical |
| EBM | Ti, CoCr | 50-100 um layer | Orthopedic implants |
| DED | Most metals | 250+ um | Large parts, repair |
| Binder Jet | Steel, bronze | 80-100 um | Tooling, high volume |

#### Polymer AM Processes

| Process | Materials | Resolution | Applications |
|---------|-----------|------------|--------------|
| SLS | Nylon, TPU | 100-150 um | Functional prototypes |
| SLA/DLP | Photopolymers | 25-100 um | High detail, patterns |
| FDM | ABS, PLA, PC, PEEK | 100-300 um | Prototypes, tooling |
| MJF | Nylon | 80 um | Production parts |

### Design for Additive Manufacturing

#### Self-Supporting Angles

```
Minimum self-supporting angle:
- Metal (DMLS): 45 degrees from horizontal
- Polymer (SLS): 0 degrees (self-supporting)
- FDM: 45 degrees (with support)
- SLA: 30-45 degrees

Overhang rule:
- Unsupported distance < 2 mm (metal)
- Unsupported distance < 5 mm (polymer)
```

#### Minimum Feature Sizes

| Process | Min Wall | Min Hole | Min Detail |
|---------|----------|----------|------------|
| DMLS | 0.4 mm | 0.5 mm | 0.2 mm |
| SLS | 0.7 mm | 1.0 mm | 0.3 mm |
| SLA | 0.5 mm | 0.5 mm | 0.1 mm |
| FDM | 0.8 mm | 2.0 mm | 0.5 mm |

#### Design Optimization

1. **Topology Optimization**
   - Define design space
   - Apply loads and constraints
   - Set mass reduction target
   - Interpret and refine results

2. **Lattice Structures**
   | Type | Relative Density | Application |
   |------|-----------------|-------------|
   | Octet truss | 10-40% | High stiffness |
   | Diamond | 15-35% | Isotropic |
   | Gyroid | 10-50% | Bone ingrowth |
   | Honeycomb | 20-50% | Directional load |

3. **Part Consolidation**
   - Identify assembly candidates
   - Evaluate function integration
   - Consider serviceability
   - Calculate cost/benefit

### Build Preparation

#### Orientation Selection

```
Optimization criteria:
1. Minimize support volume
2. Optimize surface finish on critical surfaces
3. Reduce build height (time)
4. Ensure feature accuracy

Trade-off example:
- Flat orientation: Less support, rougher top surface
- Angled orientation: More support, better detail
```

#### Support Design

1. **Support Types**
   | Type | Application | Removal |
   |------|-------------|---------|
   | Block | Large overhangs | Manual/machining |
   | Tree | Complex geometry | Manual |
   | Lattice | Heat dissipation | Manual |
   | Cone | Point supports | Manual |

2. **Support Minimization**
   - Reorient part
   - Add self-supporting chamfers
   - Split and assemble
   - Modify geometry if allowed

#### Nesting and Packing

```
Minimum spacing:
- DMLS: 2-5 mm between parts
- SLS: 2-3 mm (powder acts as support)
- FDM: N/A (single part builds)
- SLA: 2-3 mm

Packing efficiency target: 5-15% of build volume
```

### Post-Processing

#### Metal AM

1. **Required**
   - Stress relief (before removal)
   - Support removal
   - Heat treatment (as specified)

2. **Optional**
   - Machining critical surfaces
   - Shot peening
   - Polishing/finishing
   - HIP (for porosity closure)

#### Polymer AM

1. **SLS/MJF**
   - Depowder and clean
   - Dye or paint (optional)
   - Sealing (if required)

2. **SLA/DLP**
   - Wash (IPA or solvent)
   - UV post-cure
   - Support removal
   - Sanding/finishing

## Process Integration

- ME-019: Additive Manufacturing Process Development

## Input Schema

```json
{
  "part_model": "CAD file reference",
  "material_requirement": {
    "type": "metal|polymer",
    "specific": "string (e.g., Ti6Al4V, Nylon 12)",
    "properties": "strength|stiffness|temperature|biocompatible"
  },
  "quantity": "number",
  "quality_requirements": {
    "tolerance": "number (mm)",
    "surface_finish": "string",
    "critical_features": "array"
  },
  "timeline": "prototype|production",
  "budget_constraint": "number (optional)"
}
```

## Output Schema

```json
{
  "process_recommendation": {
    "technology": "string",
    "material": "string",
    "machine": "string (if specific)"
  },
  "build_preparation": {
    "orientation": "description and rationale",
    "support_volume": "number (cm3)",
    "build_time": "number (hours)",
    "material_usage": "number (kg)"
  },
  "dfam_recommendations": [
    {
      "feature": "string",
      "issue": "string",
      "recommendation": "string"
    }
  ],
  "post_processing": "array of steps",
  "cost_estimate": {
    "material": "number",
    "machine_time": "number",
    "post_processing": "number",
    "total": "number"
  }
}
```

## Best Practices

1. Design for AM from the start, not as afterthought
2. Understand process limitations before design
3. Optimize orientation for quality, not just time
4. Plan for post-processing in design stage
5. Validate material properties for application
6. Consider total cost including post-processing

## Integration Points

- Connects with CAD Modeling for geometry
- Feeds into Material Testing for property validation
- Supports DFM Review for manufacturability
- Integrates with FAI Inspection for quality
