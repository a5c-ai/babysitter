---
name: tolerance-stackup
description: Skill for dimensional tolerance analysis and stack-up calculations
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: mechanical-engineering
  domain: science
  category: design-development
  priority: medium
  phase: 8
  tools-libraries:
    - CETOL 6 Sigma
    - 3DCS
    - VSA
    - Excel
---

# Tolerance Stack-Up Analysis Skill

## Purpose

The Tolerance Stack-Up Analysis skill provides capabilities for dimensional tolerance analysis and stack-up calculations, enabling verification of assembly fits and functional requirements through systematic tolerance chain analysis.

## Capabilities

- Worst-case tolerance analysis
- Statistical (RSS) tolerance analysis
- Monte Carlo tolerance simulation
- GD&T-based stack-up analysis
- Assembly feasibility verification
- Tolerance allocation optimization
- CETOL/3DCS integration
- Stack-up report generation

## Usage Guidelines

### Tolerance Analysis Methods

#### Method Comparison

| Method | Approach | Application | Result |
|--------|----------|-------------|--------|
| Worst-case | All tolerances at limit | Safety critical | Maximum variation |
| RSS | Statistical combination | High volume production | Probable variation |
| Monte Carlo | Random sampling | Complex assemblies | Distribution |
| 6-Sigma | Process capability | Quality control | Defect rate |

### Worst-Case Analysis

#### Linear Stack-Up

```
Gap = Nominal gap +/- sum of all tolerances

For a simple assembly:
Gap_min = Nominal - sum(all positive contributors)
Gap_max = Nominal + sum(all negative contributors)

Or using sensitivity:
Gap = sum(ai * xi)
Tolerance = sum(|ai| * ti)

Where:
ai = sensitivity coefficient (+1 or -1)
xi = nominal dimension
ti = tolerance on dimension i
```

#### Direction Convention

```
Define positive direction:
- Dimensions adding to gap: positive (+1)
- Dimensions subtracting from gap: negative (-1)

Example (shaft in hole):
Gap = Hole_dia - Shaft_dia
Hole: +1 (increases gap)
Shaft: -1 (decreases gap)
```

### Statistical Analysis

#### Root Sum Square (RSS)

```
Statistical tolerance (RSS):
T_rss = sqrt(sum(ti^2))

For unequal distributions (weighted):
T_rss = sqrt(sum((ai * ti)^2))

Assumes:
- Normal distribution
- Independent variables
- Process centered at nominal
```

#### Process Capability

```
Cp = (USL - LSL) / (6 * sigma)
Cpk = min((USL - mean)/(3*sigma), (mean - LSL)/(3*sigma))

For 6-sigma quality:
Cpk >= 2.0
PPM defective < 3.4

For tolerance analysis:
sigma = T / (3 * k)

Where k depends on desired Cpk:
k = 3 for Cpk = 1.0
k = 4 for Cpk = 1.33
k = 6 for Cpk = 2.0
```

### Monte Carlo Simulation

#### Simulation Process

```
1. Define distribution for each dimension
   - Normal: mean, sigma
   - Uniform: min, max
   - Skewed: appropriate parameters

2. Generate random samples (N = 10,000+)
3. Calculate assembly result for each sample
4. Analyze output distribution
5. Determine percent out-of-spec
```

#### Distribution Selection

| Scenario | Distribution | Parameters |
|----------|--------------|------------|
| Machined feature | Normal | Nominal, T/6 (Cpk=2) |
| Purchased part | Normal/Uniform | Per vendor data |
| Press fit | Truncated normal | Limits at tolerance |
| Unknown process | Uniform | Min, max |

### GD&T in Stack-Ups

#### Including GD&T

```
Position tolerance contribution:
Dia_positional / 2 = linear contribution (per direction)

For MMC position:
Contribution = (Position_tol + Bonus_tol) / 2

Bonus tolerance:
Bonus = |Actual_size - MMC_size|
```

#### Datum Reference Frame

```
Stack-up must follow datum precedence:
1. Establish primary datum (constrains normal)
2. Establish secondary datum (constrains one rotation)
3. Establish tertiary datum (constrains remaining DOF)

Feature control frame specifies:
|Position|0.5 MMC|A|B|C|
```

### Analysis Process

#### Stack-Up Procedure

1. **Define the Problem**
   - What gap/clearance is being analyzed?
   - What is the acceptance criterion?
   - What components are involved?

2. **Create the Loop Diagram**
   - Start at one surface
   - Follow chain to other surface
   - Identify all contributors
   - Assign directions

3. **Gather Data**
   - Nominal dimensions
   - Tolerances (bilateral, unilateral)
   - Process capabilities
   - Distribution data

4. **Perform Calculation**
   - Calculate nominal gap
   - Calculate worst-case variation
   - Calculate statistical variation
   - Compare to requirement

5. **Document Results**
   - Stack-up spreadsheet
   - Loop diagram
   - Conclusions and recommendations

### Tolerance Allocation

#### Optimization Strategies

```
If tolerance too tight:
1. Increase gap nominal (if possible)
2. Tighten critical dimension tolerances
3. Add adjustment or shim
4. Change assembly method
5. Accept higher defect rate

If tolerance too loose:
1. Relax non-critical tolerances
2. Reduce manufacturing cost
```

#### Cost-Tolerance Relationship

```
Approximate relationship:
Cost ~ 1 / Tolerance^n

Where n ~ 1.5 to 2 for machining

Tighten tolerances on:
- Lower cost features
- Higher sensitivity contributors
```

## Process Integration

- ME-004: GD&T Specification and Drawing Creation

## Input Schema

```json
{
  "analysis_name": "string",
  "requirement": {
    "type": "gap|clearance|interference|alignment",
    "nominal": "number",
    "min": "number",
    "max": "number"
  },
  "contributors": [
    {
      "name": "string",
      "nominal": "number",
      "tolerance": "number (bilateral half)",
      "direction": "+1|-1",
      "distribution": "normal|uniform",
      "cpk": "number (if normal)"
    }
  ],
  "method": "worst_case|rss|monte_carlo|all"
}
```

## Output Schema

```json
{
  "analysis_summary": {
    "requirement": {
      "min": "number",
      "max": "number"
    },
    "nominal_result": "number"
  },
  "worst_case": {
    "min_result": "number",
    "max_result": "number",
    "pass_fail": "pass|fail",
    "margin": "number"
  },
  "statistical": {
    "mean": "number",
    "sigma": "number",
    "min_3sigma": "number",
    "max_3sigma": "number",
    "percent_out_of_spec": "number",
    "cpk": "number"
  },
  "monte_carlo": {
    "mean": "number",
    "sigma": "number",
    "min_observed": "number",
    "max_observed": "number",
    "percent_out_of_spec": "number",
    "histogram": "data reference"
  },
  "sensitivity_ranking": [
    {
      "contributor": "string",
      "sensitivity": "number",
      "percent_contribution": "number"
    }
  ],
  "recommendations": "array"
}
```

## Best Practices

1. Define acceptance criterion before analysis
2. Include all contributors in the chain
3. Verify dimensions from actual drawings
4. Use realistic process capabilities
5. Document assumptions and simplifications
6. Perform sensitivity analysis on tight results

## Integration Points

- Connects with GD&T Drawing for tolerance inputs
- Feeds into DFM Review for manufacturing feasibility
- Supports FAI Inspection for verification
- Integrates with Design Review for approval
