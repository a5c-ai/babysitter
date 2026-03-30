---
name: audit-sampling-calculator
description: Statistical and non-statistical audit sampling skill with sample size determination and evaluation
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: finance-accounting
  domain: business
  category: audit
  priority: medium
  shared: true
---

# Audit Sampling Calculator

## Overview

The Audit Sampling Calculator skill provides comprehensive audit sampling capabilities for both statistical and non-statistical approaches. It supports sample size determination, selection, and evaluation across various audit contexts.

## Capabilities

### Attribute Sampling
- Sample size calculation
- Expected error rate input
- Tolerable deviation rate
- Confidence level selection
- Upper error limit calculation
- Pass/fail evaluation

### Monetary Unit Sampling (MUS)
- Population stratification
- Sampling interval calculation
- Selection methodology
- Projected error calculation
- Upper error bound
- Tainting analysis

### Classical Variables Sampling
- Mean-per-unit estimation
- Difference estimation
- Ratio estimation
- Standard deviation calculation
- Precision determination
- Confidence interval

### Sample Size Calculation
- Risk model inputs
- Tolerable misstatement
- Expected misstatement
- Confidence factors
- Population characteristics
- Prior year results

### Projection of Errors
- Known error projection
- Likely error calculation
- Sampling risk assessment
- Anomalous error treatment
- Extrapolation methods
- Documentation requirements

### Confidence Level Analysis
- Risk of incorrect acceptance
- Risk of incorrect rejection
- Achieved precision
- Sample result evaluation
- Decision criteria
- Conclusion documentation

## Usage

### Substantive Testing Sample
```
Input: Population, materiality, risk assessment, expected error
Process: Calculate sample size, select items, project results
Output: Sample selection, projected misstatement, audit conclusion
```

### Control Testing Sample
```
Input: Control population, tolerable rate, expected rate
Process: Determine sample, execute testing, evaluate results
Output: Upper deviation rate, control reliance conclusion
```

## Integration

### Used By Processes
- Internal Audit Planning and Execution
- SOX Compliance and Testing
- External Audit Coordination

### Tools and Libraries
- IDEA
- ACL Analytics
- Statistical sampling libraries
- Audit workpaper platforms

### Cross-Specialization Use
- QA Testing Automation
- Data Quality domains

## Best Practices

1. Document sampling methodology selection rationale
2. Ensure random selection integrity
3. Investigate all identified errors
4. Consider qualitative factors in evaluation
5. Maintain population completeness
6. Archive sampling parameters for reference
