---
name: capacity-planner
description: Capacity requirements planning skill with demand-capacity analysis and strategic capacity decisions.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: production-planning
  backlog-id: SK-IE-028
---

# capacity-planner

You are **capacity-planner** - a specialized skill for capacity requirements planning and strategic capacity decisions.

## Overview

This skill enables AI-powered capacity planning including:
- Capacity requirements calculation from demand
- Resource capacity documentation
- Capacity gap analysis
- Rough-cut capacity planning (RCCP)
- Detailed capacity requirements planning (CRP)
- Lead, lag, match strategy evaluation
- Make vs buy analysis
- Capacity investment justification

## Capabilities

### 1. Capacity Requirements Calculation

```python
import pandas as pd
import numpy as np

def calculate_capacity_requirements(demand_forecast: pd.DataFrame,
                                   product_routing: dict,
                                   work_center_data: dict):
    """
    Calculate capacity requirements from demand

    demand_forecast: DataFrame with columns ['period', 'product', 'quantity']
    product_routing: {product: [(work_center, time_per_unit), ...]}
    work_center_data: {work_center: {'available_hours': x, 'efficiency': y}}
    """
    requirements = []

    for _, row in demand_forecast.iterrows():
        product = row['product']
        quantity = row['quantity']
        period = row['period']

        if product in product_routing:
            for work_center, time_per_unit in product_routing[product]:
                required_hours = quantity * time_per_unit / 60  # Convert to hours

                requirements.append({
                    'period': period,
                    'product': product,
                    'work_center': work_center,
                    'required_hours': required_hours
                })

    req_df = pd.DataFrame(requirements)

    # Aggregate by work center and period
    summary = req_df.groupby(['period', 'work_center'])['required_hours'].sum().reset_index()

    return {
        'detailed_requirements': req_df,
        'summary': summary
    }
```

### 2. Capacity Gap Analysis

```python
def analyze_capacity_gaps(requirements: pd.DataFrame, capacity: dict):
    """
    Identify capacity gaps between requirements and available capacity
    """
    gaps = []

    for _, row in requirements.iterrows():
        wc = row['work_center']
        required = row['required_hours']

        if wc in capacity:
            available = capacity[wc]['available_hours']
            efficiency = capacity[wc].get('efficiency', 1.0)
            effective_capacity = available * efficiency

            gap = required - effective_capacity
            utilization = required / effective_capacity * 100 if effective_capacity > 0 else float('inf')

            gaps.append({
                'period': row['period'],
                'work_center': wc,
                'required_hours': required,
                'available_hours': available,
                'effective_capacity': effective_capacity,
                'gap_hours': gap,
                'utilization_percent': utilization,
                'status': 'overcapacity' if gap > 0 else 'undercapacity' if gap < -effective_capacity * 0.2 else 'balanced'
            })

    gap_df = pd.DataFrame(gaps)

    # Summary
    summary = {
        'total_overcapacity_hours': gap_df[gap_df['gap_hours'] > 0]['gap_hours'].sum(),
        'total_undercapacity_hours': abs(gap_df[gap_df['gap_hours'] < 0]['gap_hours'].sum()),
        'bottleneck_work_centers': gap_df[gap_df['status'] == 'overcapacity']['work_center'].unique().tolist(),
        'underutilized_work_centers': gap_df[gap_df['status'] == 'undercapacity']['work_center'].unique().tolist()
    }

    return {
        'gaps': gap_df,
        'summary': summary
    }
```

### 3. Rough-Cut Capacity Planning (RCCP)

```python
def rough_cut_capacity_plan(mps: pd.DataFrame, bill_of_resources: dict,
                           available_capacity: dict):
    """
    Rough-Cut Capacity Planning

    mps: Master Production Schedule with ['period', 'product', 'quantity']
    bill_of_resources: {product: {resource: hours_per_unit}}
    available_capacity: {resource: hours_per_period}
    """
    rccp_results = []

    for _, row in mps.iterrows():
        product = row['product']
        quantity = row['quantity']
        period = row['period']

        if product in bill_of_resources:
            for resource, hours_per_unit in bill_of_resources[product].items():
                load = quantity * hours_per_unit

                rccp_results.append({
                    'period': period,
                    'product': product,
                    'resource': resource,
                    'load_hours': load
                })

    rccp_df = pd.DataFrame(rccp_results)

    # Aggregate by resource and period
    resource_load = rccp_df.groupby(['period', 'resource'])['load_hours'].sum().reset_index()

    # Compare to available
    capacity_status = []
    for _, row in resource_load.iterrows():
        resource = row['resource']
        load = row['load_hours']
        available = available_capacity.get(resource, 0)

        capacity_status.append({
            'period': row['period'],
            'resource': resource,
            'load': load,
            'available': available,
            'utilization': load / available * 100 if available > 0 else float('inf'),
            'feasible': load <= available
        })

    return {
        'rccp_detail': rccp_df,
        'resource_load': resource_load,
        'capacity_status': pd.DataFrame(capacity_status),
        'infeasible_periods': [r for r in capacity_status if not r['feasible']]
    }
```

### 4. Capacity Strategy Evaluation

```python
def evaluate_capacity_strategies(demand_growth: float, current_capacity: float,
                                capacity_increment: float, options: dict):
    """
    Evaluate Lead, Lag, and Match capacity strategies

    demand_growth: annual growth rate
    current_capacity: current capacity units
    capacity_increment: size of capacity additions
    options: {'planning_horizon': years, 'discount_rate': rate}
    """
    horizon = options.get('planning_horizon', 5)
    discount_rate = options.get('discount_rate', 0.10)

    strategies = {}

    # Project demand
    demand = [current_capacity * (1 + demand_growth) ** t for t in range(horizon)]

    # LEAD strategy - add capacity before needed
    lead_capacity = [current_capacity]
    lead_additions = []
    for t in range(1, horizon):
        if demand[t] > lead_capacity[-1] * 0.8:  # Add at 80% utilization
            lead_capacity.append(lead_capacity[-1] + capacity_increment)
            lead_additions.append(t)
        else:
            lead_capacity.append(lead_capacity[-1])

    strategies['lead'] = {
        'description': 'Add capacity before demand reaches current capacity',
        'capacity_timeline': lead_capacity,
        'additions': lead_additions,
        'average_utilization': np.mean([d / c for d, c in zip(demand, lead_capacity)]) * 100,
        'lost_sales_risk': 'Low',
        'capital_efficiency': 'Low'
    }

    # LAG strategy - add capacity after demand exceeds
    lag_capacity = [current_capacity]
    lag_additions = []
    for t in range(1, horizon):
        if demand[t-1] > lag_capacity[-1]:  # Add after exceeding
            lag_capacity.append(lag_capacity[-1] + capacity_increment)
            lag_additions.append(t)
        else:
            lag_capacity.append(lag_capacity[-1])

    strategies['lag'] = {
        'description': 'Add capacity after demand exceeds current capacity',
        'capacity_timeline': lag_capacity,
        'additions': lag_additions,
        'average_utilization': np.mean([min(1, d / c) for d, c in zip(demand, lag_capacity)]) * 100,
        'lost_sales_risk': 'High',
        'capital_efficiency': 'High'
    }

    # MATCH strategy - add capacity to match demand
    match_capacity = [current_capacity]
    match_additions = []
    for t in range(1, horizon):
        target_util = 0.85
        needed = demand[t] / target_util
        if needed > match_capacity[-1]:
            additions_needed = int(np.ceil((needed - match_capacity[-1]) / capacity_increment))
            match_capacity.append(match_capacity[-1] + additions_needed * capacity_increment)
            match_additions.append(t)
        else:
            match_capacity.append(match_capacity[-1])

    strategies['match'] = {
        'description': 'Add capacity to track demand at target utilization',
        'capacity_timeline': match_capacity,
        'additions': match_additions,
        'average_utilization': 85,  # By design
        'lost_sales_risk': 'Medium',
        'capital_efficiency': 'Medium'
    }

    return {
        'demand_projection': demand,
        'strategies': strategies,
        'recommendation': recommend_strategy(strategies, demand_growth)
    }

def recommend_strategy(strategies, growth_rate):
    if growth_rate > 0.15:
        return {'strategy': 'lead', 'reason': 'High growth - secure capacity early'}
    elif growth_rate < 0.05:
        return {'strategy': 'lag', 'reason': 'Low growth - conserve capital'}
    else:
        return {'strategy': 'match', 'reason': 'Moderate growth - balance risk and efficiency'}
```

### 5. Make vs Buy Analysis

```python
def make_vs_buy_analysis(product: str, requirements: dict, options: dict):
    """
    Analyze make vs buy decision for capacity

    requirements: {'annual_volume': x, 'quality_spec': y}
    options: {'make_cost': {}, 'buy_cost': {}, 'strategic_factors': {}}
    """
    make_cost = options['make_cost']
    buy_cost = options['buy_cost']
    volume = requirements['annual_volume']

    # Calculate total costs
    make_total = (make_cost['fixed_annual'] +
                 make_cost['variable_per_unit'] * volume)
    buy_total = buy_cost['price_per_unit'] * volume

    # Break-even analysis
    if make_cost['variable_per_unit'] < buy_cost['price_per_unit']:
        breakeven_volume = make_cost['fixed_annual'] / \
                          (buy_cost['price_per_unit'] - make_cost['variable_per_unit'])
    else:
        breakeven_volume = float('inf')

    # Strategic factors
    strategic = options.get('strategic_factors', {})
    make_score = sum([
        strategic.get('core_competency', 0) * 10,
        strategic.get('quality_control', 0) * 8,
        strategic.get('lead_time_control', 0) * 6,
        strategic.get('capacity_utilization', 0) * 4
    ])
    buy_score = sum([
        strategic.get('flexibility', 0) * 8,
        strategic.get('capital_preservation', 0) * 7,
        strategic.get('supplier_expertise', 0) * 6,
        strategic.get('risk_sharing', 0) * 5
    ])

    # Recommendation
    cost_advantage = 'make' if make_total < buy_total else 'buy'
    strategic_advantage = 'make' if make_score > buy_score else 'buy'

    return {
        'cost_analysis': {
            'make_total': make_total,
            'buy_total': buy_total,
            'difference': buy_total - make_total,
            'breakeven_volume': breakeven_volume
        },
        'strategic_analysis': {
            'make_score': make_score,
            'buy_score': buy_score
        },
        'recommendation': {
            'cost_driven': cost_advantage,
            'strategic_driven': strategic_advantage,
            'final': cost_advantage if cost_advantage == strategic_advantage else 'hybrid'
        }
    }
```

### 6. Capacity Investment Justification

```python
def justify_capacity_investment(investment: dict, benefits: dict, financial_params: dict):
    """
    Build financial justification for capacity investment
    """
    initial_cost = investment['initial_cost']
    annual_costs = investment.get('annual_costs', 0)
    lifetime = investment.get('lifetime_years', 10)

    annual_benefits = benefits.get('annual_revenue_increase', 0) + \
                     benefits.get('annual_cost_savings', 0)

    discount_rate = financial_params.get('discount_rate', 0.10)
    tax_rate = financial_params.get('tax_rate', 0.25)

    # Net cash flows
    cash_flows = [-initial_cost]
    for year in range(1, lifetime + 1):
        net_benefit = (annual_benefits - annual_costs) * (1 - tax_rate)
        # Add depreciation tax shield
        depreciation = initial_cost / lifetime
        tax_shield = depreciation * tax_rate
        cash_flows.append(net_benefit + tax_shield)

    # NPV
    npv = sum(cf / (1 + discount_rate) ** t for t, cf in enumerate(cash_flows))

    # IRR (simplified - using numerical method)
    def npv_at_rate(rate):
        return sum(cf / (1 + rate) ** t for t, cf in enumerate(cash_flows))

    # Binary search for IRR
    low, high = 0.0, 1.0
    while high - low > 0.001:
        mid = (low + high) / 2
        if npv_at_rate(mid) > 0:
            low = mid
        else:
            high = mid
    irr = mid

    # Payback period
    cumulative = 0
    payback = lifetime
    for t, cf in enumerate(cash_flows):
        cumulative += cf
        if cumulative >= 0 and t > 0:
            payback = t - 1 + abs(cumulative - cf) / cf
            break

    return {
        'investment_summary': {
            'initial_cost': initial_cost,
            'annual_benefit': annual_benefits,
            'lifetime': lifetime
        },
        'financial_metrics': {
            'NPV': round(npv, 2),
            'IRR': round(irr * 100, 1),
            'payback_years': round(payback, 1),
            'profitability_index': (npv + initial_cost) / initial_cost
        },
        'recommendation': 'approve' if npv > 0 and irr > discount_rate else 'reject',
        'sensitivity': {
            'breakeven_benefit': initial_cost / lifetime / (1 - tax_rate)
        }
    }
```

## Process Integration

This skill integrates with the following processes:
- `capacity-planning-analysis.js`
- `production-scheduling-optimization.js`
- `discrete-event-simulation-modeling.js`

## Output Format

```json
{
  "capacity_requirements": {
    "total_required_hours": 4500,
    "by_work_center": {"Assembly": 2000, "Testing": 1500}
  },
  "gap_analysis": {
    "bottlenecks": ["Assembly"],
    "overcapacity_hours": 300
  },
  "strategy_recommendation": {
    "strategy": "match",
    "reason": "Moderate growth"
  },
  "investment_justification": {
    "NPV": 125000,
    "IRR": 18.5,
    "recommendation": "approve"
  }
}
```

## Best Practices

1. **Use realistic efficiency** - Account for losses
2. **Consider variability** - Buffer for uncertainty
3. **Plan for flexibility** - Don't over-specialize
4. **Review regularly** - Update as conditions change
5. **Integrate with S&OP** - Align with business planning
6. **Validate assumptions** - Test capacity models

## Constraints

- Demand forecasts have uncertainty
- Lead times for capacity additions
- Skill requirements for new capacity
- Financial approval processes
