---
name: last-mile-delivery-optimizer
description: Final delivery leg optimization skill including dynamic scheduling, time-window management, and delivery confirmation
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

# Last-Mile Delivery Optimizer

## Overview

The Last-Mile Delivery Optimizer focuses on the final delivery leg optimization including dynamic scheduling, time-window management, and delivery confirmation. It maximizes delivery density, manages customer expectations, and coordinates various delivery methods including traditional carriers and crowdsourced options.

## Capabilities

- **Delivery Density Optimization**: Maximize deliveries per route by clustering nearby addresses
- **Time Window Scheduling**: Schedule deliveries within customer-preferred time windows
- **Driver Dispatch Optimization**: Assign deliveries to drivers based on location, capacity, and skills
- **Proof of Delivery Automation**: Capture signatures, photos, and timestamps for delivery confirmation
- **Failed Delivery Management**: Handle failed deliveries including rescheduling and alternative locations
- **Customer Communication Integration**: Send proactive updates on delivery status and ETA
- **Crowdsourced Delivery Coordination**: Integrate with gig economy platforms for flexible capacity

## Tools and Libraries

- Routing APIs
- Last-Mile Platforms
- Driver Apps
- Customer Notification Systems

## Used By Processes

- Last-Mile Delivery Optimization
- Route Optimization
- Multi-Channel Fulfillment

## Usage

```yaml
skill: last-mile-delivery-optimizer
inputs:
  deliveries:
    - delivery_id: "DEL001"
      address: "123 Main St, Boston, MA"
      coordinates: { lat: 42.3601, lng: -71.0589 }
      time_window: { start: "14:00", end: "18:00" }
      packages: 2
      special_instructions: "Leave at front door"
      customer_phone: "+1-555-0123"
    - delivery_id: "DEL002"
      address: "456 Oak Ave, Boston, MA"
      coordinates: { lat: 42.3651, lng: -71.0549 }
      time_window: { start: "10:00", end: "14:00" }
      packages: 1
      signature_required: true
  drivers:
    - driver_id: "DRV001"
      current_location: { lat: 42.3501, lng: -71.0650 }
      capacity_packages: 50
      shift_end: "20:00"
      skills: ["signature_capture", "heavy_items"]
  optimization_parameters:
    optimize_for: "delivery_density"
    max_route_time_hours: 8
    customer_notification: true
outputs:
  delivery_routes:
    - driver_id: "DRV001"
      route:
        - delivery_id: "DEL002"
          sequence: 1
          eta: "11:30"
          eta_window: { start: "11:15", end: "11:45" }
        - delivery_id: "DEL001"
          sequence: 2
          eta: "15:30"
          eta_window: { start: "15:15", end: "15:45" }
      total_deliveries: 2
      total_distance_km: 12.5
      estimated_completion: "16:00"
  customer_notifications:
    - delivery_id: "DEL001"
      notification_type: "eta_update"
      scheduled_time: "14:00"
      message: "Your delivery is on the way. Expected arrival: 3:30 PM"
  metrics:
    deliveries_per_route: 15.5
    average_delivery_time_minutes: 8
    on_time_delivery_rate: 96.5
```

## Integration Points

- Transportation Management Systems (TMS)
- Order Management Systems
- Customer Communication Platforms
- Driver Mobile Apps
- GPS/Telematics Systems

## Performance Metrics

- Deliveries per route
- On-time delivery rate
- First-attempt success rate
- Cost per delivery
- Customer satisfaction score
