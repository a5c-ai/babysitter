---
name: test-correlation
description: Skill for correlating test results with analytical predictions and model validation
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: mechanical-engineering
  domain: science
  category: testing-validation
  priority: high
  phase: 4
  tools-libraries:
    - MATLAB
    - Python scipy
    - Test data formats
    - FEA/CFD tools
---

# Test Correlation Skill

## Purpose

The Test Correlation skill provides capabilities for correlating test results with analytical predictions, enabling model validation, calibration, and uncertainty quantification for mechanical systems.

## Capabilities

- Test data processing and analysis
- Prediction-to-test comparison
- Model calibration techniques
- Uncertainty quantification
- Statistical analysis and regression
- Correlation report generation
- Model updating recommendations
- Validation criteria assessment

## Usage Guidelines

### Correlation Methodology

#### Data Processing

1. **Test Data Preparation**
   ```
   Data quality checks:
   - Missing data handling
   - Outlier detection
   - Noise filtering
   - Time synchronization
   - Unit verification
   ```

2. **Signal Processing**
   | Operation | Purpose | Method |
   |-----------|---------|--------|
   | Low-pass filter | Remove noise | Butterworth |
   | Resampling | Match analysis | Interpolation |
   | Baseline correction | Remove offset | Linear/polynomial |
   | Windowing | FFT preparation | Hanning, Hamming |

3. **Derived Quantities**
   - Integrate acceleration to velocity/displacement
   - Differentiate displacement to velocity
   - Calculate strain from displacement
   - Compute stress from strain

#### Prediction Extraction

1. **Analysis Results**
   - Match output locations to sensor positions
   - Match load cases to test conditions
   - Account for coordinate systems
   - Include analysis uncertainty

2. **Interpolation**
   ```
   For locations between nodes:
   - Shape function interpolation
   - Nearest node approximation
   - Surface interpolation (for contours)
   ```

### Comparison Methods

#### Point Comparison

```
Percent difference:
%diff = (Test - Analysis) / Test * 100

For near-zero values:
%diff = (Test - Analysis) / max(|Test|, |Analysis|) * 100

Absolute difference:
delta = Test - Analysis
```

#### Statistical Comparison

| Metric | Formula | Purpose |
|--------|---------|---------|
| Mean error | mean(Test - Analysis) | Bias detection |
| RMS error | sqrt(mean((Test-Analysis)^2)) | Overall accuracy |
| Correlation coefficient | r | Linear relationship |
| R-squared | r^2 | Variance explained |

#### Modal Correlation

1. **Frequency Comparison**
   ```
   Frequency error:
   %error = (f_test - f_analysis) / f_test * 100

   Typical acceptance: +/- 5-10%
   ```

2. **Mode Shape Correlation**
   ```
   MAC (Modal Assurance Criterion):
   MAC = |{phi_test}^T {phi_analysis}|^2 /
         ({phi_test}^T{phi_test})({phi_analysis}^T{phi_analysis})

   MAC = 1: Perfect correlation
   MAC > 0.9: Good correlation
   MAC > 0.7: Acceptable correlation
   ```

3. **Cross-Orthogonality**
   ```
   XOR = {phi_test}^T [M] {phi_analysis}

   XOR_ii > 0.9: Good correlation
   XOR_ij < 0.1: Mode independence
   ```

### Model Calibration

#### Parameter Identification

1. **Sensitivity Analysis**
   - Identify influential parameters
   - Rank by sensitivity
   - Define adjustment ranges

2. **Optimization Methods**
   | Method | Application | Pros/Cons |
   |--------|-------------|-----------|
   | Manual iteration | Simple cases | Intuitive, slow |
   | Gradient-based | Smooth response | Fast, local minimum |
   | Genetic algorithm | Complex response | Global, slow |
   | Response surface | Multiple cases | Efficient, approximation |

#### Common Calibration Parameters

| Parameter | Structural | Thermal | CFD |
|-----------|-----------|---------|-----|
| Stiffness | Young's modulus | Conductivity | - |
| Boundary | Joint stiffness | HTC | Inlet profile |
| Damping | Modal damping | - | Turbulence |
| Mass | Density | Cp | Density |
| Geometry | Thickness | Contact area | Mesh |

### Validation Criteria

#### Acceptance Criteria

```
Typical validation targets:
- Displacement: +/- 10%
- Stress: +/- 15%
- Natural frequency: +/- 5%
- MAC: > 0.9
- Temperature: +/- 5 degrees
- Pressure: +/- 10%
```

#### Validation Levels

| Level | Evidence | Application |
|-------|----------|-------------|
| 1 | Qualitative trends match | Preliminary design |
| 2 | Quantitative agreement | Detailed design |
| 3 | Statistical validation | Certification |
| 4 | Prediction capability | Production release |

### Uncertainty Quantification

#### Sources of Uncertainty

1. **Test Uncertainty**
   - Instrumentation accuracy
   - Environmental variation
   - Setup variability
   - Measurement resolution

2. **Model Uncertainty**
   - Material property variability
   - Geometry simplifications
   - Boundary condition approximations
   - Discretization error

#### Combined Uncertainty

```
u_combined = sqrt(u_test^2 + u_model^2)

Overlap criteria:
If |Test - Analysis| < 2 * u_combined:
  Results are statistically consistent
```

## Process Integration

- ME-022: Prototype Testing and Correlation

## Input Schema

```json
{
  "test_data": {
    "file_path": "string",
    "format": "csv|mat|hdf5",
    "channels": "array of channel IDs"
  },
  "analysis_results": {
    "file_path": "string",
    "software": "ANSYS|NASTRAN|Abaqus|other",
    "output_locations": "array"
  },
  "comparison_type": "static|modal|transient|steady_state",
  "correlation_requirements": {
    "metrics": "array",
    "acceptance_criteria": "object"
  }
}
```

## Output Schema

```json
{
  "correlation_results": {
    "comparison_table": "array of point comparisons",
    "statistical_metrics": {
      "mean_error": "number",
      "rms_error": "number",
      "max_error": "number",
      "correlation_coefficient": "number"
    },
    "modal_metrics": {
      "frequency_errors": "array",
      "mac_matrix": "2D array"
    }
  },
  "validation_status": {
    "overall": "pass|fail|conditional",
    "by_criterion": "array"
  },
  "calibration_recommendations": [
    {
      "parameter": "string",
      "current_value": "number",
      "recommended_value": "number",
      "sensitivity": "number"
    }
  ],
  "uncertainty_analysis": {
    "test_uncertainty": "number",
    "model_uncertainty": "number",
    "combined": "number"
  }
}
```

## Best Practices

1. Process test data before comparison
2. Match locations and coordinates carefully
3. Account for all sources of uncertainty
4. Document calibration changes
5. Validate across multiple load cases
6. Report both agreements and discrepancies

## Integration Points

- Connects with FEA Structural for model results
- Feeds into Design Review for validation evidence
- Supports Test Planning for requirements
- Integrates with Requirements Flowdown for verification
