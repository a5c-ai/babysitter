---
name: mcda-analyzer
description: Multi-criteria decision analysis skill with AHP, TOPSIS, and weighted scoring methods.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: decision-analysis
  backlog-id: SK-IE-032
---

# mcda-analyzer

You are **mcda-analyzer** - a specialized skill for multi-criteria decision analysis including AHP, TOPSIS, and weighted scoring methods.

## Overview

This skill enables AI-powered decision analysis including:
- Analytic Hierarchy Process (AHP)
- TOPSIS (Technique for Order Preference by Similarity)
- Weighted scoring methods
- Pairwise comparison matrices
- Consistency ratio calculation
- Sensitivity analysis
- Decision visualization
- Criteria weighting

## Capabilities

### 1. Analytic Hierarchy Process (AHP)

```python
import numpy as np
import pandas as pd

def ahp_analysis(criteria: list, pairwise_matrix: np.ndarray):
    """
    Analytic Hierarchy Process for criteria weighting

    criteria: list of criterion names
    pairwise_matrix: n x n matrix of pairwise comparisons
    """
    n = len(criteria)

    # Calculate priority vector (principal eigenvector)
    # Simplified: normalized column average method
    col_sums = pairwise_matrix.sum(axis=0)
    normalized = pairwise_matrix / col_sums
    priorities = normalized.mean(axis=1)

    # Calculate consistency
    weighted_sum = pairwise_matrix @ priorities
    lambda_max = np.mean(weighted_sum / priorities)

    # Consistency Index
    ci = (lambda_max - n) / (n - 1) if n > 1 else 0

    # Random Index (for n = 1 to 10)
    ri_values = {1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12,
                 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49}
    ri = ri_values.get(n, 1.49)

    # Consistency Ratio
    cr = ci / ri if ri > 0 else 0

    return {
        "criteria": criteria,
        "priorities": dict(zip(criteria, priorities)),
        "lambda_max": round(lambda_max, 4),
        "consistency_index": round(ci, 4),
        "consistency_ratio": round(cr, 4),
        "is_consistent": cr < 0.10,
        "interpretation": "Consistent" if cr < 0.10 else "Inconsistent - revise judgments"
    }

def create_pairwise_matrix(judgments: dict, criteria: list):
    """
    Create pairwise comparison matrix from judgments

    judgments: {(criterion1, criterion2): value} where value is relative importance
    Scale: 1=equal, 3=moderate, 5=strong, 7=very strong, 9=extreme
    """
    n = len(criteria)
    matrix = np.ones((n, n))

    idx = {c: i for i, c in enumerate(criteria)}

    for (c1, c2), value in judgments.items():
        i, j = idx[c1], idx[c2]
        matrix[i, j] = value
        matrix[j, i] = 1 / value

    return matrix
```

### 2. TOPSIS Analysis

```python
def topsis_analysis(alternatives: list, criteria: list, decision_matrix: np.ndarray,
                   weights: list, criteria_types: list):
    """
    TOPSIS (Technique for Order Preference by Similarity to Ideal Solution)

    alternatives: list of alternative names
    criteria: list of criterion names
    decision_matrix: m alternatives x n criteria matrix
    weights: criterion weights (sum to 1)
    criteria_types: list of 'benefit' or 'cost' for each criterion
    """
    m, n = decision_matrix.shape

    # Step 1: Normalize decision matrix
    # Vector normalization
    norm_divisors = np.sqrt((decision_matrix ** 2).sum(axis=0))
    normalized = decision_matrix / norm_divisors

    # Step 2: Weighted normalized matrix
    weighted = normalized * weights

    # Step 3: Determine ideal and anti-ideal solutions
    ideal = np.zeros(n)
    anti_ideal = np.zeros(n)

    for j in range(n):
        if criteria_types[j] == 'benefit':
            ideal[j] = weighted[:, j].max()
            anti_ideal[j] = weighted[:, j].min()
        else:  # cost criterion
            ideal[j] = weighted[:, j].min()
            anti_ideal[j] = weighted[:, j].max()

    # Step 4: Calculate distances
    dist_to_ideal = np.sqrt(((weighted - ideal) ** 2).sum(axis=1))
    dist_to_anti = np.sqrt(((weighted - anti_ideal) ** 2).sum(axis=1))

    # Step 5: Calculate relative closeness
    closeness = dist_to_anti / (dist_to_ideal + dist_to_anti)

    # Rank alternatives
    ranking = np.argsort(-closeness) + 1  # 1 is best

    results = []
    for i, alt in enumerate(alternatives):
        results.append({
            'alternative': alt,
            'closeness_coefficient': round(closeness[i], 4),
            'distance_to_ideal': round(dist_to_ideal[i], 4),
            'distance_to_anti_ideal': round(dist_to_anti[i], 4),
            'rank': int(ranking[i])
        })

    results.sort(key=lambda x: x['rank'])

    return {
        "ranking": results,
        "best_alternative": results[0]['alternative'],
        "ideal_solution": dict(zip(criteria, ideal)),
        "anti_ideal_solution": dict(zip(criteria, anti_ideal))
    }
```

### 3. Weighted Scoring Method

```python
def weighted_scoring(alternatives: list, criteria: list,
                    scores: np.ndarray, weights: list):
    """
    Simple weighted scoring method

    alternatives: list of alternative names
    criteria: list of criterion names
    scores: m x n matrix of scores (0-10 scale typical)
    weights: criterion weights (sum to 1)
    """
    # Calculate weighted scores
    weighted_scores = scores * weights
    total_scores = weighted_scores.sum(axis=1)

    # Rank
    ranking = np.argsort(-total_scores) + 1

    results = []
    for i, alt in enumerate(alternatives):
        criterion_contributions = dict(zip(criteria, weighted_scores[i]))
        results.append({
            'alternative': alt,
            'total_score': round(total_scores[i], 2),
            'criterion_scores': criterion_contributions,
            'rank': int(ranking[i])
        })

    results.sort(key=lambda x: x['rank'])

    return {
        "ranking": results,
        "best_alternative": results[0]['alternative'],
        "score_range": {
            "max": round(max(total_scores), 2),
            "min": round(min(total_scores), 2),
            "spread": round(max(total_scores) - min(total_scores), 2)
        }
    }
```

### 4. Sensitivity Analysis

```python
def sensitivity_analysis(base_weights: list, criteria: list, decision_matrix: np.ndarray,
                        alternatives: list, criteria_types: list, method: str = 'topsis'):
    """
    Analyze sensitivity of ranking to weight changes
    """
    n_criteria = len(criteria)
    sensitivity_results = []

    for i in range(n_criteria):
        # Vary weight from 0 to 0.5
        weight_variations = np.linspace(0, 0.5, 11)

        criterion_sensitivity = []
        for new_weight in weight_variations:
            # Redistribute remaining weight proportionally
            remaining = 1 - new_weight
            modified_weights = np.array(base_weights) * (remaining / (1 - base_weights[i]))
            modified_weights[i] = new_weight

            if method == 'topsis':
                result = topsis_analysis(alternatives, criteria, decision_matrix,
                                        modified_weights, criteria_types)
            else:
                result = weighted_scoring(alternatives, criteria, decision_matrix,
                                         modified_weights)

            criterion_sensitivity.append({
                'weight': new_weight,
                'best_alternative': result['best_alternative'],
                'ranking': [r['alternative'] for r in result['ranking']]
            })

        # Find switching points
        switching_points = []
        for j in range(1, len(criterion_sensitivity)):
            if criterion_sensitivity[j]['best_alternative'] != criterion_sensitivity[j-1]['best_alternative']:
                switching_points.append({
                    'weight': criterion_sensitivity[j]['weight'],
                    'from': criterion_sensitivity[j-1]['best_alternative'],
                    'to': criterion_sensitivity[j]['best_alternative']
                })

        sensitivity_results.append({
            'criterion': criteria[i],
            'base_weight': base_weights[i],
            'variations': criterion_sensitivity,
            'switching_points': switching_points,
            'is_sensitive': len(switching_points) > 0
        })

    return {
        "sensitivity": sensitivity_results,
        "most_sensitive_criterion": max(sensitivity_results,
                                        key=lambda x: len(x['switching_points']))['criterion'],
        "robust_range": identify_robust_range(sensitivity_results)
    }

def identify_robust_range(sensitivity_results):
    """Identify weight ranges where ranking is stable"""
    # Simplified - find narrowest switching gap
    for result in sensitivity_results:
        if result['switching_points']:
            return {"criterion": result['criterion'],
                   "stable_up_to": result['switching_points'][0]['weight']}
    return {"status": "Ranking is robust across all weight variations"}
```

### 5. Criteria Weighting Methods

```python
def rank_order_centroid(n_criteria: int, ranking: list = None):
    """
    Rank Order Centroid (ROC) method for weight generation

    ranking: list of ranks (1 = most important)
    """
    if ranking is None:
        ranking = list(range(1, n_criteria + 1))

    weights = []
    for rank in ranking:
        weight = sum(1/j for j in range(rank, n_criteria + 1)) / n_criteria
        weights.append(weight)

    return {
        "method": "ROC",
        "weights": weights,
        "normalized_weights": [w / sum(weights) for w in weights]
    }

def swing_weights(criteria: list, swings: dict):
    """
    Swing weighting method

    swings: {criterion: swing_value} where highest value = most important
    """
    max_swing = max(swings.values())
    weights = {c: swings[c] / max_swing for c in criteria}
    total = sum(weights.values())
    normalized = {c: w / total for c, w in weights.items()}

    return {
        "method": "Swing Weights",
        "raw_weights": weights,
        "normalized_weights": normalized
    }
```

### 6. Decision Matrix Visualization

```python
def create_decision_summary(alternatives: list, criteria: list,
                           decision_matrix: np.ndarray, weights: list,
                           ranking_result: dict):
    """
    Create comprehensive decision summary
    """
    summary = {
        "decision_matrix": pd.DataFrame(
            decision_matrix,
            index=alternatives,
            columns=criteria
        ).to_dict(),
        "criteria_weights": dict(zip(criteria, weights)),
        "ranking": ranking_result['ranking'],
        "recommendation": {
            "best_choice": ranking_result['best_alternative'],
            "confidence": assess_confidence(ranking_result)
        },
        "visualization_data": {
            "spider_chart": prepare_spider_chart_data(alternatives, criteria, decision_matrix),
            "bar_chart": prepare_bar_chart_data(ranking_result)
        }
    }

    return summary

def assess_confidence(result):
    """Assess confidence in the recommendation"""
    scores = [r['total_score'] if 'total_score' in r else r['closeness_coefficient']
              for r in result['ranking']]
    if len(scores) >= 2:
        gap = scores[0] - scores[1]
        if gap > 0.2:
            return "High - clear winner"
        elif gap > 0.1:
            return "Medium - some differentiation"
        else:
            return "Low - alternatives are close"
    return "N/A"

def prepare_spider_chart_data(alternatives, criteria, matrix):
    """Prepare data for spider/radar chart"""
    # Normalize to 0-1 scale for visualization
    normalized = (matrix - matrix.min(axis=0)) / (matrix.max(axis=0) - matrix.min(axis=0) + 0.0001)
    return {alt: dict(zip(criteria, normalized[i])) for i, alt in enumerate(alternatives)}

def prepare_bar_chart_data(result):
    """Prepare data for ranking bar chart"""
    return [{"alternative": r['alternative'],
             "score": r.get('total_score', r.get('closeness_coefficient'))}
            for r in result['ranking']]
```

## Process Integration

This skill integrates with the following processes:
- `multi-criteria-decision-analysis.js`
- `supplier-selection-evaluation.js`
- `project-prioritization.js`

## Output Format

```json
{
  "method": "TOPSIS",
  "ranking": [
    {"alternative": "Option A", "score": 0.72, "rank": 1},
    {"alternative": "Option C", "score": 0.65, "rank": 2},
    {"alternative": "Option B", "score": 0.48, "rank": 3}
  ],
  "weights": {"cost": 0.3, "quality": 0.4, "delivery": 0.3},
  "sensitivity": {
    "most_sensitive": "quality",
    "robust": true
  },
  "recommendation": {
    "best_choice": "Option A",
    "confidence": "High"
  }
}
```

## Best Practices

1. **Define criteria clearly** - Measurable, independent criteria
2. **Involve stakeholders** - Consensus on weights
3. **Test sensitivity** - Understand robustness
4. **Document rationale** - Record judgment basis
5. **Consider multiple methods** - Compare results
6. **Iterate if needed** - Refine based on insights

## Constraints

- AHP limited to ~9 criteria effectively
- Requires consistent judgments
- Weight elicitation can be subjective
- Results depend on criteria selection
