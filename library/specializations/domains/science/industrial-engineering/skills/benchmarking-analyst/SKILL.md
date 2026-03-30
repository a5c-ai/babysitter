---
name: benchmarking-analyst
description: Benchmarking analysis skill for performance comparison and best practice identification.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: continuous-improvement
  backlog-id: SK-IE-042
---

# benchmarking-analyst

You are **benchmarking-analyst** - a specialized skill for benchmarking analysis including performance comparison and best practice identification.

## Overview

This skill enables AI-powered benchmarking including:
- Internal benchmarking
- Competitive benchmarking
- Functional benchmarking
- Generic/best-in-class benchmarking
- Gap analysis
- Best practice identification
- Adaptation planning
- Performance tracking

## Capabilities

### 1. Benchmarking Project Setup

```python
from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum

class BenchmarkType(Enum):
    INTERNAL = "internal"  # Compare within organization
    COMPETITIVE = "competitive"  # Compare with competitors
    FUNCTIONAL = "functional"  # Compare similar functions across industries
    GENERIC = "generic"  # Compare with best-in-class anywhere

@dataclass
class BenchmarkProject:
    title: str
    benchmark_type: BenchmarkType
    process_area: str
    metrics: List[str]
    partners: List[str]
    owner: str

def setup_benchmark_project(project: BenchmarkProject):
    """
    Set up benchmarking project structure
    """
    phases = {
        "1_planning": {
            "status": "in_progress",
            "tasks": [
                {"task": "Identify what to benchmark", "status": "complete"},
                {"task": "Identify benchmark partners", "status": "complete"},
                {"task": "Determine data collection method", "status": "not_started"},
                {"task": "Define metrics and calculations", "status": "not_started"}
            ]
        },
        "2_analysis": {
            "status": "not_started",
            "tasks": [
                {"task": "Collect current performance data", "status": "not_started"},
                {"task": "Collect partner performance data", "status": "not_started"},
                {"task": "Determine performance gaps", "status": "not_started"},
                {"task": "Identify enablers of superior performance", "status": "not_started"}
            ]
        },
        "3_integration": {
            "status": "not_started",
            "tasks": [
                {"task": "Communicate findings", "status": "not_started"},
                {"task": "Establish improvement goals", "status": "not_started"},
                {"task": "Develop action plans", "status": "not_started"}
            ]
        },
        "4_action": {
            "status": "not_started",
            "tasks": [
                {"task": "Implement improvements", "status": "not_started"},
                {"task": "Monitor progress", "status": "not_started"},
                {"task": "Recalibrate benchmarks", "status": "not_started"}
            ]
        }
    }

    return {
        "project_id": f"BM-{datetime.now().strftime('%Y%m%d')}",
        "title": project.title,
        "type": project.benchmark_type.value,
        "process_area": project.process_area,
        "metrics": project.metrics,
        "partners": project.partners,
        "owner": project.owner,
        "created_date": datetime.now().strftime("%Y-%m-%d"),
        "phases": phases,
        "status": "planning"
    }
```

### 2. Data Collection Framework

```python
def create_data_collection_template(metrics: List[str], partners: List[str]):
    """
    Create template for benchmark data collection
    """
    template = {
        "data_points": {},
        "collection_guidance": {}
    }

    for metric in metrics:
        template["data_points"][metric] = {
            "our_performance": {
                "value": None,
                "unit": None,
                "period": None,
                "data_source": None,
                "confidence": None
            },
            "partners": {partner: {
                "value": None,
                "unit": None,
                "period": None,
                "data_source": None,
                "is_estimate": False
            } for partner in partners}
        }

        template["collection_guidance"][metric] = {
            "definition": f"Standard definition for {metric}",
            "calculation": f"How to calculate {metric}",
            "data_sources": ["System A", "Reports", "Surveys"],
            "normalization_notes": "Ensure comparable basis"
        }

    return template

def validate_benchmark_data(data: Dict):
    """
    Validate collected benchmark data
    """
    issues = []

    for metric, values in data['data_points'].items():
        # Check our data
        if values['our_performance']['value'] is None:
            issues.append(f"Missing our performance data for {metric}")

        # Check partner data
        partners_with_data = sum(1 for p in values['partners'].values()
                                 if p['value'] is not None)
        if partners_with_data == 0:
            issues.append(f"No partner data for {metric}")
        elif partners_with_data < len(values['partners']) / 2:
            issues.append(f"Limited partner data for {metric}")

        # Check comparability
        units = set()
        if values['our_performance']['unit']:
            units.add(values['our_performance']['unit'])
        for p in values['partners'].values():
            if p['unit']:
                units.add(p['unit'])
        if len(units) > 1:
            issues.append(f"Inconsistent units for {metric}: {units}")

    return {
        "is_valid": len(issues) == 0,
        "issues": issues,
        "completeness": calculate_completeness(data)
    }

def calculate_completeness(data):
    """Calculate data completeness percentage"""
    total_cells = 0
    filled_cells = 0

    for metric, values in data['data_points'].items():
        total_cells += 1  # Our data
        if values['our_performance']['value'] is not None:
            filled_cells += 1

        for partner_data in values['partners'].values():
            total_cells += 1
            if partner_data['value'] is not None:
                filled_cells += 1

    return round(filled_cells / total_cells * 100, 1) if total_cells > 0 else 0
```

### 3. Gap Analysis

```python
import numpy as np

def perform_gap_analysis(data: Dict, higher_is_better: Dict = None):
    """
    Perform gap analysis between our performance and benchmarks

    higher_is_better: {metric: True/False}
    """
    higher_is_better = higher_is_better or {}
    gap_analysis = []

    for metric, values in data['data_points'].items():
        our_value = values['our_performance']['value']
        if our_value is None:
            continue

        partner_values = [p['value'] for p in values['partners'].values()
                         if p['value'] is not None]

        if not partner_values:
            continue

        # Calculate statistics
        best = max(partner_values) if higher_is_better.get(metric, True) else min(partner_values)
        worst = min(partner_values) if higher_is_better.get(metric, True) else max(partner_values)
        median = np.median(partner_values)
        mean = np.mean(partner_values)

        # Calculate gaps
        gap_to_best = best - our_value if higher_is_better.get(metric, True) else our_value - best
        gap_to_median = median - our_value if higher_is_better.get(metric, True) else our_value - median

        # Calculate percentile position
        all_values = partner_values + [our_value]
        all_values_sorted = sorted(all_values, reverse=higher_is_better.get(metric, True))
        our_rank = all_values_sorted.index(our_value) + 1
        percentile = round((1 - our_rank / len(all_values)) * 100, 1)

        gap_analysis.append({
            'metric': metric,
            'our_value': our_value,
            'best_in_class': best,
            'median': round(median, 2),
            'mean': round(mean, 2),
            'worst': worst,
            'gap_to_best': round(gap_to_best, 2),
            'gap_to_median': round(gap_to_median, 2),
            'gap_percent': round(gap_to_best / our_value * 100, 1) if our_value != 0 else 0,
            'our_percentile': percentile,
            'position': classify_position(percentile)
        })

    # Sort by gap size
    gap_analysis.sort(key=lambda x: abs(x['gap_percent']), reverse=True)

    return {
        'gaps': gap_analysis,
        'summary': {
            'metrics_analyzed': len(gap_analysis),
            'metrics_below_median': sum(1 for g in gap_analysis if g['gap_to_median'] > 0),
            'metrics_above_median': sum(1 for g in gap_analysis if g['gap_to_median'] < 0),
            'biggest_gap_metric': gap_analysis[0]['metric'] if gap_analysis else None
        }
    }

def classify_position(percentile):
    """Classify position based on percentile"""
    if percentile >= 90:
        return "Leader"
    elif percentile >= 75:
        return "Above Average"
    elif percentile >= 50:
        return "Average"
    elif percentile >= 25:
        return "Below Average"
    else:
        return "Laggard"
```

### 4. Best Practice Identification

```python
def identify_best_practices(gap_analysis: Dict, partner_insights: Dict):
    """
    Identify best practices from benchmark partners

    partner_insights: {partner: {metric: {'practice': str, 'enablers': [str]}}}
    """
    best_practices = []

    for gap in gap_analysis['gaps']:
        metric = gap['metric']

        if gap['gap_to_best'] <= 0:
            # We are best-in-class, document our practice
            best_practices.append({
                'metric': metric,
                'source': 'internal',
                'practice': 'Current practice is best-in-class',
                'value': gap['our_value'],
                'action': 'document_and_share'
            })
        else:
            # Find best performer's practice
            for partner, insights in partner_insights.items():
                if metric in insights:
                    if insights[metric].get('is_best'):
                        best_practices.append({
                            'metric': metric,
                            'source': partner,
                            'practice': insights[metric]['practice'],
                            'enablers': insights[metric].get('enablers', []),
                            'value': gap['best_in_class'],
                            'our_gap': gap['gap_to_best'],
                            'action': 'adapt_and_implement'
                        })

    return {
        'best_practices': best_practices,
        'practices_to_adopt': sum(1 for p in best_practices if p['action'] == 'adapt_and_implement'),
        'practices_to_share': sum(1 for p in best_practices if p['action'] == 'document_and_share')
    }
```

### 5. Improvement Target Setting

```python
def set_improvement_targets(gap_analysis: Dict, timeline_years: int = 3):
    """
    Set improvement targets based on gaps
    """
    targets = []

    for gap in gap_analysis['gaps']:
        if gap['gap_to_median'] <= 0:
            # Already above median, target best-in-class
            target = gap['best_in_class']
            ambition = 'stretch'
        elif gap['position'] in ['Laggard', 'Below Average']:
            # Significant gap, target median first
            target = gap['median']
            ambition = 'catch_up'
        else:
            # Close to median, target top quartile
            target = gap['best_in_class'] * 0.9  # 90% of best
            ambition = 'improve'

        # Calculate annual improvement needed
        total_improvement = target - gap['our_value']
        annual_improvement = total_improvement / timeline_years

        targets.append({
            'metric': gap['metric'],
            'current': gap['our_value'],
            'target': round(target, 2),
            'ambition': ambition,
            'timeline_years': timeline_years,
            'annual_improvement': round(annual_improvement, 2),
            'milestones': generate_milestones(gap['our_value'], target, timeline_years)
        })

    return {
        'targets': targets,
        'summary': {
            'stretch_targets': sum(1 for t in targets if t['ambition'] == 'stretch'),
            'catch_up_targets': sum(1 for t in targets if t['ambition'] == 'catch_up'),
            'improve_targets': sum(1 for t in targets if t['ambition'] == 'improve')
        }
    }

def generate_milestones(current, target, years):
    """Generate annual milestones"""
    improvement = (target - current) / years
    milestones = []

    for year in range(1, years + 1):
        milestones.append({
            'year': year,
            'target': round(current + improvement * year, 2)
        })

    return milestones
```

### 6. Adaptation Planning

```python
def create_adaptation_plan(best_practice: Dict, our_context: Dict):
    """
    Create plan to adapt best practice to our context

    our_context: {
        'constraints': [str],
        'resources': [str],
        'culture': str,
        'current_capabilities': [str]
    }
    """
    adaptation = {
        'practice': best_practice['practice'],
        'source': best_practice['source'],
        'expected_improvement': best_practice.get('our_gap'),
        'adaptation_needed': [],
        'prerequisites': [],
        'implementation_phases': [],
        'risks': []
    }

    # Identify adaptations based on context
    if our_context.get('constraints'):
        adaptation['adaptation_needed'].append({
            'reason': 'Organizational constraints',
            'details': our_context['constraints'],
            'mitigation': 'Modify approach to work within constraints'
        })

    # Prerequisites based on enablers
    enablers = best_practice.get('enablers', [])
    for enabler in enablers:
        if enabler not in our_context.get('current_capabilities', []):
            adaptation['prerequisites'].append({
                'capability': enabler,
                'status': 'gap',
                'action': f'Develop capability: {enabler}'
            })

    # Implementation phases
    adaptation['implementation_phases'] = [
        {
            'phase': 1,
            'name': 'Preparation',
            'duration_weeks': 4,
            'activities': ['Train team', 'Secure resources', 'Pilot planning']
        },
        {
            'phase': 2,
            'name': 'Pilot',
            'duration_weeks': 8,
            'activities': ['Implement in limited area', 'Collect data', 'Adjust approach']
        },
        {
            'phase': 3,
            'name': 'Rollout',
            'duration_weeks': 12,
            'activities': ['Scale to full scope', 'Monitor results', 'Refine']
        },
        {
            'phase': 4,
            'name': 'Standardize',
            'duration_weeks': 4,
            'activities': ['Document standard work', 'Train all users', 'Audit']
        }
    ]

    # Risks
    adaptation['risks'] = [
        {'risk': 'Practice may not transfer directly', 'mitigation': 'Pilot first'},
        {'risk': 'Resource constraints', 'mitigation': 'Phase implementation'},
        {'risk': 'Cultural resistance', 'mitigation': 'Change management'}
    ]

    return adaptation
```

### 7. Progress Tracking

```python
def track_benchmark_progress(targets: List[Dict], current_performance: Dict):
    """
    Track progress toward benchmark targets
    """
    progress = []

    for target in targets:
        metric = target['metric']
        current = current_performance.get(metric)

        if current is None:
            continue

        baseline = target['current']
        goal = target['target']

        # Calculate progress
        total_needed = goal - baseline
        achieved = current - baseline
        progress_pct = (achieved / total_needed * 100) if total_needed != 0 else 0

        # Determine on-track status
        # Expected progress based on elapsed time would be calculated here
        # Simplified: check against annual milestones

        progress.append({
            'metric': metric,
            'baseline': baseline,
            'current': current,
            'target': goal,
            'improvement': round(achieved, 2),
            'progress_percent': round(progress_pct, 1),
            'remaining_gap': round(goal - current, 2),
            'status': 'on_track' if progress_pct >= 80 else 'at_risk' if progress_pct >= 50 else 'behind'
        })

    return {
        'metrics': progress,
        'summary': {
            'on_track': sum(1 for p in progress if p['status'] == 'on_track'),
            'at_risk': sum(1 for p in progress if p['status'] == 'at_risk'),
            'behind': sum(1 for p in progress if p['status'] == 'behind'),
            'avg_progress': round(np.mean([p['progress_percent'] for p in progress]), 1) if progress else 0
        }
    }
```

## Process Integration

This skill integrates with the following processes:
- `benchmarking-study-execution.js`
- `continuous-improvement-program.js`
- `strategic-planning.js`

## Output Format

```json
{
  "benchmark_project": {
    "title": "Manufacturing Efficiency Study",
    "type": "competitive",
    "partners": ["Company A", "Company B", "Industry Avg"]
  },
  "gap_analysis": {
    "metrics_analyzed": 8,
    "below_median": 3,
    "biggest_gap": {"metric": "OEE", "gap": 12}
  },
  "best_practices": [
    {"metric": "OEE", "source": "Company A", "practice": "TPM program"}
  ],
  "targets": {
    "stretch": 2,
    "catch_up": 3
  },
  "progress": {
    "on_track": 5,
    "at_risk": 2,
    "behind": 1
  }
}
```

## Best Practices

1. **Compare apples to apples** - Ensure metrics are comparable
2. **Focus on enablers** - Understanding how, not just what
3. **Adapt, don't copy** - Context matters
4. **Benchmark continuously** - Targets move
5. **Learn from best anywhere** - Not just competitors
6. **Act on findings** - Benchmarking without action is wasted

## Constraints

- Partner data can be hard to obtain
- Comparability requires careful normalization
- Best-in-class today may not be tomorrow
- Implementation is harder than identification
