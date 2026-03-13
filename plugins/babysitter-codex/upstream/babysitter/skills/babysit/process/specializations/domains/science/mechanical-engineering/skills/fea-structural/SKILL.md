---
name: fea-structural
description: Deep integration with finite element analysis tools for structural simulation across static, dynamic, and nonlinear domains
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
  priority: high
  phase: 1
  tools-libraries:
    - ANSYS Mechanical
    - Abaqus
    - MSC NASTRAN
    - HyperMesh
    - Femap
---

# Finite Element Analysis Skill

## Purpose

The Finite Element Analysis skill provides deep integration with FEA tools for structural simulation, enabling systematic setup, execution, and post-processing of finite element models across static, dynamic, and nonlinear analysis domains.

## Capabilities

- ANSYS Mechanical, Abaqus, NASTRAN model setup and execution
- Mesh generation strategies and quality assessment
- Element type selection and convergence studies
- Boundary condition specification and load case management
- Linear and nonlinear static analysis configuration
- Results post-processing and margin of safety calculation
- Mesh independence and sensitivity studies
- Report generation with stress/deflection contours

## Usage Guidelines

### Model Setup

#### Geometry Preparation

1. **CAD Import and Cleanup**
   - Defeature small holes and fillets (analysis dependent)
   - Remove unnecessary detail
   - Verify watertight geometry
   - Create symmetry conditions if applicable

2. **Geometry Partitioning**
   - Partition for mesh control
   - Create virtual topology for hex meshing
   - Identify contact surfaces
   - Define load application regions

#### Mesh Generation

1. **Element Selection**
   | Analysis Type | Recommended Elements |
   |---------------|---------------------|
   | Static stress | Hex20, Tet10, Quad8 |
   | Thin structures | Shell (QUAD4/8, TRIA3/6) |
   | Beam structures | BEAM/BAR elements |
   | Contact | Linear elements preferred |
   | Nonlinear | Reduced integration with hourglass control |

2. **Mesh Quality Criteria**
   ```
   Aspect ratio: < 5 (< 3 preferred)
   Jacobian: > 0.6
   Warpage: < 15 degrees
   Skewness: < 0.8
   ```

3. **Mesh Refinement**
   - Refine at stress concentrations
   - Transition ratios < 1.5
   - Multiple elements through thickness
   - Convergence study requirements

### Analysis Configuration

#### Boundary Conditions

1. **Constraints**
   - Fixed (all DOF constrained)
   - Pinned (translations fixed, rotations free)
   - Symmetry (appropriate DOF constrained)
   - Prescribed displacement

2. **Best Practices**
   - Avoid over-constraint
   - Use RBE2/RBE3 for load distribution
   - Consider realistic support stiffness
   - Document all assumptions

#### Load Application

1. **Load Types**
   - Pressure (uniform, hydrostatic)
   - Force (point, distributed)
   - Moment/torque
   - Thermal loads
   - Inertial loads (gravity, acceleration)

2. **Load Cases**
   - Define all operational load cases
   - Include limit and ultimate factors
   - Combine per applicable standards
   - Document load derivation

### Results Post-Processing

#### Stress Evaluation

1. **Stress Quantities**
   - von Mises (ductile materials)
   - Principal stresses (fatigue, brittle)
   - Membrane + bending (shells)
   - Interlaminar (composites)

2. **Margin of Safety**
   ```
   MS = (Allowable / Applied) - 1
   MS > 0 indicates positive margin
   ```

3. **Reporting**
   - Maximum stress location and value
   - Stress contour plots
   - Deflection summary
   - Reaction forces verification

## Process Integration

- ME-006: Finite Element Analysis (FEA) Setup and Execution
- ME-007: Stress and Deflection Analysis
- ME-009: Nonlinear Structural Analysis

## Input Schema

```json
{
  "geometry": "CAD file path or description",
  "material": {
    "name": "string",
    "E": "number (Pa)",
    "nu": "number",
    "yield": "number (Pa)",
    "ultimate": "number (Pa)"
  },
  "loads": [
    {
      "type": "pressure|force|moment|thermal",
      "magnitude": "number",
      "location": "string",
      "direction": "array [x,y,z]"
    }
  ],
  "constraints": [
    {
      "type": "fixed|pinned|symmetry",
      "location": "string",
      "dof": "array"
    }
  ],
  "analysis_type": "static|modal|nonlinear",
  "output_requests": ["stress", "displacement", "reactions"]
}
```

## Output Schema

```json
{
  "analysis_results": {
    "max_stress": {
      "von_mises": "number (Pa)",
      "location": "string",
      "element_id": "number"
    },
    "max_displacement": {
      "magnitude": "number (m)",
      "location": "string",
      "node_id": "number"
    },
    "reaction_forces": {
      "total": "array [Fx, Fy, Fz, Mx, My, Mz]"
    }
  },
  "margin_of_safety": {
    "yield": "number",
    "ultimate": "number",
    "critical_location": "string"
  },
  "mesh_quality": {
    "element_count": "number",
    "worst_aspect_ratio": "number",
    "convergence_status": "string"
  }
}
```

## Best Practices

1. Always perform mesh convergence studies for critical analyses
2. Verify reaction forces match applied loads
3. Check for rigid body modes in modal analysis
4. Use appropriate element formulations for contact
5. Document all modeling assumptions and simplifications
6. Compare results with hand calculations where possible

## Integration Points

- Connects with CAD Modeling for geometry import
- Feeds into Fatigue Life Prediction for durability assessment
- Supports Test Correlation for model validation
- Integrates with Thermal Analysis for coupled problems
