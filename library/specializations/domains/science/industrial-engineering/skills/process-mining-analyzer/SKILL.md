---
name: process-mining-analyzer
description: Process mining skill for event log analysis, process discovery, and conformance checking.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: work-measurement
  backlog-id: SK-IE-036
---

# process-mining-analyzer

You are **process-mining-analyzer** - a specialized skill for process mining including event log analysis, process discovery, and conformance checking.

## Overview

This skill enables AI-powered process mining including:
- Event log preparation and cleaning
- Process discovery algorithms (Alpha, Heuristic Miner)
- Conformance checking
- Performance analysis
- Bottleneck identification
- Variant analysis
- Social network analysis
- Dotted chart visualization

## Capabilities

### 1. Event Log Preparation

```python
import pandas as pd
import numpy as np
from datetime import datetime
from collections import defaultdict

def prepare_event_log(raw_data: pd.DataFrame, mappings: dict):
    """
    Prepare event log for process mining

    raw_data: DataFrame with raw event data
    mappings: {'case_id': col, 'activity': col, 'timestamp': col, 'resource': col}
    """
    # Map columns
    event_log = pd.DataFrame()
    event_log['case_id'] = raw_data[mappings['case_id']]
    event_log['activity'] = raw_data[mappings['activity']]
    event_log['timestamp'] = pd.to_datetime(raw_data[mappings['timestamp']])

    if 'resource' in mappings and mappings['resource'] in raw_data.columns:
        event_log['resource'] = raw_data[mappings['resource']]

    # Sort by case and timestamp
    event_log = event_log.sort_values(['case_id', 'timestamp'])

    # Add derived columns
    event_log['event_id'] = range(len(event_log))

    # Calculate duration to next event
    event_log['next_timestamp'] = event_log.groupby('case_id')['timestamp'].shift(-1)
    event_log['duration'] = (event_log['next_timestamp'] - event_log['timestamp']).dt.total_seconds()

    # Statistics
    stats = {
        'total_events': len(event_log),
        'total_cases': event_log['case_id'].nunique(),
        'unique_activities': event_log['activity'].nunique(),
        'activities': event_log['activity'].unique().tolist(),
        'date_range': {
            'start': str(event_log['timestamp'].min()),
            'end': str(event_log['timestamp'].max())
        }
    }

    return {
        'event_log': event_log,
        'statistics': stats
    }
```

### 2. Process Discovery

```python
def discover_process_model(event_log: pd.DataFrame):
    """
    Discover process model from event log using footprint analysis
    """
    # Build directly-follows graph
    dfg = defaultdict(int)
    start_activities = set()
    end_activities = set()

    for case_id, case_data in event_log.groupby('case_id'):
        activities = case_data['activity'].tolist()

        if activities:
            start_activities.add(activities[0])
            end_activities.add(activities[-1])

        for i in range(len(activities) - 1):
            dfg[(activities[i], activities[i + 1])] += 1

    # Build footprint matrix
    activities = sorted(event_log['activity'].unique())
    n = len(activities)
    act_idx = {a: i for i, a in enumerate(activities)}

    # Relations: > (directly follows), < (preceded by), || (parallel), # (no relation)
    relations = {}

    for a1 in activities:
        for a2 in activities:
            a1_to_a2 = dfg.get((a1, a2), 0)
            a2_to_a1 = dfg.get((a2, a1), 0)

            if a1_to_a2 > 0 and a2_to_a1 > 0:
                relations[(a1, a2)] = '||'  # Parallel
            elif a1_to_a2 > 0:
                relations[(a1, a2)] = '>'   # Follows
            elif a2_to_a1 > 0:
                relations[(a1, a2)] = '<'   # Preceded by
            else:
                relations[(a1, a2)] = '#'   # No relation

    return {
        'directly_follows_graph': dict(dfg),
        'start_activities': list(start_activities),
        'end_activities': list(end_activities),
        'footprint': relations,
        'activities': activities
    }

def heuristic_miner(event_log: pd.DataFrame, dependency_threshold: float = 0.5):
    """
    Heuristic Miner algorithm for process discovery
    """
    # Build frequency tables
    activity_freq = event_log['activity'].value_counts().to_dict()
    dfg = defaultdict(int)

    for case_id, case_data in event_log.groupby('case_id'):
        activities = case_data['activity'].tolist()
        for i in range(len(activities) - 1):
            dfg[(activities[i], activities[i + 1])] += 1

    # Calculate dependency measure
    # D(a,b) = (|a>b| - |b>a|) / (|a>b| + |b>a| + 1)
    dependencies = {}
    activities = list(activity_freq.keys())

    for a in activities:
        for b in activities:
            a_to_b = dfg.get((a, b), 0)
            b_to_a = dfg.get((b, a), 0)

            if a_to_b > 0 or b_to_a > 0:
                dep = (a_to_b - b_to_a) / (a_to_b + b_to_a + 1)
                if abs(dep) >= dependency_threshold:
                    dependencies[(a, b)] = round(dep, 3)

    # Filter to positive dependencies (actual follows relations)
    causal_relations = {k: v for k, v in dependencies.items() if v > 0}

    return {
        'activity_frequencies': activity_freq,
        'directly_follows_frequencies': dict(dfg),
        'dependency_measures': dependencies,
        'causal_relations': causal_relations,
        'threshold': dependency_threshold
    }
```

### 3. Conformance Checking

```python
def check_conformance(event_log: pd.DataFrame, expected_sequence: list,
                     strict: bool = False):
    """
    Check conformance of traces against expected process

    expected_sequence: list of activities in expected order
    strict: if True, exact match required; if False, subsequence match
    """
    results = []

    for case_id, case_data in event_log.groupby('case_id'):
        trace = case_data['activity'].tolist()

        if strict:
            # Exact match
            is_conforming = trace == expected_sequence
            deviations = []

            if not is_conforming:
                # Find deviations
                for i, (actual, expected) in enumerate(zip(trace, expected_sequence)):
                    if actual != expected:
                        deviations.append({
                            'position': i,
                            'expected': expected,
                            'actual': actual
                        })

                # Check for missing or extra activities
                if len(trace) < len(expected_sequence):
                    deviations.append({'type': 'missing', 'count': len(expected_sequence) - len(trace)})
                elif len(trace) > len(expected_sequence):
                    deviations.append({'type': 'extra', 'count': len(trace) - len(expected_sequence)})

        else:
            # Check if expected is subsequence
            exp_idx = 0
            is_conforming = True

            for act in trace:
                if exp_idx < len(expected_sequence) and act == expected_sequence[exp_idx]:
                    exp_idx += 1

            is_conforming = exp_idx == len(expected_sequence)
            deviations = [] if is_conforming else [{'type': 'subsequence_mismatch'}]

        results.append({
            'case_id': case_id,
            'trace': trace,
            'conforming': is_conforming,
            'deviations': deviations
        })

    # Summary statistics
    conforming_count = sum(1 for r in results if r['conforming'])
    total = len(results)

    return {
        'case_results': results,
        'summary': {
            'total_cases': total,
            'conforming_cases': conforming_count,
            'non_conforming_cases': total - conforming_count,
            'conformance_rate': round(conforming_count / total * 100, 1) if total > 0 else 0
        }
    }
```

### 4. Performance Analysis

```python
def analyze_performance(event_log: pd.DataFrame):
    """
    Analyze process performance from event log
    """
    # Case duration
    case_durations = event_log.groupby('case_id').agg({
        'timestamp': ['min', 'max']
    })
    case_durations.columns = ['start', 'end']
    case_durations['duration_hours'] = (case_durations['end'] - case_durations['start']).dt.total_seconds() / 3600

    # Activity duration statistics
    activity_stats = event_log.groupby('activity')['duration'].agg(['mean', 'median', 'std', 'count']).reset_index()
    activity_stats.columns = ['activity', 'mean_duration', 'median_duration', 'std_duration', 'count']
    activity_stats['mean_duration'] = activity_stats['mean_duration'] / 60  # Convert to minutes

    # Identify bottlenecks (longest average duration)
    bottlenecks = activity_stats.nlargest(3, 'mean_duration')

    # Waiting time analysis
    waiting_times = event_log.copy()
    waiting_times['prev_end'] = waiting_times.groupby('case_id')['timestamp'].shift(1)
    waiting_times['waiting_time'] = (waiting_times['timestamp'] - waiting_times['prev_end']).dt.total_seconds() / 60
    waiting_times = waiting_times[waiting_times['waiting_time'].notna()]

    waiting_by_activity = waiting_times.groupby('activity')['waiting_time'].mean().reset_index()
    waiting_by_activity.columns = ['activity', 'avg_waiting_minutes']

    return {
        'case_duration': {
            'mean_hours': round(case_durations['duration_hours'].mean(), 2),
            'median_hours': round(case_durations['duration_hours'].median(), 2),
            'std_hours': round(case_durations['duration_hours'].std(), 2)
        },
        'activity_performance': activity_stats.to_dict('records'),
        'bottlenecks': bottlenecks[['activity', 'mean_duration']].to_dict('records'),
        'waiting_times': waiting_by_activity.to_dict('records')
    }
```

### 5. Variant Analysis

```python
def analyze_variants(event_log: pd.DataFrame):
    """
    Analyze process variants (unique traces)
    """
    # Get trace for each case
    traces = event_log.groupby('case_id')['activity'].apply(lambda x: '->'.join(x)).reset_index()
    traces.columns = ['case_id', 'trace']

    # Count variants
    variant_counts = traces['trace'].value_counts().reset_index()
    variant_counts.columns = ['variant', 'count']
    variant_counts['percentage'] = round(variant_counts['count'] / len(traces) * 100, 1)
    variant_counts['cumulative_pct'] = variant_counts['percentage'].cumsum()

    # Get duration by variant
    case_durations = event_log.groupby('case_id').agg({
        'timestamp': ['min', 'max']
    })
    case_durations.columns = ['start', 'end']
    case_durations['duration_hours'] = (case_durations['end'] - case_durations['start']).dt.total_seconds() / 3600
    case_durations = case_durations.reset_index()

    traces_with_duration = traces.merge(case_durations[['case_id', 'duration_hours']], on='case_id')
    variant_duration = traces_with_duration.groupby('trace')['duration_hours'].mean().reset_index()
    variant_duration.columns = ['variant', 'avg_duration_hours']

    variant_analysis = variant_counts.merge(variant_duration, on='variant')

    return {
        'total_cases': len(traces),
        'unique_variants': len(variant_counts),
        'top_variants': variant_analysis.head(10).to_dict('records'),
        'pareto': {
            'variants_for_80pct': len(variant_analysis[variant_analysis['cumulative_pct'] <= 80]) + 1
        }
    }
```

### 6. Social Network Analysis

```python
def analyze_handoffs(event_log: pd.DataFrame):
    """
    Analyze resource handoffs for social network analysis
    """
    if 'resource' not in event_log.columns:
        return {"error": "Resource column not available"}

    handoffs = defaultdict(int)

    for case_id, case_data in event_log.groupby('case_id'):
        resources = case_data['resource'].tolist()
        for i in range(len(resources) - 1):
            if resources[i] != resources[i + 1]:  # Different resource
                handoffs[(resources[i], resources[i + 1])] += 1

    # Calculate metrics
    resources = set()
    for (r1, r2) in handoffs.keys():
        resources.add(r1)
        resources.add(r2)

    # Centrality - how often a resource is involved in handoffs
    in_degree = defaultdict(int)
    out_degree = defaultdict(int)

    for (r1, r2), count in handoffs.items():
        out_degree[r1] += count
        in_degree[r2] += count

    resource_metrics = []
    for r in resources:
        resource_metrics.append({
            'resource': r,
            'in_degree': in_degree[r],
            'out_degree': out_degree[r],
            'total_handoffs': in_degree[r] + out_degree[r]
        })

    resource_metrics.sort(key=lambda x: x['total_handoffs'], reverse=True)

    return {
        'handoff_matrix': dict(handoffs),
        'resource_metrics': resource_metrics,
        'total_handoffs': sum(handoffs.values()),
        'unique_resource_pairs': len(handoffs)
    }
```

## Process Integration

This skill integrates with the following processes:
- `process-discovery-analysis.js`
- `conformance-checking-audit.js`
- `process-improvement-analysis.js`

## Output Format

```json
{
  "event_log_stats": {
    "total_events": 15000,
    "total_cases": 500,
    "unique_activities": 12
  },
  "process_model": {
    "start_activities": ["Register"],
    "end_activities": ["Close"],
    "directly_follows": {"Register->Approve": 450}
  },
  "conformance": {
    "conformance_rate": 85.2
  },
  "performance": {
    "avg_case_duration_hours": 24.5,
    "bottlenecks": ["Approval", "Review"]
  },
  "variants": {
    "unique": 45,
    "top_variant_coverage": 65.2
  }
}
```

## Best Practices

1. **Clean event log** - Remove noise and duplicates
2. **Validate timestamps** - Ensure correct ordering
3. **Define case concept** - Clear case ID definition
4. **Iterative discovery** - Refine with domain experts
5. **Combine techniques** - Use multiple algorithms
6. **Focus on deviations** - They reveal improvement opportunities

## Constraints

- Requires quality event data
- Complex processes may be hard to visualize
- Timestamps must be accurate
- Parallel activities add complexity
