---
name: cfd-fluids
description: Deep integration with computational fluid dynamics tools for internal and external flow analysis
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: mechanical-engineering
  domain: science
  category: thermal-fluid-analysis
  priority: high
  phase: 1
  tools-libraries:
    - ANSYS Fluent
    - ANSYS CFX
    - OpenFOAM
    - Star-CCM+
    - ParaView
---

# CFD Analysis Skill

## Purpose

The CFD Analysis skill provides deep integration with computational fluid dynamics tools for internal and external flow analysis, enabling systematic setup, execution, and post-processing of fluid simulations.

## Capabilities

- ANSYS Fluent, CFX, OpenFOAM workflow automation
- Mesh generation for complex geometries (structured, unstructured)
- Turbulence model selection (k-epsilon, k-omega, SST, LES)
- Boundary condition specification (inlet, outlet, wall, symmetry)
- Steady-state and transient flow simulations
- Post-processing for pressure, velocity, and flow visualization
- Mesh independence studies and validation
- Pressure drop and flow coefficient calculations

## Usage Guidelines

### Pre-Processing

#### Geometry Preparation

1. **CAD Cleanup**
   - Remove small features (< 3 cells)
   - Fill gaps and holes
   - Create smooth transitions
   - Define fluid domain boundaries

2. **Domain Definition**
   - Internal flow: Extract fluid volume
   - External flow: Create far-field boundary
   - Symmetry: Identify planes of symmetry
   - Periodic: Define periodic pairs

#### Mesh Generation

1. **Mesh Types**
   | Type | Application | Pros/Cons |
   |------|-------------|-----------|
   | Structured hex | Simple geometries | High quality, more effort |
   | Unstructured tet | Complex geometries | Flexible, more cells |
   | Polyhedral | Complex internal | Good quality, moderate count |
   | Hybrid | Mixed regions | Optimized for accuracy |

2. **Boundary Layer Mesh**
   ```
   First cell height: y+ = 1 (wall-resolved)
                     y+ = 30-300 (wall functions)

   y = y+ * mu / (rho * u_tau)
   u_tau = sqrt(tau_w / rho)
   ```

3. **Mesh Quality Criteria**
   ```
   Orthogonality: > 0.1 (> 0.3 preferred)
   Skewness: < 0.95 (< 0.8 preferred)
   Aspect ratio: < 100 (< 20 near walls)
   ```

### Solver Configuration

#### Turbulence Models

| Model | Application | Wall Treatment |
|-------|-------------|----------------|
| k-epsilon Standard | General industrial | Wall functions |
| k-epsilon Realizable | Rotation, separation | Wall functions |
| k-omega SST | Aerospace, separation | Low-Re or wall functions |
| Spalart-Allmaras | External aero | Low-Re |
| LES/DES | Unsteady, vortex shedding | Wall-resolved |

#### Boundary Conditions

1. **Inlet Conditions**
   - Mass flow rate or velocity
   - Turbulence intensity (1-5% typical)
   - Hydraulic diameter or length scale
   - Temperature (if energy equation)

2. **Outlet Conditions**
   - Pressure outlet (most common)
   - Outflow (fully developed)
   - Mass flow outlet (specified)

3. **Wall Conditions**
   - No-slip (default)
   - Roughness (if significant)
   - Thermal (adiabatic, fixed T, heat flux)

#### Solution Settings

1. **Discretization Schemes**
   ```
   Convection: Second-order upwind (accuracy)
               First-order (stability)
   Pressure: PRESTO (complex geometry)
             Standard (simple geometry)
   ```

2. **Convergence Criteria**
   ```
   Residuals: < 1e-4 (typical)
              < 1e-6 (high accuracy)

   Monitor: Mass imbalance < 0.1%
            Force convergence
   ```

### Post-Processing

1. **Flow Visualization**
   - Streamlines and pathlines
   - Velocity vectors
   - Contour plots (P, V, T)
   - Surface integral reports

2. **Quantitative Results**
   - Pressure drop
   - Flow coefficient (Cv)
   - Heat transfer coefficient
   - Force and moment

## Process Integration

- ME-010: Computational Fluid Dynamics (CFD) Analysis

## Input Schema

```json
{
  "geometry": "CAD file path",
  "flow_type": "internal|external",
  "fluid": {
    "name": "string",
    "density": "number (kg/m3)",
    "viscosity": "number (Pa.s)",
    "specific_heat": "number (J/kg.K, if thermal)"
  },
  "inlet": {
    "type": "velocity|mass_flow|pressure",
    "value": "number",
    "temperature": "number (K, if thermal)"
  },
  "outlet": {
    "type": "pressure|outflow",
    "value": "number (if pressure)"
  },
  "analysis_type": "steady|transient",
  "turbulence_model": "k-epsilon|k-omega-sst|spalart-allmaras|laminar"
}
```

## Output Schema

```json
{
  "flow_results": {
    "pressure_drop": "number (Pa)",
    "flow_coefficient": "number (Cv)",
    "max_velocity": "number (m/s)",
    "reynolds_number": "number"
  },
  "forces": {
    "drag": "number (N)",
    "lift": "number (N)",
    "moment": "array [Mx, My, Mz]"
  },
  "thermal_results": {
    "heat_transfer_rate": "number (W)",
    "average_htc": "number (W/m2.K)",
    "outlet_temperature": "number (K)"
  },
  "mesh_statistics": {
    "cell_count": "number",
    "y_plus_range": [min, max],
    "orthogonality_min": "number"
  },
  "convergence": {
    "iterations": "number",
    "residuals": "object",
    "mass_imbalance": "number"
  }
}
```

## Best Practices

1. Always perform mesh independence study
2. Verify y+ values match turbulence model requirements
3. Monitor mass and energy imbalance
4. Validate with experimental data when available
5. Start with steady-state before transient
6. Use appropriate turbulence model for flow physics

## Integration Points

- Connects with CAD Modeling for geometry
- Feeds into Thermal Analysis for conjugate heat transfer
- Supports Heat Exchanger Design for performance prediction
- Integrates with Test Correlation for validation
