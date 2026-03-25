---
name: transportation-spend-analyzer
description: Freight spend analysis and benchmarking skill for cost optimization and carrier negotiation support
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: logistics
  domain: business
  category: analytics
  priority: medium
---

# Transportation Spend Analyzer

## Overview

The Transportation Spend Analyzer provides comprehensive freight spend analysis and benchmarking capabilities for cost optimization and carrier negotiation support. It analyzes spend patterns, identifies savings opportunities, and provides market intelligence for strategic procurement decisions.

## Capabilities

- **Spend Cube Analysis**: Analyze transportation spend across dimensions including lane, carrier, mode, and time
- **Lane-Level Rate Benchmarking**: Compare rates against market benchmarks at the lane level
- **Accessorial Cost Breakdown**: Analyze accessorial charges and identify reduction opportunities
- **Mode Optimization Opportunity Identification**: Identify opportunities to shift freight to more cost-effective modes
- **Contract vs. Spot Analysis**: Compare performance and cost of contract versus spot shipments
- **Carrier Performance Cost Correlation**: Correlate carrier costs with service performance metrics
- **Savings Opportunity Quantification**: Quantify potential savings from identified optimization opportunities

## Tools and Libraries

- Spend Analysis Tools
- Benchmarking Databases (DAT, Chainalytics)
- TMS Analytics
- Data Visualization Libraries

## Used By Processes

- Carrier Selection and Procurement
- Freight Audit and Payment
- Route Optimization

## Usage

```yaml
skill: transportation-spend-analyzer
inputs:
  analysis_period:
    start: "2025-01-01"
    end: "2025-12-31"
  spend_data:
    total_shipments: 45000
    total_spend: 28500000
    modes:
      truckload: 18000000
      ltl: 6500000
      parcel: 3000000
      intermodal: 1000000
  benchmark_sources:
    - "dat_rate_view"
    - "industry_benchmarks"
  focus_areas:
    - "top_lanes"
    - "accessorial_charges"
    - "mode_optimization"
outputs:
  spend_analysis:
    total_spend: 28500000
    spend_per_shipment: 633.33
    year_over_year_change: 4.2
    spend_by_mode:
      truckload: { spend: 18000000, percent: 63.2 }
      ltl: { spend: 6500000, percent: 22.8 }
      parcel: { spend: 3000000, percent: 10.5 }
      intermodal: { spend: 1000000, percent: 3.5 }
  top_lanes_analysis:
    - lane: "Chicago to Los Angeles"
      spend: 2100000
      shipments: 1200
      avg_rate: 1750
      benchmark_rate: 1680
      variance_percent: 4.2
      opportunity: 84000
    - lane: "Dallas to Atlanta"
      spend: 1850000
      shipments: 2100
      avg_rate: 881
      benchmark_rate: 850
      variance_percent: 3.6
      opportunity: 65100
  accessorial_analysis:
    total_accessorials: 3200000
    percent_of_spend: 11.2
    top_accessorials:
      - type: "fuel_surcharge"
        amount: 1800000
        percent_of_accessorials: 56.3
      - type: "detention"
        amount: 450000
        percent_of_accessorials: 14.1
        benchmark_percent: 8.0
        opportunity: 195000
  savings_opportunities:
    - category: "lane_rate_optimization"
      potential_savings: 425000
      implementation_effort: "medium"
      timeline: "3-6 months"
    - category: "accessorial_reduction"
      potential_savings: 320000
      implementation_effort: "low"
      timeline: "1-3 months"
    - category: "mode_shift_to_intermodal"
      potential_savings: 280000
      implementation_effort: "high"
      timeline: "6-12 months"
  total_savings_potential: 1025000
```

## Integration Points

- Transportation Management Systems (TMS)
- Financial Systems
- Carrier Rate Systems
- Market Benchmarking Services
- Business Intelligence Platforms

## Performance Metrics

- Spend per unit shipped
- Cost vs. benchmark variance
- Accessorial cost percentage
- Savings captured
- Mode optimization rate
