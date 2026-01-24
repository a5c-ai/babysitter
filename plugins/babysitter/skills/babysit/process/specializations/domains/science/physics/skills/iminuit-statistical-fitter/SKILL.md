---
name: iminuit-statistical-fitter
description: iminuit statistical fitting skill for physics data analysis with proper error handling and profile likelihood
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Task
metadata:
  version: "1.0"
  category: data-analysis
  domain: physics
  tools:
    - iminuit
    - probfit
    - zfit
  processes:
    - statistical-analysis-pipeline
    - systematic-uncertainty-evaluation
    - blinded-analysis-protocol
---

# iminuit Statistical Fitter Skill

## Purpose

Provides iminuit (Python interface to MINUIT) capabilities for statistical fitting in physics with proper error estimation, profile likelihood analysis, and constrained optimization.

## Capabilities

- **MINUIT Algorithms**: MIGRAD, SIMPLEX, SCAN minimization
- **HESSE Errors**: Symmetric error estimation from Hessian matrix
- **MINOS Errors**: Asymmetric errors from profile likelihood
- **Profile Likelihood**: Compute likelihood profiles and contours
- **Constrained Fitting**: Handle parameter limits and constraints
- **Simultaneous Fits**: Fit multiple datasets with shared parameters

## Usage Guidelines

1. **Cost Function Definition**
   - Define negative log-likelihood or chi-square
   - Specify parameter names and initial values
   - Set parameter limits if needed
   - Enable gradient computation if available

2. **Minimization**
   - Run MIGRAD for robust minimization
   - Check for convergence (is_valid)
   - Verify covariance matrix quality
   - Retry with different starting points if needed

3. **Error Estimation**
   - Run HESSE for symmetric errors
   - Run MINOS for asymmetric errors on key parameters
   - Check for boundary effects
   - Compute correlation matrix

4. **Profile Analysis**
   - Scan parameters around minimum
   - Compute 2D confidence contours
   - Identify degenerate solutions
   - Validate error estimates

5. **Best Practices**
   - Validate fit with pull distributions
   - Check fit quality with goodness-of-fit tests
   - Document all fit settings
   - Report correlations for physics parameters
