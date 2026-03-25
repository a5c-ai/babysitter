---
name: tco-calculator
description: Total Cost of Ownership calculation skill for comprehensive supplier and sourcing decision analysis
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

# TCO Calculator

## Overview

The TCO Calculator provides comprehensive Total Cost of Ownership analysis for supplier evaluation and sourcing decisions. It captures acquisition costs, operating costs, risk costs, and lifecycle implications to enable informed supplier selection and comparison.

## Capabilities

- **Acquisition Cost Modeling**: Price, shipping, duties, taxes calculation
- **Operating Cost Estimation**: Maintenance, quality, support cost analysis
- **Risk Cost Quantification**: Disruption, inventory, obsolescence cost modeling
- **Quality Cost Analysis**: Defects, returns, rework cost calculation
- **Lifecycle Cost Projection**: Multi-year total cost forecasting
- **Supplier Comparison Matrices**: Side-by-side TCO comparison
- **Sensitivity Analysis**: Key cost driver impact analysis
- **TCO Reporting and Visualization**: Executive-ready TCO reports

## Input Schema

```yaml
tco_request:
  suppliers: array
    - supplier_id: string
      unit_price: float
      lead_time: integer
      payment_terms: string
  item_specifications:
    annual_volume: integer
    unit_of_measure: string
    lifecycle_years: integer
  cost_factors:
    shipping: object
    duties_tariffs: object
    inventory_carrying: float
    quality_metrics: object
    support_requirements: object
  risk_factors:
    disruption_probability: float
    geographic_risk: object
```

## Output Schema

```yaml
tco_output:
  supplier_comparison: array
    - supplier_id: string
      acquisition_costs: object
      operating_costs: object
      risk_costs: object
      quality_costs: object
      total_tco: float
      tco_per_unit: float
  cost_breakdown: object
  sensitivity_analysis: object
  recommendation: object
  visualization_data: object
```

## Usage

### Supplier TCO Comparison

```
Input: 3 supplier quotes with varying prices and lead times
Process: Calculate full TCO including logistics, inventory, quality costs
Output: TCO comparison revealing lowest total cost supplier
```

### Make vs. Buy Analysis

```
Input: Internal manufacturing costs vs. outsource quotes
Process: Model full costs including overhead, capital, flexibility
Output: TCO-based make vs. buy recommendation
```

### Geographic Sourcing Decision

```
Input: Domestic vs. offshore supplier options
Process: Include tariffs, logistics, quality, risk in TCO
Output: Total cost comparison with risk-adjusted view
```

## Integration Points

- **Financial Systems**: Cost rates, overhead factors
- **Quality Systems**: Defect rates, warranty costs
- **Logistics Systems**: Freight rates, lead time data
- **Tools/Libraries**: Financial modeling libraries, cost templates

## Process Dependencies

- Supplier Evaluation and Selection
- Strategic Sourcing Initiative
- Category Management

## Best Practices

1. Use consistent cost factor assumptions across comparisons
2. Include all relevant cost categories for fair comparison
3. Apply appropriate discount rates for lifecycle analysis
4. Document assumptions and data sources
5. Update cost factors periodically
6. Consider qualitative factors alongside TCO
