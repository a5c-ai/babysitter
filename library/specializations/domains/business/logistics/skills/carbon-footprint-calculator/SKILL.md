---
name: carbon-footprint-calculator
description: Logistics carbon emission tracking and reduction planning skill supporting sustainability initiatives
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
  priority: lower
  shared-candidate: true
---

# Carbon Footprint Calculator

## Overview

The Carbon Footprint Calculator tracks logistics carbon emissions and supports reduction planning for sustainability initiatives. It calculates emissions across transportation modes, identifies reduction opportunities, and provides reporting capabilities for ESG compliance and stakeholder communication.

## Capabilities

- **Scope 1, 2, 3 Emission Calculation**: Calculate emissions across all scopes including direct fleet, purchased energy, and transportation
- **Mode-Specific Carbon Factors**: Apply appropriate emission factors for different transportation modes and fuel types
- **Route Carbon Optimization**: Identify lower-carbon route alternatives and mode shift opportunities
- **Carrier Sustainability Scoring**: Score and rank carriers based on sustainability performance
- **Reduction Target Tracking**: Track progress against carbon reduction targets and commitments
- **Offset Program Integration**: Integrate with carbon offset programs for net-zero strategies
- **Sustainability Reporting**: Generate reports for ESG disclosure, CDP, and stakeholder communication

## Tools and Libraries

- Carbon Calculation APIs
- Emission Factor Databases (GHG Protocol, EPA)
- ESG Reporting Tools
- Route Optimization Integration

## Used By Processes

- Route Optimization
- Distribution Network Optimization
- Carrier Selection and Procurement

## Usage

```yaml
skill: carbon-footprint-calculator
inputs:
  reporting_period:
    start: "2025-01-01"
    end: "2025-12-31"
  transportation_data:
    shipments:
      - mode: "truckload"
        miles: 5200000
        fuel_type: "diesel"
      - mode: "ltl"
        ton_miles: 12500000
      - mode: "ocean"
        teu_miles: 8500000
      - mode: "air"
        ton_miles: 450000
  fleet_data:
    owned_vehicles: 50
    fuel_consumed_gallons: 625000
    fuel_type: "diesel"
  facility_data:
    - facility: "DC001"
      electricity_kwh: 2500000
      natural_gas_therms: 45000
  reduction_targets:
    baseline_year: 2020
    target_reduction_percent: 30
    target_year: 2030
outputs:
  emissions_summary:
    total_mtco2e: 45250
    scope_1: 6375
    scope_2: 1250
    scope_3_transportation: 37625
    year_over_year_change: -3.2
  emissions_by_mode:
    - mode: "truckload"
      mtco2e: 18500
      percent: 49.2
      intensity_per_mile: 0.00356
    - mode: "ltl"
      mtco2e: 8750
      percent: 23.3
      intensity_per_ton_mile: 0.0007
    - mode: "ocean"
      mtco2e: 5100
      percent: 13.6
      intensity_per_teu_mile: 0.0006
    - mode: "air"
      mtco2e: 5275
      percent: 14.0
      intensity_per_ton_mile: 0.0117
  target_progress:
    baseline_emissions: 55000
    current_emissions: 45250
    reduction_achieved_percent: 17.7
    remaining_reduction_needed: 12.3
    on_track: true
  reduction_opportunities:
    - opportunity: "Mode shift truckload to intermodal"
      potential_reduction_mtco2e: 3200
      cost_impact: "neutral"
      implementation_timeline: "6-12 months"
    - opportunity: "Electric vehicle adoption"
      potential_reduction_mtco2e: 1500
      cost_impact: "increase_5_percent"
      implementation_timeline: "12-24 months"
  carrier_sustainability_scores:
    - carrier: "Eco Freight"
      score: 92
      certifications: ["SmartWay", "ISO14001"]
    - carrier: "Standard Transport"
      score: 68
      certifications: ["SmartWay"]
```

## Integration Points

- Transportation Management Systems (TMS)
- Fleet Management Systems
- Facility Management Systems
- ESG Reporting Platforms
- Carbon Offset Marketplaces

## Performance Metrics

- Total carbon emissions (mtCO2e)
- Emissions intensity (per unit shipped)
- Year-over-year reduction
- Target achievement rate
- Carrier sustainability adoption
