---
name: thermal-analysis
description: Skill for thermal management design and heat transfer analysis across conduction, convection, and radiation including heat sink sizing and electronic cooling
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
    - ANSYS Mechanical (thermal)
    - ANSYS Icepak
    - FloTHERM
    - Thermal Desktop
---

# Thermal Analysis Skill

## Purpose

The Thermal Analysis skill provides comprehensive capabilities for thermal management design and heat transfer analysis in mechanical engineering applications, enabling systematic evaluation of temperature distributions, thermal gradients, and heat dissipation across conduction, convection, and radiation heat transfer modes.

## Capabilities

- Steady-state and transient thermal analysis setup
- Conduction path modeling and optimization
- Natural and forced convection coefficient estimation
- Radiation view factor and enclosure analysis
- Heat sink sizing and optimization
- Thermal interface material selection
- Electronic cooling analysis (Icepak, FloTHERM)
- Thermal resistance network modeling

## Usage Guidelines

### Heat Transfer Mode Analysis

#### Conduction Analysis

1. **Thermal Conductivity**
   - Material property assignment
   - Anisotropic conductivity for composites
   - Temperature-dependent properties

2. **Conduction Path Modeling**
   - Identify primary heat flow paths
   - Calculate thermal resistances in series/parallel
   - Optimize cross-sectional areas

3. **Contact Resistance**
   - Include interface thermal resistance
   - Specify TIM (thermal interface material) properties
   - Consider surface roughness effects

#### Convection Analysis

1. **Natural Convection**
   - Correlations: Vertical plate, horizontal plate, enclosure
   - Calculate Grashof and Rayleigh numbers
   - Orientation-dependent coefficients

2. **Forced Convection**
   - Calculate Reynolds number for flow regime
   - Apply Nusselt number correlations
   - Account for entrance effects

3. **Coefficient Estimation**
   ```
   h_forced ≈ 5-25 W/m²K (natural air)
   h_forced ≈ 25-250 W/m²K (forced air)
   h_forced ≈ 500-10000 W/m²K (liquid)
   ```

#### Radiation Analysis

1. **View Factor Calculation**
   - Planar surfaces: Hottel's crossed-string method
   - Complex geometries: Monte Carlo ray tracing
   - Reciprocity and summation rules

2. **Radiative Exchange**
   - Gray body assumptions
   - Enclosure analysis with multiple surfaces
   - Participating media (if applicable)

### Heat Sink Design

1. **Thermal Resistance**
   ```
   R_total = R_jc + R_TIM + R_hs + R_sa

   Where:
   R_jc = Junction to case
   R_TIM = Thermal interface material
   R_hs = Heat sink spreading
   R_sa = Sink to ambient
   ```

2. **Fin Optimization**
   - Fin efficiency calculation
   - Optimal fin spacing for natural/forced convection
   - Trade-off analysis: more fins vs. reduced efficiency

3. **Selection Criteria**
   - Required thermal resistance
   - Volume and weight constraints
   - Airflow direction
   - Cost considerations

### Electronic Cooling

1. **Component Modeling**
   - Power dissipation mapping
   - Two-resistor thermal models
   - Detailed thermal models (DELPHI)

2. **PCB Thermal Analysis**
   - Effective thermal conductivity
   - Layer stackup effects
   - Thermal vias for vertical conduction

3. **System-Level Analysis**
   - Airflow distribution
   - Hot spot identification
   - Thermal shadowing effects

## Process Integration

- ME-011: Thermal Management Design
- ME-012: Heat Exchanger Design and Rating

## Input Schema

```json
{
  "component": "string",
  "power_dissipation": "number (W)",
  "ambient_temperature": "number (C)",
  "max_junction_temperature": "number (C)",
  "cooling_method": "natural|forced_air|liquid",
  "airflow_velocity": "number (m/s, if forced)",
  "constraints": {
    "max_volume": "number (mm^3)",
    "max_weight": "number (g)",
    "max_height": "number (mm)"
  }
}
```

## Output Schema

```json
{
  "thermal_solution": {
    "required_thermal_resistance": "number (C/W)",
    "heat_sink_recommendation": {
      "type": "string",
      "dimensions": "object",
      "thermal_resistance": "number (C/W)"
    },
    "tim_selection": "string",
    "predicted_temperatures": {
      "junction": "number (C)",
      "case": "number (C)",
      "heat_sink": "number (C)"
    }
  },
  "airflow_requirements": {
    "minimum_velocity": "number (m/s)",
    "volumetric_flow": "number (CFM)"
  },
  "thermal_margin": "number (C)"
}
```

## Best Practices

1. Always verify thermal conductivity values at operating temperatures
2. Include thermal interface resistance in all calculations
3. Use conservative convection coefficients for preliminary design
4. Verify radiation effects for high-temperature applications
5. Consider transient thermal response for pulsed loads
6. Validate models with experimental measurements when possible

## Integration Points

- Connects with CFD Analysis for detailed flow-thermal coupling
- Feeds into Heat Exchanger Design for system integration
- Supports FEA for thermomechanical stress analysis
- Integrates with Electronic Design for package-level thermal management
