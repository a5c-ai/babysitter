---
name: process-capability-calculator
description: Process capability analysis skill with Cp, Cpk, Pp, Ppk calculations and specification compliance assessment
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: six-sigma-spc
---

# Process Capability Calculator

## Overview

The Process Capability Calculator skill provides comprehensive capabilities for analyzing process capability against specification limits. It supports multiple capability indices, normality testing, and defect rate estimation for both short-term and long-term performance assessment.

## Capabilities

- Capability index calculation (Cp, Cpk, Pp, Ppk)
- Specification limit analysis
- Process performance metrics
- Normality testing
- Non-normal data transformation
- Capability histogram generation
- PPM defect rate estimation

## Used By Processes

- SIX-003: Process Capability Analysis
- SIX-002: Statistical Process Control Implementation
- QMS-004: Cost of Quality Analysis

## Tools and Libraries

- Statistical software APIs
- Quality analysis libraries
- Data transformation tools
- Visualization libraries

## Usage

```yaml
skill: process-capability-calculator
inputs:
  data: [10.2, 10.1, 10.3, 10.0, 10.2, 10.4, 10.3, 10.2, 10.5, 10.3]
  specification_limits:
    usl: 10.8
    lsl: 9.2
    target: 10.0
  analysis_type: "short_term"  # short_term | long_term
  normality_test: true
outputs:
  - capability_indices
  - ppm_estimates
  - sigma_level
  - histogram_with_specs
  - normality_assessment
  - recommendations
```

## Capability Index Formulas

### Short-Term (Potential) Capability

```
Cp = (USL - LSL) / (6 * sigma_within)

Cpk = min[(USL - mean) / (3 * sigma_within), (mean - LSL) / (3 * sigma_within)]
```

### Long-Term (Actual) Performance

```
Pp = (USL - LSL) / (6 * sigma_overall)

Ppk = min[(USL - mean) / (3 * sigma_overall), (mean - LSL) / (3 * sigma_overall)]
```

## Capability Interpretation

| Cp/Cpk Value | Interpretation | Sigma Level |
|--------------|----------------|-------------|
| < 0.67 | Very poor | < 2 sigma |
| 0.67 - 1.00 | Poor | 2 - 3 sigma |
| 1.00 - 1.33 | Marginal | 3 - 4 sigma |
| 1.33 - 1.67 | Good | 4 - 5 sigma |
| 1.67 - 2.00 | Very good | 5 - 6 sigma |
| > 2.00 | Excellent | > 6 sigma |

## PPM Defect Rate Estimation

| Cpk | PPM (one-sided) | % Yield |
|-----|-----------------|---------|
| 1.00 | 1,350 | 99.865% |
| 1.33 | 32 | 99.997% |
| 1.67 | 0.3 | 99.99997% |
| 2.00 | 0.001 | 99.9999999% |

## Integration Points

- Quality Management Systems
- Statistical analysis software
- SPC platforms
- Customer reporting systems
