---
name: control-chart-analyzer
description: Statistical process control chart creation and analysis skill with control limit calculation and special cause detection.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: quality-engineering
  backlog-id: SK-IE-014
---

# control-chart-analyzer

You are **control-chart-analyzer** - a specialized skill for creating and analyzing statistical process control charts with control limit calculation and special cause detection.

## Overview

This skill enables AI-powered SPC analysis including:
- X-bar and R chart generation
- X-bar and S chart for large subgroups
- Individual and Moving Range (I-MR) charts
- p-chart and np-chart for attribute data
- c-chart and u-chart for defects
- Control limit calculation (3-sigma)
- Nelson rules detection
- Western Electric rules application
- Out-of-control pattern identification

## Prerequisites

- Python 3.8+ with numpy, scipy, matplotlib
- Process measurement data
- Understanding of SPC principles

## Capabilities

### 1. X-bar and R Charts

```python
import numpy as np
from scipy import stats

# Control chart constants
A2 = {2: 1.880, 3: 1.023, 4: 0.729, 5: 0.577, 6: 0.483, 7: 0.419,
      8: 0.373, 9: 0.337, 10: 0.308}
D3 = {2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0.076, 8: 0.136, 9: 0.184, 10: 0.223}
D4 = {2: 3.267, 3: 2.574, 4: 2.282, 5: 2.114, 6: 2.004, 7: 1.924,
      8: 1.864, 9: 1.816, 10: 1.777}

def xbar_r_chart(data, subgroup_size=5):
    """
    Create X-bar and R control chart

    data: 2D array where each row is a subgroup
    """
    n = subgroup_size
    subgroups = np.array(data)

    # Calculate subgroup statistics
    xbars = np.mean(subgroups, axis=1)
    ranges = np.ptp(subgroups, axis=1)  # Range = max - min

    # Grand mean and average range
    xbar_bar = np.mean(xbars)
    r_bar = np.mean(ranges)

    # Control limits for X-bar chart
    xbar_ucl = xbar_bar + A2[n] * r_bar
    xbar_lcl = xbar_bar - A2[n] * r_bar

    # Control limits for R chart
    r_ucl = D4[n] * r_bar
    r_lcl = D3[n] * r_bar

    return {
        "xbar_chart": {
            "center_line": xbar_bar,
            "ucl": xbar_ucl,
            "lcl": xbar_lcl,
            "data": xbars.tolist()
        },
        "r_chart": {
            "center_line": r_bar,
            "ucl": r_ucl,
            "lcl": r_lcl,
            "data": ranges.tolist()
        },
        "subgroup_size": n,
        "num_subgroups": len(subgroups)
    }
```

### 2. Individual and Moving Range (I-MR) Chart

```python
def imr_chart(data):
    """
    Create Individual and Moving Range chart
    For individual observations (subgroup size = 1)
    """
    x = np.array(data)
    n = len(x)

    # Moving ranges
    mr = np.abs(np.diff(x))

    # Statistics
    x_bar = np.mean(x)
    mr_bar = np.mean(mr)

    # Control limits (using d2 = 1.128 for n=2)
    d2 = 1.128
    sigma_hat = mr_bar / d2

    x_ucl = x_bar + 3 * sigma_hat
    x_lcl = x_bar - 3 * sigma_hat

    # MR limits (D4 = 3.267 for n=2)
    mr_ucl = 3.267 * mr_bar
    mr_lcl = 0

    return {
        "i_chart": {
            "center_line": x_bar,
            "ucl": x_ucl,
            "lcl": x_lcl,
            "data": x.tolist(),
            "sigma_estimate": sigma_hat
        },
        "mr_chart": {
            "center_line": mr_bar,
            "ucl": mr_ucl,
            "lcl": mr_lcl,
            "data": mr.tolist()
        },
        "num_observations": n
    }
```

### 3. Attribute Charts (p-chart, np-chart)

```python
def p_chart(defectives, sample_sizes):
    """
    p-chart for proportion defective
    Variable sample sizes supported
    """
    defectives = np.array(defectives)
    n = np.array(sample_sizes)

    # Proportions
    p = defectives / n

    # Average proportion
    p_bar = np.sum(defectives) / np.sum(n)

    # Control limits (vary with sample size)
    ucl = p_bar + 3 * np.sqrt(p_bar * (1 - p_bar) / n)
    lcl = np.maximum(0, p_bar - 3 * np.sqrt(p_bar * (1 - p_bar) / n))

    return {
        "center_line": p_bar,
        "ucl": ucl.tolist(),  # Variable limits
        "lcl": lcl.tolist(),
        "data": p.tolist(),
        "sample_sizes": n.tolist()
    }

def np_chart(defectives, sample_size):
    """
    np-chart for number defective
    Constant sample size
    """
    defectives = np.array(defectives)
    n = sample_size

    # Average number defective
    np_bar = np.mean(defectives)
    p_bar = np_bar / n

    # Control limits
    ucl = np_bar + 3 * np.sqrt(np_bar * (1 - p_bar))
    lcl = max(0, np_bar - 3 * np.sqrt(np_bar * (1 - p_bar)))

    return {
        "center_line": np_bar,
        "ucl": ucl,
        "lcl": lcl,
        "data": defectives.tolist(),
        "sample_size": n,
        "p_bar": p_bar
    }
```

### 4. c-chart and u-chart

```python
def c_chart(defects):
    """
    c-chart for count of defects
    Constant inspection unit size
    """
    c = np.array(defects)

    c_bar = np.mean(c)

    ucl = c_bar + 3 * np.sqrt(c_bar)
    lcl = max(0, c_bar - 3 * np.sqrt(c_bar))

    return {
        "center_line": c_bar,
        "ucl": ucl,
        "lcl": lcl,
        "data": c.tolist()
    }

def u_chart(defects, unit_sizes):
    """
    u-chart for defects per unit
    Variable inspection unit sizes
    """
    defects = np.array(defects)
    n = np.array(unit_sizes)

    u = defects / n
    u_bar = np.sum(defects) / np.sum(n)

    # Variable control limits
    ucl = u_bar + 3 * np.sqrt(u_bar / n)
    lcl = np.maximum(0, u_bar - 3 * np.sqrt(u_bar / n))

    return {
        "center_line": u_bar,
        "ucl": ucl.tolist(),
        "lcl": lcl.tolist(),
        "data": u.tolist(),
        "unit_sizes": n.tolist()
    }
```

### 5. Nelson Rules Detection

```python
def detect_nelson_rules(data, center_line, ucl, lcl):
    """
    Detect all 8 Nelson rules for special cause variation
    """
    x = np.array(data)
    sigma = (ucl - center_line) / 3

    violations = {
        "rule_1": [],  # Point beyond 3 sigma
        "rule_2": [],  # 9 points same side of center
        "rule_3": [],  # 6 points increasing or decreasing
        "rule_4": [],  # 14 points alternating up/down
        "rule_5": [],  # 2 of 3 points beyond 2 sigma
        "rule_6": [],  # 4 of 5 points beyond 1 sigma
        "rule_7": [],  # 15 points within 1 sigma
        "rule_8": []   # 8 points beyond 1 sigma both sides
    }

    n = len(x)

    # Rule 1: Beyond 3 sigma
    for i in range(n):
        if x[i] > ucl or x[i] < lcl:
            violations["rule_1"].append(i)

    # Rule 2: 9 consecutive same side
    for i in range(n - 8):
        window = x[i:i+9]
        if all(w > center_line for w in window) or all(w < center_line for w in window):
            violations["rule_2"].append(i)

    # Rule 3: 6 consecutive increasing or decreasing
    for i in range(n - 5):
        window = x[i:i+6]
        diffs = np.diff(window)
        if all(d > 0 for d in diffs) or all(d < 0 for d in diffs):
            violations["rule_3"].append(i)

    # Rule 4: 14 consecutive alternating
    for i in range(n - 13):
        window = x[i:i+14]
        diffs = np.diff(window)
        alternating = all(diffs[j] * diffs[j+1] < 0 for j in range(len(diffs)-1))
        if alternating:
            violations["rule_4"].append(i)

    # Rule 5: 2 of 3 beyond 2 sigma (same side)
    two_sigma_up = center_line + 2 * sigma
    two_sigma_down = center_line - 2 * sigma
    for i in range(n - 2):
        window = x[i:i+3]
        above = sum(1 for w in window if w > two_sigma_up)
        below = sum(1 for w in window if w < two_sigma_down)
        if above >= 2 or below >= 2:
            violations["rule_5"].append(i)

    # Rule 6: 4 of 5 beyond 1 sigma (same side)
    one_sigma_up = center_line + sigma
    one_sigma_down = center_line - sigma
    for i in range(n - 4):
        window = x[i:i+5]
        above = sum(1 for w in window if w > one_sigma_up)
        below = sum(1 for w in window if w < one_sigma_down)
        if above >= 4 or below >= 4:
            violations["rule_6"].append(i)

    # Rule 7: 15 consecutive within 1 sigma
    for i in range(n - 14):
        window = x[i:i+15]
        if all(one_sigma_down < w < one_sigma_up for w in window):
            violations["rule_7"].append(i)

    # Rule 8: 8 consecutive beyond 1 sigma (either side, not hugging center)
    for i in range(n - 7):
        window = x[i:i+8]
        if all(w > one_sigma_up or w < one_sigma_down for w in window):
            violations["rule_8"].append(i)

    return violations

def interpret_violations(violations):
    """
    Provide interpretation of rule violations
    """
    interpretations = {
        "rule_1": "Special cause - point beyond control limits",
        "rule_2": "Shift in process mean",
        "rule_3": "Trend - process drifting",
        "rule_4": "Overcontrol or systematic alternation",
        "rule_5": "Warning - approaching out of control",
        "rule_6": "Shift developing",
        "rule_7": "Stratification - mixture of processes",
        "rule_8": "Mixture - two populations"
    }

    findings = []
    for rule, indices in violations.items():
        if indices:
            findings.append({
                "rule": rule,
                "occurrences": len(indices),
                "starting_points": indices[:5],  # First 5
                "interpretation": interpretations[rule]
            })

    return findings
```

### 6. Process Stability Assessment

```python
def assess_process_stability(chart_data, violations):
    """
    Overall assessment of process stability
    """
    total_violations = sum(len(v) for v in violations.values())
    n_points = len(chart_data['data'])

    # Calculate percentage in control
    out_of_control_points = set()
    for rule, indices in violations.items():
        out_of_control_points.update(indices)

    pct_in_control = (n_points - len(out_of_control_points)) / n_points * 100

    assessment = {
        "total_points": n_points,
        "out_of_control_points": len(out_of_control_points),
        "percent_in_control": pct_in_control,
        "total_rule_violations": total_violations,
        "stability_status": "",
        "recommendations": []
    }

    if pct_in_control >= 99:
        assessment["stability_status"] = "Stable - Process in statistical control"
        assessment["recommendations"].append("Process is stable - proceed with capability analysis")
    elif pct_in_control >= 95:
        assessment["stability_status"] = "Mostly stable - Minor instabilities detected"
        assessment["recommendations"].append("Investigate recent out-of-control points")
    elif pct_in_control >= 90:
        assessment["stability_status"] = "Unstable - Multiple special causes present"
        assessment["recommendations"].append("Investigate and eliminate special causes before capability study")
    else:
        assessment["stability_status"] = "Highly unstable - Process not in control"
        assessment["recommendations"].append("Focus on process stabilization before any capability analysis")

    return assessment
```

## Process Integration

This skill integrates with the following processes:
- `statistical-process-control-implementation.js`
- `root-cause-analysis-investigation.js`
- `oee-improvement.js`

## Output Format

```json
{
  "chart_type": "X-bar and R",
  "subgroup_size": 5,
  "num_subgroups": 25,
  "xbar_chart": {
    "center_line": 50.2,
    "ucl": 52.8,
    "lcl": 47.6
  },
  "r_chart": {
    "center_line": 4.5,
    "ucl": 9.5,
    "lcl": 0
  },
  "violations": {
    "rule_1": 2,
    "rule_2": 1
  },
  "stability_status": "Mostly stable",
  "recommendations": [
    "Investigate points 12 and 18 exceeding control limits"
  ]
}
```

## Best Practices

1. **Collect sufficient data** - Minimum 25 subgroups for initial limits
2. **Choose appropriate chart** - Match chart to data type
3. **Apply rules consistently** - Use agreed-upon detection rules
4. **Investigate all signals** - Every out-of-control point has a cause
5. **Recalculate after improvement** - Update limits when process changes
6. **Train operators** - Enable real-time response

## Constraints

- Control limits from in-control data only
- Document all rule sets used
- Distinguish common vs special cause
- Never adjust process based on common cause
