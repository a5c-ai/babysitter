---
name: electre-comparator
description: ELECTRE family methods skill for outranking-based decision support with concordance and discordance analysis
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: decision-intelligence
  domain: business
  category: quantitative-analysis
  priority: lower
  tools-libraries:
    - pyDecision
    - pymcdm
    - electre-py
---

# ELECTRE Comparator

## Overview

The ELECTRE Comparator skill implements the ELECTRE (ELimination Et Choix Traduisant la REalite) family of methods for multi-criteria decision analysis. It uses outranking relations based on concordance and discordance indices to handle complex decision problems with incomparability and threshold-based preferences.

## Capabilities

- ELECTRE I, II, III, IV, TRI implementation
- Concordance matrix calculation
- Discordance matrix calculation
- Credibility degree computation
- Outranking relation determination
- Kernel and ranking extraction
- Threshold sensitivity analysis
- Classification into ordered categories (ELECTRE TRI)

## Used By Processes

- Multi-Criteria Decision Analysis (MCDA)
- Portfolio Selection
- Project Prioritization

## Usage

### ELECTRE Method Selection

| Method | Purpose | Output |
|--------|---------|--------|
| ELECTRE I | Selection | Kernel (best alternatives) |
| ELECTRE II | Ranking | Strong/weak rankings |
| ELECTRE III | Ranking | Credibility-based ranking |
| ELECTRE IV | Ranking | No weights required |
| ELECTRE TRI | Sorting | Category assignment |

### Configuration Example

```python
# Define ELECTRE III configuration
config = {
    "alternatives": ["Project A", "Project B", "Project C", "Project D"],
    "criteria": [
        {
            "name": "ROI",
            "weight": 0.35,
            "type": "benefit",
            "thresholds": {"q": 2, "p": 5, "v": 15}  # indifference, preference, veto
        },
        {
            "name": "Risk",
            "weight": 0.25,
            "type": "cost",
            "thresholds": {"q": 1, "p": 3, "v": 8}
        },
        {
            "name": "Strategic Fit",
            "weight": 0.40,
            "type": "benefit",
            "thresholds": {"q": 5, "p": 10, "v": 25}
        }
    ],
    "performance_matrix": [
        [25, 4, 80],   # Project A
        [30, 6, 70],   # Project B
        [20, 3, 85],   # Project C
        [28, 5, 75]    # Project D
    ]
}
```

### Threshold Types

- **Indifference threshold (q)**: Difference below which alternatives are indifferent
- **Preference threshold (p)**: Difference above which strict preference exists
- **Veto threshold (v)**: Difference that prohibits outranking regardless of other criteria

### Concordance and Discordance

**Concordance Index**: Measures support for "a outranks b"
- C(a,b) = Sum of weights where a is at least as good as b

**Discordance Index**: Measures opposition to "a outranks b"
- D(a,b) = Maximum scaled difference where b is better than a

### ELECTRE TRI Classification

Assigns alternatives to predefined categories:
1. Define boundary profiles between categories
2. Compare alternatives to boundaries
3. Apply pessimistic or optimistic assignment rules

## Input Schema

```json
{
  "method": "ELECTRE_I|ELECTRE_II|ELECTRE_III|ELECTRE_IV|ELECTRE_TRI",
  "alternatives": ["string"],
  "criteria": [
    {
      "name": "string",
      "weight": "number",
      "type": "benefit|cost",
      "thresholds": {
        "q": "number",
        "p": "number",
        "v": "number"
      }
    }
  ],
  "performance_matrix": "2D array of numbers",
  "options": {
    "concordance_threshold": "number (for ELECTRE I)",
    "boundary_profiles": "object (for ELECTRE TRI)",
    "assignment_rule": "pessimistic|optimistic"
  }
}
```

## Output Schema

```json
{
  "method_used": "string",
  "concordance_matrix": "2D array",
  "discordance_matrix": "2D array",
  "credibility_matrix": "2D array (ELECTRE III)",
  "outranking_relations": [
    {"from": "string", "to": "string", "credibility": "number"}
  ],
  "kernel": ["string (ELECTRE I)"],
  "ranking": {
    "descending": ["string"],
    "ascending": ["string"],
    "final": ["string"]
  },
  "classifications": "object (ELECTRE TRI)",
  "incomparabilities": ["object"]
}
```

## Best Practices

1. Select ELECTRE variant based on problem type (selection, ranking, sorting)
2. Set thresholds based on criterion measurement precision
3. Validate veto thresholds with stakeholders (they block outranking)
4. Analyze incomparabilities - they may reveal important trade-offs
5. Compare results across multiple threshold scenarios
6. Use ELECTRE TRI for portfolio categorization problems

## Integration Points

- Receives weights from AHP Calculator
- Connects with PROMETHEE Evaluator for method triangulation
- Feeds into Decision Visualization for outranking graphs
- Supports Sensitivity Analyzer for threshold robustness
