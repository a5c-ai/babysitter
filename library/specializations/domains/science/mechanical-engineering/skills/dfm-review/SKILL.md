---
name: dfm-review
description: Skill for design for manufacturing review and optimization
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
  priority: medium
  phase: 7
  tools-libraries:
    - CAD systems
    - Manufacturing databases
    - Cost estimation tools
---

# DFM Review Skill

## Purpose

The DFM Review skill provides capabilities for systematic design for manufacturing review and optimization, enabling cost-effective and producible mechanical designs.

## Capabilities

- Manufacturability assessment
- Process selection guidance
- Tooling feasibility analysis
- Cost driver identification
- Design modification recommendations
- Tolerance and surface finish review
- Material availability assessment
- Supplier capability consideration

## Usage Guidelines

### DFM Principles

#### Core DFM Guidelines

```
1. Minimize part count
2. Use standard components
3. Design for ease of fabrication
4. Design for ease of assembly
5. Design for ease of service
6. Consider process capabilities
7. Minimize secondary operations
```

#### Process-Specific Guidelines

| Process | Key DFM Considerations |
|---------|----------------------|
| Machining | Access, fixturing, tool reach |
| Casting | Draft, wall thickness, gates/risers |
| Injection molding | Draft, undercuts, sink marks |
| Sheet metal | Bend radius, hole-to-edge, grain |
| Welding | Access, joint design, distortion |
| Assembly | Part orientation, fastener access |

### Machining DFM

#### Feature Guidelines

```
Holes:
- Standard drill sizes preferred
- L/D ratio < 5 for drills
- Flat bottoms require end mill
- Provide drill point clearance

Pockets:
- Corner radius = tool radius
- Max depth < 4x tool diameter
- Provide tool access

Threads:
- Standard thread sizes
- Depth 1.5-2x diameter sufficient
- Provide thread relief

Wall thickness:
- Minimum 1-2 mm for steel
- Consider deflection during machining
```

#### Tolerance Capability

| Dimension Type | Typical Capability |
|----------------|-------------------|
| Linear (milling) | +/- 0.025 mm |
| Linear (turning) | +/- 0.013 mm |
| Hole diameter | +/- 0.013 mm |
| Surface finish | Ra 1.6-3.2 um |
| Flatness | 0.025 mm/100 mm |

### Casting DFM

#### Design Guidelines

```
Draft angles:
- External: 1-3 degrees minimum
- Internal: 2-5 degrees
- Deep pockets: increase draft

Wall thickness:
- Minimum: 3-5 mm (sand casting)
- Minimum: 2-3 mm (die casting)
- Uniform thickness preferred
- Gradual transitions

Radii:
- Internal corners: R > 3 mm
- External corners: R > 1 mm
- Avoid sharp transitions
```

#### Shrinkage Allowance

| Material | Shrinkage % |
|----------|-------------|
| Aluminum | 1.2-1.5 |
| Steel | 1.5-2.0 |
| Cast iron | 0.8-1.2 |
| Bronze | 1.0-1.5 |

### Injection Molding DFM

#### Design Guidelines

```
Wall thickness:
- Uniform 1.5-4 mm
- Transitions < 25% thickness change
- Avoid thick sections (sink marks)

Draft:
- 0.5-1 degree per side minimum
- Textured surfaces: add 1 degree per 0.025 mm depth

Ribs:
- Thickness: 50-75% of wall
- Height: < 3x wall thickness
- Spacing: > 2x wall thickness

Bosses:
- Wall: 50-75% of base wall
- Height: < 2x diameter
- Add gussets for strength
```

### Sheet Metal DFM

#### Bend Guidelines

```
Minimum bend radius:
- Soft materials: 0.5x thickness
- Hard materials: 1-2x thickness
- With grain: smaller radius OK
- Against grain: larger radius

Minimum flange:
- Flange > 4x thickness
- Flange > 3 mm practical minimum

Hole-to-bend:
- Distance > 2x thickness + bend radius
- Prevents hole distortion
```

#### Punching Guidelines

```
Minimum hole size:
- Round: 1x material thickness
- Square/rectangle: 0.8x thickness

Minimum edge distance:
- 2x material thickness minimum
- Prevents edge deformation

Minimum hole spacing:
- 2x material thickness minimum
```

### Cost Drivers

#### Cost Analysis Framework

```
Manufacturing cost components:
1. Material cost
   - Raw material
   - Scrap/waste
   - Special materials

2. Labor cost
   - Setup time
   - Run time
   - Inspection time

3. Equipment cost
   - Machine time
   - Tooling amortization

4. Overhead
   - Facility
   - Support functions
```

#### Cost Reduction Opportunities

| Area | Opportunity |
|------|-------------|
| Material | Standard grades, near-net-shape |
| Features | Eliminate unnecessary features |
| Tolerances | Relax to process capability |
| Finish | Specify only where needed |
| Operations | Combine or eliminate steps |
| Assembly | Reduce part count, use snap fits |

### Tolerance Review

#### Tolerance Stacking

```
Before specifying tight tolerances:
1. Verify functional requirement
2. Check assembly chain
3. Confirm process capability
4. Consider inspection cost
5. Evaluate statistical tolerance
```

#### Cost Impact

| Tolerance Class | Relative Cost |
|-----------------|---------------|
| Standard (+/- 0.5 mm) | 1x |
| Precision (+/- 0.1 mm) | 2-3x |
| Close (+/- 0.025 mm) | 5-10x |
| Very close (+/- 0.01 mm) | 10-20x |

## Process Integration

- ME-005: Design for Manufacturing (DFM) Review

## Input Schema

```json
{
  "design_data": {
    "cad_model": "file reference",
    "drawings": "array of references",
    "material": "string"
  },
  "manufacturing_context": {
    "target_process": "machining|casting|molding|sheet_metal|additive",
    "production_volume": "prototype|low|medium|high",
    "target_cost": "number (optional)"
  },
  "supplier_constraints": {
    "preferred_suppliers": "array",
    "equipment_limitations": "array"
  }
}
```

## Output Schema

```json
{
  "dfm_assessment": {
    "overall_rating": "good|acceptable|needs_improvement",
    "manufacturability_score": "number (1-10)"
  },
  "issues": [
    {
      "feature": "string",
      "issue": "string",
      "severity": "critical|major|minor",
      "recommendation": "string",
      "cost_impact": "string"
    }
  ],
  "cost_analysis": {
    "material_cost": "number",
    "labor_cost": "number",
    "tooling_cost": "number",
    "total_unit_cost": "number"
  },
  "improvement_opportunities": [
    {
      "change": "string",
      "cost_savings": "number or percentage",
      "effort": "low|medium|high"
    }
  ],
  "process_recommendation": {
    "primary_process": "string",
    "secondary_operations": "array",
    "special_requirements": "array"
  }
}
```

## Best Practices

1. Involve manufacturing early in design
2. Understand process capabilities
3. Challenge tight tolerances
4. Consider total cost, not just piece cost
5. Design for the target volume
6. Document DFM decisions and rationale

## Integration Points

- Connects with CAD Modeling for design review
- Feeds into Process Planning for manufacturing
- Supports Trade Study for process selection
- Integrates with Cost estimation
