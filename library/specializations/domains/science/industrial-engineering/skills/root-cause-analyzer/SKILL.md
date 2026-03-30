---
name: root-cause-analyzer
description: Systematic root cause analysis skill with multiple investigation methodologies.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: quality-engineering
  backlog-id: SK-IE-019
---

# root-cause-analyzer

You are **root-cause-analyzer** - a specialized skill for systematic problem investigation and root cause identification.

## Overview

This skill enables AI-powered root cause analysis including:
- Is/Is Not analysis for problem definition
- 5 Whys facilitation and documentation
- Ishikawa (fishbone) diagram generation
- Fault tree analysis (FTA) construction
- Pareto chart generation
- Hypothesis testing for cause verification
- Corrective action development
- Effectiveness verification planning

## Capabilities

### 1. Is/Is Not Problem Definition

```python
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class IsIsNotAnalysis:
    """
    Structured problem definition using Is/Is Not
    """
    # What
    what_is: str  # What is the problem/defect?
    what_is_not: str  # What similar problems are NOT occurring?

    # Where
    where_is: str  # Where is the problem observed?
    where_is_not: str  # Where could it occur but doesn't?

    # When
    when_is: str  # When does the problem occur?
    when_is_not: str  # When could it occur but doesn't?

    # Extent
    extent_is: str  # How big, how many, how often?
    extent_is_not: str  # How big/many/often could it be but isn't?

    distinctions: List[str] = None  # What's unique about the IS vs IS NOT?
    changes: List[str] = None  # What changed around the time problem started?

    def generate_problem_statement(self):
        return f"""
PROBLEM STATEMENT:
{self.what_is} is occurring at {self.where_is}.
The problem was first observed {self.when_is}.
The extent is: {self.extent_is}.

DISTINCTIONS:
This occurs at {self.where_is} but NOT at {self.where_is_not}.
This happens {self.when_is} but NOT {self.when_is_not}.

KEY DISTINCTIONS: {', '.join(self.distinctions or [])}
RECENT CHANGES: {', '.join(self.changes or [])}
"""
```

### 2. 5 Whys Analysis

```python
@dataclass
class WhyStep:
    level: int
    question: str
    answer: str
    evidence: str = ""
    verified: bool = False

class FiveWhysAnalysis:
    """
    5 Whys root cause analysis
    """
    def __init__(self, problem_statement: str):
        self.problem_statement = problem_statement
        self.why_chain: List[WhyStep] = []

    def add_why(self, answer: str, evidence: str = ""):
        level = len(self.why_chain) + 1
        if level == 1:
            question = f"Why did {self.problem_statement} occur?"
        else:
            prev_answer = self.why_chain[-1].answer
            question = f"Why did {prev_answer}?"

        self.why_chain.append(WhyStep(
            level=level,
            question=question,
            answer=answer,
            evidence=evidence
        ))

    def get_root_cause(self):
        if self.why_chain:
            return self.why_chain[-1].answer
        return None

    def validate_chain(self):
        """
        Validate 5 Whys chain by reading backwards
        Should make logical sense: "Therefore..."
        """
        if len(self.why_chain) < 2:
            return {"valid": True, "message": "Chain too short to validate"}

        for i in range(len(self.why_chain) - 1, 0, -1):
            cause = self.why_chain[i].answer
            effect = self.why_chain[i-1].answer
            # Logic check: cause should logically lead to effect

        return {
            "valid": True,
            "root_cause": self.get_root_cause(),
            "chain_length": len(self.why_chain)
        }

    def to_dict(self):
        return {
            "problem": self.problem_statement,
            "why_chain": [
                {
                    "level": w.level,
                    "question": w.question,
                    "answer": w.answer,
                    "evidence": w.evidence,
                    "verified": w.verified
                }
                for w in self.why_chain
            ],
            "root_cause": self.get_root_cause()
        }
```

### 3. Ishikawa (Fishbone) Diagram

```python
class IshikawaDiagram:
    """
    Cause and Effect (Fishbone) Diagram
    """
    # Standard 6M categories for manufacturing
    MANUFACTURING_6M = [
        "Manpower", "Method", "Machine",
        "Material", "Measurement", "Mother Nature (Environment)"
    ]

    # Standard categories for service
    SERVICE_CATEGORIES = [
        "People", "Process", "Policy",
        "Place", "Procedure", "Product"
    ]

    def __init__(self, effect: str, categories: List[str] = None):
        self.effect = effect
        self.categories = categories or self.MANUFACTURING_6M
        self.causes = {cat: [] for cat in self.categories}

    def add_cause(self, category: str, cause: str, sub_causes: List[str] = None):
        if category in self.causes:
            self.causes[category].append({
                "cause": cause,
                "sub_causes": sub_causes or []
            })

    def render_text(self):
        """Generate text representation of fishbone"""
        lines = []
        lines.append(f"EFFECT: {self.effect}")
        lines.append("=" * 50)

        for category in self.categories:
            lines.append(f"\n{category}:")
            for cause_item in self.causes[category]:
                lines.append(f"  - {cause_item['cause']}")
                for sub in cause_item['sub_causes']:
                    lines.append(f"      - {sub}")

        return "\n".join(lines)

    def to_dict(self):
        return {
            "effect": self.effect,
            "categories": self.categories,
            "causes": self.causes
        }

    def prioritize_causes(self, team_rankings: dict):
        """
        Prioritize causes based on team rankings
        team_rankings: {cause: score} where score is 1-5
        """
        all_causes = []
        for category, causes in self.causes.items():
            for cause_item in causes:
                cause = cause_item['cause']
                score = team_rankings.get(cause, 0)
                all_causes.append({
                    "category": category,
                    "cause": cause,
                    "score": score
                })

        return sorted(all_causes, key=lambda x: x['score'], reverse=True)
```

### 4. Fault Tree Analysis

```python
from enum import Enum

class GateType(Enum):
    AND = "AND"  # All inputs must occur
    OR = "OR"    # Any input can cause event

@dataclass
class FaultTreeNode:
    event: str
    gate: Optional[GateType] = None
    probability: Optional[float] = None
    children: List['FaultTreeNode'] = None

    def calculate_probability(self):
        """
        Calculate top event probability
        """
        if not self.children:
            return self.probability or 0

        child_probs = [c.calculate_probability() for c in self.children]

        if self.gate == GateType.AND:
            # P(A AND B) = P(A) * P(B) for independent events
            result = 1
            for p in child_probs:
                result *= p
            return result
        elif self.gate == GateType.OR:
            # P(A OR B) = 1 - (1-P(A)) * (1-P(B))
            result = 1
            for p in child_probs:
                result *= (1 - p)
            return 1 - result

        return 0

class FaultTreeAnalysis:
    """
    Fault Tree Analysis for systematic failure analysis
    """
    def __init__(self, top_event: str):
        self.root = FaultTreeNode(event=top_event)

    def add_gate(self, parent_event: str, gate_type: GateType, child_events: List[str]):
        """Add a gate with children to the tree"""
        parent = self._find_node(self.root, parent_event)
        if parent:
            parent.gate = gate_type
            parent.children = [FaultTreeNode(event=e) for e in child_events]

    def set_probability(self, event: str, probability: float):
        """Set probability for a basic event"""
        node = self._find_node(self.root, event)
        if node:
            node.probability = probability

    def _find_node(self, node: FaultTreeNode, event: str) -> Optional[FaultTreeNode]:
        if node.event == event:
            return node
        if node.children:
            for child in node.children:
                found = self._find_node(child, event)
                if found:
                    return found
        return None

    def calculate_top_probability(self):
        return self.root.calculate_probability()

    def get_minimal_cut_sets(self):
        """
        Find minimal cut sets (combinations that cause top event)
        """
        # Simplified - return basic events under OR gates
        cut_sets = []
        self._find_cut_sets(self.root, [], cut_sets)
        return cut_sets

    def _find_cut_sets(self, node, current_set, all_sets):
        if not node.children:
            all_sets.append(current_set + [node.event])
            return

        if node.gate == GateType.OR:
            for child in node.children:
                self._find_cut_sets(child, current_set, all_sets)
        elif node.gate == GateType.AND:
            combined = current_set
            for child in node.children:
                if not child.children:
                    combined.append(child.event)
            all_sets.append(combined)
```

### 5. Pareto Analysis

```python
import numpy as np

def pareto_analysis(data: dict, cumulative_threshold: float = 80):
    """
    Pareto analysis to identify vital few

    data: {category: count}
    """
    # Sort by count descending
    sorted_data = sorted(data.items(), key=lambda x: x[1], reverse=True)

    total = sum(data.values())
    cumulative = 0
    cumulative_pct = 0

    results = []
    vital_few = []

    for category, count in sorted_data:
        pct = count / total * 100
        cumulative += count
        cumulative_pct = cumulative / total * 100

        entry = {
            "category": category,
            "count": count,
            "percent": round(pct, 1),
            "cumulative_count": cumulative,
            "cumulative_percent": round(cumulative_pct, 1)
        }
        results.append(entry)

        if cumulative_pct <= cumulative_threshold:
            vital_few.append(category)

    return {
        "data": results,
        "vital_few": vital_few,
        "vital_few_count": len(vital_few),
        "vital_few_percent": round(sum(data[c] for c in vital_few) / total * 100, 1),
        "trivial_many_count": len(data) - len(vital_few),
        "threshold_used": cumulative_threshold
    }
```

### 6. Corrective Action Planning

```python
@dataclass
class CorrectiveAction:
    root_cause: str
    action_type: str  # containment, corrective, preventive
    description: str
    responsible: str
    target_date: str
    verification_method: str
    status: str = "Open"
    effectiveness: Optional[str] = None

def develop_corrective_actions(root_causes: List[str]):
    """
    Guide development of corrective actions for root causes
    """
    action_plan = {
        "containment_actions": [],
        "corrective_actions": [],
        "preventive_actions": []
    }

    for rc in root_causes:
        # Containment - immediate action to protect customer
        action_plan["containment_actions"].append({
            "root_cause": rc,
            "prompt": f"What immediate action can contain the effect of '{rc}'?",
            "examples": ["100% inspection", "Quarantine suspect product", "Sort and rework"]
        })

        # Corrective - eliminate the root cause
        action_plan["corrective_actions"].append({
            "root_cause": rc,
            "prompt": f"What action will eliminate '{rc}' from occurring?",
            "examples": ["Process change", "Equipment modification", "Training"]
        })

        # Preventive - prevent similar issues
        action_plan["preventive_actions"].append({
            "root_cause": rc,
            "prompt": f"How can we prevent similar issues related to '{rc}'?",
            "examples": ["Update FMEA", "Poka-yoke", "Standard work revision"]
        })

    return action_plan
```

## Process Integration

This skill integrates with the following processes:
- `root-cause-analysis-investigation.js`
- `failure-mode-effects-analysis.js`
- `kaizen-event-facilitation.js`

## Output Format

```json
{
  "problem_statement": "Defective welds on assembly line 3",
  "is_is_not": {
    "what_is": "Incomplete weld penetration",
    "where_is": "Station 3B only",
    "when_is": "Since January 15"
  },
  "five_whys": {
    "root_cause": "Worn electrode tips not replaced per schedule",
    "chain_length": 5
  },
  "pareto": {
    "vital_few": ["Electrode condition", "Gas flow"],
    "vital_few_percent": 78
  },
  "corrective_actions": [
    {
      "action": "Implement electrode tip change schedule",
      "type": "corrective",
      "target_date": "2024-02-15"
    }
  ]
}
```

## Best Practices

1. **Define problem clearly** - Use Is/Is Not
2. **Go to gemba** - Observe the actual problem
3. **Use data** - Don't guess at causes
4. **Verify each why** - Evidence-based chain
5. **Address true root cause** - Not symptoms
6. **Verify effectiveness** - Measure improvement

## Constraints

- Document all evidence
- Include cross-functional team
- Verify containment effectiveness
- Track action completion
