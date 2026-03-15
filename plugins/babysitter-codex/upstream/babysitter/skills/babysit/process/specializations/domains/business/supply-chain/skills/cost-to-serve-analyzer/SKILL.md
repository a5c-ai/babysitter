---
name: cost-to-serve-analyzer
description: Supply chain cost-to-serve analysis skill by customer, product, or channel
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: supply-chain
  domain: business
  category: analytics
  priority: standard
---

# Cost-to-Serve Analyzer

## Overview

The Cost-to-Serve Analyzer provides detailed supply chain cost analysis by customer, product, or channel. It applies activity-based costing principles to allocate supply chain costs accurately, enabling profitability analysis and cost optimization decisions.

## Capabilities

- **Activity-Based Costing Allocation**: Cost driver-based allocation
- **Procurement Cost Assignment**: Purchase and sourcing cost allocation
- **Inventory Carrying Cost Calculation**: Working capital cost attribution
- **Logistics and Transportation Costing**: Freight and distribution costs
- **Service Cost Attribution**: Customer service and support costs
- **Profitability Analysis by Segment**: Customer/product/channel profitability
- **Cost Driver Identification**: Key cost influencer analysis
- **Optimization Recommendations**: Cost reduction opportunities

## Input Schema

```yaml
cost_to_serve_request:
  analysis_dimensions:
    by_customer: boolean
    by_product: boolean
    by_channel: boolean
  cost_data:
    procurement_costs: object
    manufacturing_costs: object
    logistics_costs: object
    inventory_costs: object
    service_costs: object
    overhead_costs: object
  activity_data:
    order_volumes: object
    shipment_data: object
    service_interactions: object
  revenue_data: object
  allocation_rules:
    cost_drivers: array
    allocation_bases: object
  analysis_period:
    start_date: date
    end_date: date
```

## Output Schema

```yaml
cost_to_serve_output:
  cost_allocation:
    by_customer: array
      - customer_id: string
        revenue: float
        costs:
          procurement: float
          inventory: float
          logistics: float
          service: float
          overhead: float
          total: float
        margin: float
        margin_percent: float
    by_product: array
    by_channel: array
  profitability_analysis:
    profitable_segments: array
    unprofitable_segments: array
    profitability_distribution: object
  cost_drivers:
    key_drivers: array
    driver_sensitivity: object
  optimization_opportunities:
    recommendations: array
      - opportunity: string
        segment: string
        current_cost: float
        target_cost: float
        savings_potential: float
    total_savings_potential: float
  visualizations: object
```

## Usage

### Customer Profitability Analysis

```
Input: Customer revenue, allocated costs
Process: Calculate cost-to-serve by customer
Output: Customer profitability ranking with drivers
```

### Channel Cost Comparison

```
Input: Multi-channel cost and revenue data
Process: Allocate costs by channel activities
Output: Channel profitability comparison
```

### Cost Driver Analysis

```
Input: Detailed activity and cost data
Process: Identify and quantify cost drivers
Output: Cost driver impact analysis
```

## Integration Points

- **ERP Systems**: Cost data, activity data
- **Financial Systems**: Revenue, cost accounting
- **Logistics Systems**: Freight, distribution costs
- **Tools/Libraries**: ABC costing models, profitability analysis

## Process Dependencies

- Supply Chain Cost-to-Serve Analysis
- Supply Chain KPI Dashboard Development
- Supply Chain Network Design

## Best Practices

1. Establish clear cost allocation methodology
2. Validate cost drivers with operational teams
3. Use activity data for accurate allocation
4. Compare results across time periods
5. Engage sales and finance in interpretation
6. Link findings to actionable improvement plans
