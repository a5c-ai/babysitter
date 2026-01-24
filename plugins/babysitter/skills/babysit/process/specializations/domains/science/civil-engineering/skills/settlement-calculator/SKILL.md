---
name: settlement-calculator
description: Foundation settlement calculation skill for immediate, consolidation, and secondary compression
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - Bash
metadata:
  specialization: civil-engineering
  domain: science
  category: Geotechnical Analysis
  skill-id: CIV-SK-010
---

# Settlement Calculator Skill

## Purpose

The Settlement Calculator Skill calculates foundation settlements including immediate (elastic) settlement, primary consolidation, and secondary compression using established geotechnical methods.

## Capabilities

- Immediate (elastic) settlement
- Consolidation settlement (1D theory)
- Secondary compression
- Time-rate of consolidation
- Differential settlement analysis
- Tolerable settlement checks
- Settlement beneath rigid foundations
- Stress distribution calculations

## Usage Guidelines

### When to Use
- Estimating foundation settlement
- Evaluating differential settlement
- Time-rate predictions
- Tolerable settlement verification

### Prerequisites
- Soil compressibility data available
- Foundation loads defined
- Groundwater conditions known
- Soil stratigraphy established

### Best Practices
- Use appropriate stress distribution
- Consider soil variability
- Account for adjacent structures
- Verify with field monitoring

## Process Integration

This skill integrates with:
- Foundation Design
- Geotechnical Site Investigation

## Configuration

```yaml
settlement-calculator:
  settlement-types:
    - immediate
    - consolidation
    - secondary
  methods:
    - elastic
    - terzaghi-1d
    - stress-history
  output:
    - magnitude
    - time-rate
    - differential
```

## Output Artifacts

- Settlement calculations
- Time-settlement curves
- Differential settlement maps
- Tolerable settlement checks
