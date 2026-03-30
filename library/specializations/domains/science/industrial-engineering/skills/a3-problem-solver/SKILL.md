---
name: a3-problem-solver
description: A3 problem-solving skill for structured problem analysis and countermeasure development.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: continuous-improvement
  backlog-id: SK-IE-040
---

# a3-problem-solver

You are **a3-problem-solver** - a specialized skill for A3 problem-solving including structured problem analysis and countermeasure development.

## Overview

This skill enables AI-powered A3 problem-solving including:
- A3 template generation
- Problem statement development
- Current condition analysis
- Root cause investigation
- Target condition definition
- Countermeasure development
- Implementation planning
- Follow-up tracking

## Capabilities

### 1. A3 Template Generation

```python
from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum

class A3Type(Enum):
    PROBLEM_SOLVING = "problem_solving"
    PROPOSAL = "proposal"
    STATUS_REPORT = "status_report"

@dataclass
class A3Document:
    title: str
    owner: str
    date: datetime
    a3_type: A3Type
    mentor: Optional[str] = None

def create_a3_template(doc: A3Document):
    """
    Create A3 template structure

    A3 is a single 11x17 page summarizing problem-solving thinking
    """
    if doc.a3_type == A3Type.PROBLEM_SOLVING:
        template = {
            "header": {
                "title": doc.title,
                "owner": doc.owner,
                "date": doc.date.strftime("%Y-%m-%d"),
                "mentor": doc.mentor,
                "revision": 1
            },
            "left_side": {
                "1_background": {
                    "section": "Background",
                    "prompt": "Why is this important? What is the business context?",
                    "content": ""
                },
                "2_current_condition": {
                    "section": "Current Condition",
                    "prompt": "What is happening now? Include data and visual.",
                    "content": "",
                    "data": [],
                    "visual": None
                },
                "3_goal": {
                    "section": "Goal/Target Condition",
                    "prompt": "What specific, measurable outcome do we want?",
                    "content": "",
                    "metric": "",
                    "target": "",
                    "deadline": ""
                },
                "4_root_cause": {
                    "section": "Root Cause Analysis",
                    "prompt": "Why does this problem exist? (5 Whys, Fishbone)",
                    "content": "",
                    "method": "",
                    "root_causes": []
                }
            },
            "right_side": {
                "5_countermeasures": {
                    "section": "Countermeasures",
                    "prompt": "What will we do to address root causes?",
                    "countermeasures": []
                },
                "6_implementation": {
                    "section": "Implementation Plan",
                    "prompt": "Who does what by when?",
                    "actions": []
                },
                "7_followup": {
                    "section": "Follow-up",
                    "prompt": "How will we verify results and sustain?",
                    "check_dates": [],
                    "success_criteria": ""
                }
            }
        }

    elif doc.a3_type == A3Type.PROPOSAL:
        template = {
            "header": {"title": doc.title, "owner": doc.owner},
            "left_side": {
                "1_background": {"section": "Background/Context"},
                "2_current_condition": {"section": "Current Situation"},
                "3_proposal": {"section": "Proposal"},
                "4_analysis": {"section": "Analysis/Rationale"}
            },
            "right_side": {
                "5_plan": {"section": "Implementation Plan"},
                "6_cost_benefit": {"section": "Cost-Benefit Analysis"},
                "7_risks": {"section": "Risks and Mitigation"}
            }
        }

    return template
```

### 2. Problem Statement Development

```python
def develop_problem_statement(observations: Dict):
    """
    Develop clear, specific problem statement

    observations: {
        'what': description of the problem,
        'where': location/process,
        'when': when it occurs,
        'extent': magnitude/frequency,
        'impact': business impact
    }
    """
    # Validate completeness
    required = ['what', 'where', 'when', 'extent', 'impact']
    missing = [r for r in required if r not in observations or not observations[r]]

    if missing:
        return {
            "status": "incomplete",
            "missing_elements": missing,
            "guidance": get_problem_statement_guidance(missing)
        }

    # Construct problem statement
    statement = f"{observations['what']} is occurring in {observations['where']}. "
    statement += f"This happens {observations['when']}, with {observations['extent']}. "
    statement += f"The impact is {observations['impact']}."

    # Check for solution bias
    solution_words = ['should', 'need to', 'must', 'implement', 'install']
    has_solution_bias = any(word in statement.lower() for word in solution_words)

    return {
        "problem_statement": statement,
        "elements": observations,
        "quality_check": {
            "is_specific": len(observations['what']) > 20,
            "is_measurable": any(char.isdigit() for char in observations['extent']),
            "has_solution_bias": has_solution_bias,
            "recommendation": "Remove solution references" if has_solution_bias else "Good problem statement"
        }
    }

def get_problem_statement_guidance(missing: list):
    guidance = {
        'what': "Describe what is wrong or not working as expected",
        'where': "Specify the location, process, or system affected",
        'when': "When does the problem occur? Patterns, triggers?",
        'extent': "How big is the problem? Frequency, percentage, quantity?",
        'impact': "What is the business impact? Cost, customer, safety?"
    }
    return {m: guidance.get(m, "") for m in missing}
```

### 3. Current Condition Analysis

```python
def analyze_current_condition(data: Dict, process_description: str):
    """
    Document and analyze current condition
    """
    analysis = {
        "process_overview": process_description,
        "performance_data": {},
        "observations": [],
        "process_map": None,
        "visual_representation": None
    }

    # Analyze provided data
    if 'metrics' in data:
        for metric, values in data['metrics'].items():
            if isinstance(values, list):
                import numpy as np
                analysis['performance_data'][metric] = {
                    'current': values[-1] if values else None,
                    'average': round(np.mean(values), 2),
                    'trend': 'improving' if len(values) > 1 and values[-1] > values[0] else 'declining',
                    'variability': round(np.std(values), 2)
                }
            else:
                analysis['performance_data'][metric] = {'current': values}

    # Gap analysis
    if 'target' in data and 'current' in data:
        analysis['gap'] = {
            'target': data['target'],
            'current': data['current'],
            'gap_size': data['target'] - data['current'],
            'gap_percent': round((data['target'] - data['current']) / data['target'] * 100, 1)
        }

    # Observations from gemba
    if 'observations' in data:
        for obs in data['observations']:
            analysis['observations'].append({
                'observation': obs,
                'category': categorize_observation(obs)
            })

    return analysis

def categorize_observation(observation: str):
    """Categorize observation type"""
    obs_lower = observation.lower()
    if any(w in obs_lower for w in ['wait', 'idle', 'delay']):
        return 'waiting'
    elif any(w in obs_lower for w in ['error', 'defect', 'mistake']):
        return 'quality'
    elif any(w in obs_lower for w in ['search', 'find', 'look for']):
        return 'searching'
    elif any(w in obs_lower for w in ['move', 'walk', 'transport']):
        return 'motion'
    else:
        return 'process'
```

### 4. Root Cause Analysis

```python
def five_whys_analysis(problem: str, whys: List[str]):
    """
    Conduct 5 Whys analysis

    whys: list of answers to successive "why" questions
    """
    analysis = {
        "problem": problem,
        "why_chain": [],
        "root_cause": None
    }

    for i, why in enumerate(whys):
        analysis["why_chain"].append({
            "level": i + 1,
            "question": f"Why #{i+1}",
            "answer": why
        })

    if len(whys) >= 3:
        analysis["root_cause"] = whys[-1]
        analysis["quality"] = "sufficient" if len(whys) >= 5 else "may need more depth"
    else:
        analysis["quality"] = "insufficient - continue asking why"

    return analysis

def fishbone_analysis(problem: str, causes_by_category: Dict):
    """
    Conduct fishbone (Ishikawa) analysis

    causes_by_category: {
        'man': [causes],
        'machine': [causes],
        'method': [causes],
        'material': [causes],
        'measurement': [causes],
        'environment': [causes]
    }
    """
    # 6M categories
    categories = {
        'man': {'name': 'People', 'causes': causes_by_category.get('man', [])},
        'machine': {'name': 'Equipment', 'causes': causes_by_category.get('machine', [])},
        'method': {'name': 'Process', 'causes': causes_by_category.get('method', [])},
        'material': {'name': 'Materials', 'causes': causes_by_category.get('material', [])},
        'measurement': {'name': 'Measurement', 'causes': causes_by_category.get('measurement', [])},
        'environment': {'name': 'Environment', 'causes': causes_by_category.get('environment', [])}
    }

    # Count and prioritize
    total_causes = sum(len(c['causes']) for c in categories.values())

    priority_categories = sorted(
        [(k, len(v['causes'])) for k, v in categories.items()],
        key=lambda x: x[1],
        reverse=True
    )

    return {
        "problem": problem,
        "categories": categories,
        "total_causes_identified": total_causes,
        "priority_categories": [p[0] for p in priority_categories if p[1] > 0],
        "recommendation": f"Focus investigation on {priority_categories[0][0]} ({priority_categories[0][1]} causes)" if priority_categories else "Identify more potential causes"
    }
```

### 5. Countermeasure Development

```python
def develop_countermeasures(root_causes: List[str], constraints: Dict = None):
    """
    Develop countermeasures for root causes
    """
    constraints = constraints or {}
    countermeasures = []

    for i, cause in enumerate(root_causes):
        cm = {
            "root_cause": cause,
            "countermeasures": [],
            "selected": None
        }

        # Generate countermeasure options
        options = generate_countermeasure_options(cause)

        for opt in options:
            evaluation = evaluate_countermeasure(opt, constraints)
            cm["countermeasures"].append({
                "description": opt,
                "evaluation": evaluation
            })

        # Select best option
        best = max(cm["countermeasures"], key=lambda x: x["evaluation"]["score"])
        cm["selected"] = best["description"]

        countermeasures.append(cm)

    return {
        "countermeasures": countermeasures,
        "summary": {
            "root_causes_addressed": len(root_causes),
            "countermeasures_identified": sum(len(cm["countermeasures"]) for cm in countermeasures)
        }
    }

def generate_countermeasure_options(root_cause: str):
    """Generate potential countermeasures (simplified)"""
    options = [
        f"Eliminate: Remove the cause of {root_cause}",
        f"Prevent: Add controls to prevent {root_cause}",
        f"Detect: Add early detection for {root_cause}",
        f"Mitigate: Reduce impact when {root_cause} occurs"
    ]
    return options

def evaluate_countermeasure(countermeasure: str, constraints: Dict):
    """Evaluate countermeasure feasibility"""
    # Simplified scoring
    score = 50  # Base score

    if 'Eliminate' in countermeasure:
        score += 30  # Elimination is best
    elif 'Prevent' in countermeasure:
        score += 20

    # Consider constraints
    if constraints.get('low_cost'):
        if 'Detect' in countermeasure:
            score += 10
    if constraints.get('quick_implementation'):
        if 'Mitigate' in countermeasure or 'Detect' in countermeasure:
            score += 10

    return {
        "score": score,
        "feasibility": "high" if score > 70 else "medium" if score > 50 else "low"
    }
```

### 6. Implementation Planning

```python
def create_implementation_plan(countermeasures: List[Dict], owner: str):
    """
    Create implementation plan with tasks and timeline
    """
    import uuid
    from datetime import datetime, timedelta

    actions = []
    start_date = datetime.now()

    for i, cm in enumerate(countermeasures):
        # Create actions for each countermeasure
        base_actions = [
            {"phase": "Prepare", "duration_days": 5, "description": f"Prepare to implement: {cm['description']}"},
            {"phase": "Implement", "duration_days": 10, "description": f"Implement: {cm['description']}"},
            {"phase": "Verify", "duration_days": 5, "description": f"Verify effectiveness of: {cm['description']}"},
            {"phase": "Standardize", "duration_days": 5, "description": f"Standardize: {cm['description']}"}
        ]

        current_date = start_date
        for action in base_actions:
            end_date = current_date + timedelta(days=action['duration_days'])
            actions.append({
                "id": str(uuid.uuid4())[:8],
                "countermeasure": cm['description'],
                "phase": action['phase'],
                "description": action['description'],
                "owner": cm.get('owner', owner),
                "start_date": current_date.strftime("%Y-%m-%d"),
                "due_date": end_date.strftime("%Y-%m-%d"),
                "status": "Not Started",
                "percent_complete": 0
            })
            current_date = end_date

    return {
        "actions": actions,
        "total_actions": len(actions),
        "timeline": {
            "start": start_date.strftime("%Y-%m-%d"),
            "end": actions[-1]["due_date"] if actions else start_date.strftime("%Y-%m-%d")
        },
        "milestones": extract_milestones(actions)
    }

def extract_milestones(actions):
    """Extract key milestones from actions"""
    milestones = []
    verify_actions = [a for a in actions if a['phase'] == 'Verify']

    for va in verify_actions:
        milestones.append({
            "milestone": f"Verify: {va['countermeasure'][:30]}...",
            "date": va['due_date']
        })

    return milestones
```

### 7. A3 Compilation

```python
def compile_a3(template: Dict, sections: Dict):
    """
    Compile complete A3 document
    """
    # Populate template with section content
    a3 = template.copy()

    # Left side
    if 'background' in sections:
        a3['left_side']['1_background']['content'] = sections['background']

    if 'current_condition' in sections:
        a3['left_side']['2_current_condition']['content'] = sections['current_condition'].get('summary', '')
        a3['left_side']['2_current_condition']['data'] = sections['current_condition'].get('data', [])

    if 'goal' in sections:
        a3['left_side']['3_goal']['content'] = sections['goal'].get('statement', '')
        a3['left_side']['3_goal']['metric'] = sections['goal'].get('metric', '')
        a3['left_side']['3_goal']['target'] = sections['goal'].get('target', '')
        a3['left_side']['3_goal']['deadline'] = sections['goal'].get('deadline', '')

    if 'root_cause' in sections:
        a3['left_side']['4_root_cause']['method'] = sections['root_cause'].get('method', '')
        a3['left_side']['4_root_cause']['root_causes'] = sections['root_cause'].get('causes', [])

    # Right side
    if 'countermeasures' in sections:
        a3['right_side']['5_countermeasures']['countermeasures'] = sections['countermeasures']

    if 'implementation' in sections:
        a3['right_side']['6_implementation']['actions'] = sections['implementation']

    if 'followup' in sections:
        a3['right_side']['7_followup']['check_dates'] = sections['followup'].get('dates', [])
        a3['right_side']['7_followup']['success_criteria'] = sections['followup'].get('criteria', '')

    return a3
```

## Process Integration

This skill integrates with the following processes:
- `a3-problem-solving-project.js`
- `root-cause-analysis.js`
- `continuous-improvement-program.js`

## Output Format

```json
{
  "a3_document": {
    "title": "Reduce Assembly Defects",
    "owner": "John Smith",
    "revision": 3
  },
  "sections": {
    "problem_statement": "Assembly defects at 2.5% vs target of 1%",
    "current_condition": {"defect_rate": 2.5, "gap": 1.5},
    "root_causes": ["Missing torque verification", "Unclear work instructions"],
    "countermeasures": ["Install torque sensors", "Update standard work"],
    "implementation": {"actions": 8, "duration_weeks": 6}
  },
  "status": {
    "phase": "Implementation",
    "percent_complete": 65
  }
}
```

## Best Practices

1. **PDCA thinking** - A3 is the artifact, thinking is the process
2. **Go see** - Base analysis on direct observation
3. **One page** - Forces clarity and prioritization
4. **Mentor involvement** - A3 is a coaching tool
5. **Living document** - Update as you learn
6. **Focus on root cause** - Don't jump to solutions

## Constraints

- Requires problem-solving training
- Not for all problem types
- Needs mentor support
- Takes time to develop skill
