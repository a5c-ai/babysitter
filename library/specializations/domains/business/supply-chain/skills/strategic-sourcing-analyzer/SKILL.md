---
name: strategic-sourcing-analyzer
description: End-to-end strategic sourcing analysis skill with spend analysis, market assessment, and strategy development
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
  priority: medium
---

# Strategic Sourcing Analyzer

## Overview

The Strategic Sourcing Analyzer provides comprehensive analytical capabilities for strategic sourcing initiatives. It supports spend analysis, market assessment, strategy development, and savings opportunity identification to drive procurement value creation.

## Capabilities

- **Spend Cube Analysis**: Multi-dimensional spend analysis by supplier, category, business unit
- **Pareto and ABC Classification**: Prioritize categories and suppliers by spend
- **Market Structure Analysis**: Assess supply market dynamics and competition
- **Porter's Five Forces**: Category-level competitive analysis
- **Sourcing Strategy Recommendations**: Data-driven strategy development
- **Wave Planning and Prioritization**: Sequence sourcing initiatives
- **Savings Opportunity Identification**: Quantify addressable spend and potential savings
- **Make vs. Buy Analysis**: Support insource/outsource decisions

## Input Schema

```yaml
sourcing_analysis_request:
  spend_data: object
    - supplier: string
      category: string
      business_unit: string
      amount: float
      period: string
  market_data: object
    - category: string
      supplier_count: integer
      market_size: float
      growth_rate: float
  current_contracts: array
  strategic_priorities: object
  analysis_scope: array[string]
```

## Output Schema

```yaml
sourcing_analysis_output:
  spend_analysis:
    spend_cube: object
    pareto_analysis: object
    abc_classification: object
  market_assessment:
    five_forces: object
    market_structure: object
    supplier_landscape: object
  strategy_recommendations: array
    - category: string
      strategy: string
      rationale: string
      savings_potential: float
  wave_plan: array
  make_buy_recommendations: array
```

## Usage

### Category Spend Analysis

```
Input: 2 years of AP spend data, supplier master
Process: Cleanse, classify, aggregate into spend cube
Output: Category spend profile with supplier concentration
```

### Market Assessment

```
Input: Category definition, supplier list, market research
Process: Apply Five Forces framework, assess market dynamics
Output: Market attractiveness and sourcing implications
```

### Sourcing Strategy Development

```
Input: Spend analysis, market assessment, business requirements
Process: Apply Kraljic Matrix, develop category strategies
Output: Recommended sourcing approach by category
```

## Integration Points

- **Spend Analytics Platforms**: Coupa, SAP Ariba, Jaggaer
- **Market Research**: Industry databases, market intelligence services
- **ERP Systems**: AP data, supplier master data
- **Tools/Libraries**: Data analysis frameworks, visualization tools

## Process Dependencies

- Strategic Sourcing Initiative
- Category Management
- Spend Analysis and Savings Identification

## Best Practices

1. Ensure spend data quality before analysis
2. Use consistent category taxonomy
3. Validate market assumptions with subject matter experts
4. Document strategy rationale for stakeholder alignment
5. Track realized savings against projections
6. Update analysis annually at minimum
