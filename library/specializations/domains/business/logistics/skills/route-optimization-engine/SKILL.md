---
name: route-optimization-engine
description: AI-powered route planning and optimization skill using advanced algorithms (VRP, TSP) to minimize transportation costs, reduce delivery times, and maximize vehicle utilization
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

# Route Optimization Engine

## Overview

The Route Optimization Engine is an AI-powered skill that provides advanced route planning and optimization capabilities using sophisticated algorithms including Vehicle Routing Problem (VRP) solvers and Traveling Salesman Problem (TSP) solutions. This skill focuses on minimizing transportation costs, reducing delivery times, and maximizing vehicle utilization across logistics operations.

## Capabilities

- **Vehicle Routing Problem (VRP) Solving**: Apply advanced optimization algorithms to solve complex multi-vehicle, multi-stop routing challenges
- **Time Window Constraint Handling**: Optimize routes while respecting customer delivery time windows and service level agreements
- **Multi-Stop Route Optimization**: Calculate optimal sequences for multiple delivery or pickup points
- **Real-Time Traffic Integration**: Incorporate live traffic data to adjust routes dynamically and avoid congestion
- **Fuel Consumption Optimization**: Minimize fuel costs by selecting efficient routes considering distance, terrain, and vehicle characteristics
- **Driver Hours of Service Compliance**: Ensure routes comply with regulatory requirements for driver rest periods and maximum driving hours
- **Dynamic Re-Routing for Exceptions**: Automatically recalculate routes when unexpected events occur such as road closures, delays, or priority orders

## Tools and Libraries

- Google OR-Tools
- VROOM
- OSRM (Open Source Routing Machine)
- GraphHopper
- HERE API

## Used By Processes

- Route Optimization
- Load Planning and Consolidation
- Last-Mile Delivery Optimization

## Usage

```yaml
skill: route-optimization-engine
inputs:
  delivery_locations:
    - location_id: "LOC001"
      address: "123 Main St"
      coordinates: { lat: 40.7128, lng: -74.0060 }
      time_window: { start: "09:00", end: "12:00" }
      service_time_minutes: 15
  vehicles:
    - vehicle_id: "VH001"
      capacity: 1000
      start_location: "DEPOT001"
      available_hours: 8
  constraints:
    max_route_duration_hours: 10
    include_traffic: true
    optimize_for: "cost" # or "time" or "balanced"
outputs:
  optimized_routes:
    - vehicle_id: "VH001"
      stops: ["LOC003", "LOC001", "LOC005"]
      total_distance_km: 45.2
      estimated_duration_hours: 3.5
      fuel_consumption_liters: 12.3
```

## Integration Points

- Transportation Management Systems (TMS)
- Fleet Management Systems
- GPS/Telematics Platforms
- Customer Notification Systems
- Traffic Data Providers

## Performance Metrics

- Route efficiency improvement percentage
- On-time delivery rate
- Fuel cost reduction
- Vehicle utilization rate
- Miles/kilometers per delivery
