---
name: calibration-trainer
description: Probability calibration training skill for improving forecast accuracy and reducing overconfidence
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: decision-intelligence
  domain: business
  category: collaboration
  priority: medium
  tools-libraries:
    - numpy
    - matplotlib
    - custom quiz engines
---

# Calibration Trainer

## Overview

The Calibration Trainer skill provides capabilities for assessing and improving forecaster calibration. It helps decision-makers align their confidence levels with actual accuracy, reducing overconfidence and improving the quality of probabilistic judgments.

## Capabilities

- Calibration quiz generation
- Confidence interval elicitation
- Brier score calculation
- Calibration curve plotting
- Overconfidence/underconfidence diagnosis
- Training exercise management
- Progress tracking over time
- Benchmark comparison

## Used By Processes

- Cognitive Bias Debiasing Process
- Decision Quality Assessment
- Predictive Analytics Implementation

## Usage

### Calibration Quiz

```python
# Generate calibration quiz
quiz_config = {
    "type": "general_knowledge",
    "format": "confidence_interval",
    "questions": 20,
    "confidence_levels": [50, 80, 90],  # percentiles to elicit
    "difficulty": "medium",
    "domains": ["business", "economics", "technology", "geography"]
}

# Example question
quiz_question = {
    "id": "Q001",
    "question": "In what year was Amazon founded?",
    "actual_answer": 1994,
    "format": "numeric_interval",
    "required_responses": [
        {"confidence": 50, "prompt": "Give your best estimate"},
        {"confidence": 80, "prompt": "Give a range you're 80% confident contains the answer"},
        {"confidence": 90, "prompt": "Give a range you're 90% confident contains the answer"}
    ]
}
```

### Response Collection

```python
# Collect responses
responses = {
    "participant": "John Smith",
    "date": "2024-01-15",
    "questions": [
        {
            "question_id": "Q001",
            "responses": {
                "point_estimate": 1997,
                "interval_80": [1995, 2000],
                "interval_90": [1992, 2002]
            }
        }
        # ... more questions
    ]
}
```

### Calibration Analysis

```python
# Analyze calibration
calibration_analysis = {
    "participant": "John Smith",
    "n_questions": 20,
    "by_confidence_level": {
        "80%_intervals": {
            "expected_hit_rate": 0.80,
            "actual_hit_rate": 0.55,
            "calibration_gap": -0.25,
            "interpretation": "overconfident"
        },
        "90%_intervals": {
            "expected_hit_rate": 0.90,
            "actual_hit_rate": 0.70,
            "calibration_gap": -0.20,
            "interpretation": "overconfident"
        }
    },
    "brier_score": 0.18,  # lower is better, 0 = perfect
    "overconfidence_index": 0.23,
    "recommendations": [
        "Widen confidence intervals by ~25%",
        "Practice with domain-specific questions",
        "Use reference class thinking"
    ]
}
```

### Training Exercises

```python
# Calibration training program
training_program = {
    "participant": "John Smith",
    "baseline_calibration": 0.55,  # hit rate for 80% intervals
    "target_calibration": 0.75,
    "exercises": [
        {
            "week": 1,
            "focus": "interval_widening",
            "exercise": "Practice giving intervals 50% wider than instinct",
            "quiz_count": 10
        },
        {
            "week": 2,
            "focus": "reference_class",
            "exercise": "For each estimate, identify a reference class first",
            "quiz_count": 10
        },
        {
            "week": 3,
            "focus": "decomposition",
            "exercise": "Break complex estimates into components",
            "quiz_count": 10
        },
        {
            "week": 4,
            "focus": "consolidation",
            "exercise": "Apply all techniques, track improvement",
            "quiz_count": 20
        }
    ]
}
```

### Progress Tracking

```python
# Track progress over time
progress_data = {
    "participant": "John Smith",
    "history": [
        {"date": "2024-01-01", "hit_rate_80": 0.55, "brier_score": 0.22},
        {"date": "2024-01-15", "hit_rate_80": 0.62, "brier_score": 0.19},
        {"date": "2024-02-01", "hit_rate_80": 0.68, "brier_score": 0.16},
        {"date": "2024-02-15", "hit_rate_80": 0.74, "brier_score": 0.13}
    ],
    "trend": "improving",
    "improvement_rate": "4% per session"
}
```

## Input Schema

```json
{
  "operation": "quiz|analyze|train|track",
  "quiz_config": {
    "type": "string",
    "format": "string",
    "questions": "number",
    "confidence_levels": ["number"]
  },
  "responses": {
    "participant": "string",
    "questions": ["object"]
  },
  "training_config": {
    "target_calibration": "number",
    "duration_weeks": "number"
  }
}
```

## Output Schema

```json
{
  "quiz": {
    "questions": ["object"],
    "total_count": "number"
  },
  "calibration_analysis": {
    "by_confidence_level": "object",
    "brier_score": "number",
    "overconfidence_index": "number",
    "calibration_curve": "object"
  },
  "recommendations": ["string"],
  "progress": {
    "history": ["object"],
    "trend": "string",
    "target_achieved": "boolean"
  }
}
```

## Calibration Metrics

| Metric | Formula | Interpretation |
|--------|---------|----------------|
| Hit Rate | % of intervals containing true value | Should match confidence level |
| Brier Score | Mean squared error of probabilities | Lower is better (0-1) |
| Calibration Gap | Expected - Actual hit rate | Positive = overconfident |
| Overconfidence Index | Average calibration gap | Quantifies overall bias |

## Calibration Curve

A well-calibrated forecaster has:
- 50% intervals capturing truth 50% of the time
- 80% intervals capturing truth 80% of the time
- 90% intervals capturing truth 90% of the time

The calibration curve plots stated confidence vs. observed accuracy.

## Best Practices

1. Use feedback immediately after each quiz
2. Track calibration separately by domain
3. Focus on the most common confidence levels (80%, 90%)
4. Practice regularly (weekly is better than monthly)
5. Use domain-relevant questions for business applications
6. Compare to well-calibrated benchmarks (superforecasters)
7. Celebrate improvement, not just accuracy

## Techniques to Improve Calibration

| Technique | Description |
|-----------|-------------|
| Widen intervals | Start wider, narrow only with strong evidence |
| Reference classes | Use base rates from similar situations |
| Decomposition | Break estimates into components |
| Devil's advocate | Actively seek reasons to be less confident |
| Pre-mortem | Imagine being wrong, identify why |

## Integration Points

- Feeds into Decision Quality Assessment
- Connects with Risk Distribution Fitter for expert elicitation
- Supports Debiasing Coach agent
- Integrates with Reference Class Forecaster for base rate thinking
