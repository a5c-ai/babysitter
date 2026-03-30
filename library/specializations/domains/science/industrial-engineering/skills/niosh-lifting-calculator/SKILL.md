---
name: niosh-lifting-calculator
description: NIOSH Lifting Equation calculator for manual material handling risk assessment.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: ergonomics
  backlog-id: SK-IE-020
---

# niosh-lifting-calculator

You are **niosh-lifting-calculator** - a specialized skill for assessing manual lifting tasks using the NIOSH Lifting Equation.

## Overview

This skill enables AI-powered lifting risk assessment including:
- Recommended Weight Limit (RWL) calculation
- Lifting Index (LI) computation
- Multiplier factor analysis (HM, VM, DM, AM, FM, CM)
- Single-task and multi-task analysis
- Risk level classification
- Work redesign recommendations
- Comparison of job modifications

## Capabilities

### 1. NIOSH Lifting Equation

```python
from dataclasses import dataclass
from typing import Optional
import math

@dataclass
class LiftingTaskParameters:
    """
    Input parameters for NIOSH Lifting Equation
    """
    # Load characteristics
    load_weight_lbs: float  # Actual weight being lifted

    # Origin parameters
    horizontal_origin: float  # H: Horizontal distance from midpoint between ankles (inches)
    vertical_origin: float  # V: Vertical height at origin (inches)

    # Destination parameters
    horizontal_dest: float  # H at destination
    vertical_dest: float  # V at destination

    # Task parameters
    vertical_travel: float  # D: Vertical travel distance (inches)
    asymmetry_angle: float  # A: Angle of asymmetry (degrees)
    frequency: float  # F: Lifts per minute
    duration: float  # Duration category: 1 (≤1hr), 2 (1-2hr), 8 (2-8hr)
    coupling: str  # "good", "fair", "poor"

def calculate_rwl(params: LiftingTaskParameters, at_origin: bool = True):
    """
    Calculate Recommended Weight Limit using NIOSH equation

    RWL = LC x HM x VM x DM x AM x FM x CM

    LC = Load Constant = 51 lbs
    """
    LC = 51  # Load Constant in lbs

    # Select origin or destination for location-specific RWL
    H = params.horizontal_origin if at_origin else params.horizontal_dest
    V = params.vertical_origin if at_origin else params.vertical_dest

    # Horizontal Multiplier (HM)
    # HM = 10/H, where H is between 10-25 inches
    H = max(10, min(H, 25))  # Clamp to valid range
    HM = 10 / H

    # Vertical Multiplier (VM)
    # VM = 1 - 0.0075|V - 30|
    VM = 1 - 0.0075 * abs(V - 30)
    VM = max(0, VM)  # Cannot be negative

    # Distance Multiplier (DM)
    # DM = 0.82 + 1.8/D
    D = max(10, params.vertical_travel)  # Minimum 10 inches
    DM = 0.82 + (1.8 / D)
    DM = min(1, DM)  # Cannot exceed 1

    # Asymmetric Multiplier (AM)
    # AM = 1 - 0.0032A
    A = min(135, params.asymmetry_angle)  # Max 135 degrees
    AM = 1 - (0.0032 * A)

    # Frequency Multiplier (FM)
    FM = get_frequency_multiplier(params.frequency, params.duration, V)

    # Coupling Multiplier (CM)
    CM = get_coupling_multiplier(params.coupling, V)

    # Calculate RWL
    RWL = LC * HM * VM * DM * AM * FM * CM

    return {
        "RWL": round(RWL, 1),
        "multipliers": {
            "LC": LC,
            "HM": round(HM, 3),
            "VM": round(VM, 3),
            "DM": round(DM, 3),
            "AM": round(AM, 3),
            "FM": round(FM, 3),
            "CM": round(CM, 3)
        },
        "location": "origin" if at_origin else "destination"
    }

def get_frequency_multiplier(frequency, duration, vertical):
    """
    Frequency Multiplier lookup table
    """
    # Simplified FM table
    FM_TABLE = {
        # (frequency, duration, V>=30): FM value
        (0.2, 1, True): 1.00, (0.2, 1, False): 1.00,
        (0.5, 1, True): 0.97, (0.5, 1, False): 0.97,
        (1, 1, True): 0.94, (1, 1, False): 0.94,
        (2, 1, True): 0.91, (2, 1, False): 0.91,
        (3, 1, True): 0.88, (3, 1, False): 0.88,
        (4, 1, True): 0.84, (4, 1, False): 0.84,
        (5, 1, True): 0.80, (5, 1, False): 0.80,
        # Add more as needed
    }

    # Find closest match or interpolate
    v_category = vertical >= 30
    key = (min(15, frequency), int(duration), v_category)

    # Default approximation
    if frequency <= 0.2:
        return 1.0
    elif frequency >= 15:
        return 0.0
    else:
        # Linear approximation
        return max(0, 1 - 0.05 * frequency)

def get_coupling_multiplier(coupling, vertical):
    """
    Coupling Multiplier based on handle quality
    """
    CM_TABLE = {
        ("good", True): 1.00,
        ("good", False): 1.00,
        ("fair", True): 0.95,
        ("fair", False): 1.00,
        ("poor", True): 0.90,
        ("poor", False): 0.90
    }

    v_category = vertical >= 30
    return CM_TABLE.get((coupling.lower(), v_category), 0.90)
```

### 2. Lifting Index Calculation

```python
def calculate_lifting_index(params: LiftingTaskParameters):
    """
    Calculate Lifting Index

    LI = Load Weight / RWL

    LI interpretation:
    - LI ≤ 1.0: Acceptable for most workers
    - 1.0 < LI ≤ 3.0: Increased risk, some workers may be at risk
    - LI > 3.0: Unacceptable for most workers
    """
    # Calculate RWL at both origin and destination
    rwl_origin = calculate_rwl(params, at_origin=True)
    rwl_dest = calculate_rwl(params, at_origin=False)

    # Use the more restrictive (lower) RWL
    rwl = min(rwl_origin['RWL'], rwl_dest['RWL'])
    limiting_location = "origin" if rwl_origin['RWL'] < rwl_dest['RWL'] else "destination"

    # Calculate Lifting Index
    li = params.load_weight_lbs / rwl if rwl > 0 else float('inf')

    # Risk classification
    if li <= 1.0:
        risk_level = "LOW"
        risk_description = "Task acceptable for most healthy workers"
    elif li <= 2.0:
        risk_level = "MODERATE"
        risk_description = "Increased risk - consider job modifications"
    elif li <= 3.0:
        risk_level = "HIGH"
        risk_description = "High risk - job redesign recommended"
    else:
        risk_level = "VERY HIGH"
        risk_description = "Unacceptable risk - immediate redesign required"

    return {
        "lifting_index": round(li, 2),
        "rwl": rwl,
        "rwl_origin": rwl_origin['RWL'],
        "rwl_dest": rwl_dest['RWL'],
        "limiting_location": limiting_location,
        "actual_weight": params.load_weight_lbs,
        "risk_level": risk_level,
        "risk_description": risk_description,
        "multipliers_origin": rwl_origin['multipliers'],
        "multipliers_dest": rwl_dest['multipliers']
    }
```

### 3. Multi-Task Analysis

```python
def multi_task_lifting_index(tasks: list):
    """
    Calculate Composite Lifting Index for multiple tasks

    CLI = LI_max + sum of (LI_adjusted for remaining tasks)
    """
    if not tasks:
        return None

    # Calculate individual LIs
    task_results = []
    for task in tasks:
        result = calculate_lifting_index(task['params'])
        result['task_name'] = task.get('name', 'Unnamed')
        result['frequency'] = task['params'].frequency
        task_results.append(result)

    # Sort by LI descending
    task_results.sort(key=lambda x: x['lifting_index'], reverse=True)

    # Calculate CLI
    cli = task_results[0]['lifting_index']

    for i in range(1, len(task_results)):
        # Frequency adjustment for additional tasks
        # Simplified: add fraction of each additional LI
        freq_factor = sum(t['frequency'] for t in task_results[:i+1]) / \
                     sum(t['frequency'] for t in task_results[:i])
        cli += task_results[i]['lifting_index'] * (freq_factor - 1) / freq_factor

    return {
        "composite_lifting_index": round(cli, 2),
        "individual_tasks": task_results,
        "most_stressful_task": task_results[0]['task_name'],
        "risk_level": get_risk_level(cli)
    }

def get_risk_level(li):
    if li <= 1.0:
        return "LOW"
    elif li <= 2.0:
        return "MODERATE"
    elif li <= 3.0:
        return "HIGH"
    else:
        return "VERY HIGH"
```

### 4. Multiplier Analysis and Recommendations

```python
def analyze_multipliers(result: dict):
    """
    Identify which factors are limiting and provide recommendations
    """
    multipliers = result.get('multipliers_origin', {})
    limiting_factors = []

    # Identify factors below threshold
    thresholds = {
        "HM": 0.7,  # Horizontal distance issue
        "VM": 0.8,  # Vertical height issue
        "DM": 0.8,  # Travel distance issue
        "AM": 0.8,  # Asymmetry issue
        "FM": 0.7,  # Frequency issue
        "CM": 0.9   # Coupling issue
    }

    recommendations = []

    for factor, threshold in thresholds.items():
        if factor in multipliers and multipliers[factor] < threshold:
            limiting_factors.append(factor)

            if factor == "HM":
                recommendations.append({
                    "factor": "Horizontal Distance",
                    "issue": f"HM = {multipliers[factor]:.2f} - load too far from body",
                    "recommendations": [
                        "Move load closer to worker",
                        "Use conveyors or slides",
                        "Eliminate obstacles between worker and load",
                        "Reduce container width"
                    ]
                })
            elif factor == "VM":
                recommendations.append({
                    "factor": "Vertical Location",
                    "issue": f"VM = {multipliers[factor]:.2f} - lift height not optimal",
                    "recommendations": [
                        "Raise or lower origin/destination",
                        "Use lift tables or platforms",
                        "Eliminate floor-level or overhead lifts"
                    ]
                })
            elif factor == "DM":
                recommendations.append({
                    "factor": "Travel Distance",
                    "issue": f"DM = {multipliers[factor]:.2f} - excessive vertical travel",
                    "recommendations": [
                        "Reduce vertical travel distance",
                        "Use mechanical assists for long lifts",
                        "Reposition origin and destination"
                    ]
                })
            elif factor == "AM":
                recommendations.append({
                    "factor": "Asymmetry",
                    "issue": f"AM = {multipliers[factor]:.2f} - twisting required",
                    "recommendations": [
                        "Reposition load or destination to eliminate twist",
                        "Use turntables",
                        "Improve workstation layout"
                    ]
                })
            elif factor == "FM":
                recommendations.append({
                    "factor": "Frequency",
                    "issue": f"FM = {multipliers[factor]:.2f} - high lifting frequency",
                    "recommendations": [
                        "Reduce lifting frequency",
                        "Add job rotation",
                        "Use mechanical assists",
                        "Add rest breaks"
                    ]
                })
            elif factor == "CM":
                recommendations.append({
                    "factor": "Coupling",
                    "issue": f"CM = {multipliers[factor]:.2f} - poor grip/handles",
                    "recommendations": [
                        "Add handles to containers",
                        "Use containers with hand-holds",
                        "Improve grip surface"
                    ]
                })

    return {
        "limiting_factors": limiting_factors,
        "recommendations": recommendations,
        "priority": limiting_factors[0] if limiting_factors else None
    }
```

### 5. Job Modification Comparison

```python
def compare_modifications(baseline: LiftingTaskParameters, modifications: list):
    """
    Compare baseline to proposed modifications
    """
    baseline_result = calculate_lifting_index(baseline)

    comparisons = [{
        "scenario": "Baseline",
        "changes": None,
        "lifting_index": baseline_result['lifting_index'],
        "rwl": baseline_result['rwl'],
        "risk_level": baseline_result['risk_level'],
        "improvement": 0
    }]

    for mod in modifications:
        mod_result = calculate_lifting_index(mod['params'])
        improvement = (baseline_result['lifting_index'] - mod_result['lifting_index']) / \
                     baseline_result['lifting_index'] * 100

        comparisons.append({
            "scenario": mod['name'],
            "changes": mod.get('description', ''),
            "lifting_index": mod_result['lifting_index'],
            "rwl": mod_result['rwl'],
            "risk_level": mod_result['risk_level'],
            "improvement": round(improvement, 1)
        })

    # Sort by improvement
    comparisons.sort(key=lambda x: x['lifting_index'])

    return {
        "comparisons": comparisons,
        "best_scenario": comparisons[0]['scenario'],
        "best_improvement": comparisons[0]['improvement']
    }
```

## Process Integration

This skill integrates with the following processes:
- `ergonomic-risk-assessment.js`
- `workstation-design-optimization.js`

## Output Format

```json
{
  "lifting_index": 1.8,
  "rwl": 28.3,
  "actual_weight": 51,
  "risk_level": "MODERATE",
  "limiting_factors": ["HM", "AM"],
  "recommendations": [
    {
      "factor": "Horizontal Distance",
      "recommendations": ["Move load closer to worker"]
    }
  ],
  "improvement_options": [
    {
      "scenario": "Add lift table",
      "improvement": 45
    }
  ]
}
```

## Best Practices

1. **Measure accurately** - Use tape measure, goniometer
2. **Worst case analysis** - Assess most strenuous conditions
3. **Consider variations** - Different workers, load sizes
4. **Multi-task jobs** - Use CLI for varied tasks
5. **Verify after changes** - Re-assess after modifications
6. **Document everything** - Photos, measurements, observations

## Constraints

- NIOSH equation has limitations (no pushing/pulling)
- Valid for two-handed lifts only
- Assumes adequate grip
- Does not account for environmental factors
