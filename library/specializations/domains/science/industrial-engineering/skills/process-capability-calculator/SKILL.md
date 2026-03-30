---
name: process-capability-calculator
description: Process capability analysis skill with Cp, Cpk, Pp, Ppk calculations and specification compliance assessment.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: quality-engineering
  backlog-id: SK-IE-015
---

# process-capability-calculator

You are **process-capability-calculator** - a specialized skill for analyzing process capability with respect to specifications.

## Overview

This skill enables AI-powered capability analysis including:
- Capability index calculation (Cp, Cpk)
- Performance index calculation (Pp, Ppk)
- Specification limit analysis
- Normality testing (Shapiro-Wilk, Anderson-Darling)
- Non-normal capability analysis (Box-Cox transformation)
- PPM defect rate estimation
- Capability histogram with distribution overlay
- Six Sigma level calculation

## Prerequisites

- Python 3.8+ with numpy, scipy, statsmodels
- Process measurement data
- Specification limits (USL, LSL)

## Capabilities

### 1. Capability Index Calculation (Cp, Cpk)

```python
import numpy as np
from scipy import stats

def calculate_capability_indices(data, usl, lsl, subgroup_size=None):
    """
    Calculate Cp, Cpk capability indices

    Uses within-subgroup variation (R-bar/d2 or S-bar/c4)
    Requires stable process
    """
    x = np.array(data)

    # Process statistics
    x_bar = np.mean(x)
    specification_width = usl - lsl

    # Estimate sigma within (short-term variation)
    if subgroup_size and subgroup_size > 1:
        # Use pooled standard deviation or R-bar method
        # Simplified: using overall std with bias correction
        d2 = {2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326}
        # In practice, calculate R-bar from subgroups
        sigma_within = np.std(x, ddof=1)  # Simplified
    else:
        # For individuals, use moving range
        mr = np.abs(np.diff(x))
        mr_bar = np.mean(mr)
        sigma_within = mr_bar / 1.128  # d2 for n=2

    # Capability indices
    cp = specification_width / (6 * sigma_within)

    cpu = (usl - x_bar) / (3 * sigma_within)
    cpl = (x_bar - lsl) / (3 * sigma_within)
    cpk = min(cpu, cpl)

    return {
        "Cp": round(cp, 3),
        "Cpk": round(cpk, 3),
        "Cpu": round(cpu, 3),
        "Cpl": round(cpl, 3),
        "sigma_within": round(sigma_within, 4),
        "process_mean": round(x_bar, 4),
        "usl": usl,
        "lsl": lsl,
        "interpretation": interpret_capability(cpk)
    }

def interpret_capability(cpk):
    if cpk >= 2.0:
        return "World class (6 sigma)"
    elif cpk >= 1.67:
        return "Excellent (5 sigma)"
    elif cpk >= 1.33:
        return "Good (4 sigma)"
    elif cpk >= 1.0:
        return "Capable (3 sigma)"
    elif cpk >= 0.67:
        return "Poor (2 sigma)"
    else:
        return "Incapable (< 2 sigma)"
```

### 2. Performance Index Calculation (Pp, Ppk)

```python
def calculate_performance_indices(data, usl, lsl):
    """
    Calculate Pp, Ppk performance indices

    Uses overall variation (long-term)
    Does not require stable process
    """
    x = np.array(data)

    x_bar = np.mean(x)
    sigma_overall = np.std(x, ddof=1)  # Sample standard deviation
    specification_width = usl - lsl

    # Performance indices
    pp = specification_width / (6 * sigma_overall)

    ppu = (usl - x_bar) / (3 * sigma_overall)
    ppl = (x_bar - lsl) / (3 * sigma_overall)
    ppk = min(ppu, ppl)

    return {
        "Pp": round(pp, 3),
        "Ppk": round(ppk, 3),
        "Ppu": round(ppu, 3),
        "Ppl": round(ppl, 3),
        "sigma_overall": round(sigma_overall, 4),
        "process_mean": round(x_bar, 4),
        "interpretation": interpret_capability(ppk)
    }
```

### 3. Normality Testing

```python
def test_normality(data):
    """
    Test data for normality using multiple tests
    """
    x = np.array(data)
    n = len(x)

    results = {}

    # Shapiro-Wilk test (best for n < 50)
    if n <= 5000:
        stat, p_value = stats.shapiro(x)
        results["shapiro_wilk"] = {
            "statistic": round(stat, 4),
            "p_value": round(p_value, 4),
            "conclusion": "Normal" if p_value > 0.05 else "Non-normal"
        }

    # Anderson-Darling test
    ad_result = stats.anderson(x, dist='norm')
    results["anderson_darling"] = {
        "statistic": round(ad_result.statistic, 4),
        "critical_values": dict(zip(
            ['15%', '10%', '5%', '2.5%', '1%'],
            [round(cv, 4) for cv in ad_result.critical_values]
        )),
        "conclusion": "Normal" if ad_result.statistic < ad_result.critical_values[2] else "Non-normal"
    }

    # D'Agostino-Pearson test (n > 20)
    if n >= 20:
        stat, p_value = stats.normaltest(x)
        results["dagostino_pearson"] = {
            "statistic": round(stat, 4),
            "p_value": round(p_value, 4),
            "conclusion": "Normal" if p_value > 0.05 else "Non-normal"
        }

    # Overall assessment
    normal_count = sum(1 for r in results.values() if r.get("conclusion") == "Normal")
    results["overall_assessment"] = "Normal" if normal_count >= 2 else "Non-normal"

    # Descriptive statistics
    results["descriptive"] = {
        "skewness": round(stats.skew(x), 3),
        "kurtosis": round(stats.kurtosis(x), 3),
        "n": n
    }

    return results
```

### 4. Non-Normal Capability Analysis

```python
from scipy.stats import boxcox
from scipy.optimize import brentq

def nonnormal_capability(data, usl, lsl, method='percentile'):
    """
    Calculate capability for non-normal data

    Methods:
    - percentile: Use empirical percentiles
    - boxcox: Transform to normal using Box-Cox
    - weibull: Fit Weibull distribution
    """
    x = np.array(data)

    if method == 'percentile':
        # Percentile method (distribution-free)
        p0135 = np.percentile(x, 0.135)  # Lower 0.135%
        p99865 = np.percentile(x, 99.865)  # Upper 99.865%
        median = np.median(x)

        # Equivalent Cp
        spread = p99865 - p0135
        cp_equiv = (usl - lsl) / spread if spread > 0 else np.inf

        # Equivalent Cpk
        cpu_equiv = (usl - median) / ((p99865 - median) * 2) if (p99865 - median) > 0 else np.inf
        cpl_equiv = (median - lsl) / ((median - p0135) * 2) if (median - p0135) > 0 else np.inf
        cpk_equiv = min(cpu_equiv, cpl_equiv)

        return {
            "method": "percentile",
            "Cp_equivalent": round(cp_equiv, 3),
            "Cpk_equivalent": round(cpk_equiv, 3),
            "p0135": round(p0135, 4),
            "p99865": round(p99865, 4),
            "median": round(median, 4)
        }

    elif method == 'boxcox':
        # Box-Cox transformation
        # Shift data if necessary (must be positive)
        shift = 0
        if np.min(x) <= 0:
            shift = abs(np.min(x)) + 1
            x_shifted = x + shift
        else:
            x_shifted = x

        # Find optimal lambda
        transformed, lambda_opt = boxcox(x_shifted)

        # Transform specification limits
        if lambda_opt == 0:
            usl_t = np.log(usl + shift)
            lsl_t = np.log(lsl + shift)
        else:
            usl_t = ((usl + shift)**lambda_opt - 1) / lambda_opt
            lsl_t = ((lsl + shift)**lambda_opt - 1) / lambda_opt

        # Calculate capability on transformed data
        result = calculate_capability_indices(transformed, usl_t, lsl_t)
        result["method"] = "boxcox"
        result["lambda"] = round(lambda_opt, 4)
        result["shift"] = shift

        return result

    return None
```

### 5. PPM and Sigma Level Calculation

```python
def calculate_ppm_sigma(cpk, process_centered=True):
    """
    Calculate expected PPM defect rate and sigma level
    """
    if process_centered:
        # Symmetric distribution around target
        z = 3 * cpk
        ppm_total = 2 * (1 - stats.norm.cdf(z)) * 1e6
        ppm_upper = ppm_total / 2
        ppm_lower = ppm_total / 2
    else:
        # Use Cpk for worst side
        z = 3 * cpk
        ppm_worst = (1 - stats.norm.cdf(z)) * 1e6
        ppm_total = ppm_worst  # Approximate

    # Sigma level (with 1.5 sigma shift convention)
    sigma_short_term = 3 * cpk
    sigma_long_term = sigma_short_term + 1.5  # Industry convention

    return {
        "ppm_total": round(ppm_total, 1),
        "ppm_percent": round(ppm_total / 1e4, 4),
        "sigma_short_term": round(sigma_short_term, 2),
        "sigma_long_term": round(sigma_long_term, 2),
        "yield_percent": round((1 - ppm_total / 1e6) * 100, 4),
        "dpmo": round(ppm_total, 0)
    }

# Sigma level reference
SIGMA_REFERENCE = {
    1: {"cpk": 0.33, "ppm": 691462, "yield": 30.85},
    2: {"cpk": 0.67, "ppm": 308538, "yield": 69.15},
    3: {"cpk": 1.00, "ppm": 66807, "yield": 93.32},
    4: {"cpk": 1.33, "ppm": 6210, "yield": 99.38},
    5: {"cpk": 1.67, "ppm": 233, "yield": 99.977},
    6: {"cpk": 2.00, "ppm": 3.4, "yield": 99.99966}
}
```

### 6. Capability Report Generation

```python
def generate_capability_report(data, usl, lsl, target=None):
    """
    Generate comprehensive capability analysis report
    """
    x = np.array(data)

    report = {
        "summary": {
            "n": len(x),
            "usl": usl,
            "lsl": lsl,
            "target": target or (usl + lsl) / 2,
            "specification_width": usl - lsl
        },
        "descriptive_statistics": {
            "mean": round(np.mean(x), 4),
            "std": round(np.std(x, ddof=1), 4),
            "min": round(np.min(x), 4),
            "max": round(np.max(x), 4),
            "range": round(np.ptp(x), 4),
            "median": round(np.median(x), 4)
        }
    }

    # Normality test
    normality = test_normality(x)
    report["normality_test"] = normality

    # Capability indices
    if normality["overall_assessment"] == "Normal":
        report["capability_indices"] = calculate_capability_indices(x, usl, lsl)
        report["performance_indices"] = calculate_performance_indices(x, usl, lsl)
        report["analysis_method"] = "Normal distribution"
    else:
        report["capability_indices"] = nonnormal_capability(x, usl, lsl, method='percentile')
        report["performance_indices"] = nonnormal_capability(x, usl, lsl, method='boxcox')
        report["analysis_method"] = "Non-normal - used percentile and Box-Cox methods"

    # PPM and sigma
    cpk = report["capability_indices"].get("Cpk") or report["capability_indices"].get("Cpk_equivalent", 0)
    report["defect_prediction"] = calculate_ppm_sigma(cpk)

    # Out of spec analysis
    out_of_spec_high = np.sum(x > usl)
    out_of_spec_low = np.sum(x < lsl)
    report["observed_defects"] = {
        "above_usl": int(out_of_spec_high),
        "below_lsl": int(out_of_spec_low),
        "total_out_of_spec": int(out_of_spec_high + out_of_spec_low),
        "observed_ppm": round((out_of_spec_high + out_of_spec_low) / len(x) * 1e6, 1)
    }

    # Recommendations
    report["recommendations"] = generate_recommendations(report)

    return report

def generate_recommendations(report):
    cpk = report["capability_indices"].get("Cpk") or report["capability_indices"].get("Cpk_equivalent", 0)
    recommendations = []

    if cpk < 1.0:
        recommendations.append("Process is not capable - immediate improvement required")
        recommendations.append("Reduce variation or widen specifications")
    elif cpk < 1.33:
        recommendations.append("Process marginally capable - continuous improvement recommended")
    elif cpk < 1.67:
        recommendations.append("Process capable - maintain monitoring")
    else:
        recommendations.append("Process highly capable - consider reducing inspection")

    # Centering
    mean = report["descriptive_statistics"]["mean"]
    target = report["summary"]["target"]
    if abs(mean - target) > (report["summary"]["specification_width"] * 0.1):
        recommendations.append(f"Process off-center by {abs(mean - target):.3f} - consider centering adjustment")

    return recommendations
```

## Process Integration

This skill integrates with the following processes:
- `statistical-process-control-implementation.js`
- `design-of-experiments-execution.js`
- `root-cause-analysis-investigation.js`

## Output Format

```json
{
  "summary": {
    "n": 150,
    "usl": 10.5,
    "lsl": 9.5
  },
  "capability_indices": {
    "Cp": 1.45,
    "Cpk": 1.32,
    "interpretation": "Good (4 sigma)"
  },
  "defect_prediction": {
    "ppm_total": 966,
    "sigma_long_term": 4.5,
    "yield_percent": 99.903
  },
  "recommendations": [
    "Process capable - maintain monitoring",
    "Consider centering adjustment"
  ]
}
```

## Best Practices

1. **Ensure stability first** - Capability analysis requires stable process
2. **Test normality** - Use appropriate methods for non-normal data
3. **Sufficient sample size** - Minimum 100 observations recommended
4. **Use Cpk not just Cp** - Centering matters
5. **Report both Cp/Cpk and Pp/Ppk** - Show short and long-term capability
6. **Include confidence intervals** - Single point estimates can be misleading

## Constraints

- Process must be in statistical control
- Document all specification limits
- Note any data transformations
- Report normality test results
