---
name: nta-particle-tracker
description: Nanoparticle Tracking Analysis skill for single-particle size and concentration measurements
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: nanotechnology
  domain: science
  category: microscopy-characterization
  priority: medium
  phase: 6
  tools-libraries:
    - NanoSight NTA software
    - ZetaView software
---

# NTA Particle Tracker

## Purpose

The NTA Particle Tracker skill provides single-particle tracking analysis for nanoparticle size and concentration measurements, offering particle-by-particle characterization through direct visualization.

## Capabilities

- Single-particle tracking
- Size-concentration profiles
- Fluorescence NTA mode
- Real-time size distribution
- Particle count and concentration
- Sample heterogeneity assessment

## Usage Guidelines

### NTA Measurement

1. **Sample Preparation**
   - Dilute to 10^7-10^9 particles/mL
   - Avoid air bubbles
   - Use appropriate buffer

2. **Acquisition**
   - Optimize camera level
   - Set detection threshold
   - Record multiple videos

3. **Analysis**
   - Track minimum 1000 particles
   - Set minimum track length
   - Generate size-concentration plot

## Process Integration

- Statistical Particle Size Distribution Analysis
- Nanoparticle Drug Delivery System Development

## Input Schema

```json
{
  "sample_id": "string",
  "mode": "scatter|fluorescence",
  "dilution_factor": "number",
  "capture_time": "number (seconds)",
  "number_of_captures": "number"
}
```

## Output Schema

```json
{
  "concentration": "number (particles/mL)",
  "mean_size": "number (nm)",
  "mode_size": "number (nm)",
  "d10": "number (nm)",
  "d50": "number (nm)",
  "d90": "number (nm)",
  "size_distribution": {"sizes": [], "counts": []},
  "particles_tracked": "number"
}
```
