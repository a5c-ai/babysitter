---
name: material-selection
description: Systematic material selection using Ashby methodology and performance indices
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: mechanical-engineering
  domain: science
  category: materials-testing
  priority: high
  phase: 3
  tools-libraries:
    - Granta CES EduPack
    - MatWeb
    - Total Materia
    - MMPDS
---

# Material Selection Skill

## Purpose

The Material Selection skill provides systematic capabilities for selecting materials using Ashby methodology and performance indices, enabling optimal material choices based on functional requirements, manufacturing constraints, and cost considerations.

## Capabilities

- Ashby chart generation and interpretation
- Performance index derivation for design requirements
- Material property database access (MatWeb, CES)
- Environmental compatibility assessment
- Manufacturing process compatibility evaluation
- Cost and availability analysis
- Equivalent material identification
- Material specification documentation

## Usage Guidelines

### Ashby Methodology

#### Performance Indices

1. **Stiffness-Limited Design**
   | Loading | Performance Index | Maximize |
   |---------|-------------------|----------|
   | Tie (tension) | E/rho | Specific stiffness |
   | Beam (bending) | E^(1/2)/rho | Flexural efficiency |
   | Panel (bending) | E^(1/3)/rho | Panel efficiency |
   | Shaft (torsion) | G^(1/2)/rho | Torsional efficiency |

2. **Strength-Limited Design**
   | Loading | Performance Index | Maximize |
   |---------|-------------------|----------|
   | Tie (tension) | sigma_y/rho | Specific strength |
   | Beam (bending) | sigma_y^(2/3)/rho | Flexural strength |
   | Panel (bending) | sigma_y^(1/2)/rho | Panel strength |
   | Shaft (torsion) | tau_y^(2/3)/rho | Torsional strength |

3. **Combined Objectives**
   ```
   For minimum cost at required stiffness:
   M = E / (rho * C_m)

   Where:
   E = Young's modulus
   rho = density
   C_m = cost per unit mass
   ```

#### Material Selection Charts

1. **Young's Modulus vs Density**
   - Identify materials above target index line
   - Compare material families
   - Identify lightweight alternatives

2. **Strength vs Density**
   - Evaluate strength-to-weight ratio
   - Compare metallic and composite options
   - Identify high-performance materials

3. **Thermal Conductivity vs Electrical Resistivity**
   - Heat dissipation requirements
   - Electrical isolation needs
   - Combined thermal-electrical requirements

### Property Requirements

#### Mechanical Properties

| Property | Units | Considerations |
|----------|-------|----------------|
| Yield strength | MPa | Safety factors, fatigue |
| Ultimate strength | MPa | Failure modes |
| Young's modulus | GPa | Deflection limits |
| Fracture toughness | MPa.m^(1/2) | Damage tolerance |
| Fatigue strength | MPa | Cyclic loading |
| Hardness | HRC, HB | Wear resistance |

#### Physical Properties

| Property | Units | Considerations |
|----------|-------|----------------|
| Density | kg/m3 | Weight constraints |
| Thermal expansion | 10^-6/K | Dimensional stability |
| Thermal conductivity | W/m.K | Heat transfer |
| Electrical resistivity | ohm.m | Conductivity needs |
| Melting point | C | Operating temperature |

### Manufacturing Compatibility

#### Process-Material Matrix

| Process | Metals | Polymers | Ceramics | Composites |
|---------|--------|----------|----------|------------|
| Casting | Yes | Yes | Limited | No |
| Machining | Yes | Yes | Limited | Yes |
| Forging | Yes | No | No | No |
| Injection molding | No | Yes | No | Short fiber |
| Sheet forming | Yes | Limited | No | Limited |
| Additive | Yes | Yes | Limited | Yes |

### Environmental Considerations

1. **Corrosion Resistance**
   - Atmospheric exposure
   - Chemical exposure
   - Galvanic compatibility
   - Stress corrosion cracking

2. **Temperature Effects**
   - Property degradation
   - Creep behavior
   - Oxidation resistance
   - Cryogenic performance

3. **Sustainability**
   - Recyclability
   - Embodied energy
   - Toxicity
   - Lifecycle assessment

## Process Integration

- ME-014: Material Selection Methodology

## Input Schema

```json
{
  "application": "string",
  "loading_conditions": {
    "type": "tension|bending|torsion|combined",
    "magnitude": "number",
    "cyclic": "boolean"
  },
  "constraints": {
    "max_weight": "number (kg)",
    "max_cost": "number ($/part)",
    "max_temperature": "number (C)",
    "corrosion_environment": "string"
  },
  "manufacturing_process": "machined|cast|molded|forged|additive",
  "current_material": "string (if replacement study)",
  "required_properties": {
    "min_yield": "number (MPa)",
    "min_stiffness": "number (GPa)",
    "max_density": "number (kg/m3)"
  }
}
```

## Output Schema

```json
{
  "recommended_materials": [
    {
      "name": "string",
      "specification": "string (e.g., ASTM, AMS)",
      "performance_index": "number",
      "properties": {
        "yield_strength": "number (MPa)",
        "modulus": "number (GPa)",
        "density": "number (kg/m3)"
      },
      "cost_estimate": "number ($/kg)",
      "availability": "string"
    }
  ],
  "selection_rationale": "string",
  "trade_off_analysis": {
    "primary_candidate": "string",
    "alternates": "array",
    "comparison_matrix": "object"
  },
  "manufacturing_notes": "string",
  "specification_recommendation": "string"
}
```

## Best Practices

1. Define functional requirements before selecting material
2. Consider full lifecycle costs, not just material cost
3. Verify property data from reliable sources
4. Account for processing effects on properties
5. Evaluate galvanic compatibility in assemblies
6. Document selection rationale for traceability

## Integration Points

- Connects with Requirements Flowdown for design constraints
- Feeds into FEA Structural for analysis properties
- Supports DFM Review for manufacturing feasibility
- Integrates with Material Testing for validation
