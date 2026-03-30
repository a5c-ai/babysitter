---
name: pareto-analyzer
description: Pareto analysis skill for identifying vital few causes and prioritizing improvement efforts.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: continuous-improvement
  backlog-id: SK-IE-038
---

# pareto-analyzer

You are **pareto-analyzer** - a specialized skill for Pareto analysis to identify the vital few causes and prioritize improvement efforts.

## Overview

This skill enables AI-powered Pareto analysis including:
- Basic Pareto chart creation
- Multi-level Pareto analysis
- Weighted Pareto analysis
- Before/after comparison
- Pareto by multiple dimensions
- Statistical validation
- Vital few identification
- Improvement prioritization

## Capabilities

### 1. Basic Pareto Analysis

```python
import pandas as pd
import numpy as np

def pareto_analysis(data: pd.DataFrame, category_col: str, value_col: str):
    """
    Perform basic Pareto analysis

    data: DataFrame with categories and values
    category_col: column name for categories
    value_col: column name for values (counts, costs, etc.)
    """
    # Aggregate by category
    summary = data.groupby(category_col)[value_col].sum().reset_index()
    summary.columns = ['category', 'value']

    # Sort descending
    summary = summary.sort_values('value', ascending=False).reset_index(drop=True)

    # Calculate percentages
    total = summary['value'].sum()
    summary['percentage'] = summary['value'] / total * 100
    summary['cumulative_value'] = summary['value'].cumsum()
    summary['cumulative_percentage'] = summary['cumulative_value'] / total * 100

    # Identify vital few (categories up to 80%)
    vital_few = summary[summary['cumulative_percentage'] <= 80]
    if len(vital_few) == 0:
        vital_few = summary.head(1)
    elif summary[summary['cumulative_percentage'] <= 80].iloc[-1]['cumulative_percentage'] < 80:
        # Add one more to cross 80%
        vital_few = summary.head(len(vital_few) + 1)

    trivial_many = summary[~summary['category'].isin(vital_few['category'])]

    return {
        "analysis": summary.to_dict('records'),
        "total_value": total,
        "vital_few": {
            "categories": vital_few['category'].tolist(),
            "count": len(vital_few),
            "value": vital_few['value'].sum(),
            "percentage": round(vital_few['value'].sum() / total * 100, 1)
        },
        "trivial_many": {
            "categories": trivial_many['category'].tolist(),
            "count": len(trivial_many),
            "value": trivial_many['value'].sum(),
            "percentage": round(trivial_many['value'].sum() / total * 100, 1)
        },
        "pareto_ratio": f"{len(vital_few)}/{len(summary)} categories cause {round(vital_few['value'].sum() / total * 100)}% of impact"
    }
```

### 2. Multi-Level Pareto

```python
def multi_level_pareto(data: pd.DataFrame, levels: list, value_col: str):
    """
    Multi-level Pareto analysis for drilling down

    levels: list of column names for hierarchical analysis
    Example: ['department', 'defect_type', 'root_cause']
    """
    results = {}

    # Level 1 - Top level Pareto
    level1_result = pareto_analysis(data, levels[0], value_col)
    results['level_1'] = {
        'dimension': levels[0],
        'analysis': level1_result
    }

    # Subsequent levels - Pareto within top categories
    if len(levels) > 1:
        vital_categories = level1_result['vital_few']['categories']

        for level_idx in range(1, len(levels)):
            level_results = []

            for cat in vital_categories:
                filtered = data[data[levels[level_idx - 1]] == cat]

                if len(filtered) > 0:
                    sub_pareto = pareto_analysis(filtered, levels[level_idx], value_col)
                    level_results.append({
                        'parent_category': cat,
                        'analysis': sub_pareto
                    })

            results[f'level_{level_idx + 1}'] = {
                'dimension': levels[level_idx],
                'sub_analyses': level_results
            }

            # Update vital categories for next level
            vital_categories = []
            for sub in level_results:
                vital_categories.extend(sub['analysis']['vital_few']['categories'])

    return results
```

### 3. Weighted Pareto Analysis

```python
def weighted_pareto(data: pd.DataFrame, category_col: str,
                   frequency_col: str, severity_col: str = None,
                   cost_col: str = None):
    """
    Weighted Pareto considering multiple factors

    Can weight by frequency × severity, or by actual cost
    """
    summary = data.groupby(category_col).agg({
        frequency_col: 'sum'
    }).reset_index()
    summary.columns = ['category', 'frequency']

    # Add severity weighting if provided
    if severity_col:
        severity_avg = data.groupby(category_col)[severity_col].mean().reset_index()
        severity_avg.columns = ['category', 'avg_severity']
        summary = summary.merge(severity_avg, on='category')
        summary['weighted_score'] = summary['frequency'] * summary['avg_severity']
    elif cost_col:
        cost_total = data.groupby(category_col)[cost_col].sum().reset_index()
        cost_total.columns = ['category', 'total_cost']
        summary = summary.merge(cost_total, on='category')
        summary['weighted_score'] = summary['total_cost']
    else:
        summary['weighted_score'] = summary['frequency']

    # Sort by weighted score
    summary = summary.sort_values('weighted_score', ascending=False).reset_index(drop=True)

    # Calculate cumulative
    total = summary['weighted_score'].sum()
    summary['percentage'] = summary['weighted_score'] / total * 100
    summary['cumulative_pct'] = summary['percentage'].cumsum()

    # Compare rankings
    freq_rank = summary.sort_values('frequency', ascending=False)['category'].tolist()
    weighted_rank = summary['category'].tolist()

    rank_comparison = []
    for i, cat in enumerate(weighted_rank):
        freq_position = freq_rank.index(cat) + 1
        rank_comparison.append({
            'category': cat,
            'weighted_rank': i + 1,
            'frequency_rank': freq_position,
            'rank_change': freq_position - (i + 1)
        })

    return {
        "weighted_analysis": summary.to_dict('records'),
        "rank_comparison": rank_comparison,
        "weighting_method": "severity" if severity_col else "cost" if cost_col else "frequency",
        "insight": identify_rank_changes(rank_comparison)
    }

def identify_rank_changes(comparisons):
    """Identify categories with significant rank changes"""
    movers = [c for c in comparisons if abs(c['rank_change']) >= 2]
    if movers:
        return f"{len(movers)} categories have significant rank changes when weighted"
    return "Rankings are consistent between frequency and weighted analysis"
```

### 4. Before/After Pareto Comparison

```python
def compare_pareto_periods(before_data: pd.DataFrame, after_data: pd.DataFrame,
                          category_col: str, value_col: str):
    """
    Compare Pareto analysis between two periods
    """
    before = pareto_analysis(before_data, category_col, value_col)
    after = pareto_analysis(after_data, category_col, value_col)

    # Build comparison
    before_df = pd.DataFrame(before['analysis'])
    after_df = pd.DataFrame(after['analysis'])

    comparison = before_df.merge(
        after_df,
        on='category',
        how='outer',
        suffixes=('_before', '_after')
    )

    comparison = comparison.fillna(0)
    comparison['change'] = comparison['value_after'] - comparison['value_before']
    comparison['change_pct'] = np.where(
        comparison['value_before'] > 0,
        (comparison['change'] / comparison['value_before']) * 100,
        100 if comparison['value_after'] > 0 else 0
    )

    # Summary metrics
    total_before = before['total_value']
    total_after = after['total_value']

    # Identify improvements and deteriorations
    improved = comparison[comparison['change'] < 0].sort_values('change')
    deteriorated = comparison[comparison['change'] > 0].sort_values('change', ascending=False)

    return {
        "before_period": before,
        "after_period": after,
        "comparison": comparison.to_dict('records'),
        "summary": {
            "total_before": total_before,
            "total_after": total_after,
            "total_change": total_after - total_before,
            "total_change_pct": round((total_after - total_before) / total_before * 100, 1)
        },
        "improvements": improved[['category', 'change', 'change_pct']].head(5).to_dict('records'),
        "deteriorations": deteriorated[['category', 'change', 'change_pct']].head(5).to_dict('records'),
        "vital_few_change": compare_vital_few(before, after)
    }

def compare_vital_few(before, after):
    """Compare vital few categories between periods"""
    before_vital = set(before['vital_few']['categories'])
    after_vital = set(after['vital_few']['categories'])

    return {
        "added": list(after_vital - before_vital),
        "removed": list(before_vital - after_vital),
        "unchanged": list(before_vital & after_vital)
    }
```

### 5. Pareto Chart Data Generation

```python
def generate_pareto_chart_data(pareto_result: dict, chart_options: dict = None):
    """
    Generate data formatted for Pareto chart visualization
    """
    options = chart_options or {}

    data = pareto_result['analysis']

    chart_data = {
        "chart_type": "pareto",
        "title": options.get('title', 'Pareto Analysis'),
        "x_axis": {
            "label": options.get('x_label', 'Category'),
            "values": [d['category'] for d in data]
        },
        "bars": {
            "label": options.get('bar_label', 'Value'),
            "values": [d['value'] for d in data],
            "color": options.get('bar_color', '#4472C4')
        },
        "line": {
            "label": "Cumulative %",
            "values": [d['cumulative_percentage'] for d in data],
            "color": options.get('line_color', '#ED7D31')
        },
        "reference_lines": [
            {"y": 80, "label": "80% Line", "style": "dashed"}
        ],
        "annotations": {
            "vital_few_boundary": len(pareto_result['vital_few']['categories']),
            "vital_few_label": f"Vital Few ({pareto_result['vital_few']['count']} categories = {pareto_result['vital_few']['percentage']}%)"
        }
    }

    return chart_data
```

### 6. Statistical Validation

```python
from scipy import stats

def validate_pareto_pattern(data: pd.DataFrame, category_col: str, value_col: str):
    """
    Statistically validate if data follows Pareto distribution
    """
    # Aggregate
    summary = data.groupby(category_col)[value_col].sum().reset_index()
    summary.columns = ['category', 'value']
    summary = summary.sort_values('value', ascending=False)

    total = summary['value'].sum()
    n = len(summary)

    # Calculate Gini coefficient
    values = summary['value'].values
    cumulative = np.cumsum(values) / total
    gini = 1 - 2 * np.trapz(cumulative, dx=1/n)

    # Check 80/20 rule
    cumsum = 0
    count_for_80 = 0
    for val in values:
        cumsum += val
        count_for_80 += 1
        if cumsum >= total * 0.8:
            break

    percent_categories_for_80 = count_for_80 / n * 100

    # Fit power law
    ranks = np.arange(1, n + 1)
    log_ranks = np.log(ranks)
    log_values = np.log(values + 1)  # Add 1 to handle zeros

    slope, intercept, r_value, p_value, std_err = stats.linregress(log_ranks, log_values)

    return {
        "gini_coefficient": round(gini, 3),
        "gini_interpretation": interpret_gini(gini),
        "pareto_check": {
            "percent_categories_for_80": round(percent_categories_for_80, 1),
            "follows_80_20": percent_categories_for_80 <= 30  # Approximately 20%
        },
        "power_law_fit": {
            "exponent": round(-slope, 3),
            "r_squared": round(r_value**2, 3),
            "is_power_law": r_value**2 > 0.8 and p_value < 0.05
        },
        "recommendation": generate_recommendation(gini, percent_categories_for_80)
    }

def interpret_gini(gini):
    if gini > 0.6:
        return "High concentration - strong Pareto pattern"
    elif gini > 0.4:
        return "Moderate concentration - Pareto analysis useful"
    else:
        return "Low concentration - consider other analysis methods"

def generate_recommendation(gini, pct_for_80):
    if gini > 0.5 and pct_for_80 <= 30:
        return "Strong Pareto pattern - focus efforts on vital few categories"
    elif gini > 0.4:
        return "Moderate Pareto pattern - prioritize top categories but monitor all"
    else:
        return "Weak Pareto pattern - consider stratification or other analysis"
```

## Process Integration

This skill integrates with the following processes:
- `root-cause-analysis.js`
- `quality-improvement-project.js`
- `cost-reduction-analysis.js`

## Output Format

```json
{
  "pareto_analysis": {
    "total_value": 1250,
    "vital_few": {
      "categories": ["Defect A", "Defect B", "Defect C"],
      "count": 3,
      "percentage": 78.5
    },
    "trivial_many": {
      "count": 12,
      "percentage": 21.5
    }
  },
  "statistical_validation": {
    "gini_coefficient": 0.62,
    "follows_80_20": true
  },
  "chart_data": {...},
  "recommendations": [
    "Focus on Defect A - accounts for 45% of total",
    "Address Defect B and C together - combined 33%"
  ]
}
```

## Best Practices

1. **Use meaningful categories** - Not too granular or broad
2. **Include all data** - Don't exclude low-frequency items
3. **Validate statistically** - Ensure pattern exists
4. **Drill down** - Second-level Pareto on vital few
5. **Track over time** - Monitor shifts in priorities
6. **Weight appropriately** - Consider severity and cost

## Constraints

- Requires categorical data
- Small sample sizes may be misleading
- Categories must be mutually exclusive
- Pattern may not always exist
