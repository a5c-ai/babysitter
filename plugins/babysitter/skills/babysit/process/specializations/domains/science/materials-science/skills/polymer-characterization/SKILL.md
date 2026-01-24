---
name: polymer-characterization
description: Specialized skill for polymer materials analysis including molecular weight distribution, thermal transitions, crystallinity, and rheological properties
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: materials-science
  domain: science
  category: materials-characterization
  priority: high
  phase: 6
  tools-libraries:
    - GPC/SEC software
    - Rheometer software
    - FTIR libraries
    - DSC analysis
---

# Polymer Characterization Skill

## Purpose

The Polymer Characterization skill provides comprehensive analysis capabilities for polymeric materials, enabling systematic evaluation of molecular weight, thermal behavior, crystallinity, mechanical properties, and chemical structure essential for polymer science and engineering applications.

## Capabilities

- Molecular weight distribution analysis (GPC/SEC)
- Thermal transition identification (Tg, Tm, Tc)
- Crystallinity determination (DSC, XRD)
- Rheological property analysis (viscosity, viscoelasticity)
- Chemical structure verification (FTIR, NMR)
- Degradation pathway analysis
- Additive and filler content determination
- Polymer blend compatibility assessment

## Usage Guidelines

### Molecular Weight Analysis (GPC/SEC)

1. **Sample Preparation**
   - Dissolve in appropriate solvent (THF, DMF, chloroform)
   - Filter through 0.45 um membrane
   - Prepare at 1-5 mg/mL concentration

2. **Calibration**
   - Use narrow molecular weight standards (PS, PMMA, PEO)
   - Apply universal calibration with Mark-Houwink parameters
   - Consider absolute methods (light scattering, viscometry)

3. **Data Analysis**
   - Calculate Mn, Mw, Mz averages
   - Determine polydispersity index (PDI = Mw/Mn)
   - Identify multimodal distributions

### Thermal Analysis for Polymers

1. **Glass Transition (Tg)**
   - Use DSC at 10-20 K/min heating rate
   - Report midpoint, onset, or inflection consistently
   - Note thermal history effects

2. **Melting Behavior**
   - Identify peak melting temperature (Tm)
   - Calculate heat of fusion for crystallinity
   - Watch for multiple melting peaks (reorganization)

3. **Crystallinity Calculation**
   ```
   Crystallinity (%) = (ΔHm / ΔHm°) × 100
   ```
   Where ΔHm° is the enthalpy of 100% crystalline polymer

### Rheological Characterization

1. **Viscosity Measurements**
   - Shear viscosity vs. shear rate curves
   - Zero-shear viscosity determination
   - Shear thinning/thickening behavior

2. **Viscoelastic Properties**
   - Storage modulus (G') and loss modulus (G'')
   - Complex viscosity (η*)
   - Crossover frequency and modulus

3. **Temperature Dependence**
   - Apply WLF equation above Tg
   - Use Arrhenius below Tg
   - Generate master curves via time-temperature superposition

### Chemical Structure Analysis

1. **FTIR Spectroscopy**
   - Identify functional groups
   - Verify polymer backbone structure
   - Detect oxidation and degradation

2. **NMR Spectroscopy**
   - Determine tacticity and stereoregularity
   - Identify end groups and branching
   - Quantify copolymer composition

## Process Integration

- MS-003: Spectroscopic Analysis Suite
- MS-004: Thermal Analysis Protocol

## Input Schema

```json
{
  "sample_id": "string",
  "polymer_type": "string",
  "analysis_methods": ["GPC", "DSC", "rheology", "FTIR", "NMR"],
  "solvent": "string (for GPC)",
  "temperature_range": {
    "start": "number (C)",
    "end": "number (C)"
  }
}
```

## Output Schema

```json
{
  "sample_id": "string",
  "molecular_weight": {
    "Mn": "number (g/mol)",
    "Mw": "number (g/mol)",
    "PDI": "number"
  },
  "thermal_properties": {
    "Tg": "number (C)",
    "Tm": "number (C)",
    "Tc": "number (C)",
    "crystallinity": "number (percent)"
  },
  "rheological_properties": {
    "zero_shear_viscosity": "number (Pa.s)",
    "crossover_frequency": "number (rad/s)",
    "flow_activation_energy": "number (kJ/mol)"
  },
  "chemical_structure": {
    "functional_groups": ["string"],
    "degradation_indicators": "string"
  }
}
```

## Best Practices

1. Erase thermal history with heat-cool-heat DSC cycle
2. Use appropriate molecular weight standards for calibration
3. Ensure complete dissolution for GPC samples
4. Apply Cox-Merz rule to relate steady shear and dynamic data
5. Verify polymer identification with multiple techniques
6. Document processing and storage conditions

## Integration Points

- Connects with Thermal Analysis for comprehensive thermal characterization
- Feeds into Mechanical Testing for structure-property relationships
- Supports Spectroscopy Analysis for chemical identification
- Integrates with Composite Design for matrix characterization
