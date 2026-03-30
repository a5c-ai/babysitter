---
name: fea-mesh-generator
description: Finite element mesh generation skill optimized for biomedical geometries including implants, anatomical structures, and tissue models
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - Bash
metadata:
  specialization: biomedical-engineering
  domain: science
  category: Biomechanics and Structural Analysis
  skill-id: BME-SK-011
---

# FEA Mesh Generator Skill

## Purpose

The FEA Mesh Generator Skill creates optimized finite element meshes for biomedical applications, supporting analysis of implants, anatomical structures, and tissue models with appropriate element types and mesh quality.

## Capabilities

- Automatic mesh generation from CAD/STL
- Mesh quality assessment and repair
- Boundary layer meshing for fluid-structure
- Mesh convergence study automation
- Anatomical landmark identification
- Patient-specific mesh generation from imaging
- Adaptive mesh refinement
- Multi-material mesh handling
- Contact surface mesh preparation
- Hexahedral and tetrahedral meshing
- Mesh smoothing and optimization

## Usage Guidelines

### When to Use
- Preparing FEA models for biomedical analysis
- Creating patient-specific anatomical models
- Conducting mesh sensitivity studies
- Optimizing computational efficiency

### Prerequisites
- CAD geometry or imaging data available
- Material regions identified
- Analysis requirements defined
- Contact interfaces specified

### Best Practices
- Verify mesh quality metrics before analysis
- Conduct mesh convergence studies
- Use appropriate element types for physics
- Document mesh parameters for reproducibility

## Process Integration

This skill integrates with the following processes:
- Finite Element Analysis for Medical Devices
- Orthopedic Implant Biomechanical Testing
- Gait Analysis and Musculoskeletal Modeling
- Scaffold Fabrication and Characterization

## Dependencies

- ANSYS meshing tools
- Abaqus CAE
- COMSOL Multiphysics
- Mimics/3-matic
- Open-source mesh tools (Gmsh, TetGen)

## Configuration

```yaml
fea-mesh-generator:
  element-types:
    - tetrahedral
    - hexahedral
    - wedge
    - shell
    - beam
  quality-metrics:
    - aspect-ratio
    - jacobian
    - skewness
    - warpage
  mesh-sources:
    - CAD
    - STL
    - CT-imaging
    - MRI-imaging
```

## Output Artifacts

- Finite element meshes
- Mesh quality reports
- Convergence study results
- Element statistics
- Boundary condition assignments
- Material region definitions
- Contact surface definitions
- Mesh parameter documentation

## Quality Criteria

- Mesh quality metrics within acceptable limits
- Convergence demonstrated for key outputs
- Element types appropriate for analysis physics
- Mesh captures geometric features adequately
- Contact surfaces properly defined
- Documentation supports reproducibility
