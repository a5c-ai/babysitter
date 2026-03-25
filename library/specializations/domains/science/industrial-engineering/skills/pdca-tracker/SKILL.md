---
name: pdca-tracker
description: PDCA cycle tracking skill for plan-do-check-act improvement management.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: continuous-improvement
  backlog-id: SK-IE-041
---

# pdca-tracker

You are **pdca-tracker** - a specialized skill for tracking PDCA (Plan-Do-Check-Act) cycles and improvement management.

## Overview

This skill enables AI-powered PDCA tracking including:
- PDCA cycle setup and management
- Hypothesis development
- Experiment planning
- Results verification
- Standard work updates
- Cycle iteration tracking
- Learning documentation
- Multi-project portfolio view

## Capabilities

### 1. PDCA Cycle Setup

```python
from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum
import uuid

class PDCAPhase(Enum):
    PLAN = "plan"
    DO = "do"
    CHECK = "check"
    ACT = "act"

@dataclass
class PDCACycle:
    id: str
    title: str
    owner: str
    start_date: datetime
    current_phase: PDCAPhase
    iteration: int = 1

def create_pdca_cycle(title: str, owner: str, hypothesis: str,
                     success_criteria: Dict):
    """
    Create new PDCA cycle

    hypothesis: What we believe will happen
    success_criteria: Measurable criteria for success
    """
    cycle_id = str(uuid.uuid4())[:8]

    cycle = {
        "id": cycle_id,
        "title": title,
        "owner": owner,
        "created_date": datetime.now().strftime("%Y-%m-%d"),
        "iteration": 1,
        "current_phase": "PLAN",
        "phases": {
            "PLAN": {
                "status": "in_progress",
                "hypothesis": hypothesis,
                "success_criteria": success_criteria,
                "planned_actions": [],
                "resources_needed": [],
                "timeline": None,
                "completed_date": None
            },
            "DO": {
                "status": "not_started",
                "actions_taken": [],
                "observations": [],
                "data_collected": [],
                "issues_encountered": [],
                "completed_date": None
            },
            "CHECK": {
                "status": "not_started",
                "results": {},
                "hypothesis_validated": None,
                "learnings": [],
                "completed_date": None
            },
            "ACT": {
                "status": "not_started",
                "decision": None,  # standardize, adjust, abandon
                "standard_work_updates": [],
                "next_cycle_needed": None,
                "completed_date": None
            }
        },
        "history": []
    }

    return cycle
```

### 2. Plan Phase Management

```python
def develop_plan(cycle: Dict, plan_details: Dict):
    """
    Develop the Plan phase

    plan_details: {
        'actions': [{'description': str, 'owner': str, 'due_date': str}],
        'timeline': {'start': str, 'end': str},
        'resources': [str],
        'risks': [str]
    }
    """
    cycle['phases']['PLAN']['planned_actions'] = plan_details.get('actions', [])
    cycle['phases']['PLAN']['timeline'] = plan_details.get('timeline')
    cycle['phases']['PLAN']['resources_needed'] = plan_details.get('resources', [])
    cycle['phases']['PLAN']['risks'] = plan_details.get('risks', [])

    # Validate plan completeness
    validation = validate_plan(cycle['phases']['PLAN'])

    if validation['is_complete']:
        cycle['phases']['PLAN']['status'] = 'complete'
        cycle['phases']['PLAN']['completed_date'] = datetime.now().strftime("%Y-%m-%d")
        cycle['current_phase'] = 'DO'
        cycle['phases']['DO']['status'] = 'in_progress'

        # Log transition
        cycle['history'].append({
            'timestamp': datetime.now().isoformat(),
            'event': 'phase_transition',
            'from': 'PLAN',
            'to': 'DO'
        })

    return {
        'cycle': cycle,
        'validation': validation
    }

def validate_plan(plan: Dict):
    """Validate plan completeness"""
    issues = []

    if not plan.get('hypothesis'):
        issues.append("Missing hypothesis")
    if not plan.get('success_criteria'):
        issues.append("Missing success criteria")
    if not plan.get('planned_actions'):
        issues.append("No actions planned")
    if not plan.get('timeline'):
        issues.append("No timeline defined")

    return {
        'is_complete': len(issues) == 0,
        'issues': issues
    }
```

### 3. Do Phase Tracking

```python
def track_do_phase(cycle: Dict, execution_data: Dict):
    """
    Track execution in Do phase

    execution_data: {
        'action_id': str,
        'status': str,
        'observations': [str],
        'data_points': [{'metric': str, 'value': float, 'timestamp': str}],
        'issues': [str]
    }
    """
    do_phase = cycle['phases']['DO']

    # Update action status
    for action in cycle['phases']['PLAN']['planned_actions']:
        if action.get('id') == execution_data.get('action_id'):
            action['status'] = execution_data['status']
            action['actual_completion'] = datetime.now().strftime("%Y-%m-%d")

    # Record observations
    if execution_data.get('observations'):
        do_phase['observations'].extend(execution_data['observations'])

    # Collect data
    if execution_data.get('data_points'):
        do_phase['data_collected'].extend(execution_data['data_points'])

    # Record issues
    if execution_data.get('issues'):
        do_phase['issues_encountered'].extend(execution_data['issues'])

    # Check if Do phase is complete
    planned_actions = cycle['phases']['PLAN']['planned_actions']
    completed = sum(1 for a in planned_actions if a.get('status') == 'complete')

    if completed == len(planned_actions):
        do_phase['status'] = 'complete'
        do_phase['completed_date'] = datetime.now().strftime("%Y-%m-%d")
        cycle['current_phase'] = 'CHECK'
        cycle['phases']['CHECK']['status'] = 'in_progress'

        cycle['history'].append({
            'timestamp': datetime.now().isoformat(),
            'event': 'phase_transition',
            'from': 'DO',
            'to': 'CHECK'
        })

    return {
        'cycle': cycle,
        'do_phase_progress': {
            'actions_completed': completed,
            'actions_total': len(planned_actions),
            'data_points_collected': len(do_phase['data_collected']),
            'issues_count': len(do_phase['issues_encountered'])
        }
    }
```

### 4. Check Phase Analysis

```python
import numpy as np

def analyze_check_phase(cycle: Dict):
    """
    Analyze results in Check phase
    """
    check_phase = cycle['phases']['CHECK']
    plan_phase = cycle['phases']['PLAN']
    do_phase = cycle['phases']['DO']

    results = {}

    # Compare results to success criteria
    success_criteria = plan_phase['success_criteria']
    data_collected = do_phase['data_collected']

    criteria_results = []
    for criterion, target in success_criteria.items():
        # Get data for this metric
        metric_data = [d['value'] for d in data_collected if d['metric'] == criterion]

        if metric_data:
            actual = np.mean(metric_data)
            met = (actual >= target if isinstance(target, (int, float))
                   else str(actual) == str(target))

            criteria_results.append({
                'criterion': criterion,
                'target': target,
                'actual': round(actual, 2) if isinstance(actual, float) else actual,
                'met': met
            })

    # Validate hypothesis
    criteria_met = sum(1 for c in criteria_results if c['met'])
    total_criteria = len(criteria_results)

    hypothesis_validated = criteria_met == total_criteria if total_criteria > 0 else None

    check_phase['results'] = {
        'criteria_results': criteria_results,
        'criteria_met': criteria_met,
        'total_criteria': total_criteria
    }
    check_phase['hypothesis_validated'] = hypothesis_validated

    # Generate learnings
    learnings = generate_learnings(criteria_results, do_phase['observations'],
                                   do_phase['issues_encountered'])
    check_phase['learnings'] = learnings

    return {
        'cycle': cycle,
        'analysis': {
            'hypothesis_validated': hypothesis_validated,
            'success_rate': round(criteria_met / total_criteria * 100, 1) if total_criteria > 0 else 0,
            'criteria_results': criteria_results,
            'learnings': learnings
        }
    }

def generate_learnings(criteria_results, observations, issues):
    """Generate learnings from check phase"""
    learnings = []

    # From criteria results
    for cr in criteria_results:
        if cr['met']:
            learnings.append(f"SUCCESS: {cr['criterion']} achieved target")
        else:
            learnings.append(f"MISS: {cr['criterion']} did not meet target - investigate root cause")

    # From issues
    if issues:
        learnings.append(f"ISSUES: {len(issues)} issues encountered during execution")

    return learnings
```

### 5. Act Phase Decision

```python
def complete_act_phase(cycle: Dict, decision: str, next_steps: Dict):
    """
    Complete Act phase with decision

    decision: 'standardize', 'adjust', 'abandon'
    next_steps: {
        'standard_work_updates': [str],
        'next_cycle_hypothesis': str,  # if adjust
        'reason_for_abandonment': str   # if abandon
    }
    """
    act_phase = cycle['phases']['ACT']

    act_phase['decision'] = decision

    if decision == 'standardize':
        act_phase['standard_work_updates'] = next_steps.get('standard_work_updates', [])
        act_phase['next_cycle_needed'] = False

        # Mark cycle complete
        act_phase['status'] = 'complete'
        act_phase['completed_date'] = datetime.now().strftime("%Y-%m-%d")
        cycle['status'] = 'completed'

        cycle['history'].append({
            'timestamp': datetime.now().isoformat(),
            'event': 'cycle_complete',
            'decision': 'standardize',
            'outcome': 'success'
        })

    elif decision == 'adjust':
        act_phase['next_cycle_needed'] = True
        act_phase['next_hypothesis'] = next_steps.get('next_cycle_hypothesis')
        act_phase['adjustments'] = next_steps.get('adjustments', [])

        # Prepare next iteration
        cycle['iteration'] += 1
        new_cycle = prepare_next_iteration(cycle)

        cycle['history'].append({
            'timestamp': datetime.now().isoformat(),
            'event': 'iteration_start',
            'iteration': cycle['iteration'],
            'hypothesis': act_phase['next_hypothesis']
        })

        return {'cycle': cycle, 'next_iteration': new_cycle}

    elif decision == 'abandon':
        act_phase['reason_for_abandonment'] = next_steps.get('reason_for_abandonment')
        act_phase['next_cycle_needed'] = False

        act_phase['status'] = 'complete'
        cycle['status'] = 'abandoned'

        cycle['history'].append({
            'timestamp': datetime.now().isoformat(),
            'event': 'cycle_abandoned',
            'reason': act_phase['reason_for_abandonment']
        })

    return {'cycle': cycle}

def prepare_next_iteration(current_cycle: Dict):
    """Prepare next PDCA iteration"""
    return {
        'iteration': current_cycle['iteration'],
        'hypothesis': current_cycle['phases']['ACT'].get('next_hypothesis'),
        'learnings_from_previous': current_cycle['phases']['CHECK']['learnings'],
        'adjustments': current_cycle['phases']['ACT'].get('adjustments', [])
    }
```

### 6. PDCA Portfolio View

```python
def get_portfolio_status(cycles: List[Dict]):
    """
    Get portfolio view of all PDCA cycles
    """
    summary = {
        'total_cycles': len(cycles),
        'by_phase': {phase.value: 0 for phase in PDCAPhase},
        'by_status': {'active': 0, 'completed': 0, 'abandoned': 0},
        'iterations': [],
        'cycle_details': []
    }

    for cycle in cycles:
        # Count by phase
        current_phase = cycle.get('current_phase', 'PLAN')
        summary['by_phase'][current_phase.lower()] += 1

        # Count by status
        status = cycle.get('status', 'active')
        summary['by_status'][status] += 1

        # Track iterations
        summary['iterations'].append(cycle.get('iteration', 1))

        # Cycle summary
        summary['cycle_details'].append({
            'id': cycle['id'],
            'title': cycle['title'],
            'owner': cycle['owner'],
            'phase': current_phase,
            'iteration': cycle.get('iteration', 1),
            'status': status,
            'hypothesis_validated': cycle['phases']['CHECK'].get('hypothesis_validated')
        })

    # Aggregate stats
    summary['avg_iterations'] = round(np.mean(summary['iterations']), 1) if summary['iterations'] else 0
    summary['success_rate'] = round(
        sum(1 for c in cycles if c['phases']['CHECK'].get('hypothesis_validated') == True) /
        len(cycles) * 100, 1
    ) if cycles else 0

    return summary
```

### 7. Learning Documentation

```python
def document_learnings(cycle: Dict):
    """
    Create comprehensive learning document from PDCA cycle
    """
    learning_doc = {
        'cycle_id': cycle['id'],
        'title': cycle['title'],
        'date_completed': cycle['phases']['ACT'].get('completed_date'),
        'iterations': cycle.get('iteration', 1),
        'sections': {
            'hypothesis': cycle['phases']['PLAN']['hypothesis'],
            'what_we_tried': [],
            'what_happened': [],
            'what_we_learned': [],
            'what_changed': [],
            'recommendations': []
        }
    }

    # What we tried
    for action in cycle['phases']['PLAN']['planned_actions']:
        learning_doc['sections']['what_we_tried'].append(action['description'])

    # What happened
    for obs in cycle['phases']['DO']['observations']:
        learning_doc['sections']['what_happened'].append(obs)

    for issue in cycle['phases']['DO']['issues_encountered']:
        learning_doc['sections']['what_happened'].append(f"Issue: {issue}")

    # What we learned
    learning_doc['sections']['what_we_learned'] = cycle['phases']['CHECK']['learnings']

    # What changed
    if cycle['phases']['ACT']['decision'] == 'standardize':
        learning_doc['sections']['what_changed'] = cycle['phases']['ACT']['standard_work_updates']
    elif cycle['phases']['ACT']['decision'] == 'adjust':
        learning_doc['sections']['what_changed'] = [
            f"Adjusted hypothesis: {cycle['phases']['ACT'].get('next_hypothesis')}"
        ]

    # Recommendations
    learning_doc['sections']['recommendations'] = generate_recommendations(cycle)

    return learning_doc

def generate_recommendations(cycle: Dict):
    """Generate recommendations based on cycle outcome"""
    recommendations = []

    if cycle['phases']['CHECK'].get('hypothesis_validated'):
        recommendations.append("Document and share successful approach")
        recommendations.append("Consider scaling to other areas")
    else:
        recommendations.append("Review root cause analysis depth")
        if cycle.get('iteration', 1) >= 3:
            recommendations.append("Consider different approach or escalation")

    return recommendations
```

## Process Integration

This skill integrates with the following processes:
- `continuous-improvement-program.js`
- `a3-problem-solving-project.js`
- `kaizen-event-execution.js`

## Output Format

```json
{
  "pdca_cycle": {
    "id": "abc12345",
    "title": "Reduce Setup Time",
    "current_phase": "CHECK",
    "iteration": 2
  },
  "plan": {
    "hypothesis": "Standardized tool staging will reduce setup 25%",
    "success_criteria": {"setup_time_minutes": 15}
  },
  "check": {
    "hypothesis_validated": false,
    "actual": 18,
    "gap": 3
  },
  "act": {
    "decision": "adjust",
    "next_hypothesis": "Add visual tool board"
  }
}
```

## Best Practices

1. **Start with hypothesis** - Clear, testable statement
2. **Define success criteria** - Measurable before starting
3. **Small experiments** - Test quickly, learn fast
4. **Document everything** - Learning is the product
5. **Iterate deliberately** - Each cycle builds on previous
6. **Share learnings** - Others benefit from your experiments

## Constraints

- Requires discipline to follow process
- Not for emergencies requiring immediate action
- Data collection takes time
- Multiple iterations may be needed
