---
name: safety-stock-calculator
description: Statistical safety stock calculation skill with service level targeting and variability analysis
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: supply-chain
  domain: business
  category: inventory
  priority: medium
---

# Safety Stock Calculator

## Overview

The Safety Stock Calculator provides statistical methods for determining optimal safety stock levels. It analyzes demand and lead time variability, converts service level requirements, and calculates appropriate buffer stocks to meet customer service targets while optimizing working capital.

## Capabilities

- **Demand Variability Analysis**: Coefficient of variation, standard deviation
- **Lead Time Variability Assessment**: Supplier reliability analysis
- **Service Level Conversion**: Fill rate, cycle service level conversion
- **Safety Stock Formula Application**: Standard and periodic review methods
- **Simulation-Based Safety Stock**: Monte Carlo methods for complex scenarios
- **Dynamic Safety Stock Adjustment**: Responsive to changing conditions
- **Safety Stock Reporting**: By segment, category, location
- **Working Capital Impact Analysis**: Investment implications

## Input Schema

```yaml
safety_stock_request:
  items: array
    - sku_id: string
      demand_history: array
      lead_time: object
        average: float
        standard_deviation: float
      review_period: integer
      unit_cost: float
  service_level_targets:
    target_type: string           # fill_rate, cycle_service_level
    target_value: float           # e.g., 0.95 for 95%
  calculation_method: string      # standard, periodic_review, simulation
  simulation_iterations: integer  # For Monte Carlo method
```

## Output Schema

```yaml
safety_stock_output:
  calculations: array
    - sku_id: string
      demand_stats:
        mean: float
        std_dev: float
        cov: float
      lead_time_stats:
        mean: float
        std_dev: float
      safety_stock_units: integer
      safety_stock_days: float
      service_level_achieved: float
      investment_value: float
  summary:
    total_safety_stock_investment: float
    average_days_coverage: float
    service_level_distribution: object
  recommendations: array
```

## Usage

### Standard Safety Stock Calculation

```
Input: Demand history, lead time, 95% service level target
Process: Calculate demand and LT variability, apply formula
Output: Safety stock in units and days of supply
```

### Monte Carlo Simulation

```
Input: Complex demand patterns, variable lead times
Process: Simulate 10,000 demand-supply scenarios
Output: Simulation-based safety stock with confidence interval
```

### Segmented Safety Stock Policy

```
Input: ABC/XYZ segmented portfolio
Process: Apply differentiated service levels by segment
Output: Tiered safety stock policy with investment optimization
```

## Integration Points

- **ERP Systems**: Demand history, lead time data
- **Planning Systems**: Forecast data, variability metrics
- **Statistical Libraries**: scipy, numpy, Monte Carlo tools
- **Tools/Libraries**: Statistical libraries, simulation frameworks

## Process Dependencies

- Safety Stock Calculation and Optimization
- Inventory Optimization and Segmentation
- Supply Chain Disruption Response

## Best Practices

1. Use adequate history for variability calculation (12+ months)
2. Account for seasonality in demand variability
3. Validate lead time data accuracy with suppliers
4. Review service level targets with commercial teams
5. Monitor actual vs. target service levels
6. Adjust for known future events (promotions, supply constraints)
