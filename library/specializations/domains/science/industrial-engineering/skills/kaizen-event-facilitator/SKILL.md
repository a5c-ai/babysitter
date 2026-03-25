---
name: kaizen-event-facilitator
description: Kaizen event facilitation skill for rapid improvement workshops and action planning.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: continuous-improvement
  backlog-id: SK-IE-039
---

# kaizen-event-facilitator

You are **kaizen-event-facilitator** - a specialized skill for facilitating Kaizen events and rapid improvement workshops.

## Overview

This skill enables AI-powered Kaizen facilitation including:
- Event planning and preparation
- Current state documentation
- Waste identification (8 wastes)
- Future state design
- Action plan development
- Standard work creation
- Results tracking
- Sustainability planning

## Capabilities

### 1. Kaizen Event Planning

```python
import pandas as pd
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class KaizenEvent:
    title: str
    scope: str
    objectives: List[str]
    metrics: List[Dict]
    start_date: datetime
    duration_days: int
    team_members: List[str]
    sponsor: str

def plan_kaizen_event(event: KaizenEvent):
    """
    Generate comprehensive Kaizen event plan
    """
    # Pre-event preparation (2-4 weeks before)
    prep_activities = [
        {"week": -4, "activity": "Define scope and objectives with sponsor", "owner": "Facilitator"},
        {"week": -4, "activity": "Identify team members and get commitment", "owner": "Sponsor"},
        {"week": -3, "activity": "Collect baseline data for metrics", "owner": "Team Lead"},
        {"week": -3, "activity": "Schedule room and equipment", "owner": "Facilitator"},
        {"week": -2, "activity": "Prepare training materials", "owner": "Facilitator"},
        {"week": -2, "activity": "Communicate to affected employees", "owner": "Sponsor"},
        {"week": -1, "activity": "Confirm all logistics", "owner": "Facilitator"},
        {"week": -1, "activity": "Pre-brief team on event objectives", "owner": "Facilitator"}
    ]

    # Event agenda by day
    agenda = generate_event_agenda(event.duration_days)

    # Post-event follow-up
    followup = [
        {"week": 1, "activity": "Complete 30-day action items", "owner": "Team"},
        {"week": 2, "activity": "First results check", "owner": "Facilitator"},
        {"week": 4, "activity": "30-day review meeting", "owner": "Sponsor"},
        {"week": 12, "activity": "90-day sustainability audit", "owner": "Facilitator"}
    ]

    return {
        "event_summary": {
            "title": event.title,
            "scope": event.scope,
            "objectives": event.objectives,
            "duration": f"{event.duration_days} days",
            "team_size": len(event.team_members)
        },
        "preparation": prep_activities,
        "event_agenda": agenda,
        "followup": followup,
        "success_metrics": event.metrics
    }

def generate_event_agenda(duration_days: int):
    """Generate standard Kaizen event agenda"""
    if duration_days == 5:
        return {
            "day_1": {
                "theme": "Training and Current State",
                "activities": [
                    {"time": "8:00-8:30", "activity": "Welcome and introductions"},
                    {"time": "8:30-10:00", "activity": "Lean fundamentals training"},
                    {"time": "10:00-12:00", "activity": "Go to gemba - observe current state"},
                    {"time": "1:00-3:00", "activity": "Document current state process map"},
                    {"time": "3:00-5:00", "activity": "Collect time observations"}
                ]
            },
            "day_2": {
                "theme": "Waste Identification and Analysis",
                "activities": [
                    {"time": "8:00-10:00", "activity": "Complete current state map"},
                    {"time": "10:00-12:00", "activity": "Identify 8 wastes"},
                    {"time": "1:00-3:00", "activity": "Root cause analysis"},
                    {"time": "3:00-5:00", "activity": "Prioritize opportunities"}
                ]
            },
            "day_3": {
                "theme": "Future State Design",
                "activities": [
                    {"time": "8:00-10:00", "activity": "Brainstorm improvements"},
                    {"time": "10:00-12:00", "activity": "Design future state"},
                    {"time": "1:00-3:00", "activity": "Develop action plans"},
                    {"time": "3:00-5:00", "activity": "Begin implementation"}
                ]
            },
            "day_4": {
                "theme": "Implementation",
                "activities": [
                    {"time": "8:00-12:00", "activity": "Implement changes"},
                    {"time": "1:00-3:00", "activity": "Test and adjust"},
                    {"time": "3:00-5:00", "activity": "Document standard work"}
                ]
            },
            "day_5": {
                "theme": "Standardize and Report",
                "activities": [
                    {"time": "8:00-10:00", "activity": "Finalize standard work"},
                    {"time": "10:00-12:00", "activity": "Train affected employees"},
                    {"time": "1:00-3:00", "activity": "Prepare report-out"},
                    {"time": "3:00-4:00", "activity": "Management report-out"},
                    {"time": "4:00-5:00", "activity": "Celebrate and close"}
                ]
            }
        }
    elif duration_days == 3:
        return {
            "day_1": {"theme": "Analyze", "activities": ["Current state", "Waste identification"]},
            "day_2": {"theme": "Improve", "activities": ["Future state", "Implementation"]},
            "day_3": {"theme": "Standardize", "activities": ["Standard work", "Report-out"]}
        }
    return {}
```

### 2. Waste Identification (8 Wastes)

```python
def identify_wastes(observations: List[Dict]):
    """
    Categorize observations into 8 wastes (TIMWOODS)

    observations: list of {'description': str, 'location': str, 'frequency': str, 'impact': str}
    """
    waste_categories = {
        'T': {'name': 'Transport', 'description': 'Unnecessary movement of materials', 'examples': []},
        'I': {'name': 'Inventory', 'description': 'Excess inventory beyond immediate need', 'examples': []},
        'M': {'name': 'Motion', 'description': 'Unnecessary movement of people', 'examples': []},
        'W': {'name': 'Waiting', 'description': 'Idle time waiting for next step', 'examples': []},
        'O': {'name': 'Overproduction', 'description': 'Producing more than needed', 'examples': []},
        'O2': {'name': 'Overprocessing', 'description': 'More processing than required', 'examples': []},
        'D': {'name': 'Defects', 'description': 'Rework, scrap, errors', 'examples': []},
        'S': {'name': 'Skills', 'description': 'Underutilized people capabilities', 'examples': []}
    }

    categorized = []

    for obs in observations:
        # AI-assisted categorization based on keywords
        category = categorize_waste(obs['description'])
        obs['waste_category'] = category
        waste_categories[category]['examples'].append(obs)
        categorized.append(obs)

    # Summarize
    summary = []
    for code, waste in waste_categories.items():
        if waste['examples']:
            summary.append({
                'code': code,
                'name': waste['name'],
                'count': len(waste['examples']),
                'high_impact': sum(1 for e in waste['examples'] if e.get('impact') == 'high')
            })

    summary.sort(key=lambda x: x['count'], reverse=True)

    return {
        'waste_categories': waste_categories,
        'observations': categorized,
        'summary': summary,
        'total_wastes_identified': len(observations),
        'top_waste_category': summary[0] if summary else None
    }

def categorize_waste(description: str):
    """Simple keyword-based waste categorization"""
    desc_lower = description.lower()

    if any(w in desc_lower for w in ['move', 'transport', 'carry', 'travel']):
        return 'T' if 'material' in desc_lower else 'M'
    elif any(w in desc_lower for w in ['wait', 'idle', 'queue', 'delay']):
        return 'W'
    elif any(w in desc_lower for w in ['inventory', 'stock', 'wip', 'pile']):
        return 'I'
    elif any(w in desc_lower for w in ['defect', 'rework', 'scrap', 'error', 'reject']):
        return 'D'
    elif any(w in desc_lower for w in ['extra', 'unnecessary', 'redundant']):
        return 'O2'
    elif any(w in desc_lower for w in ['overproduce', 'too many', 'ahead of']):
        return 'O'
    elif any(w in desc_lower for w in ['skill', 'talent', 'idea', 'capability']):
        return 'S'
    else:
        return 'O2'  # Default
```

### 3. Action Plan Development

```python
def create_action_plan(improvements: List[Dict], event_end_date: datetime):
    """
    Create structured action plan from improvements

    improvements: list of {'description': str, 'owner': str, 'priority': str, 'effort': str}
    """
    actions = []

    for i, imp in enumerate(improvements):
        # Determine timeline based on effort
        if imp['effort'] == 'just_do_it':
            due_date = event_end_date
            category = 'Do During Event'
        elif imp['effort'] == 'short_term':
            due_date = event_end_date + timedelta(days=30)
            category = '30-Day Action'
        elif imp['effort'] == 'medium_term':
            due_date = event_end_date + timedelta(days=90)
            category = '90-Day Action'
        else:
            due_date = event_end_date + timedelta(days=180)
            category = 'Long-Term Initiative'

        actions.append({
            'id': f'A{i+1:03d}',
            'description': imp['description'],
            'owner': imp['owner'],
            'priority': imp['priority'],
            'category': category,
            'due_date': due_date.strftime('%Y-%m-%d'),
            'status': 'Not Started',
            'percent_complete': 0,
            'support_needed': imp.get('support_needed', ''),
            'success_criteria': imp.get('success_criteria', '')
        })

    # Organize by category
    by_category = {}
    for action in actions:
        cat = action['category']
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(action)

    return {
        'all_actions': actions,
        'by_category': by_category,
        'summary': {
            'total_actions': len(actions),
            'during_event': len(by_category.get('Do During Event', [])),
            '30_day': len(by_category.get('30-Day Action', [])),
            '90_day': len(by_category.get('90-Day Action', [])),
            'long_term': len(by_category.get('Long-Term Initiative', []))
        }
    }
```

### 4. Results Tracking

```python
def track_kaizen_results(baseline: Dict, current: Dict, targets: Dict):
    """
    Track Kaizen event results against baseline and targets
    """
    results = []

    for metric, baseline_value in baseline.items():
        target_value = targets.get(metric, baseline_value)
        current_value = current.get(metric, baseline_value)

        # Calculate improvements
        if baseline_value != 0:
            improvement_pct = (baseline_value - current_value) / baseline_value * 100
            target_improvement_pct = (baseline_value - target_value) / baseline_value * 100
        else:
            improvement_pct = 0
            target_improvement_pct = 0

        # Check if target met
        better_is_lower = target_value < baseline_value
        if better_is_lower:
            target_met = current_value <= target_value
        else:
            target_met = current_value >= target_value

        results.append({
            'metric': metric,
            'baseline': baseline_value,
            'target': target_value,
            'current': current_value,
            'improvement_percent': round(improvement_pct, 1),
            'target_improvement_percent': round(target_improvement_pct, 1),
            'target_met': target_met,
            'status': 'green' if target_met else 'yellow' if abs(improvement_pct) > 0 else 'red'
        })

    # Overall summary
    targets_met = sum(1 for r in results if r['target_met'])

    return {
        'metrics': results,
        'summary': {
            'metrics_tracked': len(results),
            'targets_met': targets_met,
            'target_achievement_rate': round(targets_met / len(results) * 100, 1) if results else 0
        }
    }
```

### 5. Standard Work Documentation

```python
def create_standard_work(process_steps: List[Dict], takt_time: float,
                        cycle_time: float, work_in_process: int = 1):
    """
    Create standard work documentation

    process_steps: list of {'step': int, 'description': str, 'time': float, 'key_points': list}
    """
    # Calculate totals
    total_time = sum(s['time'] for s in process_steps)
    manual_time = sum(s['time'] for s in process_steps if not s.get('machine_time', False))
    walk_time = sum(s.get('walk_time', 0) for s in process_steps)

    # Standard work elements
    standard_work = {
        'header': {
            'process_name': '',  # To be filled
            'takt_time': takt_time,
            'cycle_time': cycle_time,
            'operators': 1,
            'standard_wip': work_in_process
        },
        'time_summary': {
            'total_cycle_time': round(total_time, 1),
            'manual_time': round(manual_time, 1),
            'walk_time': round(walk_time, 1),
            'takt_vs_cycle': round(takt_time - cycle_time, 1)
        },
        'sequence': [],
        'quality_checks': [],
        'safety_points': []
    }

    # Build sequence
    cumulative = 0
    for step in process_steps:
        cumulative += step['time']
        standard_work['sequence'].append({
            'step': step['step'],
            'description': step['description'],
            'time_seconds': step['time'],
            'cumulative_time': cumulative,
            'key_points': step.get('key_points', []),
            'symbol': step.get('symbol', 'operation')  # operation, transport, inspect, wait
        })

        # Extract quality checks and safety points
        for kp in step.get('key_points', []):
            if 'quality' in kp.lower() or 'check' in kp.lower():
                standard_work['quality_checks'].append({'step': step['step'], 'point': kp})
            if 'safety' in kp.lower() or 'caution' in kp.lower():
                standard_work['safety_points'].append({'step': step['step'], 'point': kp})

    return standard_work

def create_standard_work_combination_sheet(operators: List[Dict], takt_time: float):
    """
    Create standard work combination sheet for multiple operators
    """
    combination = {
        'takt_time': takt_time,
        'operators': []
    }

    for op in operators:
        op_data = {
            'operator': op['name'],
            'tasks': op['tasks'],
            'total_manual_time': sum(t.get('manual', 0) for t in op['tasks']),
            'total_walk_time': sum(t.get('walk', 0) for t in op['tasks']),
            'total_wait_time': sum(t.get('wait', 0) for t in op['tasks']),
            'total_cycle_time': sum(t.get('manual', 0) + t.get('walk', 0) + t.get('wait', 0) for t in op['tasks'])
        }
        op_data['utilization'] = round(op_data['total_cycle_time'] / takt_time * 100, 1)
        combination['operators'].append(op_data)

    return combination
```

### 6. Sustainability Assessment

```python
def assess_sustainability(event_id: str, days_since_event: int,
                         audit_findings: List[Dict]):
    """
    Assess sustainability of Kaizen improvements
    """
    categories = {
        'standard_work_adherence': [],
        'metrics_maintained': [],
        'visual_management': [],
        'employee_engagement': [],
        'system_support': []
    }

    for finding in audit_findings:
        cat = finding.get('category', 'standard_work_adherence')
        if cat in categories:
            categories[cat].append(finding)

    # Score each category
    scores = {}
    for cat, findings in categories.items():
        if findings:
            positive = sum(1 for f in findings if f.get('status') == 'maintained')
            scores[cat] = round(positive / len(findings) * 100, 1)
        else:
            scores[cat] = None

    # Overall sustainability score
    valid_scores = [s for s in scores.values() if s is not None]
    overall = round(sum(valid_scores) / len(valid_scores), 1) if valid_scores else 0

    return {
        'event_id': event_id,
        'days_since_event': days_since_event,
        'category_scores': scores,
        'overall_sustainability_score': overall,
        'status': 'sustained' if overall >= 80 else 'at_risk' if overall >= 60 else 'degraded',
        'findings': categories,
        'recommendations': generate_sustainability_recommendations(scores, overall)
    }

def generate_sustainability_recommendations(scores, overall):
    recommendations = []

    if scores.get('standard_work_adherence', 100) < 80:
        recommendations.append("Reinforce standard work training and daily audits")

    if scores.get('visual_management', 100) < 80:
        recommendations.append("Update and maintain visual management boards")

    if scores.get('employee_engagement', 100) < 80:
        recommendations.append("Increase team involvement in daily improvement activities")

    if overall < 60:
        recommendations.append("Consider refresher Kaizen event to restore gains")

    return recommendations
```

## Process Integration

This skill integrates with the following processes:
- `kaizen-event-execution.js`
- `continuous-improvement-program.js`
- `standard-work-development.js`

## Output Format

```json
{
  "event_plan": {
    "title": "Assembly Cell Improvement",
    "duration": "5 days",
    "objectives": ["Reduce cycle time 20%", "Eliminate 3 wastes"]
  },
  "waste_identification": {
    "total_identified": 15,
    "top_category": "Motion",
    "high_impact": 5
  },
  "action_plan": {
    "total_actions": 22,
    "during_event": 8,
    "30_day": 10,
    "90_day": 4
  },
  "results": {
    "metrics_improved": 4,
    "targets_met": 3,
    "overall_improvement": "25%"
  }
}
```

## Best Practices

1. **Prepare thoroughly** - 80% of success is in preparation
2. **Go to gemba** - Observe reality, not reports
3. **Involve operators** - They know the problems
4. **Do, don't discuss** - Implement during the event
5. **Measure before/after** - Data proves improvement
6. **Follow up** - Sustainability requires attention

## Constraints

- Requires dedicated team time
- Management support essential
- Scope must be achievable in timeframe
- Not all problems suit Kaizen events
