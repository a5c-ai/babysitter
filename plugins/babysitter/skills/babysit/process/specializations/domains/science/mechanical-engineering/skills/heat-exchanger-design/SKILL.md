---
name: heat-exchanger-design
description: Specialized skill for heat exchanger sizing, rating, and optimization per TEMA standards including shell-and-tube, plate, and air-cooled configurations
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
  phase: 6
  tools-libraries:
    - HTRI Xchanger Suite
    - Aspen Exchanger Design and Rating
---

# Heat Exchanger Design Skill

## Purpose

The Heat Exchanger Design skill provides comprehensive capabilities for sizing, rating, and optimizing heat exchangers according to TEMA standards, enabling systematic thermal-hydraulic design of shell-and-tube, plate, and air-cooled heat exchanger configurations.

## Capabilities

- Shell-and-tube heat exchanger design and rating
- Plate heat exchanger sizing
- Air-cooled heat exchanger configuration
- LMTD and effectiveness-NTU methods
- Fouling factor consideration
- Pressure drop calculations
- HTRI Xchanger Suite integration
- Thermal-hydraulic optimization

## Usage Guidelines

### Design Methods

#### LMTD Method

1. **Log Mean Temperature Difference**
   ```
   LMTD = (ΔT1 - ΔT2) / ln(ΔT1/ΔT2)

   Q = U × A × F × LMTD

   Where:
   F = Correction factor for non-counterflow
   U = Overall heat transfer coefficient
   A = Heat transfer area
   ```

2. **LMTD Correction Factors**
   - One shell pass, 2/4/6 tube passes
   - Two shell passes, 4/8 tube passes
   - Crossflow configurations

#### Effectiveness-NTU Method

1. **Effectiveness Definition**
   ```
   ε = Q_actual / Q_max
   Q_max = Cmin × (Th,in - Tc,in)
   ```

2. **NTU Calculation**
   ```
   NTU = UA / Cmin
   Cr = Cmin / Cmax
   ```

3. **Effectiveness Relations**
   - Counterflow: ε = (1-exp(-NTU(1-Cr)))/(1-Cr×exp(-NTU(1-Cr)))
   - Parallel flow: ε = (1-exp(-NTU(1+Cr)))/(1+Cr)
   - Shell-and-tube: Complex correlations by TEMA type

### Shell-and-Tube Design

1. **TEMA Designations**
   | Front End | Shell | Rear End |
   |-----------|-------|----------|
   | A - Channel | E - One-pass | L - Fixed tubesheet |
   | B - Bonnet | F - Two-pass | M - Fixed tubesheet |
   | N - Channel | J - Divided flow | N - Fixed tubesheet |
   | - | X - Crossflow | P - Outside packed |
   | - | - | S - Floating head |
   | - | - | U - U-tube |

2. **Tube Layout**
   - Triangular pitch (30°): Maximum tubes, poor cleaning
   - Square pitch (90°): Mechanical cleaning possible
   - Rotated square (45°): Higher turbulence

3. **Baffle Design**
   - Segmental: 20-45% cut
   - Double segmental: Reduced pressure drop
   - No-tubes-in-window: Vibration mitigation

### Plate Heat Exchanger

1. **Plate Selection**
   - Chevron angle (25-65°): Trade-off h vs ΔP
   - Plate spacing: 2-5 mm typical
   - Pass arrangement: U or Z configuration

2. **Design Considerations**
   - Maximum pressure: 25-30 bar typical
   - Maximum temperature: 150-200°C (gaskets)
   - Fouling service: Not ideal

### Air-Cooled Heat Exchanger

1. **Configuration**
   - Forced draft: Fan below bundle
   - Induced draft: Fan above bundle
   - Natural draft: No fan (limited duty)

2. **Design Parameters**
   - Face velocity: 2.5-3.5 m/s
   - Tube rows: 3-6 typical
   - Fin density: 275-435 fins/m

### Fouling Considerations

| Service | Fouling Factor (m²K/kW) |
|---------|------------------------|
| Cooling water | 0.2-0.35 |
| River water | 0.35-0.5 |
| Fuel oil | 0.5-0.9 |
| Heavy hydrocarbons | 0.35-0.7 |
| Light hydrocarbons | 0.1-0.2 |
| Steam (clean) | 0.05-0.1 |

## Process Integration

- ME-012: Heat Exchanger Design and Rating
- ME-011: Thermal Management Design

## Input Schema

```json
{
  "design_type": "sizing|rating",
  "exchanger_type": "shell_tube|plate|air_cooled",
  "hot_fluid": {
    "name": "string",
    "flow_rate": "number (kg/s)",
    "inlet_temp": "number (C)",
    "outlet_temp": "number (C, for sizing)"
  },
  "cold_fluid": {
    "name": "string",
    "flow_rate": "number (kg/s)",
    "inlet_temp": "number (C)",
    "outlet_temp": "number (C, for sizing)"
  },
  "pressure_constraints": {
    "hot_side_max_dp": "number (kPa)",
    "cold_side_max_dp": "number (kPa)"
  },
  "fouling_factors": {
    "hot_side": "number (m2K/kW)",
    "cold_side": "number (m2K/kW)"
  }
}
```

## Output Schema

```json
{
  "duty": "number (kW)",
  "geometry": {
    "type": "string (TEMA designation or plate type)",
    "area": "number (m2)",
    "shell_diameter": "number (mm)",
    "tube_count": "number",
    "tube_length": "number (m)"
  },
  "thermal": {
    "LMTD": "number (C)",
    "F_factor": "number",
    "U_clean": "number (W/m2K)",
    "U_dirty": "number (W/m2K)"
  },
  "hydraulic": {
    "shell_side_dp": "number (kPa)",
    "tube_side_dp": "number (kPa)"
  },
  "performance": {
    "effectiveness": "number",
    "NTU": "number"
  }
}
```

## Best Practices

1. Always include fouling factors appropriate for the service
2. Verify pressure drop constraints are met on both sides
3. Check for vibration potential in shell-and-tube designs
4. Consider maintenance access in configuration selection
5. Apply TEMA tolerances for manufacturing variations
6. Use conservative correlations for preliminary sizing

## Integration Points

- Connects with CFD Analysis for detailed flow distribution
- Feeds into HVAC System Design for system integration
- Supports Thermal Analysis for component-level design
- Integrates with Process Design for plant-level optimization
