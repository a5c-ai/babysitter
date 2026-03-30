---
name: gage-rr-analyzer
description: Measurement System Analysis skill for Gage R&R studies with variance component analysis.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: quality-engineering
  backlog-id: SK-IE-016
---

# gage-rr-analyzer

You are **gage-rr-analyzer** - a specialized skill for conducting Measurement System Analysis (MSA) and Gage R&R studies.

## Overview

This skill enables AI-powered MSA including:
- Gage R&R study design (crossed, nested)
- ANOVA variance decomposition
- Repeatability (equipment variation) calculation
- Reproducibility (appraiser variation) calculation
- Part-to-part variation analysis
- %GRR and %Contribution metrics
- Number of distinct categories (ndc)
- Measurement decision analysis
- Acceptance criteria evaluation (< 10%, 10-30%, > 30%)

## Prerequisites

- Python 3.8+ with numpy, scipy, pandas
- Measurement data from designed study
- Understanding of MSA principles

## Capabilities

### 1. Gage R&R Study Design

```python
from dataclasses import dataclass
from typing import List
import numpy as np

@dataclass
class GageRRStudyDesign:
    """
    Design parameters for Gage R&R study
    """
    num_parts: int = 10  # Typically 10
    num_operators: int = 3  # Typically 2-3
    num_trials: int = 3  # Typically 2-3 measurements per part per operator

    def total_measurements(self):
        return self.num_parts * self.num_operators * self.num_trials

    def randomized_run_order(self):
        """Generate randomized measurement order"""
        runs = []
        for part in range(1, self.num_parts + 1):
            for operator in range(1, self.num_operators + 1):
                for trial in range(1, self.num_trials + 1):
                    runs.append({
                        "part": part,
                        "operator": operator,
                        "trial": trial
                    })

        np.random.shuffle(runs)
        return runs

def create_study_worksheet(design: GageRRStudyDesign):
    """
    Create data collection worksheet
    """
    runs = design.randomized_run_order()

    worksheet = {
        "study_info": {
            "gage_name": "",
            "gage_number": "",
            "study_date": "",
            "characteristic": "",
            "specification": "",
            "resolution": ""
        },
        "operators": [f"Operator_{i}" for i in range(1, design.num_operators + 1)],
        "parts": [f"Part_{i}" for i in range(1, design.num_parts + 1)],
        "run_order": runs,
        "data_entry": []
    }

    return worksheet
```

### 2. ANOVA Method (Crossed Study)

```python
import pandas as pd
from scipy import stats

def gage_rr_anova(data, parts_col='Part', operators_col='Operator', measurement_col='Measurement'):
    """
    Gage R&R analysis using ANOVA method

    data: DataFrame with Part, Operator, and Measurement columns
    """
    df = pd.DataFrame(data)

    # Get design parameters
    n_parts = df[parts_col].nunique()
    n_operators = df[operators_col].nunique()
    n_trials = len(df) // (n_parts * n_operators)

    # Calculate means
    grand_mean = df[measurement_col].mean()
    part_means = df.groupby(parts_col)[measurement_col].mean()
    operator_means = df.groupby(operators_col)[measurement_col].mean()
    cell_means = df.groupby([parts_col, operators_col])[measurement_col].mean()

    # Sum of Squares
    SS_total = ((df[measurement_col] - grand_mean) ** 2).sum()

    SS_part = n_operators * n_trials * ((part_means - grand_mean) ** 2).sum()

    SS_operator = n_parts * n_trials * ((operator_means - grand_mean) ** 2).sum()

    # SS Interaction
    SS_cell = n_trials * ((cell_means - grand_mean) ** 2).sum()
    SS_interaction = SS_cell - SS_part - SS_operator

    # SS Error (repeatability)
    SS_error = SS_total - SS_part - SS_operator - SS_interaction

    # Degrees of freedom
    df_part = n_parts - 1
    df_operator = n_operators - 1
    df_interaction = df_part * df_operator
    df_error = n_parts * n_operators * (n_trials - 1)
    df_total = len(df) - 1

    # Mean Squares
    MS_part = SS_part / df_part
    MS_operator = SS_operator / df_operator
    MS_interaction = SS_interaction / df_interaction if df_interaction > 0 else 0
    MS_error = SS_error / df_error

    # F-statistics
    F_part = MS_part / MS_interaction if MS_interaction > 0 else MS_part / MS_error
    F_operator = MS_operator / MS_interaction if MS_interaction > 0 else MS_operator / MS_error
    F_interaction = MS_interaction / MS_error if MS_interaction > 0 else 0

    # p-values
    p_part = 1 - stats.f.cdf(F_part, df_part, df_interaction if MS_interaction > 0 else df_error)
    p_operator = 1 - stats.f.cdf(F_operator, df_operator, df_interaction if MS_interaction > 0 else df_error)
    p_interaction = 1 - stats.f.cdf(F_interaction, df_interaction, df_error) if F_interaction > 0 else 1

    anova_table = {
        "Part": {"SS": SS_part, "df": df_part, "MS": MS_part, "F": F_part, "p": p_part},
        "Operator": {"SS": SS_operator, "df": df_operator, "MS": MS_operator, "F": F_operator, "p": p_operator},
        "Part*Operator": {"SS": SS_interaction, "df": df_interaction, "MS": MS_interaction, "F": F_interaction, "p": p_interaction},
        "Repeatability": {"SS": SS_error, "df": df_error, "MS": MS_error},
        "Total": {"SS": SS_total, "df": df_total}
    }

    return anova_table, {
        "n_parts": n_parts,
        "n_operators": n_operators,
        "n_trials": n_trials,
        "grand_mean": grand_mean
    }
```

### 3. Variance Components Calculation

```python
def calculate_variance_components(anova_table, design_params):
    """
    Extract variance components from ANOVA
    """
    n = design_params['n_trials']
    k = design_params['n_operators']
    p = design_params['n_parts']

    MS_part = anova_table['Part']['MS']
    MS_operator = anova_table['Operator']['MS']
    MS_interaction = anova_table['Part*Operator']['MS']
    MS_error = anova_table['Repeatability']['MS']

    # Variance components
    var_repeatability = MS_error

    # Check if interaction is significant (p < 0.25 typically)
    if anova_table['Part*Operator']['p'] < 0.25:
        var_interaction = max(0, (MS_interaction - MS_error) / n)
        var_operator = max(0, (MS_operator - MS_interaction) / (n * p))
    else:
        # Pool interaction with error
        var_interaction = 0
        pooled_ms = (anova_table['Part*Operator']['SS'] + anova_table['Repeatability']['SS']) / \
                    (anova_table['Part*Operator']['df'] + anova_table['Repeatability']['df'])
        var_operator = max(0, (MS_operator - pooled_ms) / (n * p))
        var_repeatability = pooled_ms

    var_part = max(0, (MS_part - MS_operator) / (n * k)) if MS_part > MS_operator else \
               max(0, (MS_part - MS_error) / (n * k))

    # Reproducibility = Operator + Interaction
    var_reproducibility = var_operator + var_interaction

    # Gage R&R = Repeatability + Reproducibility
    var_grr = var_repeatability + var_reproducibility

    # Total variation
    var_total = var_grr + var_part

    return {
        "repeatability": var_repeatability,
        "reproducibility": var_reproducibility,
        "operator": var_operator,
        "interaction": var_interaction,
        "gage_rr": var_grr,
        "part_to_part": var_part,
        "total": var_total
    }
```

### 4. %GRR and Metrics Calculation

```python
def calculate_grr_metrics(variance_components, tolerance=None):
    """
    Calculate Gage R&R metrics

    tolerance: specification range (USL - LSL) for %Tolerance calculation
    """
    vc = variance_components

    # Standard deviations (6*sigma for 99.73% spread)
    std_repeatability = np.sqrt(vc['repeatability'])
    std_reproducibility = np.sqrt(vc['reproducibility'])
    std_grr = np.sqrt(vc['gage_rr'])
    std_part = np.sqrt(vc['part_to_part'])
    std_total = np.sqrt(vc['total'])

    # Study variation (6 * sigma)
    sv_repeatability = 6 * std_repeatability
    sv_reproducibility = 6 * std_reproducibility
    sv_grr = 6 * std_grr
    sv_part = 6 * std_part
    sv_total = 6 * std_total

    metrics = {
        "study_variation": {
            "repeatability": sv_repeatability,
            "reproducibility": sv_reproducibility,
            "gage_rr": sv_grr,
            "part_to_part": sv_part,
            "total": sv_total
        },
        "percent_contribution": {
            "repeatability": vc['repeatability'] / vc['total'] * 100,
            "reproducibility": vc['reproducibility'] / vc['total'] * 100,
            "gage_rr": vc['gage_rr'] / vc['total'] * 100,
            "part_to_part": vc['part_to_part'] / vc['total'] * 100
        },
        "percent_study_variation": {
            "repeatability": sv_repeatability / sv_total * 100,
            "reproducibility": sv_reproducibility / sv_total * 100,
            "gage_rr": sv_grr / sv_total * 100,
            "part_to_part": sv_part / sv_total * 100
        }
    }

    # %Tolerance (if specification provided)
    if tolerance:
        metrics["percent_tolerance"] = {
            "repeatability": sv_repeatability / tolerance * 100,
            "reproducibility": sv_reproducibility / tolerance * 100,
            "gage_rr": sv_grr / tolerance * 100
        }

    # Number of Distinct Categories
    ndc = int(1.41 * (std_part / std_grr)) if std_grr > 0 else np.inf
    metrics["ndc"] = max(1, ndc)

    return metrics
```

### 5. Acceptance Criteria Evaluation

```python
def evaluate_measurement_system(metrics):
    """
    Evaluate measurement system against acceptance criteria
    """
    grr_pct_sv = metrics['percent_study_variation']['gage_rr']
    grr_pct_tol = metrics.get('percent_tolerance', {}).get('gage_rr', grr_pct_sv)
    ndc = metrics['ndc']

    evaluation = {
        "grr_percent": grr_pct_sv,
        "ndc": ndc,
        "assessment": "",
        "recommendations": []
    }

    # AIAG guidelines
    if grr_pct_sv < 10:
        evaluation["assessment"] = "ACCEPTABLE"
        evaluation["recommendations"].append("Measurement system acceptable for use")
    elif grr_pct_sv < 30:
        evaluation["assessment"] = "MARGINAL"
        evaluation["recommendations"].append("May be acceptable depending on application")
        evaluation["recommendations"].append("Consider improvement opportunities")
    else:
        evaluation["assessment"] = "UNACCEPTABLE"
        evaluation["recommendations"].append("Measurement system requires improvement")
        evaluation["recommendations"].append("Do not use for process control until improved")

    # NDC evaluation
    if ndc < 2:
        evaluation["ndc_assessment"] = "Cannot distinguish between parts"
        evaluation["recommendations"].append("Measurement system cannot discriminate parts")
    elif ndc < 5:
        evaluation["ndc_assessment"] = "Marginal discrimination"
        evaluation["recommendations"].append("Limited ability to distinguish between parts")
    else:
        evaluation["ndc_assessment"] = "Good discrimination"

    # Component analysis
    pct_repeat = metrics['percent_study_variation']['repeatability']
    pct_reprod = metrics['percent_study_variation']['reproducibility']

    if pct_repeat > pct_reprod * 2:
        evaluation["primary_issue"] = "Repeatability (Equipment Variation)"
        evaluation["recommendations"].append("Focus on gage maintenance, fixtures, or replacement")
    elif pct_reprod > pct_repeat * 2:
        evaluation["primary_issue"] = "Reproducibility (Appraiser Variation)"
        evaluation["recommendations"].append("Focus on operator training and standard procedures")
    else:
        evaluation["primary_issue"] = "Both components significant"
        evaluation["recommendations"].append("Address both equipment and operator variation")

    return evaluation
```

### 6. Gage R&R Report Generation

```python
def generate_grr_report(data, parts_col, operators_col, measurement_col,
                        tolerance=None, characteristic_name=""):
    """
    Generate complete Gage R&R report
    """
    # Run analysis
    anova_table, design_params = gage_rr_anova(data, parts_col, operators_col, measurement_col)
    variance_components = calculate_variance_components(anova_table, design_params)
    metrics = calculate_grr_metrics(variance_components, tolerance)
    evaluation = evaluate_measurement_system(metrics)

    report = {
        "study_info": {
            "characteristic": characteristic_name,
            "tolerance": tolerance,
            "parts": design_params['n_parts'],
            "operators": design_params['n_operators'],
            "trials": design_params['n_trials'],
            "total_measurements": len(data)
        },
        "anova_table": anova_table,
        "variance_components": variance_components,
        "metrics": metrics,
        "evaluation": evaluation,
        "conclusion": {
            "grr_result": evaluation['assessment'],
            "grr_percent": round(metrics['percent_study_variation']['gage_rr'], 2),
            "ndc": metrics['ndc'],
            "primary_contributor": evaluation['primary_issue']
        }
    }

    return report
```

## Process Integration

This skill integrates with the following processes:
- `statistical-process-control-implementation.js`
- `design-of-experiments-execution.js`

## Output Format

```json
{
  "study_info": {
    "characteristic": "Diameter",
    "tolerance": 0.05,
    "parts": 10,
    "operators": 3,
    "trials": 3
  },
  "metrics": {
    "percent_study_variation": {
      "repeatability": 8.5,
      "reproducibility": 12.3,
      "gage_rr": 15.2,
      "part_to_part": 98.8
    },
    "ndc": 9
  },
  "evaluation": {
    "assessment": "MARGINAL",
    "primary_issue": "Reproducibility (Appraiser Variation)"
  },
  "recommendations": [
    "Focus on operator training",
    "Standardize measurement procedure"
  ]
}
```

## Best Practices

1. **Proper study design** - Minimum 10 parts, 3 operators, 2-3 trials
2. **Representative parts** - Select parts spanning expected range
3. **Blind measurements** - Operators shouldn't know which part
4. **Randomize order** - Prevent systematic bias
5. **Same conditions** - Control environmental factors
6. **Trained operators** - Ensure consistent technique

## Constraints

- Use parts representing production range
- Document measurement procedure
- Report all variance components
- Follow AIAG MSA guidelines
