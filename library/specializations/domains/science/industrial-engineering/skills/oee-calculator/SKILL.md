---
name: oee-calculator
description: Overall Equipment Effectiveness calculation skill with loss categorization and improvement analysis.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: production-planning
  backlog-id: SK-IE-031
---

# oee-calculator

You are **oee-calculator** - a specialized skill for calculating Overall Equipment Effectiveness (OEE) and analyzing equipment losses.

## Overview

This skill enables AI-powered OEE analysis including:
- OEE calculation (Availability x Performance x Quality)
- Six Big Losses categorization
- TEEP (Total Effective Equipment Performance)
- Loss waterfall analysis
- OEE trending and benchmarking
- Improvement opportunity identification
- Root cause linkage for losses
- World-class OEE targeting

## Capabilities

### 1. OEE Calculation

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def calculate_oee(production_data: dict):
    """
    Calculate OEE from production data

    production_data:
        - planned_production_time: minutes
        - actual_run_time: minutes
        - ideal_cycle_time: minutes per unit
        - total_count: units produced
        - good_count: units without defects
    """
    # Availability
    planned_time = production_data['planned_production_time']
    run_time = production_data['actual_run_time']
    downtime = planned_time - run_time

    availability = (run_time / planned_time) * 100 if planned_time > 0 else 0

    # Performance
    ideal_cycle = production_data['ideal_cycle_time']
    total_count = production_data['total_count']

    ideal_run_time = total_count * ideal_cycle
    performance = (ideal_run_time / run_time) * 100 if run_time > 0 else 0

    # Cap performance at 100% (adjust ideal cycle if consistently over)
    performance = min(performance, 100)

    # Quality
    good_count = production_data['good_count']
    quality = (good_count / total_count) * 100 if total_count > 0 else 0

    # OEE
    oee = (availability / 100) * (performance / 100) * (quality / 100) * 100

    return {
        "oee": round(oee, 1),
        "availability": round(availability, 1),
        "performance": round(performance, 1),
        "quality": round(quality, 1),
        "breakdown": {
            "planned_time_minutes": planned_time,
            "run_time_minutes": run_time,
            "downtime_minutes": downtime,
            "total_count": total_count,
            "good_count": good_count,
            "defect_count": total_count - good_count
        }
    }
```

### 2. Six Big Losses Analysis

```python
def analyze_six_big_losses(loss_data: dict):
    """
    Categorize and analyze the Six Big Losses

    loss_data:
        - breakdowns: minutes
        - setup_adjustments: minutes
        - minor_stops: minutes
        - reduced_speed: minutes (calculated from speed losses)
        - startup_rejects: units
        - production_rejects: units
        - planned_time: minutes
        - ideal_cycle_time: minutes/unit
    """
    planned_time = loss_data['planned_time']
    ideal_cycle = loss_data['ideal_cycle_time']

    # Availability Losses
    breakdowns = loss_data.get('breakdowns', 0)
    setup_adjustments = loss_data.get('setup_adjustments', 0)
    availability_losses = breakdowns + setup_adjustments

    # Performance Losses
    minor_stops = loss_data.get('minor_stops', 0)
    reduced_speed = loss_data.get('reduced_speed', 0)
    performance_losses = minor_stops + reduced_speed

    # Quality Losses (convert to time equivalent)
    startup_rejects = loss_data.get('startup_rejects', 0)
    production_rejects = loss_data.get('production_rejects', 0)
    quality_losses = (startup_rejects + production_rejects) * ideal_cycle

    # Total losses
    total_losses = availability_losses + performance_losses + quality_losses

    losses = {
        "availability_losses": {
            "breakdowns": {"minutes": breakdowns, "percent": breakdowns / planned_time * 100},
            "setup_adjustments": {"minutes": setup_adjustments, "percent": setup_adjustments / planned_time * 100},
            "subtotal": availability_losses
        },
        "performance_losses": {
            "minor_stops": {"minutes": minor_stops, "percent": minor_stops / planned_time * 100},
            "reduced_speed": {"minutes": reduced_speed, "percent": reduced_speed / planned_time * 100},
            "subtotal": performance_losses
        },
        "quality_losses": {
            "startup_rejects": {"units": startup_rejects, "time_equivalent": startup_rejects * ideal_cycle},
            "production_rejects": {"units": production_rejects, "time_equivalent": production_rejects * ideal_cycle},
            "subtotal": quality_losses
        },
        "total_loss_time": total_losses,
        "productive_time": planned_time - total_losses,
        "loss_percent": total_losses / planned_time * 100
    }

    return losses
```

### 3. TEEP Calculation

```python
def calculate_teep(production_data: dict, calendar_time_hours: float = 24):
    """
    Calculate Total Effective Equipment Performance

    TEEP = OEE x Loading
    Loading = Planned Production Time / Calendar Time
    """
    # First calculate OEE
    oee_result = calculate_oee(production_data)

    # Calculate Loading
    planned_time_hours = production_data['planned_production_time'] / 60
    loading = (planned_time_hours / calendar_time_hours) * 100

    # TEEP
    teep = (oee_result['oee'] / 100) * (loading / 100) * 100

    return {
        "teep": round(teep, 1),
        "oee": oee_result['oee'],
        "loading": round(loading, 1),
        "calendar_time_hours": calendar_time_hours,
        "planned_time_hours": planned_time_hours,
        "interpretation": interpret_teep(teep)
    }

def interpret_teep(teep):
    if teep >= 90:
        return "World-class - exceptional asset utilization"
    elif teep >= 70:
        return "Good - some improvement opportunity"
    elif teep >= 50:
        return "Average - significant improvement potential"
    else:
        return "Low - major improvement needed"
```

### 4. OEE Trending

```python
def oee_trend_analysis(historical_data: pd.DataFrame):
    """
    Analyze OEE trends over time

    historical_data: DataFrame with columns ['date', 'oee', 'availability', 'performance', 'quality']
    """
    historical_data = historical_data.sort_values('date')

    # Calculate moving averages
    historical_data['oee_ma7'] = historical_data['oee'].rolling(window=7).mean()
    historical_data['oee_ma30'] = historical_data['oee'].rolling(window=30).mean()

    # Calculate trend
    if len(historical_data) >= 7:
        recent = historical_data.tail(7)['oee'].mean()
        previous = historical_data.tail(14).head(7)['oee'].mean() if len(historical_data) >= 14 else recent
        trend = recent - previous
    else:
        trend = 0

    # Find best and worst days
    best_day = historical_data.loc[historical_data['oee'].idxmax()]
    worst_day = historical_data.loc[historical_data['oee'].idxmin()]

    # Identify limiting factor
    means = {
        'availability': historical_data['availability'].mean(),
        'performance': historical_data['performance'].mean(),
        'quality': historical_data['quality'].mean()
    }
    limiting_factor = min(means, key=means.get)

    return {
        "current_oee": round(historical_data['oee'].iloc[-1], 1),
        "average_oee": round(historical_data['oee'].mean(), 1),
        "trend": round(trend, 1),
        "trend_direction": "improving" if trend > 0 else "declining" if trend < 0 else "stable",
        "best_day": {"date": str(best_day['date']), "oee": best_day['oee']},
        "worst_day": {"date": str(worst_day['date']), "oee": worst_day['oee']},
        "limiting_factor": limiting_factor,
        "component_averages": means
    }
```

### 5. Loss Waterfall

```python
def create_loss_waterfall(planned_time: float, losses: dict):
    """
    Create waterfall data showing progression from planned time to productive time
    """
    waterfall = [
        {"category": "Planned Time", "value": planned_time, "type": "total"},
        {"category": "Breakdowns", "value": -losses['breakdowns'], "type": "loss"},
        {"category": "Changeovers", "value": -losses['setup_adjustments'], "type": "loss"},
        {"category": "Minor Stops", "value": -losses['minor_stops'], "type": "loss"},
        {"category": "Speed Loss", "value": -losses['reduced_speed'], "type": "loss"},
        {"category": "Startup Rejects", "value": -losses['startup_rejects_time'], "type": "loss"},
        {"category": "Production Rejects", "value": -losses['production_rejects_time'], "type": "loss"}
    ]

    running_total = planned_time
    for item in waterfall[1:]:
        running_total += item['value']
        item['running_total'] = running_total

    waterfall.append({
        "category": "Productive Time",
        "value": running_total,
        "type": "result"
    })

    return {
        "waterfall": waterfall,
        "total_losses": planned_time - running_total,
        "loss_percentage": (planned_time - running_total) / planned_time * 100
    }
```

### 6. Improvement Opportunity Analysis

```python
def identify_improvement_opportunities(oee_data: dict, losses: dict, benchmarks: dict = None):
    """
    Identify and prioritize OEE improvement opportunities
    """
    benchmarks = benchmarks or {
        'world_class_oee': 85,
        'world_class_availability': 90,
        'world_class_performance': 95,
        'world_class_quality': 99.9
    }

    opportunities = []

    # Availability opportunities
    avail_gap = benchmarks['world_class_availability'] - oee_data['availability']
    if avail_gap > 0:
        opportunities.append({
            'component': 'Availability',
            'current': oee_data['availability'],
            'target': benchmarks['world_class_availability'],
            'gap': avail_gap,
            'primary_losses': ['breakdowns', 'setup_adjustments'],
            'potential_oee_gain': calculate_oee_impact(oee_data, 'availability', avail_gap)
        })

    # Performance opportunities
    perf_gap = benchmarks['world_class_performance'] - oee_data['performance']
    if perf_gap > 0:
        opportunities.append({
            'component': 'Performance',
            'current': oee_data['performance'],
            'target': benchmarks['world_class_performance'],
            'gap': perf_gap,
            'primary_losses': ['minor_stops', 'reduced_speed'],
            'potential_oee_gain': calculate_oee_impact(oee_data, 'performance', perf_gap)
        })

    # Quality opportunities
    qual_gap = benchmarks['world_class_quality'] - oee_data['quality']
    if qual_gap > 0:
        opportunities.append({
            'component': 'Quality',
            'current': oee_data['quality'],
            'target': benchmarks['world_class_quality'],
            'gap': qual_gap,
            'primary_losses': ['startup_rejects', 'production_rejects'],
            'potential_oee_gain': calculate_oee_impact(oee_data, 'quality', qual_gap)
        })

    # Sort by potential gain
    opportunities.sort(key=lambda x: x['potential_oee_gain'], reverse=True)

    return {
        "opportunities": opportunities,
        "total_potential_gain": benchmarks['world_class_oee'] - oee_data['oee'],
        "priority_focus": opportunities[0]['component'] if opportunities else None
    }

def calculate_oee_impact(current: dict, component: str, improvement: float):
    """Calculate OEE impact of improving one component"""
    a = current['availability'] + (improvement if component == 'availability' else 0)
    p = current['performance'] + (improvement if component == 'performance' else 0)
    q = current['quality'] + (improvement if component == 'quality' else 0)
    new_oee = (a / 100) * (p / 100) * (q / 100) * 100
    return new_oee - current['oee']
```

## Process Integration

This skill integrates with the following processes:
- `equipment-effectiveness-analysis.js`
- `tpm-implementation.js`
- `continuous-improvement-program.js`

## Output Format

```json
{
  "oee_summary": {
    "oee": 72.5,
    "availability": 85.0,
    "performance": 92.0,
    "quality": 92.7
  },
  "losses": {
    "availability_losses": {"breakdowns": 45, "changeovers": 30},
    "performance_losses": {"minor_stops": 20, "speed_loss": 15},
    "quality_losses": {"rejects": 150}
  },
  "improvement_opportunities": [
    {"component": "Availability", "gap": 5.0, "potential_gain": 4.2}
  ],
  "recommendations": [
    "Focus on reducing breakdown frequency",
    "Implement SMED for changeover reduction"
  ]
}
```

## Best Practices

1. **Measure accurately** - Use automated data collection
2. **Define losses consistently** - Standard definitions
3. **Focus on one component** - Biggest gap first
4. **Track daily** - Short-interval control
5. **Engage operators** - They know the losses
6. **Link to root causes** - Not just symptoms

## Constraints

- Data quality affects accuracy
- Manual collection prone to errors
- Different industries have different norms
- World-class targets vary by process type
