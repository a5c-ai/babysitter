---
name: supply-chain-visibility-platform
description: End-to-end supply chain visibility skill providing real-time tracking and control tower capabilities
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

# Supply Chain Visibility Platform

## Overview

The Supply Chain Visibility Platform provides end-to-end supply chain visibility with real-time tracking and control tower capabilities. It integrates data from multiple tiers of the supply chain to provide comprehensive visibility, exception management, and predictive analytics for proactive supply chain management.

## Capabilities

- **Multi-Tier Supplier Visibility**: Track materials and products across multiple tiers of the supply chain
- **In-Transit Inventory Tracking**: Monitor inventory in transit across all modes and carriers
- **Exception Management and Alerting**: Detect exceptions and trigger appropriate alerts and escalations
- **Predictive ETA Modeling**: Predict arrival times using historical data and real-time conditions
- **Risk Event Monitoring**: Monitor for supply chain risk events including weather, geopolitical, and supplier issues
- **Performance Dashboards**: Provide comprehensive visibility dashboards for supply chain performance
- **Collaboration Portal**: Enable collaboration between supply chain partners through shared visibility

## Tools and Libraries

- Visibility Platforms (Project44, FourKites)
- IoT Integration
- Event Streaming (Kafka)
- Risk Monitoring Services

## Used By Processes

- Shipment Tracking and Visibility
- Distribution Network Optimization
- Demand Forecasting

## Usage

```yaml
skill: supply-chain-visibility-platform
inputs:
  tracking_scope:
    purchase_orders: ["PO-2026-001", "PO-2026-002"]
    shipments: ["SHP-2026-101", "SHP-2026-102"]
    visibility_depth: "multi_tier"
  alert_configuration:
    delay_threshold_hours: 4
    risk_categories: ["weather", "port_congestion", "supplier_issue"]
    notification_channels: ["email", "dashboard", "slack"]
  dashboard_parameters:
    time_range_days: 30
    key_lanes: ["Shanghai-LA", "Vietnam-NYC", "Mexico-Chicago"]
outputs:
  visibility_summary:
    total_shipments_tracked: 156
    in_transit: 42
    at_risk: 5
    delivered_on_time_percent: 94.2
  shipment_details:
    - shipment_id: "SHP-2026-101"
      origin: "Shanghai, China"
      destination: "Los Angeles, CA"
      mode: "ocean"
      carrier: "COSCO"
      vessel: "COSCO Shipping Universe"
      current_location: "Pacific Ocean - 500nm from LA"
      status: "in_transit"
      original_eta: "2026-01-28"
      current_eta: "2026-01-27"
      eta_confidence: 92
      milestones:
        - event: "vessel_departure"
          location: "Shanghai Port"
          timestamp: "2026-01-10T14:00:00Z"
        - event: "transhipment"
          location: "Busan, Korea"
          timestamp: "2026-01-13T08:00:00Z"
  risk_alerts:
    - alert_id: "ALT-001"
      type: "port_congestion"
      location: "Los Angeles Port"
      severity: "medium"
      affected_shipments: ["SHP-2026-101", "SHP-2026-105"]
      impact: "Potential 1-2 day delay"
      recommended_action: "Monitor closely, prepare for potential dray carrier rebooking"
  supplier_visibility:
    - supplier: "Acme Manufacturing"
      tier: 1
      active_pos: 5
      on_time_rate: 91
      risk_score: "low"
```

## Integration Points

- Transportation Management Systems (TMS)
- Enterprise Resource Planning (ERP)
- Supplier Portals
- Risk Intelligence Services
- IoT/GPS Tracking Devices

## Performance Metrics

- Visibility coverage percentage
- ETA accuracy
- Exception detection rate
- Alert response time
- Partner adoption rate
