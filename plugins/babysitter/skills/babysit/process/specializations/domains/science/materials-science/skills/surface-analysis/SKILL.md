---
name: surface-analysis
description: Skill for surface composition, chemical state, and topography analysis including XPS depth profiling, AFM imaging, and contact angle measurements
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
    - CasaXPS
    - Gwyddion
    - AFM analysis software
    - ImageJ
---

# Surface Analysis Skill

## Purpose

The Surface Analysis skill provides comprehensive capabilities for characterizing material surfaces, enabling detailed analysis of surface composition, chemical bonding states, topography, and interfacial properties critical for understanding surface-sensitive phenomena.

## Capabilities

- XPS depth profiling and chemical state analysis
- AFM imaging and roughness quantification
- Contact angle measurement and surface energy calculation
- Profilometry data analysis
- Surface contamination identification
- Tribological surface analysis
- Coating thickness measurement
- Adhesion mechanism analysis

## Usage Guidelines

### X-ray Photoelectron Spectroscopy (XPS)

1. **Survey Spectra**
   - Acquire wide scan (0-1200 eV) for elemental identification
   - Identify all elements present above detection limit (~0.1 at%)
   - Note adventitious carbon for charge referencing

2. **High-Resolution Spectra**
   - Acquire narrow scans for elements of interest
   - Use appropriate pass energy (20-50 eV typical)
   - Ensure sufficient signal-to-noise for peak fitting

3. **Peak Fitting**
   - Apply Shirley or linear background
   - Constrain FWHM and peak shape within physical limits
   - Assign chemical states from binding energy shifts

4. **Depth Profiling**
   - Use Ar+ sputtering for inorganic materials
   - Consider cluster ions (Ar-cluster, C60) for organics
   - Monitor for preferential sputtering and mixing

### Atomic Force Microscopy (AFM)

1. **Imaging Mode Selection**
   - Contact mode: Hard surfaces, atomic resolution
   - Tapping mode: Soft samples, reduced tip wear
   - Non-contact: Minimal surface interaction

2. **Image Analysis**
   - Calculate roughness parameters (Ra, RMS, Rmax)
   - Identify surface features and defects
   - Measure step heights and feature dimensions

3. **Force Spectroscopy**
   - Acquire force-distance curves
   - Extract adhesion forces
   - Map mechanical properties (modulus, stiffness)

### Contact Angle Analysis

1. **Measurement Methods**
   - Sessile drop for static contact angle
   - Advancing/receding for dynamic behavior
   - Wilhelmy plate for surface tension

2. **Surface Energy Calculation**
   - Owens-Wendt method (dispersive + polar)
   - Van Oss-Chaudhury-Good (acid-base)
   - Use multiple probe liquids (water, diiodomethane, formamide)

3. **Interpretation**
   - Hydrophilic: Contact angle < 90 degrees
   - Hydrophobic: Contact angle > 90 degrees
   - Superhydrophobic: Contact angle > 150 degrees

## Process Integration

- MS-003: Spectroscopic Analysis Suite
- MS-015: Thin Film Deposition Protocol

## Input Schema

```json
{
  "sample_id": "string",
  "technique": "XPS|AFM|contact_angle|profilometry",
  "analysis_type": "survey|depth_profile|imaging|force_spectroscopy|wettability",
  "parameters": {
    "scan_area": "number (um x um for AFM)",
    "sputter_depth": "number (nm for XPS)",
    "probe_liquids": ["string (for contact angle)"]
  }
}
```

## Output Schema

```json
{
  "sample_id": "string",
  "xps_results": {
    "elemental_composition": [
      {
        "element": "string",
        "concentration": "number (at%)",
        "chemical_states": [
          {
            "state": "string",
            "binding_energy": "number (eV)",
            "fraction": "number (percent)"
          }
        ]
      }
    ],
    "depth_profile": {
      "depth": ["number (nm)"],
      "composition": {}
    }
  },
  "afm_results": {
    "roughness": {
      "Ra": "number (nm)",
      "RMS": "number (nm)",
      "Rmax": "number (nm)"
    },
    "features": ["string"]
  },
  "surface_energy": {
    "total": "number (mJ/m2)",
    "dispersive": "number (mJ/m2)",
    "polar": "number (mJ/m2)"
  }
}
```

## Best Practices

1. Clean samples appropriately before analysis (solvent, plasma)
2. Use charge neutralization for insulating samples in XPS
3. Reference XPS binding energies to C 1s at 284.8 eV
4. Calibrate AFM z-scale with step height standards
5. Use fresh probe liquids for contact angle measurements
6. Report measurement conditions and uncertainties

## Integration Points

- Connects with Spectroscopy Analysis for complementary chemical information
- Feeds into Thin Film Deposition for process monitoring
- Supports Failure Analysis for surface contamination identification
- Integrates with Corrosion Assessment for passive layer analysis
