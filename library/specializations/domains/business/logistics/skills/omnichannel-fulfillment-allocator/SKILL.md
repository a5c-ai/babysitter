---
name: omnichannel-fulfillment-allocator
description: Integrated fulfillment allocation skill for unified inventory across channels with intelligent order routing
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
  category: distribution
  priority: medium
---

# Omnichannel Fulfillment Allocator

## Overview

The Omnichannel Fulfillment Allocator provides integrated fulfillment allocation for unified inventory across channels with intelligent order routing. It optimizes order assignment to fulfillment nodes, balances inventory across locations, and manages complex fulfillment scenarios including ship-from-store and buy-online-pickup-in-store (BOPIS).

## Capabilities

- **Distributed Order Management**: Orchestrate orders across multiple fulfillment nodes and channels
- **Store-Fulfillment Capability Scoring**: Rate stores for fulfillment suitability based on capacity, inventory, and performance
- **Inventory Promise/ATP Calculation**: Calculate accurate available-to-promise across all inventory locations
- **Ship-From-Store Optimization**: Optimize selection of stores for e-commerce fulfillment
- **BOPIS Order Orchestration**: Manage buy-online-pickup-in-store orders including inventory reservation and pickup scheduling
- **Split Shipment Optimization**: Determine optimal split shipment strategies balancing cost and customer experience
- **Channel Priority Balancing**: Balance fulfillment priorities across channels based on business rules

## Tools and Libraries

- OMS APIs
- Inventory Visibility Platforms
- Order Routing Engines
- Real-Time Inventory Systems

## Used By Processes

- Multi-Channel Fulfillment
- Distribution Network Optimization
- Last-Mile Delivery Optimization

## Usage

```yaml
skill: omnichannel-fulfillment-allocator
inputs:
  order:
    order_id: "ORD-2026-12345"
    channel: "ecommerce"
    customer_location: "Boston, MA"
    delivery_type: "ship_to_home"
    requested_delivery: "2026-01-27"
    items:
      - sku: "SKU001"
        quantity: 2
      - sku: "SKU002"
        quantity: 1
  fulfillment_nodes:
    - node_id: "DC001"
      type: "distribution_center"
      location: "Newark, NJ"
      inventory:
        SKU001: 500
        SKU002: 200
      ship_cost_to_customer: 8.50
      transit_days: 2
    - node_id: "STORE042"
      type: "store"
      location: "Cambridge, MA"
      inventory:
        SKU001: 5
        SKU002: 3
      fulfillment_capability_score: 85
      ship_cost_to_customer: 6.00
      transit_days: 1
  allocation_rules:
    prefer_single_shipment: true
    max_split_shipments: 2
    protect_store_inventory_percent: 20
outputs:
  fulfillment_allocation:
    order_id: "ORD-2026-12345"
    allocation_type: "single_shipment"
    fulfillment_node: "STORE042"
    node_type: "store"
    shipments:
      - shipment_id: "SHP001"
        node: "STORE042"
        items:
          - sku: "SKU001"
            quantity: 2
          - sku: "SKU002"
            quantity: 1
        ship_cost: 6.00
        estimated_delivery: "2026-01-26"
    total_ship_cost: 6.00
    customer_delivery_date: "2026-01-26"
  allocation_rationale:
    - "Store fulfillment selected for faster delivery (1 day vs 2 days)"
    - "Store inventory sufficient after protection threshold"
    - "Lower shipping cost ($6.00 vs $8.50)"
  inventory_impact:
    STORE042:
      SKU001: { before: 5, after: 3, protected: 1 }
      SKU002: { before: 3, after: 2, protected: 1 }
```

## Integration Points

- Order Management Systems (OMS)
- Warehouse Management Systems (WMS)
- Point of Sale Systems
- Inventory Management Systems
- E-commerce Platforms

## Performance Metrics

- Order fill rate
- Ship-from-store percentage
- Split shipment rate
- Fulfillment cost per order
- Delivery promise accuracy
