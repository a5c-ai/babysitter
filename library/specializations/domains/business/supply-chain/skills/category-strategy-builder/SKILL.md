---
name: category-strategy-builder
description: Category management strategy development using Kraljic Matrix and portfolio optimization
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: supply-chain
  domain: business
  category: procurement
  priority: standard
---

# Category Strategy Builder

## Overview

The Category Strategy Builder enables structured category management strategy development using proven frameworks like the Kraljic Matrix. It supports category segmentation, strategy formulation, and supplier portfolio optimization to maximize procurement value.

## Capabilities

- **Kraljic Matrix Categorization**: Classify categories by risk and profit impact
- **Supply Market Complexity Assessment**: Evaluate supplier market dynamics
- **Business Impact Evaluation**: Quantify category importance to operations
- **Category Strategy Recommendations**: Framework-driven strategy selection
- **Supplier Rationalization Analysis**: Optimize supplier count by category
- **Demand Aggregation Opportunities**: Identify consolidation potential
- **Risk Mitigation Strategies**: Category-specific risk management
- **Category Roadmap Generation**: Multi-year category plans

## Input Schema

```yaml
category_strategy_request:
  category: string
  spend_data:
    annual_spend: float
    supplier_count: integer
    transaction_volume: integer
  market_data:
    supplier_concentration: float
    switching_costs: string
    innovation_rate: string
  business_impact:
    criticality: string
    differentiation: string
    profit_impact: float
  current_state:
    contracts: array
    performance: object
    issues: array
```

## Output Schema

```yaml
category_strategy_output:
  kraljic_classification:
    quadrant: string              # Strategic, Leverage, Bottleneck, Non-critical
    risk_score: float
    impact_score: float
  recommended_strategy:
    approach: string
    tactics: array
    supplier_strategy: string
    risk_mitigation: array
  supplier_portfolio:
    rationalization: object
    segmentation: array
    target_state: object
  roadmap:
    initiatives: array
    timeline: object
    expected_outcomes: object
  savings_opportunity: float
```

## Usage

### Kraljic Matrix Classification

```
Input: Category spend, market data, business criticality
Process: Score on supply risk and profit impact axes
Output: Quadrant classification with strategy implications
```

### Category Strategy Development

```
Input: Strategic category classification, current supplier base
Process: Apply appropriate strategy framework
Output: Comprehensive category strategy with tactics
```

### Supplier Portfolio Optimization

```
Input: Current 15 suppliers in category
Process: Analyze performance, consolidation opportunities
Output: Target portfolio of 5 preferred suppliers
```

## Integration Points

- **Spend Analytics**: Category spend data
- **Market Intelligence**: Supply market research
- **Supplier Management**: Performance and relationship data
- **Tools/Libraries**: Category management templates, portfolio optimization

## Process Dependencies

- Category Management
- Strategic Sourcing Initiative
- Supplier Evaluation and Selection

## Best Practices

1. Refresh category classifications annually
2. Involve stakeholders in strategy development
3. Balance cost focus with risk management
4. Document strategy rationale and assumptions
5. Track strategy execution progress
6. Adapt strategies to market changes
