---
name: inventory-optimizer
description: Inventory optimization skill for safety stock, reorder point, and order quantity calculations.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: supply-chain
  backlog-id: SK-IE-025
---

# inventory-optimizer

You are **inventory-optimizer** - a specialized skill for optimizing inventory policies including safety stock, reorder points, and order quantities.

## Overview

This skill enables AI-powered inventory optimization including:
- ABC/XYZ classification
- Economic Order Quantity (EOQ) calculation
- Safety stock calculation by service level
- Reorder point determination
- Periodic review (R,S) policy optimization
- Continuous review (r,Q) policy optimization
- Multi-echelon inventory optimization
- Inventory investment analysis

## Capabilities

### 1. ABC/XYZ Classification

```python
import numpy as np
import pandas as pd

def abc_analysis(items: pd.DataFrame, value_column: str, quantity_column: str):
    """
    ABC classification based on annual value (Pareto analysis)

    A: Top 80% of value (typically 20% of items)
    B: Next 15% of value (typically 30% of items)
    C: Remaining 5% of value (typically 50% of items)
    """
    # Calculate annual value
    items = items.copy()
    items['annual_value'] = items[value_column] * items[quantity_column]
    items = items.sort_values('annual_value', ascending=False)

    # Calculate cumulative percentage
    total_value = items['annual_value'].sum()
    items['cum_value'] = items['annual_value'].cumsum()
    items['cum_pct'] = items['cum_value'] / total_value * 100

    # Assign ABC class
    def assign_class(pct):
        if pct <= 80:
            return 'A'
        elif pct <= 95:
            return 'B'
        else:
            return 'C'

    items['ABC_class'] = items['cum_pct'].apply(assign_class)

    return items

def xyz_analysis(items: pd.DataFrame, demand_history_columns: list):
    """
    XYZ classification based on demand variability

    X: CV < 0.5 (stable demand)
    Y: 0.5 <= CV < 1.0 (moderate variability)
    Z: CV >= 1.0 (high variability)
    """
    items = items.copy()

    # Calculate coefficient of variation
    demand_data = items[demand_history_columns]
    items['mean_demand'] = demand_data.mean(axis=1)
    items['std_demand'] = demand_data.std(axis=1)
    items['CV'] = items['std_demand'] / items['mean_demand']

    # Assign XYZ class
    def assign_xyz(cv):
        if cv < 0.5:
            return 'X'
        elif cv < 1.0:
            return 'Y'
        else:
            return 'Z'

    items['XYZ_class'] = items['CV'].apply(assign_xyz)

    return items

def abc_xyz_matrix(items: pd.DataFrame):
    """
    Create combined ABC-XYZ matrix
    """
    matrix = items.groupby(['ABC_class', 'XYZ_class']).size().unstack(fill_value=0)

    recommendations = {
        'AX': 'High value, stable - continuous review, tight control',
        'AY': 'High value, variable - safety stock important, frequent review',
        'AZ': 'High value, unpredictable - careful forecasting, higher safety stock',
        'BX': 'Medium value, stable - periodic review',
        'BY': 'Medium value, variable - moderate control',
        'BZ': 'Medium value, unpredictable - consider min-max system',
        'CX': 'Low value, stable - simple rules, minimal attention',
        'CY': 'Low value, variable - periodic review, simple rules',
        'CZ': 'Low value, unpredictable - consider elimination or consignment'
    }

    return {
        "matrix": matrix,
        "recommendations": recommendations
    }
```

### 2. Economic Order Quantity (EOQ)

```python
def economic_order_quantity(annual_demand: float, ordering_cost: float,
                           holding_cost_per_unit: float):
    """
    Classic EOQ calculation

    EOQ = sqrt(2 * D * S / H)

    D: Annual demand
    S: Ordering cost per order
    H: Holding cost per unit per year
    """
    eoq = np.sqrt((2 * annual_demand * ordering_cost) / holding_cost_per_unit)

    # Calculate associated costs
    orders_per_year = annual_demand / eoq
    annual_ordering_cost = orders_per_year * ordering_cost
    average_inventory = eoq / 2
    annual_holding_cost = average_inventory * holding_cost_per_unit
    total_cost = annual_ordering_cost + annual_holding_cost

    return {
        "EOQ": round(eoq, 0),
        "orders_per_year": round(orders_per_year, 1),
        "order_interval_days": round(365 / orders_per_year, 1),
        "annual_ordering_cost": round(annual_ordering_cost, 2),
        "annual_holding_cost": round(annual_holding_cost, 2),
        "total_relevant_cost": round(total_cost, 2),
        "average_inventory": round(average_inventory, 0)
    }

def eoq_with_quantity_discounts(annual_demand: float, ordering_cost: float,
                                holding_rate: float, price_breaks: list):
    """
    EOQ with quantity discounts

    price_breaks: [(min_qty, unit_price), ...]
    """
    results = []

    for min_qty, unit_price in sorted(price_breaks, key=lambda x: x[1], reverse=True):
        holding_cost = unit_price * holding_rate
        eoq = np.sqrt((2 * annual_demand * ordering_cost) / holding_cost)

        # Check if EOQ is feasible for this price bracket
        if eoq < min_qty:
            order_qty = min_qty
        else:
            order_qty = eoq

        # Calculate total cost
        orders_per_year = annual_demand / order_qty
        annual_ordering = orders_per_year * ordering_cost
        annual_holding = (order_qty / 2) * holding_cost
        annual_purchase = annual_demand * unit_price
        total_cost = annual_ordering + annual_holding + annual_purchase

        results.append({
            "min_quantity": min_qty,
            "unit_price": unit_price,
            "calculated_eoq": round(eoq, 0),
            "order_quantity": round(order_qty, 0),
            "total_annual_cost": round(total_cost, 2)
        })

    # Find optimal
    optimal = min(results, key=lambda x: x['total_annual_cost'])

    return {
        "all_options": results,
        "optimal": optimal
    }
```

### 3. Safety Stock Calculation

```python
from scipy import stats

def safety_stock_service_level(demand_std: float, lead_time_mean: float,
                               lead_time_std: float = 0, service_level: float = 0.95):
    """
    Calculate safety stock for desired service level

    Accounts for variability in both demand and lead time
    """
    # Z-score for service level
    z = stats.norm.ppf(service_level)

    if lead_time_std > 0:
        # Combined variability
        # SS = z * sqrt(LT * sigma_d^2 + d_avg^2 * sigma_LT^2)
        # Simplified: SS = z * sigma_d * sqrt(LT)
        combined_std = np.sqrt(lead_time_mean * demand_std**2)
        safety_stock = z * combined_std
    else:
        # Only demand variability
        safety_stock = z * demand_std * np.sqrt(lead_time_mean)

    return {
        "safety_stock": round(safety_stock, 0),
        "service_level": service_level,
        "z_score": round(z, 2),
        "demand_std": demand_std,
        "lead_time": lead_time_mean
    }

def safety_stock_fill_rate(demand_mean: float, demand_std: float,
                           order_quantity: float, target_fill_rate: float = 0.98):
    """
    Calculate safety stock for target fill rate

    Fill rate: proportion of demand satisfied from stock
    """
    # Expected shortage per cycle (using loss function)
    target_shortage = (1 - target_fill_rate) * order_quantity

    # Iterative search for safety stock
    for ss in range(0, int(demand_std * 10), 1):
        z = ss / demand_std
        loss = demand_std * (stats.norm.pdf(z) - z * (1 - stats.norm.cdf(z)))
        if loss <= target_shortage:
            return {
                "safety_stock": ss,
                "target_fill_rate": target_fill_rate,
                "achieved_fill_rate": 1 - loss / order_quantity
            }

    return {"safety_stock": int(demand_std * 10), "note": "Max safety stock reached"}
```

### 4. Reorder Point Determination

```python
def calculate_reorder_point(average_demand_per_period: float,
                           lead_time_periods: float,
                           safety_stock: float):
    """
    Calculate reorder point (r)

    r = d * L + SS

    d: Average demand per period
    L: Lead time in periods
    SS: Safety stock
    """
    lead_time_demand = average_demand_per_period * lead_time_periods
    reorder_point = lead_time_demand + safety_stock

    return {
        "reorder_point": round(reorder_point, 0),
        "lead_time_demand": round(lead_time_demand, 0),
        "safety_stock": round(safety_stock, 0),
        "interpretation": f"Order when inventory reaches {round(reorder_point, 0)} units"
    }
```

### 5. Continuous Review (r, Q) Policy

```python
def optimize_rQ_policy(annual_demand: float, demand_std_per_period: float,
                       lead_time_periods: float, ordering_cost: float,
                       holding_cost_per_unit: float, service_level: float = 0.95):
    """
    Optimize continuous review policy

    r: Reorder point
    Q: Order quantity (EOQ)
    """
    # Calculate Q using EOQ
    eoq_result = economic_order_quantity(annual_demand, ordering_cost, holding_cost_per_unit)
    Q = eoq_result['EOQ']

    # Calculate safety stock for service level
    ss_result = safety_stock_service_level(
        demand_std=demand_std_per_period,
        lead_time_mean=lead_time_periods,
        service_level=service_level
    )
    SS = ss_result['safety_stock']

    # Calculate reorder point
    periods_per_year = 12  # Assuming monthly
    avg_demand_per_period = annual_demand / periods_per_year

    r = avg_demand_per_period * lead_time_periods + SS

    return {
        "policy": "(r, Q)",
        "reorder_point": round(r, 0),
        "order_quantity": round(Q, 0),
        "safety_stock": round(SS, 0),
        "service_level": service_level,
        "average_inventory": round(Q/2 + SS, 0),
        "annual_cost": eoq_result['total_relevant_cost']
    }
```

### 6. Periodic Review (R, S) Policy

```python
def optimize_RS_policy(annual_demand: float, demand_std_per_period: float,
                       review_period_periods: float, lead_time_periods: float,
                       holding_cost_per_unit: float, service_level: float = 0.95):
    """
    Optimize periodic review policy

    R: Review period
    S: Order-up-to level
    """
    z = stats.norm.ppf(service_level)

    # Protection period = review period + lead time
    protection_period = review_period_periods + lead_time_periods

    # Average demand during protection period
    periods_per_year = 12
    avg_demand_per_period = annual_demand / periods_per_year
    avg_demand_protection = avg_demand_per_period * protection_period

    # Standard deviation during protection period
    std_protection = demand_std_per_period * np.sqrt(protection_period)

    # Safety stock
    SS = z * std_protection

    # Order-up-to level
    S = avg_demand_protection + SS

    # Average inventory (approximation)
    avg_order_qty = avg_demand_per_period * review_period_periods
    avg_inventory = avg_order_qty / 2 + SS

    return {
        "policy": "(R, S)",
        "review_period": review_period_periods,
        "order_up_to_level": round(S, 0),
        "safety_stock": round(SS, 0),
        "service_level": service_level,
        "average_inventory": round(avg_inventory, 0),
        "annual_holding_cost": round(avg_inventory * holding_cost_per_unit, 2)
    }
```

## Process Integration

This skill integrates with the following processes:
- `inventory-optimization-analysis.js`
- `demand-forecasting-model-development.js`
- `warehouse-layout-slotting-optimization.js`

## Output Format

```json
{
  "item": "SKU-12345",
  "abc_class": "A",
  "xyz_class": "X",
  "policy": "(r, Q)",
  "reorder_point": 450,
  "order_quantity": 200,
  "safety_stock": 85,
  "service_level": 0.95,
  "average_inventory": 185,
  "annual_cost": 5420.50,
  "recommendations": [
    "Consider vendor-managed inventory given high volume"
  ]
}
```

## Best Practices

1. **Classify items first** - Use ABC/XYZ to prioritize
2. **Match policy to class** - More sophisticated for A items
3. **Review parameters regularly** - Demand patterns change
4. **Consider total cost** - Not just inventory cost
5. **Validate assumptions** - Lead time, demand distributions
6. **Monitor service levels** - Actual vs target

## Constraints

- Requires accurate demand and cost data
- Assumes known distributions
- Lead time variability often underestimated
- Review periodically as conditions change
