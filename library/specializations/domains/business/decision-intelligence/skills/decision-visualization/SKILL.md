---
name: decision-visualization
description: Decision-specific visualization skill for creating clear, actionable visual representations of analyses
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: decision-intelligence
  domain: business
  category: visualization
  priority: high
  tools-libraries:
    - plotly
    - bokeh
    - matplotlib
    - d3.js
---

# Decision Visualization

## Overview

The Decision Visualization skill provides specialized visualization capabilities for decision support, creating clear, actionable visual representations that communicate analysis results effectively to decision-makers and stakeholders.

## Capabilities

- Decision tree diagrams
- Strategy tables and consequence matrices
- Trade-off scatter plots
- Value-of-information graphs
- Confidence/uncertainty bands
- Waterfall charts for sensitivity
- Heat maps for MCDA
- Interactive dashboards

## Used By Processes

- Executive Dashboard Development
- Structured Decision Making Process
- Multi-Criteria Decision Analysis (MCDA)
- Decision Documentation and Learning

## Usage

### Decision Tree Visualization

```python
# Decision tree diagram configuration
decision_tree_viz = {
    "type": "decision_tree",
    "data": decision_tree_structure,
    "options": {
        "node_shapes": {
            "decision": "square",
            "chance": "circle",
            "terminal": "triangle"
        },
        "show_probabilities": True,
        "show_payoffs": True,
        "highlight_optimal_path": True,
        "color_scheme": "sequential",
        "orientation": "horizontal"
    }
}
```

### Strategy Table

```python
# Strategy comparison table
strategy_table = {
    "type": "strategy_table",
    "alternatives": ["Strategy A", "Strategy B", "Strategy C"],
    "criteria": ["Cost", "Time", "Quality", "Risk"],
    "data": performance_matrix,
    "options": {
        "color_coding": "performance_based",
        "show_weights": True,
        "show_scores": True,
        "highlight_winner": True
    }
}
```

### Trade-off Scatter Plot

```python
# Multi-objective trade-off visualization
tradeoff_plot = {
    "type": "scatter",
    "data": alternatives_data,
    "x_axis": {"variable": "cost", "label": "Total Cost ($)"},
    "y_axis": {"variable": "benefit", "label": "Expected Benefit"},
    "options": {
        "show_pareto_frontier": True,
        "label_alternatives": True,
        "size_by": "probability",
        "color_by": "risk_category",
        "show_dominated_region": True
    }
}
```

### Tornado Diagram

```python
# Sensitivity tornado diagram
tornado = {
    "type": "tornado",
    "base_value": 1000000,
    "sensitivities": {
        "Price": {"low": 800000, "high": 1300000},
        "Volume": {"low": 900000, "high": 1150000},
        "Cost": {"low": 950000, "high": 1100000},
        "Market Share": {"low": 850000, "high": 1200000}
    },
    "options": {
        "sort_by": "swing",
        "show_base_line": True,
        "color_scheme": ["red", "green"],
        "show_values": True
    }
}
```

### Uncertainty Visualization

```python
# Distribution and confidence visualization
uncertainty_viz = {
    "type": "distribution",
    "data": simulation_results,
    "options": {
        "show_histogram": True,
        "show_density": True,
        "show_percentiles": [5, 25, 50, 75, 95],
        "show_mean": True,
        "confidence_band": 0.90,
        "highlight_threshold": 0  # e.g., breakeven
    }
}
```

## Visualization Types

| Type | Use Case | Key Features |
|------|----------|--------------|
| Decision Tree | Structure visualization | Nodes, branches, payoffs |
| Strategy Table | Alternative comparison | Color-coded performance |
| Tornado Diagram | Sensitivity ranking | Horizontal bars, swing |
| Spider/Radar | Multi-criteria profile | Polygon overlay |
| Heat Map | Matrix data | Color intensity |
| Waterfall | Value decomposition | Sequential bars |
| Scatter | Trade-offs | Points, Pareto frontier |
| Box Plot | Uncertainty | Quartiles, outliers |
| Fan Chart | Forecast uncertainty | Widening confidence bands |

## Input Schema

```json
{
  "visualization_type": "string",
  "data": "object",
  "axes": {
    "x": {"variable": "string", "label": "string"},
    "y": {"variable": "string", "label": "string"}
  },
  "options": {
    "title": "string",
    "color_scheme": "string",
    "interactive": "boolean",
    "annotations": ["object"],
    "export_format": "png|svg|pdf|html"
  }
}
```

## Output Schema

```json
{
  "visualization_path": "string",
  "interactive_url": "string (if applicable)",
  "metadata": {
    "type": "string",
    "dimensions": {"width": "number", "height": "number"},
    "data_summary": "object"
  },
  "accessibility": {
    "alt_text": "string",
    "data_table": "object"
  }
}
```

## Design Principles

1. **Clarity**: Remove chart junk, maximize data-ink ratio
2. **Accuracy**: No distortion, appropriate scales
3. **Efficiency**: Quick comprehension, key insights prominent
4. **Actionability**: Clear implications for decisions
5. **Accessibility**: Color-blind friendly, alt text provided

## Best Practices

1. Match visualization type to data and message
2. Use consistent color schemes across related charts
3. Include clear titles and axis labels
4. Highlight key takeaways with annotations
5. Provide interactive features for exploration
6. Export to multiple formats for different uses
7. Include data tables for accessibility

## Integration Points

- Receives data from all analysis skills
- Feeds into Data Storytelling for narratives
- Supports Executive Dashboard Development
- Connects with Decision Journal for documentation
