---
name: crystallography-analysis
description: Advanced skill for crystallographic structure analysis and determination including space group identification, atomic position refinement, and PDF analysis
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
    - GSAS-II
    - VESTA
    - CrystalMaker
    - Mercury
    - PDFgui
---

# Crystallography Analysis Skill

## Purpose

The Crystallography Analysis skill provides advanced capabilities for determining and analyzing crystal structures from diffraction data, enabling detailed structural characterization of crystalline materials including phase identification, symmetry analysis, and local structure determination through pair distribution function methods.

## Capabilities

- Space group determination and symmetry analysis
- Atomic position refinement
- Disorder and defect modeling
- Structure factor calculation
- Pair distribution function (PDF) analysis
- Neutron diffraction data analysis
- Single-crystal structure solution
- Reciprocal space mapping interpretation

## Usage Guidelines

### Space Group Determination

1. **Systematic Absence Analysis**
   - Identify extinct reflections from diffraction pattern
   - Determine Bravais lattice type
   - Assign possible space groups from extinction conditions

2. **Symmetry Verification**
   - Check intensity statistics for centrosymmetry
   - Verify Laue class assignment
   - Consider twinning if symmetry ambiguous

3. **Structure Validation**
   - Use checkCIF for validation
   - Verify bond distances and angles
   - Check displacement parameters for physical reasonableness

### Rietveld Refinement

1. **Starting Model**
   - Use published structure or ab initio solution
   - Verify unit cell parameters from indexing
   - Set appropriate peak shape function

2. **Refinement Strategy**
   - Refine background first, then scale
   - Add profile parameters gradually
   - Refine atomic positions with appropriate constraints

3. **Quality Metrics**
   - Monitor Rwp, Rp, chi-squared
   - Check difference curve for systematic errors
   - Validate with independent techniques

### Pair Distribution Function (PDF)

1. **Data Collection**
   - Use high Q-range data (synchrotron or Mo source)
   - Measure to Q > 20 A^-1 for adequate resolution
   - Collect background and container separately

2. **Data Reduction**
   - Apply corrections (absorption, polarization, Compton)
   - Normalize to obtain S(Q)
   - Fourier transform to obtain G(r)

3. **PDF Modeling**
   - Use small-box modeling for average structure
   - Apply reverse Monte Carlo for complex disorder
   - Consider multiple phases and nanoparticle effects

## Process Integration

- MS-001: XRD Analysis & Phase Identification
- MS-002: Electron Microscopy Characterization

## Input Schema

```json
{
  "sample_id": "string",
  "data_type": "powder_xrd|single_crystal|neutron|electron|pdf",
  "data_file": "string (path)",
  "wavelength": "number (Angstrom)",
  "analysis_type": "phase_id|refinement|structure_solution|pdf_fit",
  "starting_model": "string (CIF file, optional)"
}
```

## Output Schema

```json
{
  "sample_id": "string",
  "space_group": "string",
  "unit_cell": {
    "a": "number (Angstrom)",
    "b": "number (Angstrom)",
    "c": "number (Angstrom)",
    "alpha": "number (degrees)",
    "beta": "number (degrees)",
    "gamma": "number (degrees)"
  },
  "atomic_positions": [
    {
      "atom": "string",
      "site": "string",
      "x": "number",
      "y": "number",
      "z": "number",
      "occupancy": "number",
      "Uiso": "number (Angstrom^2)"
    }
  ],
  "r_factors": {
    "Rwp": "number",
    "Rp": "number",
    "chi_squared": "number"
  }
}
```

## Best Practices

1. Always index pattern before attempting structure solution
2. Use multiple space group possibilities if extinction conditions ambiguous
3. Apply soft constraints for chemically reasonable structures
4. Validate refined structures against bond valence sums
5. Report estimated standard deviations from refinement
6. Use combined refinement for multi-technique data when available

## Integration Points

- Connects with XRD Analysis for powder data processing
- Feeds into DFT Calculation for structure verification
- Supports Electron Microscopy for SAED indexing
- Integrates with Materials Database for structure archival
