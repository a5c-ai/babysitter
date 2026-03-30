---
name: decision-tree-analyzer
description: Decision tree analysis skill with expected value, risk analysis, and utility theory.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: decision-analysis
  backlog-id: SK-IE-033
---

# decision-tree-analyzer

You are **decision-tree-analyzer** - a specialized skill for decision tree analysis including expected value calculations, risk analysis, and utility theory applications.

## Overview

This skill enables AI-powered decision tree analysis including:
- Decision tree construction
- Expected Monetary Value (EMV) calculation
- Expected Value of Perfect Information (EVPI)
- Expected Value of Sample Information (EVSI)
- Risk profiles and sensitivity
- Utility function application
- Decision rollback analysis
- Multi-stage sequential decisions

## Capabilities

### 1. Decision Tree Construction

```python
import numpy as np
from dataclasses import dataclass
from typing import List, Dict, Optional
from enum import Enum

class NodeType(Enum):
    DECISION = "decision"
    CHANCE = "chance"
    TERMINAL = "terminal"

@dataclass
class TreeNode:
    node_id: str
    node_type: NodeType
    name: str
    value: float = 0  # For terminal nodes
    probability: float = 1.0  # For chance branches
    children: List['TreeNode'] = None
    parent: Optional['TreeNode'] = None

    def __post_init__(self):
        if self.children is None:
            self.children = []

def build_decision_tree(structure: dict):
    """
    Build decision tree from structure definition

    structure: nested dict defining tree
    {
        'type': 'decision',
        'name': 'Initial Decision',
        'branches': [
            {
                'name': 'Option A',
                'type': 'chance',
                'branches': [
                    {'name': 'High', 'probability': 0.3, 'value': 100},
                    {'name': 'Low', 'probability': 0.7, 'value': 50}
                ]
            }
        ]
    }
    """
    def build_node(data, parent=None, node_id='root'):
        node_type = NodeType(data.get('type', 'terminal'))

        node = TreeNode(
            node_id=node_id,
            node_type=node_type,
            name=data.get('name', ''),
            value=data.get('value', 0),
            probability=data.get('probability', 1.0),
            parent=parent
        )

        if 'branches' in data:
            for i, branch in enumerate(data['branches']):
                child = build_node(branch, node, f"{node_id}_{i}")
                node.children.append(child)

        return node

    root = build_node(structure)
    return root
```

### 2. Expected Monetary Value (EMV)

```python
def calculate_emv(node: TreeNode):
    """
    Calculate Expected Monetary Value using rollback analysis
    """
    results = {}

    def rollback(n):
        if n.node_type == NodeType.TERMINAL:
            return n.value

        if n.node_type == NodeType.CHANCE:
            # EMV is weighted average of outcomes
            emv = sum(child.probability * rollback(child) for child in n.children)
            results[n.node_id] = {'name': n.name, 'emv': emv, 'type': 'chance'}
            return emv

        if n.node_type == NodeType.DECISION:
            # Choose maximum EMV branch
            child_values = [(child, rollback(child)) for child in n.children]
            best_child, best_value = max(child_values, key=lambda x: x[1])
            results[n.node_id] = {
                'name': n.name,
                'emv': best_value,
                'type': 'decision',
                'best_choice': best_child.name,
                'all_choices': {c.name: v for c, v in child_values}
            }
            return best_value

    final_emv = rollback(node)

    return {
        "emv": round(final_emv, 2),
        "node_values": results,
        "optimal_strategy": extract_optimal_strategy(results)
    }

def extract_optimal_strategy(results):
    """Extract optimal decision path"""
    strategy = []
    for node_id, data in results.items():
        if data['type'] == 'decision':
            strategy.append({
                'decision': data['name'],
                'choice': data['best_choice'],
                'emv': round(data['emv'], 2)
            })
    return strategy
```

### 3. Expected Value of Perfect Information (EVPI)

```python
def calculate_evpi(decision_node: TreeNode):
    """
    Calculate Expected Value of Perfect Information

    EVPI = EV with perfect information - EMV without information
    """
    # First, get EMV without perfect information
    emv_result = calculate_emv(decision_node)
    emv_without = emv_result['emv']

    # Calculate EV with perfect information
    # For each state of nature, choose best decision
    states = collect_chance_outcomes(decision_node)

    ev_with_perfect = 0
    perfect_decisions = {}

    for state, prob in states.items():
        # For this state, find best decision
        best_value = float('-inf')
        best_decision = None

        for decision_branch in decision_node.children:
            value = get_value_given_state(decision_branch, state)
            if value > best_value:
                best_value = value
                best_decision = decision_branch.name

        ev_with_perfect += prob * best_value
        perfect_decisions[state] = {'decision': best_decision, 'value': best_value}

    evpi = ev_with_perfect - emv_without

    return {
        "evpi": round(evpi, 2),
        "ev_with_perfect_info": round(ev_with_perfect, 2),
        "emv_without_info": round(emv_without, 2),
        "perfect_decisions": perfect_decisions,
        "interpretation": f"Worth up to ${round(evpi, 2)} for perfect information"
    }

def collect_chance_outcomes(node, outcomes=None, current_prob=1.0):
    """Collect all chance outcomes and their probabilities"""
    if outcomes is None:
        outcomes = {}

    if node.node_type == NodeType.TERMINAL:
        return outcomes

    if node.node_type == NodeType.CHANCE:
        for child in node.children:
            outcomes[child.name] = child.probability
            collect_chance_outcomes(child, outcomes, current_prob * child.probability)

    for child in node.children:
        collect_chance_outcomes(child, outcomes, current_prob)

    return outcomes

def get_value_given_state(node, state):
    """Get value of a branch given a specific state occurs"""
    # Simplified - would need full tree traversal
    for child in node.children:
        if child.name == state:
            return child.value if child.node_type == NodeType.TERMINAL else 0
        result = get_value_given_state(child, state)
        if result != 0:
            return result
    return 0
```

### 4. Risk Profile Analysis

```python
def create_risk_profile(decision_node: TreeNode, decision_choice: str = None):
    """
    Create risk profile showing probability distribution of outcomes
    """
    outcomes = []

    def collect_outcomes(node, current_prob=1.0, path=None):
        if path is None:
            path = []

        if node.node_type == NodeType.TERMINAL:
            outcomes.append({
                'value': node.value,
                'probability': current_prob,
                'path': ' -> '.join(path)
            })
            return

        if node.node_type == NodeType.CHANCE:
            for child in node.children:
                collect_outcomes(child, current_prob * child.probability,
                               path + [child.name])

        elif node.node_type == NodeType.DECISION:
            if decision_choice:
                for child in node.children:
                    if child.name == decision_choice:
                        collect_outcomes(child, current_prob, path + [child.name])
            else:
                # Use optimal decision
                emv_result = calculate_emv(node)
                best = emv_result['node_values'].get(node.node_id, {}).get('best_choice')
                for child in node.children:
                    if child.name == best:
                        collect_outcomes(child, current_prob, path + [child.name])

    collect_outcomes(decision_node)

    # Aggregate by value
    value_probs = {}
    for outcome in outcomes:
        v = outcome['value']
        value_probs[v] = value_probs.get(v, 0) + outcome['probability']

    # Calculate statistics
    values = [o['value'] for o in outcomes]
    probs = [o['probability'] for o in outcomes]

    expected_value = sum(v * p for v, p in zip(values, probs))
    variance = sum(p * (v - expected_value)**2 for v, p in zip(values, probs))
    std_dev = np.sqrt(variance)

    # Cumulative distribution
    sorted_outcomes = sorted(value_probs.items())
    cumulative = 0
    cdf = []
    for value, prob in sorted_outcomes:
        cumulative += prob
        cdf.append({'value': value, 'cumulative_prob': cumulative})

    return {
        "outcomes": outcomes,
        "probability_distribution": value_probs,
        "statistics": {
            "expected_value": round(expected_value, 2),
            "variance": round(variance, 2),
            "std_deviation": round(std_dev, 2),
            "min_value": min(values),
            "max_value": max(values)
        },
        "cumulative_distribution": cdf
    }
```

### 5. Utility Function Analysis

```python
def apply_utility_function(decision_node: TreeNode, risk_attitude: str = 'neutral',
                          risk_parameter: float = None):
    """
    Apply utility function to convert monetary values

    risk_attitude: 'neutral', 'averse', 'seeking'
    """
    def utility(x, attitude, param):
        if attitude == 'neutral':
            return x
        elif attitude == 'averse':
            # Exponential utility: U(x) = 1 - e^(-x/R)
            R = param or 1000  # Risk tolerance
            return 1 - np.exp(-x / R)
        elif attitude == 'seeking':
            # Exponential utility for risk seeking
            R = param or 1000
            return np.exp(x / R) - 1
        return x

    def inverse_utility(u, attitude, param):
        if attitude == 'neutral':
            return u
        elif attitude == 'averse':
            R = param or 1000
            return -R * np.log(1 - u) if u < 1 else float('inf')
        elif attitude == 'seeking':
            R = param or 1000
            return R * np.log(u + 1)
        return u

    # Convert tree to utility values
    def convert_node(n):
        if n.node_type == NodeType.TERMINAL:
            n.utility_value = utility(n.value, risk_attitude, risk_parameter)
        for child in n.children:
            convert_node(child)

    convert_node(decision_node)

    # Calculate expected utility
    def expected_utility(n):
        if n.node_type == NodeType.TERMINAL:
            return n.utility_value

        if n.node_type == NodeType.CHANCE:
            return sum(child.probability * expected_utility(child) for child in n.children)

        if n.node_type == NodeType.DECISION:
            return max(expected_utility(child) for child in n.children)

    eu = expected_utility(decision_node)
    certainty_equivalent = inverse_utility(eu, risk_attitude, risk_parameter)

    # Compare to EMV
    emv_result = calculate_emv(decision_node)

    return {
        "expected_utility": round(eu, 4),
        "certainty_equivalent": round(certainty_equivalent, 2),
        "emv": emv_result['emv'],
        "risk_premium": round(emv_result['emv'] - certainty_equivalent, 2),
        "risk_attitude": risk_attitude,
        "interpretation": interpret_risk_attitude(certainty_equivalent, emv_result['emv'])
    }

def interpret_risk_attitude(ce, emv):
    if abs(ce - emv) < 1:
        return "Risk neutral - indifferent between expected value and certain equivalent"
    elif ce < emv:
        return f"Risk averse - willing to accept ${round(emv - ce, 2)} less for certainty"
    else:
        return f"Risk seeking - requires ${round(ce - emv, 2)} premium over expected value"
```

### 6. Sensitivity Analysis

```python
def sensitivity_analysis(decision_node: TreeNode, parameter: str,
                        range_min: float, range_max: float, steps: int = 10):
    """
    Analyze sensitivity of decision to parameter changes
    """
    values = np.linspace(range_min, range_max, steps)
    results = []

    for val in values:
        # Modify parameter (probability or value)
        modify_parameter(decision_node, parameter, val)
        emv_result = calculate_emv(decision_node)

        results.append({
            'parameter_value': round(val, 3),
            'emv': round(emv_result['emv'], 2),
            'best_decision': emv_result['optimal_strategy'][0]['choice']
                           if emv_result['optimal_strategy'] else None
        })

    # Find crossover points
    crossovers = []
    for i in range(1, len(results)):
        if results[i]['best_decision'] != results[i-1]['best_decision']:
            crossovers.append({
                'value': results[i]['parameter_value'],
                'from': results[i-1]['best_decision'],
                'to': results[i]['best_decision']
            })

    return {
        "parameter": parameter,
        "range": {"min": range_min, "max": range_max},
        "results": results,
        "crossover_points": crossovers,
        "recommendation": generate_sensitivity_recommendation(crossovers, results)
    }

def modify_parameter(node, parameter, value):
    """Modify a parameter in the tree"""
    # Implementation depends on parameter specification
    pass

def generate_sensitivity_recommendation(crossovers, results):
    if not crossovers:
        return f"Decision is robust - same choice across entire range"
    return f"Decision switches at {len(crossovers)} point(s) - careful analysis needed"
```

## Process Integration

This skill integrates with the following processes:
- `multi-criteria-decision-analysis.js`
- `risk-assessment-analysis.js`
- `investment-analysis.js`

## Output Format

```json
{
  "decision_tree": {
    "emv": 125000,
    "optimal_strategy": [
      {"decision": "Initial", "choice": "Expand", "emv": 125000}
    ]
  },
  "evpi": 15000,
  "risk_profile": {
    "expected_value": 125000,
    "std_deviation": 45000,
    "probability_of_loss": 0.15
  },
  "utility_analysis": {
    "certainty_equivalent": 110000,
    "risk_premium": 15000
  },
  "recommendation": "Choose Expand option with expected value of $125,000"
}
```

## Best Practices

1. **Structure carefully** - Clear decision and chance nodes
2. **Validate probabilities** - Must sum to 1 at chance nodes
3. **Consider all outcomes** - Don't miss important scenarios
4. **Test sensitivity** - Understand key drivers
5. **Consider risk attitude** - EMV assumes risk neutrality
6. **Document assumptions** - Record probability sources

## Constraints

- Requires probability estimates
- Tree complexity grows quickly
- Sequential decisions compound uncertainty
- Utility functions are subjective
