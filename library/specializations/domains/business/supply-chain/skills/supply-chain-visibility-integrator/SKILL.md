---
name: supply-chain-visibility-integrator
description: End-to-end supply chain visibility integration skill connecting systems and data sources
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: supply-chain
  domain: business
  category: cross-functional
  priority: future
---

# Supply Chain Visibility Integrator

## Overview

The Supply Chain Visibility Integrator enables end-to-end supply chain visibility by connecting disparate systems and data sources. It aggregates inventory positions, shipment tracking, and order status across the supply chain network to provide a unified view.

## Capabilities

- **Multi-Tier Supplier Visibility**: Extended supply network transparency
- **Shipment Tracking Integration**: Carrier and logistics tracking consolidation
- **Inventory Visibility Aggregation**: Cross-location inventory positions
- **Order Status Consolidation**: Unified order tracking view
- **Exception Alerting**: Automated deviation notifications
- **Control Tower Dashboard Support**: Visibility platform enablement
- **API Connectivity Management**: Integration orchestration
- **Data Quality Monitoring**: Visibility data health tracking

## Input Schema

```yaml
visibility_integration_request:
  data_sources:
    erp_systems: array
    wms_systems: array
    tms_systems: array
    supplier_portals: array
    carrier_apis: array
  visibility_scope:
    inventory: boolean
    orders: boolean
    shipments: boolean
    supplier_tiers: integer
  integration_config:
    refresh_frequency: string
    data_mapping: object
    exception_rules: array
  alert_configuration:
    recipients: array
    thresholds: object
    channels: array
```

## Output Schema

```yaml
visibility_integration_output:
  visibility_status:
    data_sources_connected: integer
    data_freshness: object
    coverage_percentage: float
  inventory_visibility:
    positions: array
      - location: string
        sku: string
        quantity: integer
        last_updated: datetime
    aggregated_view: object
  order_visibility:
    orders: array
      - order_id: string
        status: string
        milestones: array
        eta: datetime
  shipment_visibility:
    shipments: array
      - shipment_id: string
        carrier: string
        status: string
        location: object
        eta: datetime
  supplier_visibility:
    tier1_visibility: object
    tier2_visibility: object
    gaps: array
  exceptions:
    active_alerts: array
    alert_history: array
  data_quality:
    quality_score: float
    issues: array
    recommendations: array
```

## Usage

### Inventory Visibility Setup

```
Input: ERP and WMS connections, location hierarchy
Process: Integrate and aggregate inventory data
Output: Unified inventory visibility across network
```

### Shipment Tracking Consolidation

```
Input: Carrier API connections, shipment data
Process: Aggregate tracking across carriers
Output: Consolidated shipment tracking view
```

### Multi-Tier Supplier Visibility

```
Input: Supplier portal connections, tier mapping
Process: Extend visibility to sub-tier suppliers
Output: Multi-tier supply visibility
```

## Integration Points

- **EDI Networks**: B2B data exchange
- **API Platforms**: REST/SOAP integrations
- **Tracking Platforms**: Carrier and logistics APIs
- **Control Tower Systems**: Visibility platform feeds
- **Tools/Libraries**: EDI, API integration, tracking platforms

## Process Dependencies

- Supply Chain KPI Dashboard Development
- Supplier Risk Monitoring and Early Warning
- Supply Chain Disruption Response

## Best Practices

1. Prioritize critical flows for visibility
2. Establish data standards across partners
3. Monitor data quality continuously
4. Set appropriate refresh frequencies
5. Design for scalability
6. Plan for exception handling
