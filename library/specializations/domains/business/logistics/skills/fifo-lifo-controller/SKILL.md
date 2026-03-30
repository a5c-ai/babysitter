---
name: fifo-lifo-controller
description: Automated inventory rotation management skill ensuring proper product flow based on expiration, production, or receipt dates
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
  category: inventory
  priority: medium
---

# FIFO-LIFO Controller

## Overview

The FIFO-LIFO Controller is an automated skill that manages inventory rotation to ensure proper product flow based on expiration dates, production dates, or receipt dates. It enforces First-In-First-Out (FIFO), First-Expired-First-Out (FEFO), or Last-In-First-Out (LIFO) policies and manages lot tracking and shelf life compliance.

## Capabilities

- **FIFO Enforcement at Pick Time**: Ensure oldest inventory is picked first based on receipt or production date
- **FEFO (First Expired First Out) Management**: Prioritize inventory with nearest expiration dates for picking
- **Lot and Batch Tracking**: Maintain complete traceability of inventory by lot, batch, or serial number
- **Expiration Date Alerting**: Generate alerts for inventory approaching expiration thresholds
- **Shelf Life Calculation**: Calculate remaining shelf life and predict expiration risk
- **Product Hold Management**: Manage inventory holds for quality, recall, or compliance reasons
- **Compliance Documentation**: Generate documentation for regulatory compliance and audit requirements

## Tools and Libraries

- WMS APIs
- Lot Tracking Systems
- Shelf Life Databases
- Compliance Management Tools

## Used By Processes

- FIFO-LIFO Inventory Control
- Cycle Counting Program
- Receiving and Putaway Optimization

## Usage

```yaml
skill: fifo-lifo-controller
inputs:
  item:
    sku: "SKU001"
    rotation_method: "FEFO"
    shelf_life_days: 180
    min_remaining_life_percent: 50
  inventory:
    - lot_number: "LOT001"
      quantity: 100
      receipt_date: "2025-10-15"
      production_date: "2025-10-10"
      expiration_date: "2026-04-10"
      location: "A-01-02"
    - lot_number: "LOT002"
      quantity: 150
      receipt_date: "2025-11-20"
      production_date: "2025-11-15"
      expiration_date: "2026-05-15"
      location: "A-01-03"
  pick_request:
    quantity: 75
    order_date: "2026-01-25"
    customer_min_life_days: 60
outputs:
  pick_recommendation:
    - lot_number: "LOT001"
      quantity: 75
      location: "A-01-02"
      expiration_date: "2026-04-10"
      remaining_life_days: 75
      meets_customer_requirement: true
  rotation_status:
    sku: "SKU001"
    total_quantity: 250
    lots_at_risk: 0
    lots_expiring_30_days: 0
    lots_expiring_60_days: 0
    lots_expiring_90_days: 1
  alerts:
    - type: "approaching_expiration"
      lot_number: "LOT001"
      days_remaining: 75
      action_required: "prioritize_for_picking"
```

## Integration Points

- Warehouse Management Systems (WMS)
- Quality Management Systems (QMS)
- Enterprise Resource Planning (ERP)
- Recall Management Systems
- Compliance/Regulatory Systems

## Performance Metrics

- FIFO/FEFO compliance rate
- Expired inventory percentage
- Write-off due to expiration
- Lot traceability accuracy
- Customer freshness compliance
