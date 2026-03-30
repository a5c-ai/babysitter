---
name: fatigue-analysis
description: Specialized skill for fatigue life assessment and durability prediction under cyclic loading conditions
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
  phase: 5
  tools-libraries:
    - nCode DesignLife
    - Fe-Safe
    - NASGRO
    - AFGROW
    - MATLAB
---

# Fatigue Life Prediction Skill

## Purpose

The Fatigue Life Prediction skill provides specialized capabilities for assessing fatigue life and durability under cyclic loading conditions, enabling systematic evaluation of component life using stress-life, strain-life, and fracture mechanics approaches.

## Capabilities

- Stress-life (S-N) curve application and analysis
- Strain-life (epsilon-N) methodology implementation
- Fracture mechanics crack growth prediction (NASGRO, AFGROW)
- Load spectrum development and cycle counting (rainflow)
- Damage accumulation using Miner's rule
- Mean stress correction methods (Goodman, Gerber, Soderberg)
- Multiaxial fatigue assessment
- Fatigue report generation with life predictions

## Usage Guidelines

### Fatigue Analysis Approaches

#### Stress-Life Method (S-N)

1. **Application**
   - High-cycle fatigue (N > 10^4 cycles)
   - Elastic stress conditions
   - Rotating machinery, vibration loading

2. **S-N Curve Development**
   ```
   S = A * N^b

   Where:
   S = stress amplitude
   N = cycles to failure
   A, b = material constants
   ```

3. **Endurance Limit Modifiers**
   ```
   Se = Se' * ka * kb * kc * kd * ke * kf

   Where:
   ka = surface factor
   kb = size factor
   kc = load factor
   kd = temperature factor
   ke = reliability factor
   kf = miscellaneous effects
   ```

#### Strain-Life Method (epsilon-N)

1. **Application**
   - Low-cycle fatigue (N < 10^4 cycles)
   - Plastic strain present
   - Notched components

2. **Coffin-Manson Equation**
   ```
   epsilon_a = (sigma_f'/E) * (2Nf)^b + epsilon_f' * (2Nf)^c

   Where:
   epsilon_a = strain amplitude
   sigma_f' = fatigue strength coefficient
   b = fatigue strength exponent
   epsilon_f' = fatigue ductility coefficient
   c = fatigue ductility exponent
   ```

3. **Neuber's Rule for Notches**
   ```
   (Kt * S)^2 / E = sigma * epsilon
   ```

#### Fracture Mechanics

1. **Application**
   - Damage tolerance analysis
   - Crack growth life prediction
   - Inspection interval determination

2. **Paris Law**
   ```
   da/dN = C * (delta_K)^m

   Where:
   da/dN = crack growth rate
   delta_K = stress intensity factor range
   C, m = material constants
   ```

3. **Stress Intensity Factor**
   ```
   K = beta * S * sqrt(pi * a)

   Where:
   beta = geometry factor
   S = remote stress
   a = crack length
   ```

### Load Spectrum Development

1. **Rainflow Cycle Counting**
   - Extract cycles from complex load history
   - Identify cycle ranges and means
   - Generate cycle count matrix

2. **Damage Summation**
   ```
   D = sum(ni/Ni)

   Failure when D >= 1.0
   ```

3. **Load Sequence Effects**
   - Consider overload retardation
   - Evaluate block loading effects
   - Apply appropriate interaction models

### Mean Stress Corrections

| Method | Equation | Application |
|--------|----------|-------------|
| Goodman | Sa/Se + Sm/Su = 1 | Conservative, most common |
| Gerber | Sa/Se + (Sm/Su)^2 = 1 | Less conservative |
| Soderberg | Sa/Se + Sm/Sy = 1 | Very conservative |
| Morrow | Sa/Se + Sm/sigma_f' = 1 | Strain-life approach |

## Process Integration

- ME-008: Fatigue Life Prediction

## Input Schema

```json
{
  "component": "string",
  "material": {
    "name": "string",
    "Su": "number (Pa)",
    "Sy": "number (Pa)",
    "Se_prime": "number (Pa)",
    "sigma_f_prime": "number (Pa)",
    "epsilon_f_prime": "number",
    "b": "number",
    "c": "number"
  },
  "loading": {
    "type": "constant_amplitude|spectrum",
    "stress_amplitude": "number (Pa)",
    "mean_stress": "number (Pa)",
    "spectrum_file": "string (if spectrum)"
  },
  "geometry": {
    "Kt": "number (stress concentration)",
    "surface_finish": "string",
    "size": "number (mm)"
  },
  "target_life": "number (cycles)",
  "reliability": "number (0-1)"
}
```

## Output Schema

```json
{
  "fatigue_life": {
    "predicted_cycles": "number",
    "safety_factor": "number",
    "critical_location": "string"
  },
  "damage_summary": {
    "total_damage": "number",
    "damage_by_range": "array"
  },
  "analysis_details": {
    "method_used": "string",
    "mean_stress_correction": "string",
    "modifying_factors": "object"
  },
  "recommendations": {
    "design_changes": "array",
    "inspection_interval": "number (if applicable)"
  }
}
```

## Best Practices

1. Use appropriate method for expected life regime (HCF vs LCF)
2. Include all relevant modifying factors
3. Account for mean stress effects
4. Validate material properties from tested data
5. Consider multiaxial stress states for complex loading
6. Apply appropriate safety factors per industry standards

## Integration Points

- Connects with FEA Structural for stress inputs
- Feeds into Test Planning for validation requirements
- Supports Material Selection for fatigue-resistant materials
- Integrates with Design Review for life certification
