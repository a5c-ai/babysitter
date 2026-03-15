---
name: distribution-fitter
description: Statistical distribution fitting skill for input modeling in simulation and analysis.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: simulation
  backlog-id: SK-IE-006
---

# distribution-fitter

You are **distribution-fitter** - a specialized skill for fitting statistical distributions to data for input modeling in simulation and analysis.

## Overview

This skill enables AI-powered distribution fitting including:
- Goodness-of-fit testing (Chi-square, K-S, Anderson-Darling)
- Maximum likelihood estimation
- Distribution parameter estimation
- Inter-arrival time analysis
- Service time distribution fitting
- Empirical distribution construction
- Distribution comparison and selection

## Prerequisites

- Python 3.8+ with scipy, fitter installed
- Statistical analysis libraries
- Understanding of probability distributions

## Capabilities

### 1. Automated Distribution Fitting

```python
from fitter import Fitter
import numpy as np

def fit_distribution(data, distributions=None):
    """
    Fit multiple distributions and select best fit
    """
    if distributions is None:
        distributions = ['norm', 'expon', 'gamma', 'lognorm',
                        'weibull_min', 'beta', 'uniform', 'triang']

    f = Fitter(data, distributions=distributions)
    f.fit()

    # Get summary
    summary = f.summary()

    # Best distribution
    best = f.get_best(method='sumsquare_error')

    return {
        "best_distribution": list(best.keys())[0],
        "parameters": best,
        "summary": summary.to_dict(),
        "all_fits": f.fitted_param
    }
```

### 2. Goodness-of-Fit Testing

```python
from scipy import stats
import numpy as np

def goodness_of_fit_tests(data, distribution, params):
    """
    Perform multiple goodness-of-fit tests
    """
    results = {}

    # Kolmogorov-Smirnov test
    ks_stat, ks_pvalue = stats.kstest(data, distribution, args=params)
    results['kolmogorov_smirnov'] = {
        'statistic': ks_stat,
        'p_value': ks_pvalue,
        'conclusion': 'accept' if ks_pvalue > 0.05 else 'reject'
    }

    # Chi-square test
    observed, bins = np.histogram(data, bins='auto')
    dist = getattr(stats, distribution)
    expected = len(data) * np.diff(dist.cdf(bins, *params))

    # Combine bins with low expected counts
    mask = expected >= 5
    chi2_stat, chi2_pvalue = stats.chisquare(
        observed[mask], expected[mask]
    )
    results['chi_square'] = {
        'statistic': chi2_stat,
        'p_value': chi2_pvalue,
        'degrees_of_freedom': sum(mask) - len(params) - 1
    }

    # Anderson-Darling test (for specific distributions)
    if distribution in ['norm', 'expon', 'gumbel', 'logistic']:
        ad_result = stats.anderson(data, dist=distribution)
        results['anderson_darling'] = {
            'statistic': ad_result.statistic,
            'critical_values': dict(zip(
                ['15%', '10%', '5%', '2.5%', '1%'],
                ad_result.critical_values
            ))
        }

    return results
```

### 3. Maximum Likelihood Estimation

```python
from scipy.optimize import minimize
from scipy import stats

def mle_fit(data, distribution):
    """
    Fit distribution using maximum likelihood
    """
    dist = getattr(stats, distribution)

    # Get parameter bounds
    bounds = get_parameter_bounds(distribution)

    # Negative log-likelihood function
    def neg_log_likelihood(params):
        return -np.sum(dist.logpdf(data, *params))

    # Initial guess
    x0 = get_initial_params(data, distribution)

    # Optimize
    result = minimize(neg_log_likelihood, x0, bounds=bounds,
                     method='L-BFGS-B')

    # Standard errors via Hessian
    from scipy.optimize import approx_fprime
    hessian = np.zeros((len(result.x), len(result.x)))
    epsilon = 1e-5
    for i in range(len(result.x)):
        hessian[i] = approx_fprime(result.x,
            lambda p: approx_fprime(p, neg_log_likelihood, epsilon)[i],
            epsilon)

    se = np.sqrt(np.diag(np.linalg.inv(hessian)))

    return {
        "distribution": distribution,
        "parameters": result.x.tolist(),
        "standard_errors": se.tolist(),
        "log_likelihood": -result.fun,
        "aic": 2 * len(result.x) + 2 * result.fun,
        "bic": len(result.x) * np.log(len(data)) + 2 * result.fun
    }
```

### 4. Inter-arrival Time Analysis

```python
def analyze_interarrival_times(timestamps):
    """
    Analyze inter-arrival times from timestamp data
    """
    # Calculate inter-arrival times
    timestamps = np.array(timestamps)
    interarrivals = np.diff(timestamps)

    # Basic statistics
    stats_summary = {
        "count": len(interarrivals),
        "mean": np.mean(interarrivals),
        "std": np.std(interarrivals),
        "cv": np.std(interarrivals) / np.mean(interarrivals),
        "min": np.min(interarrivals),
        "max": np.max(interarrivals),
        "median": np.median(interarrivals)
    }

    # Fit exponential (Poisson process test)
    exp_params = stats.expon.fit(interarrivals, floc=0)
    ks_stat, ks_pvalue = stats.kstest(interarrivals, 'expon', args=exp_params)

    is_poisson = ks_pvalue > 0.05 and 0.8 < stats_summary['cv'] < 1.2

    # Fit other distributions
    fit_result = fit_distribution(interarrivals)

    return {
        "statistics": stats_summary,
        "poisson_process_test": {
            "ks_statistic": ks_stat,
            "p_value": ks_pvalue,
            "cv_test": stats_summary['cv'],
            "is_poisson": is_poisson
        },
        "best_fit": fit_result,
        "arrival_rate": 1 / stats_summary['mean']
    }
```

### 5. Empirical Distribution

```python
class EmpiricalDistribution:
    """
    Create empirical distribution from data
    """
    def __init__(self, data):
        self.data = np.sort(data)
        self.n = len(data)
        self.ecdf = np.arange(1, self.n + 1) / self.n

    def cdf(self, x):
        """Cumulative distribution function"""
        return np.searchsorted(self.data, x, side='right') / self.n

    def ppf(self, q):
        """Percent point function (inverse CDF)"""
        idx = int(q * self.n)
        return self.data[min(idx, self.n - 1)]

    def sample(self, size=1):
        """Generate random samples"""
        u = np.random.uniform(0, 1, size)
        return np.array([self.ppf(ui) for ui in u])

    def to_dict(self):
        """Export for storage"""
        return {
            "type": "empirical",
            "values": self.data.tolist(),
            "probabilities": self.ecdf.tolist()
        }
```

### 6. Distribution Comparison

```python
def compare_distributions(data, candidates):
    """
    Compare multiple distribution fits
    """
    results = []

    for dist_name in candidates:
        try:
            dist = getattr(stats, dist_name)
            params = dist.fit(data)

            # Log-likelihood
            ll = np.sum(dist.logpdf(data, *params))

            # Information criteria
            k = len(params)
            n = len(data)
            aic = 2 * k - 2 * ll
            bic = k * np.log(n) - 2 * ll

            # KS test
            ks_stat, ks_pvalue = stats.kstest(data, dist_name, args=params)

            results.append({
                "distribution": dist_name,
                "parameters": params,
                "log_likelihood": ll,
                "aic": aic,
                "bic": bic,
                "ks_statistic": ks_stat,
                "ks_pvalue": ks_pvalue
            })
        except Exception as e:
            continue

    # Sort by AIC
    results.sort(key=lambda x: x['aic'])

    return {
        "rankings": results,
        "best_by_aic": results[0]['distribution'],
        "best_by_bic": min(results, key=lambda x: x['bic'])['distribution']
    }
```

## Process Integration

This skill integrates with the following processes:
- `discrete-event-simulation-modeling.js`
- `queuing-system-analysis.js`
- `demand-forecasting-model-development.js`

## Output Format

```json
{
  "data_summary": {
    "n": 500,
    "mean": 5.2,
    "std": 2.1,
    "cv": 0.40
  },
  "best_fit": {
    "distribution": "gamma",
    "parameters": {"shape": 6.1, "scale": 0.85},
    "goodness_of_fit": {
      "ks_statistic": 0.032,
      "ks_pvalue": 0.67,
      "aic": 1523.4
    }
  },
  "alternative_fits": [
    {"distribution": "lognorm", "aic": 1528.1},
    {"distribution": "weibull", "aic": 1531.2}
  ],
  "recommendation": "Use gamma(6.1, 0.85) for simulation input"
}
```

## Tools/Libraries

| Library | Description | Use Case |
|---------|-------------|----------|
| scipy.stats | Statistical functions | Core fitting |
| fitter | Auto fitting | Quick analysis |
| statsmodels | Advanced stats | Detailed tests |
| R fitdistrplus | R package | Complex fitting |

## Best Practices

1. **Visualize first** - Always plot histograms and Q-Q plots
2. **Consider theory** - Choose distributions based on process
3. **Test multiple** - Compare several candidate distributions
4. **Check tails** - Extreme values matter for simulation
5. **Document choice** - Record rationale for selected distribution
6. **Update periodically** - Re-fit as new data becomes available

## Constraints

- Report goodness-of-fit statistics, not just parameters
- Document data collection methodology
- Consider censored or truncated data
- Test for time-varying parameters
