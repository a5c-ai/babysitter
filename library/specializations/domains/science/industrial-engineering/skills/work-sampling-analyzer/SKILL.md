---
name: work-sampling-analyzer
description: Work sampling analysis skill for activity distribution and utilization studies.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: work-measurement
  backlog-id: SK-IE-035
---

# work-sampling-analyzer

You are **work-sampling-analyzer** - a specialized skill for work sampling studies to analyze activity distribution and equipment/worker utilization.

## Overview

This skill enables AI-powered work sampling including:
- Random observation scheduling
- Sample size determination
- Activity categorization
- Statistical confidence intervals
- Control chart monitoring
- Multi-activity studies
- Standard time development from sampling
- Utilization analysis

## Capabilities

### 1. Sample Size Determination

```python
import numpy as np
from scipy import stats
import random
from datetime import datetime, timedelta

def determine_sample_size_binomial(estimated_proportion: float,
                                  desired_accuracy: float,
                                  confidence_level: float = 0.95):
    """
    Determine required sample size for work sampling

    estimated_proportion: estimated percentage of time in activity (as decimal)
    desired_accuracy: desired accuracy (e.g., 0.05 for ±5%)
    confidence_level: statistical confidence (typically 0.95)
    """
    p = estimated_proportion
    e = desired_accuracy
    z = stats.norm.ppf(1 - (1 - confidence_level) / 2)

    # n = (z² × p × (1-p)) / e²
    n = (z ** 2 * p * (1 - p)) / (e ** 2)

    return {
        "required_observations": int(np.ceil(n)),
        "estimated_proportion": p,
        "desired_accuracy": f"±{e * 100:.1f}%",
        "confidence_level": f"{confidence_level * 100:.0f}%",
        "z_score": round(z, 2)
    }

def update_sample_size(observations: int, observed_proportion: float,
                      desired_accuracy: float, confidence_level: float = 0.95):
    """
    Update sample size based on observed data
    """
    z = stats.norm.ppf(1 - (1 - confidence_level) / 2)

    # Recalculate with observed proportion
    p = observed_proportion
    required = int(np.ceil((z ** 2 * p * (1 - p)) / (desired_accuracy ** 2)))

    return {
        "current_observations": observations,
        "observed_proportion": round(p, 3),
        "required_observations": required,
        "additional_needed": max(0, required - observations),
        "study_complete": observations >= required
    }
```

### 2. Random Observation Scheduling

```python
def generate_random_schedule(study_duration_days: int,
                            observations_per_day: int,
                            work_start: str = "08:00",
                            work_end: str = "17:00",
                            exclude_lunch: tuple = ("12:00", "13:00")):
    """
    Generate random observation times for work sampling study
    """
    start_time = datetime.strptime(work_start, "%H:%M")
    end_time = datetime.strptime(work_end, "%H:%M")
    lunch_start = datetime.strptime(exclude_lunch[0], "%H:%M")
    lunch_end = datetime.strptime(exclude_lunch[1], "%H:%M")

    schedule = []

    for day in range(study_duration_days):
        day_schedule = []

        # Generate random times
        attempts = 0
        while len(day_schedule) < observations_per_day and attempts < 1000:
            # Random minutes from start to end
            total_minutes = (end_time - start_time).seconds // 60
            random_minutes = random.randint(0, total_minutes)
            obs_time = start_time + timedelta(minutes=random_minutes)

            # Check if during lunch
            if lunch_start <= obs_time < lunch_end:
                attempts += 1
                continue

            # Check minimum spacing (10 minutes)
            too_close = False
            for existing in day_schedule:
                if abs((obs_time - existing).seconds) < 600:  # 10 minutes
                    too_close = True
                    break

            if not too_close:
                day_schedule.append(obs_time)

            attempts += 1

        day_schedule.sort()
        schedule.append({
            'day': day + 1,
            'times': [t.strftime("%H:%M") for t in day_schedule]
        })

    return {
        "total_days": study_duration_days,
        "observations_per_day": observations_per_day,
        "total_observations": study_duration_days * observations_per_day,
        "schedule": schedule
    }
```

### 3. Activity Analysis

```python
def analyze_observations(observations: list, categories: list):
    """
    Analyze work sampling observations

    observations: list of observed categories
    categories: list of possible categories
    """
    total = len(observations)

    # Count by category
    counts = {cat: observations.count(cat) for cat in categories}

    # Calculate proportions and confidence intervals
    z = stats.norm.ppf(0.975)  # 95% confidence

    results = []
    for cat in categories:
        count = counts[cat]
        p = count / total if total > 0 else 0

        # Standard error
        se = np.sqrt(p * (1 - p) / total) if total > 0 else 0

        # Confidence interval
        ci_lower = max(0, p - z * se)
        ci_upper = min(1, p + z * se)

        results.append({
            'category': cat,
            'count': count,
            'proportion': round(p, 4),
            'percentage': round(p * 100, 1),
            'std_error': round(se, 4),
            'ci_95_lower': round(ci_lower * 100, 1),
            'ci_95_upper': round(ci_upper * 100, 1)
        })

    # Sort by proportion descending
    results.sort(key=lambda x: x['proportion'], reverse=True)

    return {
        "total_observations": total,
        "categories": results,
        "summary": {
            "productive": sum(r['proportion'] for r in results
                           if 'idle' not in r['category'].lower() and
                           'delay' not in r['category'].lower()) * 100,
            "non_productive": sum(r['proportion'] for r in results
                                if 'idle' in r['category'].lower() or
                                'delay' in r['category'].lower()) * 100
        }
    }
```

### 4. Control Chart for Work Sampling

```python
def create_sampling_control_chart(daily_observations: list,
                                 target_proportion: float = None):
    """
    Create control chart to monitor sampling consistency

    daily_observations: list of {'day': int, 'productive': int, 'total': int}
    """
    # Calculate overall average
    total_productive = sum(d['productive'] for d in daily_observations)
    total_obs = sum(d['total'] for d in daily_observations)
    p_bar = total_productive / total_obs if total_obs > 0 else 0

    # Calculate control limits for each day (variable sample size)
    chart_data = []

    for day_data in daily_observations:
        n = day_data['total']
        p = day_data['productive'] / n if n > 0 else 0

        # Standard error
        se = np.sqrt(p_bar * (1 - p_bar) / n) if n > 0 else 0

        # 3-sigma control limits
        ucl = min(1, p_bar + 3 * se)
        lcl = max(0, p_bar - 3 * se)

        # Check if in control
        in_control = lcl <= p <= ucl

        chart_data.append({
            'day': day_data['day'],
            'proportion': round(p, 4),
            'sample_size': n,
            'ucl': round(ucl, 4),
            'lcl': round(lcl, 4),
            'in_control': in_control
        })

    # Identify out of control points
    ooc_points = [d for d in chart_data if not d['in_control']]

    return {
        "center_line": round(p_bar, 4),
        "chart_data": chart_data,
        "out_of_control_days": len(ooc_points),
        "process_stable": len(ooc_points) == 0,
        "recommendation": "Process is stable" if len(ooc_points) == 0
                         else f"Investigate {len(ooc_points)} out-of-control points"
    }
```

### 5. Standard Time from Work Sampling

```python
def calculate_standard_time_from_sampling(sampling_results: dict,
                                         total_study_time_hours: float,
                                         units_produced: int,
                                         allowance_percent: float):
    """
    Develop standard time from work sampling data

    sampling_results: results from analyze_observations
    total_study_time_hours: total time covered by study
    units_produced: number of units produced during study
    allowance_percent: PFD allowance
    """
    # Find productive time proportion
    productive_proportion = sampling_results['summary']['productive'] / 100

    # Total productive time
    productive_hours = total_study_time_hours * productive_proportion

    # Normal time per unit
    normal_time_hours = productive_hours / units_produced if units_produced > 0 else 0
    normal_time_minutes = normal_time_hours * 60

    # Apply allowances
    allowance_factor = 1 + (allowance_percent / 100)
    standard_time_minutes = normal_time_minutes * allowance_factor

    return {
        "study_duration_hours": total_study_time_hours,
        "productive_proportion": round(productive_proportion, 3),
        "productive_hours": round(productive_hours, 2),
        "units_produced": units_produced,
        "normal_time_per_unit": round(normal_time_minutes, 3),
        "allowance_percent": allowance_percent,
        "standard_time_per_unit": round(standard_time_minutes, 3),
        "pieces_per_hour": round(60 / standard_time_minutes, 1) if standard_time_minutes > 0 else 0
    }
```

### 6. Multi-Activity Study

```python
def multi_activity_study(observations: list, workers: list, machines: list):
    """
    Analyze multi-activity work sampling with workers and machines

    observations: list of {'time': str, 'worker': str, 'activity': str, 'machine': str}
    """
    total_obs = len(observations)

    # Analyze by worker
    worker_analysis = {}
    for worker in workers:
        worker_obs = [o for o in observations if o['worker'] == worker]
        n = len(worker_obs)

        activities = {}
        for obs in worker_obs:
            act = obs['activity']
            activities[act] = activities.get(act, 0) + 1

        worker_analysis[worker] = {
            'observations': n,
            'activities': {k: {'count': v, 'percent': round(v / n * 100, 1)}
                         for k, v in activities.items()}
        }

    # Analyze by machine
    machine_analysis = {}
    for machine in machines:
        machine_obs = [o for o in observations if o.get('machine') == machine]
        n = len(machine_obs)

        states = {}
        for obs in machine_obs:
            state = obs.get('machine_state', 'running')
            states[state] = states.get(state, 0) + 1

        if n > 0:
            machine_analysis[machine] = {
                'observations': n,
                'states': {k: {'count': v, 'percent': round(v / n * 100, 1)}
                          for k, v in states.items()},
                'utilization': round(states.get('running', 0) / n * 100, 1)
            }

    return {
        "total_observations": total_obs,
        "worker_analysis": worker_analysis,
        "machine_analysis": machine_analysis,
        "summary": {
            "avg_worker_utilization": np.mean([
                100 - w['activities'].get('idle', {}).get('percent', 0)
                for w in worker_analysis.values()
            ]),
            "avg_machine_utilization": np.mean([
                m['utilization'] for m in machine_analysis.values()
            ]) if machine_analysis else 0
        }
    }
```

## Process Integration

This skill integrates with the following processes:
- `work-measurement-analysis.js`
- `utilization-improvement.js`
- `workforce-planning.js`

## Output Format

```json
{
  "study_summary": {
    "total_observations": 500,
    "study_duration_days": 10,
    "confidence_level": "95%"
  },
  "activity_analysis": {
    "productive": {"percent": 72.5, "ci": [68.5, 76.5]},
    "idle": {"percent": 15.2, "ci": [12.1, 18.3]},
    "delay": {"percent": 12.3, "ci": [9.5, 15.1]}
  },
  "utilization": {
    "worker": 84.8,
    "machine": 78.2
  },
  "standard_time": {
    "normal_time": 2.45,
    "standard_time": 2.82
  },
  "recommendations": [
    "Reduce idle time through better scheduling",
    "Investigate delay causes"
  ]
}
```

## Best Practices

1. **Truly random times** - Use random number generator
2. **Sufficient observations** - Based on desired accuracy
3. **Consistent categorization** - Train all observers
4. **Brief observations** - Record what's seen instantly
5. **Inform workers** - Reduces Hawthorne effect over time
6. **Monitor stability** - Use control charts

## Constraints

- Cannot determine sequence of activities
- Requires clear category definitions
- Random schedule may miss rare events
- Worker behavior may change when observed
