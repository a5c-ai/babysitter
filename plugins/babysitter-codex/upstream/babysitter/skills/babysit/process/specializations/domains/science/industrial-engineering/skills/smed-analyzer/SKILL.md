---
name: smed-analyzer
description: Single Minute Exchange of Die analysis skill for changeover time reduction.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: lean-manufacturing
  backlog-id: SK-IE-011
---

# smed-analyzer

You are **smed-analyzer** - a specialized skill for analyzing and reducing changeover times using the Single Minute Exchange of Die (SMED) methodology.

## Overview

This skill enables AI-powered SMED analysis including:
- Changeover video analysis
- Internal vs external activity separation
- Activity timing and sequencing
- Conversion opportunity identification
- Parallel work assignment
- Quick-release mechanism suggestions
- Before/after comparison reports
- Standard changeover documentation

## Prerequisites

- Video recording capability
- Stopwatch or timing software
- Understanding of changeover process

## Capabilities

### 1. Changeover Activity Recording

```python
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional
import datetime

class ActivityType(Enum):
    INTERNAL = "internal"  # Machine must be stopped
    EXTERNAL = "external"  # Can be done while running

@dataclass
class ChangeoverActivity:
    id: int
    description: str
    start_time: float  # seconds from changeover start
    end_time: float
    activity_type: ActivityType
    operator: str
    tools_required: List[str]
    notes: Optional[str] = None

    @property
    def duration(self):
        return self.end_time - self.start_time

class ChangeoverAnalysis:
    """
    Record and analyze changeover activities
    """
    def __init__(self, machine_name: str, from_product: str, to_product: str):
        self.machine_name = machine_name
        self.from_product = from_product
        self.to_product = to_product
        self.activities: List[ChangeoverActivity] = []
        self.timestamp = datetime.datetime.now()

    def add_activity(self, description, start, end, activity_type,
                    operator, tools=None, notes=None):
        activity = ChangeoverActivity(
            id=len(self.activities) + 1,
            description=description,
            start_time=start,
            end_time=end,
            activity_type=activity_type,
            operator=operator,
            tools_required=tools or [],
            notes=notes
        )
        self.activities.append(activity)
        return activity

    def summary(self):
        internal = [a for a in self.activities if a.activity_type == ActivityType.INTERNAL]
        external = [a for a in self.activities if a.activity_type == ActivityType.EXTERNAL]

        return {
            "total_changeover_time": max(a.end_time for a in self.activities),
            "internal_time": sum(a.duration for a in internal),
            "external_time": sum(a.duration for a in external),
            "num_activities": len(self.activities),
            "num_internal": len(internal),
            "num_external": len(external)
        }
```

### 2. Internal/External Separation Analysis

```python
def analyze_internal_external(activities):
    """
    Identify activities that could be converted from internal to external
    """
    conversion_opportunities = []

    for activity in activities:
        if activity.activity_type == ActivityType.INTERNAL:
            # Check for conversion potential
            potential = assess_conversion_potential(activity)
            if potential['can_convert']:
                conversion_opportunities.append({
                    "activity_id": activity.id,
                    "description": activity.description,
                    "current_duration": activity.duration,
                    "conversion_method": potential['method'],
                    "estimated_savings": potential['savings'],
                    "investment_required": potential['investment']
                })

    return conversion_opportunities

def assess_conversion_potential(activity):
    """
    Assess if internal activity can become external
    """
    # Keywords indicating conversion potential
    prep_keywords = ['get', 'find', 'look for', 'search', 'locate', 'bring']
    adjustment_keywords = ['adjust', 'set', 'calibrate', 'tune']
    removal_keywords = ['remove', 'take off', 'disconnect']

    desc_lower = activity.description.lower()

    # Preparation activities can often be done externally
    if any(kw in desc_lower for kw in prep_keywords):
        return {
            'can_convert': True,
            'method': 'Pre-stage tools and materials before stopping machine',
            'savings': activity.duration * 0.9,  # 90% reduction
            'investment': 'Low - organization and staging area'
        }

    # Adjustments might be eliminated with presetting
    if any(kw in desc_lower for kw in adjustment_keywords):
        return {
            'can_convert': True,
            'method': 'Use preset tooling or jigs for instant settings',
            'savings': activity.duration * 0.7,
            'investment': 'Medium - preset tooling investment'
        }

    return {'can_convert': False}
```

### 3. Parallel Work Analysis

```python
def analyze_parallel_opportunities(activities, available_operators):
    """
    Identify activities that can be done in parallel
    """
    # Group activities by time window
    timeline = []

    for activity in activities:
        timeline.append({
            'time': activity.start_time,
            'type': 'start',
            'activity': activity
        })
        timeline.append({
            'time': activity.end_time,
            'type': 'end',
            'activity': activity
        })

    timeline.sort(key=lambda x: x['time'])

    # Analyze operator utilization
    parallel_opportunities = []
    current_activities = []

    for event in timeline:
        if event['type'] == 'start':
            current_activities.append(event['activity'])
        else:
            current_activities.remove(event['activity'])

        # Check if operators are idle
        active_operators = len(set(a.operator for a in current_activities))
        idle_operators = available_operators - active_operators

        if idle_operators > 0 and len(current_activities) > 0:
            parallel_opportunities.append({
                'time': event['time'],
                'idle_operators': idle_operators,
                'active_activities': [a.description for a in current_activities]
            })

    return parallel_opportunities

def optimize_parallel_work(activities, available_operators):
    """
    Reassign activities for parallel execution
    """
    # Simple greedy assignment
    assignments = {i: [] for i in range(available_operators)}
    operator_end_times = [0] * available_operators

    # Sort by start time
    sorted_activities = sorted(activities, key=lambda a: a.start_time)

    for activity in sorted_activities:
        # Find operator who finishes earliest
        earliest_op = min(range(available_operators),
                         key=lambda i: operator_end_times[i])

        # Assign to this operator
        new_start = max(activity.start_time, operator_end_times[earliest_op])
        new_end = new_start + activity.duration

        assignments[earliest_op].append({
            'activity': activity.description,
            'original_start': activity.start_time,
            'new_start': new_start,
            'end': new_end
        })

        operator_end_times[earliest_op] = new_end

    new_total_time = max(operator_end_times)
    original_total_time = max(a.end_time for a in activities)

    return {
        'assignments': assignments,
        'original_time': original_total_time,
        'optimized_time': new_total_time,
        'time_savings': original_total_time - new_total_time,
        'reduction_percent': (1 - new_total_time/original_total_time) * 100
    }
```

### 4. Quick-Release Mechanism Suggestions

```python
def suggest_quick_release_mechanisms(activities):
    """
    Suggest engineering improvements for faster changeovers
    """
    suggestions = []

    for activity in activities:
        desc_lower = activity.description.lower()

        # Fastener improvements
        if any(word in desc_lower for word in ['bolt', 'screw', 'nut', 'fasten']):
            suggestions.append({
                'activity': activity.description,
                'current_method': 'Threaded fasteners',
                'improvement': 'Quick-release clamps, cam locks, or quarter-turn fasteners',
                'typical_reduction': '70-90%',
                'investment_level': 'Medium'
            })

        # Tool changes
        if 'tool' in desc_lower and 'change' in desc_lower:
            suggestions.append({
                'activity': activity.description,
                'current_method': 'Manual tool change',
                'improvement': 'Quick-change tool holders with preset tooling',
                'typical_reduction': '80-95%',
                'investment_level': 'Medium-High'
            })

        # Positioning/alignment
        if any(word in desc_lower for word in ['align', 'position', 'center']):
            suggestions.append({
                'activity': activity.description,
                'current_method': 'Manual alignment',
                'improvement': 'Locating pins, guides, or self-centering fixtures',
                'typical_reduction': '60-80%',
                'investment_level': 'Low-Medium'
            })

        # Settings/adjustments
        if any(word in desc_lower for word in ['adjust', 'set', 'calibrate']):
            suggestions.append({
                'activity': activity.description,
                'current_method': 'Trial and error adjustment',
                'improvement': 'Digital presets, scales, or stops',
                'typical_reduction': '50-70%',
                'investment_level': 'Medium'
            })

    return suggestions
```

### 5. Before/After Comparison

```python
def generate_comparison_report(before_analysis, after_analysis):
    """
    Generate before/after SMED comparison report
    """
    before_summary = before_analysis.summary()
    after_summary = after_analysis.summary()

    return {
        'changeover': {
            'machine': before_analysis.machine_name,
            'product_change': f"{before_analysis.from_product} -> {before_analysis.to_product}"
        },
        'time_comparison': {
            'before': {
                'total_minutes': before_summary['total_changeover_time'] / 60,
                'internal_minutes': before_summary['internal_time'] / 60,
                'external_minutes': before_summary['external_time'] / 60
            },
            'after': {
                'total_minutes': after_summary['total_changeover_time'] / 60,
                'internal_minutes': after_summary['internal_time'] / 60,
                'external_minutes': after_summary['external_time'] / 60
            }
        },
        'improvement': {
            'time_reduction_minutes': (before_summary['total_changeover_time'] -
                                       after_summary['total_changeover_time']) / 60,
            'percent_reduction': (1 - after_summary['total_changeover_time'] /
                                 before_summary['total_changeover_time']) * 100,
            'internal_reduction_percent': (1 - after_summary['internal_time'] /
                                          before_summary['internal_time']) * 100
        },
        'activities_comparison': {
            'before_count': before_summary['num_activities'],
            'after_count': after_summary['num_activities'],
            'eliminated': before_summary['num_activities'] - after_summary['num_activities']
        }
    }
```

### 6. Standard Changeover Documentation

```python
def generate_standard_changeover(optimized_analysis):
    """
    Create standard work document for changeover
    """
    document = {
        'title': f"Standard Changeover: {optimized_analysis.machine_name}",
        'revision': '1.0',
        'date': datetime.datetime.now().isoformat(),
        'target_time_minutes': optimized_analysis.summary()['total_changeover_time'] / 60,
        'preparation_phase': {
            'description': 'Activities to complete BEFORE stopping machine',
            'activities': []
        },
        'changeover_phase': {
            'description': 'Activities performed while machine is stopped',
            'activities': []
        },
        'startup_phase': {
            'description': 'Activities to complete after starting machine',
            'activities': []
        }
    }

    for activity in optimized_analysis.activities:
        entry = {
            'step': activity.id,
            'description': activity.description,
            'time_seconds': activity.duration,
            'operator': activity.operator,
            'tools': activity.tools_required,
            'notes': activity.notes
        }

        if activity.activity_type == ActivityType.EXTERNAL:
            if activity.start_time < 0:  # Prep phase
                document['preparation_phase']['activities'].append(entry)
            else:
                document['startup_phase']['activities'].append(entry)
        else:
            document['changeover_phase']['activities'].append(entry)

    return document
```

## Process Integration

This skill integrates with the following processes:
- `setup-time-reduction-smed.js`
- `kaizen-event-facilitation.js`
- `oee-improvement.js`

## Output Format

```json
{
  "current_state": {
    "total_changeover_minutes": 45,
    "internal_minutes": 38,
    "external_minutes": 7
  },
  "opportunities": {
    "convert_to_external": 5,
    "parallel_execution": 3,
    "quick_release": 4,
    "eliminate": 2
  },
  "projected_future_state": {
    "total_changeover_minutes": 12,
    "reduction_percent": 73
  },
  "implementation_plan": {
    "phase_1": "Convert preparation to external",
    "phase_2": "Implement parallel work",
    "phase_3": "Install quick-release mechanisms"
  }
}
```

## Best Practices

1. **Video record changeovers** - Capture actual process
2. **Involve operators** - They know the details
3. **Separate internal/external first** - Quick wins
4. **Standardize before optimizing** - Consistent baseline
5. **Measure before and after** - Validate improvements
6. **Document standard work** - Sustain the gains

## Constraints

- Safety cannot be compromised for speed
- Validate quality after changeover
- Consider operator ergonomics
- Document all standard procedures
