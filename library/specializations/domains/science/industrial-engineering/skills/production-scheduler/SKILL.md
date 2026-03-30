---
name: production-scheduler
description: Production scheduling skill with sequencing rules, resource allocation, and schedule optimization.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: production-planning
  backlog-id: SK-IE-029
---

# production-scheduler

You are **production-scheduler** - a specialized skill for production scheduling including job sequencing, resource allocation, and schedule optimization.

## Overview

This skill enables AI-powered production scheduling including:
- Job shop scheduling
- Flow shop scheduling
- Priority dispatch rules (SPT, EDD, CR, SLACK)
- Makespan minimization
- Tardiness minimization
- Resource-constrained scheduling
- Gantt chart generation
- Schedule performance metrics

## Capabilities

### 1. Priority Dispatch Rules

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def apply_dispatch_rules(jobs: pd.DataFrame, rule: str):
    """
    Apply priority dispatch rules for job sequencing

    jobs: DataFrame with columns ['job_id', 'processing_time', 'due_date', 'arrival_time']
    rule: 'SPT', 'LPT', 'EDD', 'CR', 'SLACK', 'FCFS'
    """
    jobs = jobs.copy()
    current_time = jobs['arrival_time'].min()

    if rule == 'SPT':  # Shortest Processing Time
        jobs['priority'] = jobs['processing_time']
        sequence = jobs.sort_values('priority')

    elif rule == 'LPT':  # Longest Processing Time
        jobs['priority'] = -jobs['processing_time']
        sequence = jobs.sort_values('priority')

    elif rule == 'EDD':  # Earliest Due Date
        jobs['priority'] = jobs['due_date']
        sequence = jobs.sort_values('priority')

    elif rule == 'CR':  # Critical Ratio
        jobs['time_remaining'] = (jobs['due_date'] - current_time).dt.total_seconds() / 3600
        jobs['priority'] = jobs['time_remaining'] / jobs['processing_time']
        jobs.loc[jobs['priority'] <= 0, 'priority'] = 0.001  # Urgent jobs first
        sequence = jobs.sort_values('priority')

    elif rule == 'SLACK':  # Minimum Slack
        jobs['time_remaining'] = (jobs['due_date'] - current_time).dt.total_seconds() / 3600
        jobs['priority'] = jobs['time_remaining'] - jobs['processing_time']
        sequence = jobs.sort_values('priority')

    elif rule == 'FCFS':  # First Come First Served
        sequence = jobs.sort_values('arrival_time')

    return {
        "rule": rule,
        "sequence": sequence['job_id'].tolist(),
        "jobs": sequence
    }
```

### 2. Schedule Performance Metrics

```python
def calculate_schedule_metrics(schedule: pd.DataFrame):
    """
    Calculate comprehensive schedule performance metrics

    schedule: DataFrame with ['job_id', 'start_time', 'end_time', 'due_date']
    """
    schedule = schedule.copy()

    # Completion time (flow time)
    schedule['completion_time'] = schedule['end_time']

    # Lateness (can be positive or negative)
    schedule['lateness'] = (schedule['end_time'] - schedule['due_date']).dt.total_seconds() / 3600

    # Tardiness (max of lateness and 0)
    schedule['tardiness'] = schedule['lateness'].apply(lambda x: max(0, x))

    # Earliness
    schedule['earliness'] = schedule['lateness'].apply(lambda x: abs(min(0, x)))

    # Binary late indicator
    schedule['is_late'] = schedule['lateness'] > 0

    metrics = {
        'makespan': (schedule['end_time'].max() - schedule['start_time'].min()).total_seconds() / 3600,
        'mean_flow_time': schedule['completion_time'].mean(),
        'total_tardiness': schedule['tardiness'].sum(),
        'max_tardiness': schedule['tardiness'].max(),
        'number_tardy': schedule['is_late'].sum(),
        'percent_on_time': (1 - schedule['is_late'].mean()) * 100,
        'mean_lateness': schedule['lateness'].mean(),
        'total_earliness': schedule['earliness'].sum()
    }

    return {
        "metrics": metrics,
        "schedule_detail": schedule
    }
```

### 3. Job Shop Scheduling

```python
from collections import defaultdict

def job_shop_schedule(jobs: list, machines: list):
    """
    Job shop scheduling using dispatching rules

    jobs: list of {'job_id': str, 'operations': [(machine, processing_time), ...], 'due_date': datetime}
    machines: list of machine IDs
    """
    # Initialize machine availability
    machine_available = {m: 0 for m in machines}
    job_completion = defaultdict(lambda: 0)

    schedule = []

    # Process jobs operation by operation
    for job in jobs:
        job_id = job['job_id']
        prev_end = 0

        for op_idx, (machine, proc_time) in enumerate(job['operations']):
            # Start time is max of machine availability and job's previous operation end
            start_time = max(machine_available[machine], prev_end)
            end_time = start_time + proc_time

            schedule.append({
                'job_id': job_id,
                'operation': op_idx + 1,
                'machine': machine,
                'start_time': start_time,
                'end_time': end_time,
                'processing_time': proc_time
            })

            machine_available[machine] = end_time
            prev_end = end_time

        job_completion[job_id] = prev_end

    return {
        "schedule": pd.DataFrame(schedule),
        "makespan": max(job_completion.values()),
        "machine_utilization": calculate_machine_utilization(schedule, machines)
    }

def calculate_machine_utilization(schedule: list, machines: list):
    """Calculate utilization for each machine"""
    makespan = max(s['end_time'] for s in schedule)

    utilization = {}
    for machine in machines:
        machine_ops = [s for s in schedule if s['machine'] == machine]
        busy_time = sum(s['processing_time'] for s in machine_ops)
        utilization[machine] = busy_time / makespan * 100 if makespan > 0 else 0

    return utilization
```

### 4. Flow Shop Scheduling

```python
def johnson_algorithm(jobs: list):
    """
    Johnson's algorithm for 2-machine flow shop
    Minimizes makespan

    jobs: list of {'job_id': str, 'machine1_time': float, 'machine2_time': float}
    """
    # Separate into two sets
    set_i = []  # Jobs where machine1_time <= machine2_time
    set_ii = []  # Jobs where machine1_time > machine2_time

    for job in jobs:
        if job['machine1_time'] <= job['machine2_time']:
            set_i.append(job)
        else:
            set_ii.append(job)

    # Sort set_i by machine1_time ascending
    set_i.sort(key=lambda x: x['machine1_time'])

    # Sort set_ii by machine2_time descending
    set_ii.sort(key=lambda x: x['machine2_time'], reverse=True)

    # Optimal sequence is set_i followed by set_ii
    optimal_sequence = set_i + set_ii

    # Calculate makespan
    m1_end = 0
    m2_end = 0
    schedule = []

    for job in optimal_sequence:
        # Machine 1 processing
        m1_start = m1_end
        m1_end = m1_start + job['machine1_time']

        # Machine 2 processing (must wait for both machine 1 and previous job on machine 2)
        m2_start = max(m1_end, m2_end)
        m2_end = m2_start + job['machine2_time']

        schedule.append({
            'job_id': job['job_id'],
            'machine1_start': m1_start,
            'machine1_end': m1_end,
            'machine2_start': m2_start,
            'machine2_end': m2_end
        })

    return {
        "optimal_sequence": [j['job_id'] for j in optimal_sequence],
        "makespan": m2_end,
        "schedule": schedule
    }
```

### 5. Resource-Constrained Scheduling

```python
def resource_constrained_schedule(tasks: list, resources: dict, dependencies: dict):
    """
    Schedule tasks with resource constraints and dependencies

    tasks: list of {'task_id': str, 'duration': float, 'resources': {resource: amount}}
    resources: {resource: available_amount}
    dependencies: {task_id: [predecessor_task_ids]}
    """
    # Track task status
    scheduled = {}
    resource_timeline = {r: [] for r in resources}

    # Get tasks in topological order
    remaining = set(t['task_id'] for t in tasks)
    task_dict = {t['task_id']: t for t in tasks}

    current_time = 0
    max_time = 1000  # Safety limit

    while remaining and current_time < max_time:
        # Find eligible tasks (all predecessors complete)
        eligible = []
        for task_id in remaining:
            predecessors = dependencies.get(task_id, [])
            if all(p in scheduled for p in predecessors):
                # Check earliest start (after predecessors)
                earliest = 0
                for p in predecessors:
                    earliest = max(earliest, scheduled[p]['end_time'])
                eligible.append((task_id, earliest))

        # Try to schedule eligible tasks
        for task_id, earliest in sorted(eligible, key=lambda x: x[1]):
            task = task_dict[task_id]
            start_time = max(earliest, current_time)

            # Check resource availability
            can_schedule = True
            for resource, amount in task.get('resources', {}).items():
                if amount > resources.get(resource, 0):
                    can_schedule = False
                    break

            if can_schedule:
                end_time = start_time + task['duration']
                scheduled[task_id] = {
                    'task_id': task_id,
                    'start_time': start_time,
                    'end_time': end_time,
                    'duration': task['duration']
                }
                remaining.remove(task_id)

        current_time += 1

    return {
        "schedule": list(scheduled.values()),
        "makespan": max(s['end_time'] for s in scheduled.values()) if scheduled else 0,
        "unscheduled": list(remaining)
    }
```

### 6. Gantt Chart Generation

```python
def generate_gantt_data(schedule: pd.DataFrame, group_by: str = 'machine'):
    """
    Generate data for Gantt chart visualization

    schedule: DataFrame with columns appropriate for group_by
    group_by: 'machine' or 'job'
    """
    gantt_data = []

    for _, row in schedule.iterrows():
        gantt_data.append({
            'Task': row[group_by] if group_by in row else row.get('job_id', 'Unknown'),
            'Start': row['start_time'],
            'Finish': row['end_time'],
            'Resource': row.get('job_id', row.get('machine', 'Unknown')),
            'Duration': row['end_time'] - row['start_time']
        })

    return {
        "gantt_data": gantt_data,
        "timeline_start": min(g['Start'] for g in gantt_data),
        "timeline_end": max(g['Finish'] for g in gantt_data),
        "resources": list(set(g['Resource'] for g in gantt_data))
    }
```

## Process Integration

This skill integrates with the following processes:
- `production-scheduling-optimization.js`
- `capacity-planning-analysis.js`

## Output Format

```json
{
  "schedule": {
    "sequence": ["J1", "J3", "J2", "J4"],
    "rule_applied": "EDD"
  },
  "metrics": {
    "makespan": 42,
    "mean_flow_time": 24.5,
    "total_tardiness": 8,
    "percent_on_time": 75
  },
  "gantt_data": [...],
  "recommendations": [
    "Consider SPT rule to minimize flow time",
    "Job J4 is critical path - prioritize"
  ]
}
```

## Best Practices

1. **Match rule to objective** - SPT for flow time, EDD for due dates
2. **Consider setup times** - Sequence-dependent setups matter
3. **Build in buffers** - Account for variability
4. **Monitor actual vs. planned** - Adjust rules based on performance
5. **Communicate changes** - Schedule visibility is critical
6. **Review regularly** - Reschedule as conditions change

## Constraints

- Static scheduling assumes known job arrivals
- Setup times may be sequence-dependent
- Resource constraints add complexity
- Real-time adjustments needed for disruptions
