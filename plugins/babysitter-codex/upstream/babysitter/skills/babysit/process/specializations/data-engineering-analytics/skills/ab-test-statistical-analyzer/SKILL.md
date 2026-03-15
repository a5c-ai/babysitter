---
name: A/B Test Statistical Analyzer
description: Performs statistical analysis for A/B testing experiments
version: 1.0.0
category: Analytics
skillId: SK-DEA-014
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# A/B Test Statistical Analyzer

## Overview

Performs statistical analysis for A/B testing experiments. This skill provides rigorous statistical methods to determine experiment validity and significance.

## Capabilities

- Sample size calculation
- Statistical significance testing
- Bayesian analysis
- Sequential testing
- Multi-armed bandit analysis
- Segment analysis
- Novelty/primacy effect detection
- SRM (Sample Ratio Mismatch) detection
- Confidence interval calculation
- Power analysis

## Input Schema

```json
{
  "experimentData": {
    "control": "object",
    "variants": ["object"]
  },
  "metrics": [{
    "name": "string",
    "type": "conversion|continuous|ratio"
  }],
  "analysisType": "frequentist|bayesian|sequential"
}
```

## Output Schema

```json
{
  "results": [{
    "metric": "string",
    "controlValue": "number",
    "variantValues": ["number"],
    "pValue": "number",
    "confidenceInterval": "object",
    "significant": "boolean"
  }],
  "srmCheck": "object",
  "recommendation": "string"
}
```

## Target Processes

- A/B Testing Pipeline
- Feature Store Setup

## Usage Guidelines

1. Provide complete experiment data for control and variants
2. Define metrics with appropriate types
3. Select analysis methodology based on requirements
4. Review SRM checks before interpreting results

## Best Practices

- Always check for sample ratio mismatch before analysis
- Use appropriate statistical tests for metric types
- Consider practical significance alongside statistical significance
- Account for multiple comparison corrections
- Document assumptions and limitations
