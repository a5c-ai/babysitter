---
name: shipment-visibility-tracker
description: Real-time shipment monitoring and exception management skill with proactive alerting and customer communication
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
  priority: high
---

# Shipment Visibility Tracker

## Overview

The Shipment Visibility Tracker provides real-time shipment monitoring and exception management capabilities with proactive alerting and automated customer communication. It integrates with multiple carriers and tracking sources to deliver comprehensive visibility across the supply chain.

## Capabilities

- **Multi-Carrier Tracking Integration**: Consolidate tracking data from multiple carriers, modes, and tracking sources into a unified view
- **ETA Prediction with ML Models**: Use machine learning to predict accurate estimated arrival times based on historical patterns and current conditions
- **Exception Detection and Alerting**: Automatically detect shipment exceptions such as delays, damage, or route deviations and trigger appropriate alerts
- **Proof of Delivery Capture**: Capture and store proof of delivery documentation including signatures, photos, and timestamps
- **Milestone Event Tracking**: Track and record shipment milestone events from pickup through final delivery
- **Customer Notification Automation**: Automatically send status updates and notifications to customers via email, SMS, or portal
- **Performance Analytics Dashboards**: Provide visibility into carrier performance, transit times, and exception rates

## Tools and Libraries

- Tracking APIs (Project44, FourKites)
- GPS/Telematics Integration
- Visibility Platforms
- Notification Services (Twilio, SendGrid)

## Used By Processes

- Shipment Tracking and Visibility
- Last-Mile Delivery Optimization
- Carrier Selection and Procurement

## Usage

```yaml
skill: shipment-visibility-tracker
inputs:
  shipment:
    shipment_id: "SHP-2026-12345"
    carrier: "CARRIER001"
    tracking_number: "1Z999AA10123456784"
    origin: "Chicago, IL"
    destination: "New York, NY"
    planned_delivery: "2026-01-25T14:00:00Z"
  monitoring:
    alert_on_delay_hours: 2
    customer_notification: true
    notification_milestones: ["picked_up", "in_transit", "out_for_delivery", "delivered"]
outputs:
  current_status:
    status: "in_transit"
    location: "Toledo, OH"
    last_update: "2026-01-24T08:30:00Z"
    predicted_eta: "2026-01-25T12:30:00Z"
    eta_confidence: 92
  milestones:
    - event: "picked_up"
      timestamp: "2026-01-23T15:00:00Z"
      location: "Chicago, IL"
    - event: "departed_facility"
      timestamp: "2026-01-24T02:00:00Z"
      location: "Chicago Distribution Center"
  exceptions: []
  notifications_sent:
    - type: "status_update"
      channel: "email"
      timestamp: "2026-01-24T08:35:00Z"
```

## Integration Points

- Transportation Management Systems (TMS)
- Carrier Tracking APIs
- Customer Portals
- Order Management Systems
- IoT/GPS Devices

## Performance Metrics

- Tracking data accuracy
- ETA prediction accuracy
- Exception detection rate
- Customer notification timeliness
- Visibility coverage percentage
