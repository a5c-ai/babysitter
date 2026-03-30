---
name: hvac-design
description: Skill for HVAC system design and analysis per ASHRAE standards including load calculations, equipment selection, and energy efficiency analysis
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
    - Carrier HAP
    - Trane TRACE
    - EnergyPlus
    - eQUEST
---

# HVAC System Design Skill

## Purpose

The HVAC System Design skill provides comprehensive capabilities for heating, ventilation, and air conditioning system design according to ASHRAE standards, enabling systematic load calculations, equipment selection, ductwork design, and energy efficiency analysis for commercial and industrial buildings.

## Capabilities

- Heating and cooling load calculations
- Psychrometric analysis and chart calculations
- Equipment selection (AHU, chillers, boilers)
- Duct and piping system sizing
- Energy efficiency analysis (ASHRAE 90.1)
- Indoor air quality assessment (ASHRAE 62.1)
- System simulation and optimization
- Control system specification

## Usage Guidelines

### Load Calculations

#### Cooling Load Components

1. **External Loads**
   - Solar radiation through windows (SHGC consideration)
   - Conduction through envelope (walls, roof, floor)
   - Infiltration and ventilation air

2. **Internal Loads**
   - People: 250 Btu/h sensible, 200 Btu/h latent (typical office)
   - Lighting: Use installed wattage with diversity
   - Equipment: Plug loads with usage factors

3. **Calculation Methods**
   - CLTD/CLF method: Manual calculations
   - RTS (Radiant Time Series): More accurate
   - Heat Balance Method: Full simulation

#### Heating Load

1. **Design Conditions**
   - Use ASHRAE 99.6% or 99% design temperature
   - No solar credit for heating design
   - Full infiltration at design conditions

2. **Load Components**
   - Envelope conduction (U × A × ΔT)
   - Infiltration/ventilation (1.08 × CFM × ΔT)
   - No internal gains credited

### Psychrometric Analysis

1. **Key Properties**
   - Dry-bulb and wet-bulb temperatures
   - Relative humidity and humidity ratio
   - Enthalpy and specific volume
   - Dew point temperature

2. **Process Calculations**
   | Process | Constant Property |
   |---------|------------------|
   | Sensible heating/cooling | Humidity ratio |
   | Humidification | Enthalpy (adiabatic) |
   | Dehumidification | Saturation curve |
   | Mixing | Mass-weighted average |

3. **Coil Processes**
   ```
   Sensible Heat Ratio (SHR) = Qs / Qt

   Bypass Factor (BF) = (T_leaving - T_ADP) / (T_entering - T_ADP)
   ```

### Equipment Selection

#### Air Handling Units

1. **Coil Sizing**
   - Entering/leaving air conditions
   - Water temperatures (chilled water: 44/54°F typical)
   - Face velocity: 400-550 fpm

2. **Fan Selection**
   - Total static pressure requirements
   - Fan efficiency and motor sizing
   - Variable speed considerations

#### Chillers

1. **Types and Selection**
   - Reciprocating: < 200 tons
   - Scroll: 20-400 tons
   - Screw: 100-1500 tons
   - Centrifugal: > 300 tons

2. **Efficiency Metrics**
   - COP (Coefficient of Performance)
   - kW/ton: 0.5-0.8 typical range
   - IPLV: Part-load efficiency

### Duct Design

1. **Sizing Methods**
   - Equal friction: Constant pressure drop per 100 ft
   - Static regain: Constant velocity pressure
   - Velocity method: Noise-controlled

2. **Pressure Drop**
   - Typical systems: 0.08-0.1 in.w.g./100 ft
   - Low velocity: < 0.08 in.w.g./100 ft
   - High velocity: > 0.1 in.w.g./100 ft

3. **Fitting Losses**
   - Express as equivalent length or C coefficient
   - Use ASHRAE duct fitting database

### Energy Efficiency

1. **ASHRAE 90.1 Compliance**
   - Envelope requirements (U-values, SHGC)
   - HVAC efficiency minimums
   - Lighting power density limits
   - Energy cost budget method

2. **Energy Conservation Measures**
   - Economizer operation
   - Heat recovery
   - Variable speed drives
   - Demand-controlled ventilation

## Process Integration

- ME-013: HVAC System Design

## Input Schema

```json
{
  "building": {
    "location": "string",
    "type": "office|retail|healthcare|industrial",
    "gross_area": "number (ft2)",
    "floors": "number"
  },
  "design_criteria": {
    "indoor_summer": {
      "temp": "number (F)",
      "rh": "number (%)"
    },
    "indoor_winter": {
      "temp": "number (F)"
    },
    "ventilation_standard": "ASHRAE 62.1|local code"
  },
  "internal_loads": {
    "occupancy": "number (people)",
    "lighting": "number (W/ft2)",
    "equipment": "number (W/ft2)"
  }
}
```

## Output Schema

```json
{
  "loads": {
    "peak_cooling": "number (tons)",
    "peak_heating": "number (MBH)",
    "ventilation": "number (CFM)"
  },
  "equipment": {
    "ahu": [{
      "designation": "string",
      "supply_cfm": "number",
      "cooling_tons": "number",
      "heating_mbh": "number"
    }],
    "chiller": {
      "type": "string",
      "capacity": "number (tons)",
      "efficiency": "number (kW/ton)"
    },
    "boiler": {
      "type": "string",
      "capacity": "number (MBH)",
      "efficiency": "number (%)"
    }
  },
  "energy_analysis": {
    "annual_cooling": "number (kWh)",
    "annual_heating": "number (therms)",
    "eui": "number (kBtu/ft2/yr)"
  }
}
```

## Best Practices

1. Use ASHRAE weather data for design conditions
2. Apply appropriate safety factors (10-15% typical)
3. Consider zone diversity for central equipment
4. Verify ventilation rates meet ASHRAE 62.1
5. Model energy performance before finalizing design
6. Coordinate with architectural and structural disciplines

## Integration Points

- Connects with CFD Analysis for airflow modeling
- Feeds into Thermal Analysis for component design
- Supports Building Energy Simulation for annual performance
- Integrates with Control System Design for automation
