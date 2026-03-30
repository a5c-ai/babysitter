---
name: doe-designer
description: Design of Experiments planning and analysis skill for factorial and response surface experiments.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: quality-engineering
  backlog-id: SK-IE-017
---

# doe-designer

You are **doe-designer** - a specialized skill for designing, executing, and analyzing designed experiments for process optimization.

## Overview

This skill enables AI-powered DOE including:
- Full factorial design generation
- Fractional factorial design with confounding analysis
- Response surface methodology (CCD, Box-Behnken)
- Screening design (Plackett-Burman, definitive screening)
- ANOVA analysis of experimental results
- Main effects and interaction plots
- Contour plots and surface plots
- Optimal factor level determination
- Confirmation run planning

## Capabilities

### 1. Full Factorial Design

```python
import pyDOE2 as doe
import numpy as np
import pandas as pd

def full_factorial_design(factors, levels=2):
    """
    Generate full factorial design

    factors: dict of {name: (low, high)} for 2-level
             or {name: [level1, level2, ...]} for multi-level
    """
    factor_names = list(factors.keys())
    n_factors = len(factors)

    if levels == 2:
        # 2^k design
        design_coded = doe.ff2n(n_factors)
        n_runs = 2 ** n_factors

        # Convert to actual values
        design_actual = np.zeros_like(design_coded)
        for i, (name, bounds) in enumerate(factors.items()):
            low, high = bounds
            design_actual[:, i] = np.where(design_coded[:, i] == -1, low, high)
    else:
        # General full factorial
        level_counts = [levels] * n_factors
        design_coded = doe.fullfact(level_counts)
        n_runs = levels ** n_factors

        design_actual = np.zeros_like(design_coded)
        for i, (name, levels_list) in enumerate(factors.items()):
            for j, level in enumerate(levels_list):
                design_actual[design_coded[:, i] == j, i] = level

    df = pd.DataFrame(design_actual, columns=factor_names)
    df['Run'] = range(1, n_runs + 1)
    df['StdOrder'] = df['Run']

    # Randomize
    df['RunOrder'] = np.random.permutation(n_runs) + 1
    df = df.sort_values('RunOrder').reset_index(drop=True)

    return {
        "design_matrix": df,
        "coded_matrix": design_coded,
        "num_runs": n_runs,
        "num_factors": n_factors,
        "design_type": f"{levels}^{n_factors} Full Factorial",
        "resolution": "Full"
    }
```

### 2. Fractional Factorial Design

```python
def fractional_factorial_design(factors, resolution='IV'):
    """
    Generate fractional factorial design

    resolution: 'III', 'IV', or 'V'
    """
    n_factors = len(factors)
    factor_names = list(factors.keys())

    # Common fractional factorial generators
    generators = {
        3: {'III': 'a b ab'},  # 2^(3-1)
        4: {'IV': 'a b c abc'},  # 2^(4-1)
        5: {'V': 'a b c d abcd', 'III': 'a b ab c ac'},  # 2^(5-1) or 2^(5-2)
        6: {'IV': 'a b c d ab cd', 'III': 'a b ab c ac bc'},
        7: {'IV': 'a b c d ab ac bc', 'III': 'a b ab c ac d ad'}
    }

    if n_factors in generators and resolution in generators[n_factors]:
        gen = generators[n_factors][resolution]
        design_coded = doe.fracfact(gen)
    else:
        # Default to resolution IV if available
        design_coded = doe.fracfact(' '.join(['abcdefghij'[:n_factors]]))

    n_runs = len(design_coded)

    # Convert to actual values
    design_actual = np.zeros_like(design_coded)
    for i, (name, bounds) in enumerate(factors.items()):
        low, high = bounds
        design_actual[:, i] = np.where(design_coded[:, i] == -1, low, high)

    df = pd.DataFrame(design_actual, columns=factor_names)

    # Analyze confounding
    confounding = analyze_confounding(n_factors, resolution)

    return {
        "design_matrix": df,
        "num_runs": n_runs,
        "resolution": resolution,
        "confounding_pattern": confounding,
        "design_type": f"2^({n_factors}-p) Resolution {resolution}"
    }

def analyze_confounding(n_factors, resolution):
    """Describe confounding pattern by resolution"""
    patterns = {
        'III': "Main effects confounded with 2-factor interactions",
        'IV': "Main effects clear; 2FIs confounded with each other",
        'V': "Main effects and 2FIs clear; 3FIs confounded"
    }
    return patterns.get(resolution, "Unknown confounding pattern")
```

### 3. Response Surface Designs

```python
def central_composite_design(factors, alpha='rotatable', center_points=5):
    """
    Generate Central Composite Design (CCD)

    alpha: 'rotatable', 'orthogonal', or numeric value
    """
    n_factors = len(factors)
    factor_names = list(factors.keys())

    # Generate CCD
    design_coded = doe.ccdesign(n_factors, center=(0, center_points), alpha=alpha)

    n_runs = len(design_coded)

    # Convert to actual values
    design_actual = np.zeros_like(design_coded)
    for i, (name, bounds) in enumerate(factors.items()):
        low, high = bounds
        center = (low + high) / 2
        half_range = (high - low) / 2
        design_actual[:, i] = center + design_coded[:, i] * half_range

    df = pd.DataFrame(design_actual, columns=factor_names)

    return {
        "design_matrix": df,
        "coded_matrix": design_coded,
        "num_runs": n_runs,
        "design_type": "Central Composite Design",
        "alpha": alpha,
        "center_points": center_points
    }

def box_behnken_design(factors, center_points=3):
    """
    Generate Box-Behnken Design

    Good for 3-4 factors, avoids extreme corners
    """
    n_factors = len(factors)
    factor_names = list(factors.keys())

    design_coded = doe.bbdesign(n_factors, center=center_points)
    n_runs = len(design_coded)

    # Convert to actual values
    design_actual = np.zeros_like(design_coded)
    for i, (name, bounds) in enumerate(factors.items()):
        low, high = bounds
        center = (low + high) / 2
        half_range = (high - low) / 2
        design_actual[:, i] = center + design_coded[:, i] * half_range

    df = pd.DataFrame(design_actual, columns=factor_names)

    return {
        "design_matrix": df,
        "num_runs": n_runs,
        "design_type": "Box-Behnken Design",
        "center_points": center_points,
        "advantage": "No corner points - avoids extreme conditions"
    }
```

### 4. ANOVA Analysis

```python
import statsmodels.api as sm
from statsmodels.formula.api import ols

def analyze_factorial_experiment(data, response_col, factor_cols):
    """
    Perform ANOVA on factorial experiment
    """
    # Build formula with main effects and interactions
    main_effects = ' + '.join(factor_cols)
    interactions = ' + '.join([f'{a}:{b}' for i, a in enumerate(factor_cols)
                               for b in factor_cols[i+1:]])
    formula = f'{response_col} ~ {main_effects} + {interactions}'

    model = ols(formula, data=data).fit()
    anova_table = sm.stats.anova_lm(model, typ=2)

    # Effect estimates
    effects = {}
    for factor in factor_cols:
        high_mean = data[data[factor] == data[factor].max()][response_col].mean()
        low_mean = data[data[factor] == data[factor].min()][response_col].mean()
        effects[factor] = high_mean - low_mean

    return {
        "anova_table": anova_table.to_dict(),
        "r_squared": model.rsquared,
        "adj_r_squared": model.rsquared_adj,
        "effects": effects,
        "significant_factors": [f for f in factor_cols
                                if anova_table.loc[f, 'PR(>F)'] < 0.05],
        "model_summary": model.summary().as_text()
    }
```

### 5. Response Surface Analysis

```python
def fit_response_surface(data, response_col, factor_cols):
    """
    Fit second-order response surface model
    """
    # Build quadratic formula
    linear = ' + '.join(factor_cols)
    quadratic = ' + '.join([f'I({f}**2)' for f in factor_cols])
    interactions = ' + '.join([f'{a}:{b}' for i, a in enumerate(factor_cols)
                               for b in factor_cols[i+1:]])

    formula = f'{response_col} ~ {linear} + {quadratic} + {interactions}'

    model = ols(formula, data=data).fit()

    # Find stationary point
    # Extract coefficients for optimization
    coeffs = model.params

    return {
        "model": model,
        "r_squared": model.rsquared,
        "coefficients": coeffs.to_dict(),
        "significant_terms": [t for t in model.pvalues.index
                             if model.pvalues[t] < 0.05],
        "formula": formula
    }

def find_optimal_conditions(model, factor_cols, bounds, maximize=True):
    """
    Find optimal factor settings using response surface
    """
    from scipy.optimize import minimize

    def predict(x):
        data = pd.DataFrame([dict(zip(factor_cols, x))])
        pred = model.predict(data)[0]
        return -pred if maximize else pred

    # Multiple starts for global optimization
    best_result = None
    for _ in range(20):
        x0 = [np.random.uniform(b[0], b[1]) for b in bounds]
        result = minimize(predict, x0, bounds=bounds, method='L-BFGS-B')
        if best_result is None or result.fun < best_result.fun:
            best_result = result

    optimal = dict(zip(factor_cols, best_result.x))
    optimal_response = -best_result.fun if maximize else best_result.fun

    return {
        "optimal_settings": optimal,
        "predicted_response": optimal_response,
        "optimization_success": best_result.success
    }
```

### 6. Confirmation Run Planning

```python
def plan_confirmation_runs(optimal_settings, model, n_runs=5, alpha=0.05):
    """
    Plan confirmation runs at optimal settings
    """
    from scipy import stats

    # Predict at optimal
    data = pd.DataFrame([optimal_settings])
    predicted = model.predict(data)[0]

    # Prediction interval
    pred_se = np.sqrt(model.mse_resid)  # Simplified
    t_val = stats.t.ppf(1 - alpha/2, model.df_resid)

    pi_lower = predicted - t_val * pred_se * np.sqrt(1 + 1/len(model.model.data.orig_endog))
    pi_upper = predicted + t_val * pred_se * np.sqrt(1 + 1/len(model.model.data.orig_endog))

    return {
        "optimal_settings": optimal_settings,
        "predicted_response": predicted,
        "prediction_interval": {
            "lower": pi_lower,
            "upper": pi_upper,
            "confidence": 1 - alpha
        },
        "confirmation_runs": n_runs,
        "acceptance_criterion": f"Mean of {n_runs} runs should fall within [{pi_lower:.3f}, {pi_upper:.3f}]"
    }
```

## Process Integration

This skill integrates with the following processes:
- `design-of-experiments-execution.js`
- `root-cause-analysis-investigation.js`
- `statistical-process-control-implementation.js`

## Output Format

```json
{
  "design_type": "2^4 Full Factorial",
  "factors": ["Temperature", "Pressure", "Time", "Catalyst"],
  "num_runs": 16,
  "analysis": {
    "significant_factors": ["Temperature", "Pressure"],
    "significant_interactions": ["Temperature:Pressure"],
    "r_squared": 0.94
  },
  "optimal_settings": {
    "Temperature": 180,
    "Pressure": 2.5,
    "Time": 60,
    "Catalyst": 0.5
  },
  "predicted_response": 95.3,
  "confirmation_plan": {
    "runs": 5,
    "prediction_interval": [93.1, 97.5]
  }
}
```

## Best Practices

1. **Start with screening** - Use Plackett-Burman for many factors
2. **Choose appropriate resolution** - Resolution IV minimum for main effects
3. **Include center points** - Detect curvature
4. **Randomize run order** - Reduce systematic bias
5. **Replicate** - Estimate error for significance testing
6. **Confirm results** - Always run confirmation experiments

## Constraints

- Document all experimental conditions
- Control nuisance factors
- Follow design exactly as planned
- Report both practical and statistical significance
