---
name: vibration-analysis
description: Expert skill for modal analysis, frequency response, and vibration characterization of mechanical systems
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
    - ANSYS Mechanical
    - MSC NASTRAN
    - LMS Test.Lab
    - MATLAB
---

# Dynamics and Vibration Analysis Skill

## Purpose

The Dynamics and Vibration Analysis skill provides expert capabilities for modal analysis, frequency response, and vibration characterization of mechanical systems, enabling systematic evaluation of dynamic behavior and resonance avoidance.

## Capabilities

- Natural frequency and mode shape extraction
- Modal participation factor analysis
- Harmonic response analysis configuration
- Random vibration (PSD) analysis
- Transient dynamic response simulation
- Shock response spectrum (SRS) analysis
- Damping estimation and modeling
- Vibration test correlation and model updating

## Usage Guidelines

### Modal Analysis

#### Natural Frequency Extraction

1. **Analysis Setup**
   - Define mass distribution accurately
   - Include structural stiffness
   - Apply appropriate boundary conditions
   - Request sufficient modes

2. **Mode Shape Interpretation**
   ```
   Mode 1-6: Rigid body modes (if unconstrained)
   Mode 7+: Flexible modes

   Modal Effective Mass > 5%: Significant participation
   ```

3. **Frequency Targets**
   | Application | Typical First Mode Target |
   |-------------|--------------------------|
   | Machine mount | > 2x operating speed |
   | Building floor | > 8 Hz (human comfort) |
   | Aerospace | Per environment specification |
   | Automotive | Avoid engine orders |

#### Modal Participation Factors

1. **Effective Mass**
   ```
   Meff = (phi^T * M * r)^2 / (phi^T * M * phi)

   Where:
   phi = mode shape
   M = mass matrix
   r = direction vector
   ```

2. **Mode Selection**
   - Include modes with significant effective mass
   - Typically capture 90%+ of total mass
   - Consider all excitation directions

### Harmonic Response Analysis

1. **Frequency Range**
   - Start below first mode
   - Include all modes of interest
   - Extend beyond highest excitation frequency

2. **Damping Specification**
   | Damping Type | Typical Values |
   |--------------|----------------|
   | Structural steel | 1-3% critical |
   | Aluminum | 0.5-2% |
   | Bolted joints | 2-5% |
   | Elastomers | 5-20% |

3. **Response Quantities**
   - Displacement amplitude and phase
   - Acceleration at critical points
   - Dynamic stress at notches
   - Reaction forces

### Random Vibration Analysis

1. **PSD Input Definition**
   ```
   Acceleration PSD: g^2/Hz
   Force PSD: N^2/Hz

   Common profiles:
   - MIL-STD-810
   - NAVMAT P-9492
   - Customer specification
   ```

2. **Response Statistics**
   ```
   1-sigma response: RMS value
   3-sigma response: RMS * 3 (99.7% probability)
   ```

3. **Fatigue from Random Vibration**
   - Calculate stress PSD
   - Determine zero-crossing frequency
   - Apply Steinberg or Dirlik methods

### Shock Response Spectrum (SRS)

1. **SRS Generation**
   - Time history to SRS conversion
   - Q factor specification
   - Frequency resolution

2. **Design Verification**
   - Compare component modes to SRS
   - Calculate maximum response
   - Apply dynamic amplification

### Transient Dynamic Analysis

1. **Time Step Selection**
   ```
   dt <= T_min / 20

   Where:
   T_min = period of highest frequency of interest
   ```

2. **Integration Methods**
   - Implicit (Newmark): Large time steps, unconditionally stable
   - Explicit: Small time steps, high-frequency accuracy
   - Modal superposition: Efficient for linear systems

## Process Integration

- ME-009: Dynamics and Vibration Analysis

## Input Schema

```json
{
  "structure": "FEA model reference",
  "analysis_type": "modal|harmonic|random|transient|srs",
  "boundary_conditions": {
    "type": "fixed|free|constrained",
    "locations": "array"
  },
  "excitation": {
    "type": "base|force|pressure",
    "frequency_range": [0, 2000],
    "psd_profile": "array (if random)",
    "time_history": "array (if transient)"
  },
  "damping": {
    "type": "modal|Rayleigh|structural",
    "value": "number or array"
  },
  "output_locations": ["node IDs or named selections"]
}
```

## Output Schema

```json
{
  "modal_results": {
    "frequencies": "array (Hz)",
    "mode_shapes": "reference to shapes",
    "effective_mass": {
      "X": "array",
      "Y": "array",
      "Z": "array"
    },
    "cumulative_mass": "object"
  },
  "response_results": {
    "max_displacement": "number (m)",
    "max_acceleration": "number (g)",
    "max_stress": "number (Pa)",
    "location": "string"
  },
  "frequency_response": {
    "frequencies": "array",
    "amplitude": "array",
    "phase": "array"
  },
  "random_statistics": {
    "rms_values": "object",
    "three_sigma_values": "object"
  }
}
```

## Best Practices

1. Verify mass and stiffness before modal analysis
2. Include sufficient modes to capture total effective mass
3. Use measured damping values when available
4. Validate models with experimental modal analysis
5. Consider nonlinear effects for large amplitudes
6. Document all damping assumptions

## Integration Points

- Connects with FEA Structural for model input
- Feeds into Test Correlation for validation
- Supports Fatigue Analysis for vibration-induced fatigue
- Integrates with Mechanism Design for rotating machinery
