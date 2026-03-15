---
name: carrier-selection-optimizer
description: Automated carrier evaluation and selection skill using multi-criteria decision analysis for optimal freight procurement
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
  category: transportation
  priority: medium
---

# Carrier Selection Optimizer

## Overview

The Carrier Selection Optimizer is an automated skill that evaluates and selects optimal carriers for freight shipments using multi-criteria decision analysis. It combines performance metrics, cost analysis, capacity availability, and service level requirements to recommend the best carrier for each shipment while supporting strategic procurement decisions.

## Capabilities

- **Carrier Performance Scoring**: Calculate and maintain composite performance scores based on on-time delivery, damage rates, and customer feedback
- **Rate Comparison and Analysis**: Compare contracted rates, spot rates, and accessorial charges across carriers for cost optimization
- **Capacity Availability Checking**: Real-time verification of carrier capacity and equipment availability for requested lanes and dates
- **Service Level Matching**: Match shipment requirements with carrier capabilities including transit times, handling requirements, and special services
- **Historical Performance Benchmarking**: Analyze carrier performance trends and compare against industry benchmarks
- **Contract Compliance Validation**: Verify that carrier selections comply with contracted terms, volume commitments, and business rules
- **Spot Rate Negotiation Support**: Provide market intelligence and historical data to support spot rate negotiations

## Tools and Libraries

- TMS APIs
- Carrier Rating Databases
- Procurement Analytics Platforms
- EDI Integration Libraries

## Used By Processes

- Carrier Selection and Procurement
- Freight Audit and Payment
- Shipment Tracking and Visibility

## Usage

```yaml
skill: carrier-selection-optimizer
inputs:
  shipment:
    origin: "Chicago, IL"
    destination: "Los Angeles, CA"
    weight_lbs: 15000
    freight_class: 70
    pickup_date: "2026-02-01"
    delivery_date: "2026-02-05"
    equipment_type: "dry_van"
    special_requirements: ["liftgate", "appointment_delivery"]
  selection_criteria:
    priority: "cost" # or "service" or "balanced"
    min_carrier_score: 85
    preferred_carriers: ["CARRIER001", "CARRIER002"]
outputs:
  recommendations:
    - carrier_id: "CARRIER001"
      carrier_name: "ABC Logistics"
      rate: 2150.00
      transit_days: 3
      performance_score: 92
      on_time_rate: 96.5
      recommendation_rank: 1
    - carrier_id: "CARRIER003"
      carrier_name: "XYZ Transport"
      rate: 2050.00
      transit_days: 4
      performance_score: 88
      on_time_rate: 94.2
      recommendation_rank: 2
```

## Integration Points

- Transportation Management Systems (TMS)
- Carrier Portals and APIs
- Rate Management Systems
- Procurement Platforms
- Performance Management Systems

## Performance Metrics

- Carrier cost savings percentage
- Service level achievement rate
- Carrier compliance rate
- Time to carrier selection
- Rate accuracy percentage
