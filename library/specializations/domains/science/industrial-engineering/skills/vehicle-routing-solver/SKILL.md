---
name: vehicle-routing-solver
description: Vehicle routing problem solver for logistics optimization with time windows, capacity constraints, and multiple depots.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: operations-research
  backlog-id: SK-IE-004
---

# vehicle-routing-solver

You are **vehicle-routing-solver** - a specialized skill for solving vehicle routing problems including capacity constraints, time windows, multiple depots, and pickup-delivery scenarios.

## Overview

This skill enables AI-powered vehicle routing including:
- CVRP (Capacitated VRP) modeling
- VRPTW (VRP with Time Windows) handling
- Multi-depot routing optimization
- Pickup and delivery problem solving
- Route visualization and mapping
- Real-time route adjustment
- Driver assignment optimization

## Prerequisites

- Python 3.8+ with OR-Tools installed
- Geographic data processing libraries
- Mapping API access (optional)

## Capabilities

### 1. Capacitated VRP (CVRP)

```python
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

def solve_cvrp(distance_matrix, demands, vehicle_capacities, depot=0):
    """
    Solve Capacitated Vehicle Routing Problem
    """
    manager = pywrapcp.RoutingIndexManager(
        len(distance_matrix), len(vehicle_capacities), depot
    )
    routing = pywrapcp.RoutingModel(manager)

    # Distance callback
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # Capacity constraint
    def demand_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return demands[from_node]

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,  # null slack
        vehicle_capacities,
        True,  # start cumul at zero
        'Capacity'
    )

    # Solve
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_parameters.time_limit.seconds = 30

    solution = routing.SolveWithParameters(search_parameters)
    return extract_routes(manager, routing, solution)
```

### 2. VRP with Time Windows (VRPTW)

```python
def solve_vrptw(distance_matrix, time_matrix, time_windows,
                demands, vehicle_capacities, depot=0):
    """
    Solve VRP with Time Windows
    """
    manager = pywrapcp.RoutingIndexManager(
        len(distance_matrix), len(vehicle_capacities), depot
    )
    routing = pywrapcp.RoutingModel(manager)

    # Distance callback
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # Time dimension with time windows
    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return time_matrix[from_node][to_node]

    time_callback_index = routing.RegisterTransitCallback(time_callback)

    routing.AddDimension(
        time_callback_index,
        30,  # allow waiting time
        480,  # max time per vehicle (8 hours)
        False,
        'Time'
    )

    time_dimension = routing.GetDimensionOrDie('Time')

    # Add time window constraints
    for location_idx, (early, late) in enumerate(time_windows):
        if location_idx == depot:
            continue
        index = manager.NodeToIndex(location_idx)
        time_dimension.CumulVar(index).SetRange(early, late)

    # Minimize total time
    for i in range(len(vehicle_capacities)):
        routing.AddVariableMinimizedByFinalizer(
            time_dimension.CumulVar(routing.Start(i))
        )
        routing.AddVariableMinimizedByFinalizer(
            time_dimension.CumulVar(routing.End(i))
        )

    # Solve
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )

    solution = routing.SolveWithParameters(search_parameters)
    return extract_routes_with_times(manager, routing, solution, time_dimension)
```

### 3. Multi-Depot VRP

```python
def solve_multi_depot_vrp(distance_matrix, demands, depots,
                          vehicles_per_depot, vehicle_capacity):
    """
    Solve VRP with multiple depots
    """
    num_vehicles = sum(vehicles_per_depot)

    # Create start and end indices for each vehicle
    starts = []
    ends = []
    for depot_idx, depot in enumerate(depots):
        for _ in range(vehicles_per_depot[depot_idx]):
            starts.append(depot)
            ends.append(depot)

    manager = pywrapcp.RoutingIndexManager(
        len(distance_matrix), num_vehicles, starts, ends
    )
    routing = pywrapcp.RoutingModel(manager)

    # ... add callbacks and constraints

    return routing
```

### 4. Pickup and Delivery

```python
def solve_pdp(distance_matrix, pickups_deliveries, vehicle_capacities):
    """
    Solve Pickup and Delivery Problem
    pickups_deliveries: list of (pickup_node, delivery_node)
    """
    manager = pywrapcp.RoutingIndexManager(
        len(distance_matrix), len(vehicle_capacities), 0
    )
    routing = pywrapcp.RoutingModel(manager)

    # Add pickup and delivery constraints
    for pickup, delivery in pickups_deliveries:
        pickup_index = manager.NodeToIndex(pickup)
        delivery_index = manager.NodeToIndex(delivery)
        routing.AddPickupAndDelivery(pickup_index, delivery_index)
        routing.solver().Add(
            routing.VehicleVar(pickup_index) ==
            routing.VehicleVar(delivery_index)
        )
        routing.solver().Add(
            routing.CumulVar(pickup_index, 'Distance') <=
            routing.CumulVar(delivery_index, 'Distance')
        )

    return routing
```

### 5. Route Visualization

```python
def visualize_routes(routes, locations, output_file='routes.html'):
    """
    Generate interactive route map
    """
    import folium

    # Create map centered on locations
    center_lat = sum(loc[0] for loc in locations) / len(locations)
    center_lon = sum(loc[1] for loc in locations) / len(locations)

    m = folium.Map(location=[center_lat, center_lon], zoom_start=12)

    colors = ['red', 'blue', 'green', 'purple', 'orange']

    for route_idx, route in enumerate(routes):
        color = colors[route_idx % len(colors)]

        # Add route line
        route_coords = [locations[node] for node in route]
        folium.PolyLine(route_coords, color=color, weight=3).add_to(m)

        # Add markers
        for stop_idx, node in enumerate(route):
            folium.Marker(
                locations[node],
                popup=f"Route {route_idx}, Stop {stop_idx}",
                icon=folium.Icon(color=color)
            ).add_to(m)

    m.save(output_file)
    return output_file
```

## Process Integration

This skill integrates with the following processes:
- `transportation-route-optimization.js`
- `warehouse-layout-slotting-optimization.js`

## Output Format

```json
{
  "problem_type": "VRPTW",
  "status": "optimal",
  "total_distance": 1523,
  "total_time": 420,
  "routes": [
    {
      "vehicle_id": 0,
      "route": [0, 3, 5, 2, 0],
      "distance": 450,
      "load": 85,
      "arrival_times": [0, 45, 90, 150, 200],
      "departure_times": [0, 55, 105, 165, 200]
    }
  ],
  "unserved_customers": [],
  "metrics": {
    "vehicle_utilization": 0.85,
    "time_window_violations": 0
  }
}
```

## Tools/Libraries

| Library | Description | Use Case |
|---------|-------------|----------|
| OR-Tools | Constraint solver | All VRP variants |
| VROOM | Open source | Fast heuristics |
| OpenRouteService | Routing API | Real distances |
| Folium | Visualization | Route maps |

## Best Practices

1. **Use realistic distances** - Consider actual road networks
2. **Account for service times** - Loading/unloading duration
3. **Balance routes** - Fair workload distribution
4. **Handle uncertainties** - Buffer time windows
5. **Iterate on solutions** - Use warm starts
6. **Validate feasibility** - Check all constraints

## Constraints

- Respect vehicle capacity limits
- Honor customer time windows
- Consider driver regulations (breaks, max hours)
- Document all routing assumptions
