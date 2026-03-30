---
name: takt-time-calculator
description: Takt time and cycle time analysis skill for production line balancing and capacity planning.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: lean-manufacturing
  backlog-id: SK-IE-010
---

# takt-time-calculator

You are **takt-time-calculator** - a specialized skill for calculating takt time, cycle time, and related metrics for production planning and line balancing.

## Overview

This skill enables AI-powered takt time analysis including:
- Takt time calculation from demand and available time
- Cycle time measurement and analysis
- Operator cycle time tracking
- Takt time attainment monitoring
- Pitch calculation for paced withdrawal
- Planned cycle time with efficiency factors
- Overtime and shift adjustment calculations

## Prerequisites

- Production demand data
- Available working time information
- Cycle time observations

## Capabilities

### 1. Takt Time Calculation

```python
def calculate_takt_time(customer_demand, available_time, time_unit='seconds'):
    """
    Takt Time = Available Production Time / Customer Demand

    Args:
        customer_demand: units required per period
        available_time: production time available in period
        time_unit: output unit ('seconds', 'minutes', 'hours')

    Returns:
        Takt time and related metrics
    """
    if customer_demand <= 0:
        raise ValueError("Customer demand must be positive")

    takt_seconds = available_time / customer_demand

    conversions = {
        'seconds': takt_seconds,
        'minutes': takt_seconds / 60,
        'hours': takt_seconds / 3600
    }

    return {
        "takt_time": conversions[time_unit],
        "time_unit": time_unit,
        "customer_demand": customer_demand,
        "available_time_seconds": available_time,
        "interpretation": f"Must complete 1 unit every {takt_seconds:.1f} seconds"
    }

def calculate_available_time(shift_length_hours, breaks_minutes,
                            planned_downtime_minutes, shifts_per_day):
    """
    Calculate net available production time
    """
    shift_seconds = shift_length_hours * 3600
    breaks_seconds = breaks_minutes * 60
    downtime_seconds = planned_downtime_minutes * 60

    net_per_shift = shift_seconds - breaks_seconds - downtime_seconds
    total_daily = net_per_shift * shifts_per_day

    return {
        "gross_time_per_shift": shift_seconds,
        "breaks_deduction": breaks_seconds,
        "planned_downtime": downtime_seconds,
        "net_available_per_shift": net_per_shift,
        "shifts_per_day": shifts_per_day,
        "total_daily_available": total_daily
    }
```

### 2. Cycle Time Analysis

```python
import numpy as np
from scipy import stats

def analyze_cycle_times(observations):
    """
    Statistical analysis of observed cycle times
    """
    data = np.array(observations)

    analysis = {
        "count": len(data),
        "mean": np.mean(data),
        "median": np.median(data),
        "std": np.std(data, ddof=1),
        "min": np.min(data),
        "max": np.max(data),
        "range": np.max(data) - np.min(data),
        "cv": np.std(data, ddof=1) / np.mean(data) * 100  # Coefficient of variation
    }

    # Percentiles
    analysis["p5"] = np.percentile(data, 5)
    analysis["p95"] = np.percentile(data, 95)

    # Confidence interval for mean
    ci = stats.t.interval(0.95, len(data)-1,
                         loc=np.mean(data),
                         scale=stats.sem(data))
    analysis["ci_95"] = {"lower": ci[0], "upper": ci[1]}

    # Outlier detection (IQR method)
    q1, q3 = np.percentile(data, [25, 75])
    iqr = q3 - q1
    outliers = data[(data < q1 - 1.5*iqr) | (data > q3 + 1.5*iqr)]
    analysis["outliers"] = outliers.tolist()

    return analysis

def compare_to_takt(cycle_time_stats, takt_time):
    """
    Compare observed cycle times to takt time
    """
    mean_ct = cycle_time_stats['mean']
    p95_ct = cycle_time_stats['p95']

    comparison = {
        "takt_time": takt_time,
        "mean_cycle_time": mean_ct,
        "takt_attainment": takt_time / mean_ct * 100 if mean_ct > 0 else 0,
        "at_risk": mean_ct > takt_time * 0.9,
        "exceeds_takt": mean_ct > takt_time,
        "p95_vs_takt": p95_ct / takt_time * 100,
        "buffer_available": takt_time - mean_ct
    }

    if comparison["exceeds_takt"]:
        comparison["recommendation"] = "Cycle time exceeds takt - immediate improvement needed"
    elif comparison["at_risk"]:
        comparison["recommendation"] = "Cycle time near takt - limited buffer for variability"
    else:
        comparison["recommendation"] = "Healthy buffer exists below takt time"

    return comparison
```

### 3. Operator Cycle Time Tracking

```python
class OperatorCycleTimeTracker:
    """
    Track and analyze operator cycle times
    """
    def __init__(self):
        self.observations = {}  # {operator_id: [observations]}

    def record_observation(self, operator_id, cycle_time, timestamp=None):
        if operator_id not in self.observations:
            self.observations[operator_id] = []

        self.observations[operator_id].append({
            "cycle_time": cycle_time,
            "timestamp": timestamp or datetime.now()
        })

    def analyze_operator(self, operator_id):
        obs = [o['cycle_time'] for o in self.observations.get(operator_id, [])]
        return analyze_cycle_times(obs) if obs else None

    def compare_operators(self):
        """Compare performance across operators"""
        comparison = {}

        for op_id in self.observations:
            stats = self.analyze_operator(op_id)
            if stats:
                comparison[op_id] = {
                    "mean": stats['mean'],
                    "cv": stats['cv'],
                    "count": stats['count']
                }

        # Rank by mean cycle time
        ranked = sorted(comparison.items(), key=lambda x: x[1]['mean'])

        return {
            "operator_stats": comparison,
            "ranked_by_speed": [op_id for op_id, _ in ranked],
            "best_performer": ranked[0][0] if ranked else None,
            "spread": ranked[-1][1]['mean'] - ranked[0][1]['mean'] if len(ranked) > 1 else 0
        }
```

### 4. Pitch Calculation

```python
def calculate_pitch(takt_time, pack_quantity):
    """
    Pitch = Takt Time x Pack Quantity

    Pitch is the time interval for paced withdrawal
    (how often to move containers)
    """
    pitch_seconds = takt_time * pack_quantity

    return {
        "pitch_seconds": pitch_seconds,
        "pitch_minutes": pitch_seconds / 60,
        "takt_time": takt_time,
        "pack_quantity": pack_quantity,
        "withdrawals_per_hour": 3600 / pitch_seconds,
        "interpretation": f"Move {pack_quantity} units every {pitch_seconds/60:.1f} minutes"
    }
```

### 5. Planned Cycle Time

```python
def calculate_planned_cycle_time(takt_time, efficiency_factors):
    """
    Planned Cycle Time accounts for expected inefficiencies

    efficiency_factors: dict with components like:
        - oee: Overall Equipment Effectiveness (0-1)
        - quality_rate: First pass yield (0-1)
        - availability: Machine availability (0-1)
    """
    total_efficiency = 1.0
    for factor, value in efficiency_factors.items():
        total_efficiency *= value

    planned_ct = takt_time * total_efficiency

    return {
        "takt_time": takt_time,
        "efficiency_factors": efficiency_factors,
        "combined_efficiency": total_efficiency,
        "planned_cycle_time": planned_ct,
        "buffer_percentage": (1 - total_efficiency) * 100,
        "interpretation": f"Target {planned_ct:.1f}s to achieve takt of {takt_time:.1f}s"
    }
```

### 6. Overtime and Shift Adjustments

```python
def adjust_for_demand_changes(base_takt, base_demand, new_demand,
                              base_available_time, options):
    """
    Calculate adjustments needed for demand changes

    options: dict with available levers:
        - overtime_available: max overtime minutes per shift
        - additional_shifts: bool, can add shifts
        - weekends: bool, can work weekends
    """
    demand_ratio = new_demand / base_demand

    if demand_ratio <= 1:
        new_takt = base_takt / demand_ratio
        return {
            "action": "none_needed",
            "new_takt": new_takt,
            "demand_decrease": (1 - demand_ratio) * 100
        }

    # Need more capacity
    additional_time_needed = base_available_time * (demand_ratio - 1)

    solutions = []

    # Overtime option
    if options.get('overtime_available'):
        overtime_per_shift = options['overtime_available'] * 60  # to seconds
        shifts_needed = additional_time_needed / overtime_per_shift
        if shifts_needed <= 5:  # 5 day week
            solutions.append({
                "method": "overtime",
                "overtime_minutes_per_day": additional_time_needed / 60,
                "feasible": True
            })

    # Additional shift
    if options.get('additional_shifts'):
        solutions.append({
            "method": "additional_shift",
            "coverage_percentage": min(100, (base_available_time / additional_time_needed) * 100),
            "feasible": additional_time_needed <= base_available_time
        })

    # Weekend work
    if options.get('weekends'):
        solutions.append({
            "method": "weekend_work",
            "days_needed": additional_time_needed / base_available_time,
            "feasible": True
        })

    return {
        "demand_increase_percent": (demand_ratio - 1) * 100,
        "additional_time_needed_hours": additional_time_needed / 3600,
        "solutions": solutions,
        "new_takt_with_increase": base_available_time / new_demand
    }
```

## Process Integration

This skill integrates with the following processes:
- `standard-work-development.js`
- `line-balancing-analysis.js`
- `value-stream-mapping-analysis.js`

## Output Format

```json
{
  "takt_analysis": {
    "customer_demand": 460,
    "available_time_hours": 7.5,
    "takt_time_seconds": 58.7,
    "takt_time_formatted": "58.7 sec/unit"
  },
  "cycle_time_comparison": {
    "observed_mean": 52.3,
    "observed_std": 4.2,
    "takt_attainment_percent": 112.2,
    "buffer_seconds": 6.4
  },
  "status": "healthy",
  "recommendations": [
    "Current cycle time provides adequate buffer",
    "Monitor variability to maintain performance"
  ]
}
```

## Best Practices

1. **Use net available time** - Subtract breaks, meetings, maintenance
2. **Include variability** - Don't design to exact takt
3. **Update regularly** - Recalculate when demand changes
4. **Visual displays** - Post takt time at workstations
5. **Multiple observations** - Get statistically valid cycle times
6. **Consider all products** - May need product-specific takts

## Constraints

- Takt time is a target, not a fixed rule
- Account for product mix when applicable
- Document all time assumptions
- Review when demand patterns change
