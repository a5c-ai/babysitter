---
name: time-study-analyzer
description: Time study analysis skill with stopwatch methods, performance rating, and standard time calculation.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: work-measurement
  backlog-id: SK-IE-034
---

# time-study-analyzer

You are **time-study-analyzer** - a specialized skill for time study analysis including stopwatch methods, performance rating, and standard time calculation.

## Overview

This skill enables AI-powered time study analysis including:
- Stopwatch time study
- Element breakdown and timing
- Performance rating application
- Allowance calculation
- Standard time development
- Sample size determination
- Statistical analysis of observations
- Predetermined time systems (MTM)

## Capabilities

### 1. Time Study Data Collection

```python
import numpy as np
import pandas as pd
from scipy import stats

def analyze_time_study(observations: pd.DataFrame):
    """
    Analyze time study observations

    observations: DataFrame with columns ['element', 'cycle', 'time', 'rating']
    """
    results = {}

    for element in observations['element'].unique():
        element_data = observations[observations['element'] == element]

        # Basic statistics
        times = element_data['time'].values
        ratings = element_data['rating'].values

        # Identify outliers using IQR method
        q1, q3 = np.percentile(times, [25, 75])
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        valid_mask = (times >= lower_bound) & (times <= upper_bound)
        valid_times = times[valid_mask]
        valid_ratings = ratings[valid_mask]

        # Calculate observed time
        observed_time = np.mean(valid_times)

        # Calculate average performance rating
        avg_rating = np.mean(valid_ratings) / 100  # Convert to decimal

        # Normal time = Observed time × Rating
        normal_time = observed_time * avg_rating

        results[element] = {
            'observations': len(times),
            'outliers_removed': len(times) - len(valid_times),
            'observed_time': round(observed_time, 3),
            'std_dev': round(np.std(valid_times), 3),
            'avg_rating': round(avg_rating * 100, 1),
            'normal_time': round(normal_time, 3)
        }

    return {
        "elements": results,
        "total_normal_time": sum(e['normal_time'] for e in results.values())
    }
```

### 2. Performance Rating

```python
def apply_performance_rating(observed_time: float, rating_method: str,
                            rating_factors: dict = None):
    """
    Apply performance rating to observed time

    rating_method: 'pace', 'westinghouse', 'synthetic', 'objective'
    rating_factors: method-specific factors
    """
    if rating_method == 'pace':
        # Simple pace rating (100 = normal)
        rating = rating_factors.get('pace', 100) / 100
        normal_time = observed_time * rating

    elif rating_method == 'westinghouse':
        # Westinghouse system with four factors
        skill = rating_factors.get('skill', 0)  # -0.22 to +0.15
        effort = rating_factors.get('effort', 0)  # -0.17 to +0.13
        conditions = rating_factors.get('conditions', 0)  # -0.07 to +0.06
        consistency = rating_factors.get('consistency', 0)  # -0.04 to +0.04

        total_adjustment = skill + effort + conditions + consistency
        rating = 1 + total_adjustment
        normal_time = observed_time * rating

    elif rating_method == 'synthetic':
        # Based on predetermined time comparison
        benchmark_time = rating_factors.get('benchmark_time', observed_time)
        rating = benchmark_time / observed_time
        normal_time = benchmark_time  # Use benchmark as normal

    elif rating_method == 'objective':
        # Based on pace and difficulty
        pace = rating_factors.get('pace', 100) / 100
        difficulty = rating_factors.get('difficulty', 1.0)
        rating = pace * difficulty
        normal_time = observed_time * rating

    else:
        rating = 1.0
        normal_time = observed_time

    return {
        "method": rating_method,
        "observed_time": observed_time,
        "rating": round(rating * 100, 1),
        "normal_time": round(normal_time, 3),
        "factors_applied": rating_factors
    }

def westinghouse_lookup():
    """Return Westinghouse rating tables"""
    return {
        "skill": {
            "A1 - Superskill": 0.15, "A2 - Superskill": 0.13,
            "B1 - Excellent": 0.11, "B2 - Excellent": 0.08,
            "C1 - Good": 0.06, "C2 - Good": 0.03,
            "D - Average": 0.00,
            "E1 - Fair": -0.05, "E2 - Fair": -0.10,
            "F1 - Poor": -0.16, "F2 - Poor": -0.22
        },
        "effort": {
            "A1 - Excessive": 0.13, "A2 - Excessive": 0.12,
            "B1 - Excellent": 0.10, "B2 - Excellent": 0.08,
            "C1 - Good": 0.05, "C2 - Good": 0.02,
            "D - Average": 0.00,
            "E1 - Fair": -0.04, "E2 - Fair": -0.08,
            "F1 - Poor": -0.12, "F2 - Poor": -0.17
        },
        "conditions": {
            "A - Ideal": 0.06, "B - Excellent": 0.04,
            "C - Good": 0.02, "D - Average": 0.00,
            "E - Fair": -0.03, "F - Poor": -0.07
        },
        "consistency": {
            "A - Perfect": 0.04, "B - Excellent": 0.03,
            "C - Good": 0.01, "D - Average": 0.00,
            "E - Fair": -0.02, "F - Poor": -0.04
        }
    }
```

### 3. Allowance Calculation

```python
def calculate_allowances(normal_time: float, allowance_factors: dict):
    """
    Calculate allowances and standard time

    allowance_factors:
        - personal: percentage (typically 5%)
        - fatigue: percentage (varies by job)
        - delay: percentage (unavoidable delays)
        - special: any special allowances
    """
    personal = allowance_factors.get('personal', 5)
    fatigue = allowance_factors.get('fatigue', 4)
    delay = allowance_factors.get('delay', 5)
    special = allowance_factors.get('special', 0)

    # Total allowance percentage
    total_allowance_pct = personal + fatigue + delay + special

    # Calculate standard time
    # Method 1: Add to normal time
    allowance_time = normal_time * (total_allowance_pct / 100)
    standard_time_add = normal_time + allowance_time

    # Method 2: Divide by (1 - allowance factor) - more common
    pfd_factor = total_allowance_pct / 100
    standard_time_mult = normal_time / (1 - pfd_factor) if pfd_factor < 1 else normal_time * 2

    return {
        "normal_time": round(normal_time, 3),
        "allowances": {
            "personal": personal,
            "fatigue": fatigue,
            "delay": delay,
            "special": special,
            "total_percent": total_allowance_pct
        },
        "standard_time": round(standard_time_mult, 3),
        "method": "multiplicative",
        "pieces_per_hour": round(60 / standard_time_mult, 1) if standard_time_mult > 0 else 0
    }
```

### 4. Sample Size Determination

```python
def determine_sample_size(pilot_data: list, confidence: float = 0.95,
                         accuracy: float = 0.05):
    """
    Determine required sample size for time study

    pilot_data: initial observations
    confidence: confidence level (0.95 or 0.99 typical)
    accuracy: desired accuracy as proportion of mean (e.g., 0.05 = ±5%)
    """
    n_pilot = len(pilot_data)
    mean = np.mean(pilot_data)
    std_dev = np.std(pilot_data, ddof=1)
    cv = std_dev / mean  # Coefficient of variation

    # Z-score for confidence level
    z = stats.norm.ppf(1 - (1 - confidence) / 2)

    # Required sample size
    # n = (z * s / (A * x̄))²
    # where A is desired accuracy proportion
    required_n = (z * std_dev / (accuracy * mean)) ** 2

    # Adjust for small samples using t-distribution
    if required_n < 30:
        t_value = stats.t.ppf(1 - (1 - confidence) / 2, df=max(n_pilot - 1, 1))
        required_n = (t_value * std_dev / (accuracy * mean)) ** 2

    return {
        "pilot_observations": n_pilot,
        "pilot_mean": round(mean, 3),
        "pilot_std_dev": round(std_dev, 3),
        "coefficient_of_variation": round(cv, 3),
        "confidence_level": confidence,
        "desired_accuracy": accuracy,
        "required_sample_size": int(np.ceil(required_n)),
        "additional_observations_needed": max(0, int(np.ceil(required_n)) - n_pilot)
    }
```

### 5. Element Breakdown

```python
def create_element_breakdown(task_description: str, elements: list):
    """
    Document element breakdown for time study

    elements: list of {'name': str, 'description': str, 'type': str, 'breakpoint': str}
    """
    breakdown = []

    for i, elem in enumerate(elements):
        breakdown.append({
            'element_number': i + 1,
            'name': elem['name'],
            'description': elem['description'],
            'type': elem.get('type', 'regular'),  # regular, occasional, foreign
            'breakpoint': elem.get('breakpoint', ''),  # endpoint description
            'machine_controlled': elem.get('machine_controlled', False),
            'frequency': elem.get('frequency', 1.0)  # times per cycle
        })

    return {
        "task": task_description,
        "element_count": len(breakdown),
        "elements": breakdown,
        "element_types": {
            "regular": sum(1 for e in breakdown if e['type'] == 'regular'),
            "occasional": sum(1 for e in breakdown if e['type'] == 'occasional'),
            "foreign": sum(1 for e in breakdown if e['type'] == 'foreign')
        }
    }
```

### 6. Standard Time Summary

```python
def create_standard_time_summary(elements: list, allowances: dict,
                                frequency_adjustments: dict = None):
    """
    Create comprehensive standard time summary
    """
    total_normal_time = 0
    element_details = []

    for elem in elements:
        frequency = frequency_adjustments.get(elem['name'], 1.0) if frequency_adjustments else 1.0
        adjusted_time = elem['normal_time'] * frequency

        element_details.append({
            'element': elem['name'],
            'normal_time': elem['normal_time'],
            'frequency': frequency,
            'adjusted_time': round(adjusted_time, 3)
        })

        total_normal_time += adjusted_time

    # Apply allowances
    allowance_result = calculate_allowances(total_normal_time, allowances)

    return {
        "elements": element_details,
        "total_normal_time": round(total_normal_time, 3),
        "standard_time": allowance_result['standard_time'],
        "allowances": allowance_result['allowances'],
        "production_standards": {
            "pieces_per_hour": round(60 / allowance_result['standard_time'], 1),
            "pieces_per_shift_8hr": round(480 / allowance_result['standard_time'], 0),
            "hours_per_100": round(100 * allowance_result['standard_time'] / 60, 2)
        }
    }
```

## Process Integration

This skill integrates with the following processes:
- `work-measurement-analysis.js`
- `standard-work-development.js`
- `labor-cost-estimation.js`

## Output Format

```json
{
  "time_study": {
    "task": "Assembly Operation A",
    "elements": [
      {"element": "Get parts", "observed": 0.15, "rating": 95, "normal": 0.143},
      {"element": "Position", "observed": 0.22, "rating": 100, "normal": 0.220}
    ],
    "total_normal_time": 1.45
  },
  "standard_time": {
    "normal_time": 1.45,
    "allowance_percent": 15,
    "standard_time": 1.71
  },
  "production_standards": {
    "pieces_per_hour": 35.1,
    "hours_per_100": 2.85
  },
  "sample_analysis": {
    "required_observations": 25,
    "confidence": 95,
    "accuracy": "±5%"
  }
}
```

## Best Practices

1. **Define elements clearly** - Consistent breakpoints
2. **Trained observers** - Consistent rating is critical
3. **Multiple cycles** - Statistical significance
4. **Document conditions** - Workplace, tools, materials
5. **Worker cooperation** - Explain purpose
6. **Verify with workers** - They should agree it's achievable

## Constraints

- Rating is subjective and requires training
- Workers may not perform at normal pace
- Element variation increases sample needs
- Machine-paced elements don't need rating
