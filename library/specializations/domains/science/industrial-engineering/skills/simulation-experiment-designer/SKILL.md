---
name: simulation-experiment-designer
description: Simulation experimental design skill for efficient scenario analysis and optimization.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: simulation
  backlog-id: SK-IE-008
---

# simulation-experiment-designer

You are **simulation-experiment-designer** - a specialized skill for designing and analyzing simulation experiments efficiently.

## Overview

This skill enables AI-powered simulation experimentation including:
- Factorial experiment design for simulation
- Latin hypercube sampling
- Variance reduction techniques (common random numbers, antithetic variates)
- Ranking and selection procedures
- Metamodel fitting (response surface)
- OptQuest-style simulation optimization
- Scenario comparison with statistical tests

## Prerequisites

- Python 3.8+ with pyDOE2, SALib, scipy
- SimPy or other DES framework
- Statistical analysis libraries

## Capabilities

### 1. Factorial Experiment Design

```python
import pyDOE2 as doe
import numpy as np

def create_factorial_design(factors, levels=2):
    """
    Create full or fractional factorial design
    factors: dict of {name: (low, high)}
    """
    n_factors = len(factors)
    factor_names = list(factors.keys())

    if levels == 2:
        # Full factorial
        design_coded = doe.ff2n(n_factors)

        # Fractional factorial for many factors
        if n_factors > 5:
            design_coded = doe.fracfact(
                ' '.join(['a', 'b', 'c', 'd', 'e'][:n_factors])
            )
    else:
        # General full factorial
        design_coded = doe.fullfact([levels] * n_factors)

    # Convert to actual values
    design = np.zeros_like(design_coded, dtype=float)
    for i, (name, (low, high)) in enumerate(factors.items()):
        if levels == 2:
            design[:, i] = np.where(design_coded[:, i] == -1, low, high)
        else:
            step = (high - low) / (levels - 1)
            design[:, i] = low + design_coded[:, i] * step

    return {
        "design_matrix": design,
        "factor_names": factor_names,
        "num_runs": len(design),
        "coded_design": design_coded
    }
```

### 2. Latin Hypercube Sampling

```python
from scipy.stats import qmc

def latin_hypercube_design(factors, n_samples, seed=None):
    """
    Create Latin Hypercube sample for simulation
    factors: dict of {name: (low, high)}
    """
    n_factors = len(factors)
    factor_names = list(factors.keys())
    bounds = list(factors.values())

    # Create LHS sampler
    sampler = qmc.LatinHypercube(d=n_factors, seed=seed)
    sample = sampler.random(n=n_samples)

    # Scale to factor ranges
    l_bounds = [b[0] for b in bounds]
    u_bounds = [b[1] for b in bounds]
    design = qmc.scale(sample, l_bounds, u_bounds)

    # Quality metrics
    discrepancy = qmc.discrepancy(sample)

    return {
        "design_matrix": design,
        "factor_names": factor_names,
        "num_samples": n_samples,
        "discrepancy": discrepancy,
        "space_filling": "latin_hypercube"
    }
```

### 3. Variance Reduction - Common Random Numbers

```python
import numpy as np

class CommonRandomNumbers:
    """
    Implement CRN for comparing system configurations
    """
    def __init__(self, seed):
        self.base_seed = seed
        self.streams = {}

    def get_stream(self, stream_id, replication):
        """Get deterministic random stream"""
        key = (stream_id, replication)
        if key not in self.streams:
            seed = hash(key) % (2**32)
            self.streams[key] = np.random.RandomState(seed)
        return self.streams[key]

    def compare_configurations(self, sim_func, configs, n_reps):
        """
        Compare configurations using CRN
        """
        results = {c: [] for c in configs}

        for rep in range(n_reps):
            for config in configs:
                # Same random stream for each config in this rep
                rng = self.get_stream('main', rep)
                result = sim_func(config, rng)
                results[config].append(result)

        # Paired comparison
        paired_diffs = []
        for i in range(n_reps):
            diff = results[configs[0]][i] - results[configs[1]][i]
            paired_diffs.append(diff)

        from scipy import stats
        t_stat, p_value = stats.ttest_1samp(paired_diffs, 0)

        return {
            "config_means": {c: np.mean(results[c]) for c in configs},
            "paired_difference_mean": np.mean(paired_diffs),
            "variance_reduction": 1 - np.var(paired_diffs) / (
                np.var(results[configs[0]]) + np.var(results[configs[1]])
            ),
            "t_statistic": t_stat,
            "p_value": p_value
        }
```

### 4. Ranking and Selection

```python
from scipy import stats

def rinott_procedure(configurations, sim_func, alpha=0.05, delta=1.0):
    """
    Rinott's two-stage procedure for selecting best
    delta: indifference zone parameter
    """
    k = len(configurations)
    n0 = 20  # Initial sample size

    # Stage 1: Initial sampling
    stage1_results = {c: [] for c in configurations}
    for config in configurations:
        for _ in range(n0):
            result = sim_func(config)
            stage1_results[config].append(result)

    # Calculate sample variances
    variances = {c: np.var(stage1_results[c], ddof=1)
                 for c in configurations}

    # Rinott's constant (simplified - use tables in practice)
    h = stats.t.ppf(1 - alpha/(k-1), n0-1) * np.sqrt(2)

    # Stage 2 sample sizes
    stage2_sizes = {c: max(n0, int(np.ceil((h * np.sqrt(variances[c]) / delta)**2)))
                    for c in configurations}

    # Stage 2: Additional sampling
    final_results = {c: list(stage1_results[c]) for c in configurations}
    for config in configurations:
        additional = stage2_sizes[config] - n0
        for _ in range(additional):
            final_results[config].append(sim_func(config))

    # Select best (assuming maximization)
    means = {c: np.mean(final_results[c]) for c in configurations}
    best = max(means, key=means.get)

    return {
        "best_configuration": best,
        "means": means,
        "stage2_sample_sizes": stage2_sizes,
        "total_samples": sum(stage2_sizes.values()),
        "confidence": 1 - alpha
    }
```

### 5. Response Surface Metamodel

```python
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
import numpy as np

def fit_response_surface(design_matrix, responses, degree=2):
    """
    Fit polynomial response surface model
    """
    # Create polynomial features
    poly = PolynomialFeatures(degree=degree, include_bias=False)
    X_poly = poly.fit_transform(design_matrix)

    # Fit regression
    model = LinearRegression()
    model.fit(X_poly, responses)

    # Predictions and residuals
    predictions = model.predict(X_poly)
    residuals = responses - predictions

    # R-squared
    ss_res = np.sum(residuals**2)
    ss_tot = np.sum((responses - np.mean(responses))**2)
    r_squared = 1 - ss_res / ss_tot

    # ANOVA
    n = len(responses)
    p = X_poly.shape[1]
    ms_res = ss_res / (n - p - 1)
    ms_reg = (ss_tot - ss_res) / p
    f_stat = ms_reg / ms_res

    return {
        "model": model,
        "poly_transformer": poly,
        "r_squared": r_squared,
        "adjusted_r_squared": 1 - (1 - r_squared) * (n - 1) / (n - p - 1),
        "coefficients": model.coef_.tolist(),
        "intercept": model.intercept_,
        "f_statistic": f_stat,
        "feature_names": poly.get_feature_names_out()
    }

def optimize_response_surface(model, poly, bounds, maximize=True):
    """
    Find optimal factor settings
    """
    from scipy.optimize import minimize

    def objective(x):
        x_poly = poly.transform(x.reshape(1, -1))
        pred = model.predict(x_poly)[0]
        return -pred if maximize else pred

    # Multi-start optimization
    best_result = None
    for _ in range(10):
        x0 = [np.random.uniform(b[0], b[1]) for b in bounds]
        result = minimize(objective, x0, bounds=bounds, method='L-BFGS-B')
        if best_result is None or result.fun < best_result.fun:
            best_result = result

    return {
        "optimal_factors": best_result.x.tolist(),
        "predicted_response": -best_result.fun if maximize else best_result.fun,
        "optimization_success": best_result.success
    }
```

### 6. Sensitivity Analysis

```python
from SALib.sample import saltelli
from SALib.analyze import sobol

def global_sensitivity_analysis(problem_def, sim_func, n_samples=1024):
    """
    Sobol sensitivity analysis
    problem_def: {'num_vars': n, 'names': [...], 'bounds': [[lo,hi],...]}
    """
    # Generate samples
    param_values = saltelli.sample(problem_def, n_samples)

    # Run simulations
    Y = np.array([sim_func(params) for params in param_values])

    # Analyze
    Si = sobol.analyze(problem_def, Y)

    return {
        "first_order_indices": dict(zip(problem_def['names'], Si['S1'])),
        "total_order_indices": dict(zip(problem_def['names'], Si['ST'])),
        "second_order_indices": Si.get('S2', None),
        "confidence_intervals": {
            "S1_conf": dict(zip(problem_def['names'], Si['S1_conf'])),
            "ST_conf": dict(zip(problem_def['names'], Si['ST_conf']))
        }
    }
```

## Process Integration

This skill integrates with the following processes:
- `discrete-event-simulation-modeling.js`
- `design-of-experiments-execution.js`
- `capacity-planning-analysis.js`

## Output Format

```json
{
  "experiment_design": {
    "type": "latin_hypercube",
    "factors": ["arrival_rate", "service_rate", "num_servers"],
    "num_runs": 50
  },
  "analysis": {
    "metamodel_r_squared": 0.94,
    "significant_factors": ["arrival_rate", "num_servers"],
    "optimal_settings": {
      "arrival_rate": 8.5,
      "service_rate": 4.0,
      "num_servers": 3
    },
    "predicted_performance": 0.85
  },
  "sensitivity": {
    "most_influential": "arrival_rate",
    "sobol_indices": {"arrival_rate": 0.45, "service_rate": 0.25}
  }
}
```

## Tools/Libraries

| Library | Description | Use Case |
|---------|-------------|----------|
| pyDOE2 | DOE generation | Factorial designs |
| SALib | Sensitivity analysis | Global SA |
| scipy.stats | Statistics | Hypothesis tests |
| sklearn | Machine learning | Metamodeling |

## Best Practices

1. **Use CRN for comparisons** - Reduces required replications
2. **Screen factors first** - Use screening designs for many factors
3. **Validate metamodels** - Check residuals and R-squared
4. **Document all assumptions** - Experimental conditions
5. **Consider practical significance** - Not just statistical
6. **Plan for failures** - Handle infeasible runs

## Constraints

- Report all design decisions
- Document variance reduction effectiveness
- Validate metamodel predictions
- Use appropriate sample sizes
