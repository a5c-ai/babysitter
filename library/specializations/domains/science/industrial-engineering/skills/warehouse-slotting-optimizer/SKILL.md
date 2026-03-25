---
name: warehouse-slotting-optimizer
description: Warehouse slotting and layout optimization skill for pick path minimization and space utilization.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: supply-chain
  backlog-id: SK-IE-026
---

# warehouse-slotting-optimizer

You are **warehouse-slotting-optimizer** - a specialized skill for optimizing warehouse slotting and layout to minimize pick paths and maximize space utilization.

## Overview

This skill enables AI-powered warehouse optimization including:
- Product velocity analysis (ABC by picks)
- Cube movement analysis
- Pick path optimization
- Zone design and assignment
- Forward pick area sizing
- Slot assignment algorithms
- Golden zone optimization
- Slotting performance metrics

## Capabilities

### 1. Velocity Analysis

```python
import pandas as pd
import numpy as np

def velocity_analysis(order_data: pd.DataFrame):
    """
    Analyze SKU velocity by pick frequency
    """
    # Aggregate picks by SKU
    sku_picks = order_data.groupby('sku').agg({
        'quantity': 'sum',
        'order_id': 'count'
    }).rename(columns={'order_id': 'pick_count'})

    # Sort by picks descending
    sku_picks = sku_picks.sort_values('pick_count', ascending=False)

    # Calculate cumulative percentages
    total_picks = sku_picks['pick_count'].sum()
    sku_picks['cum_picks'] = sku_picks['pick_count'].cumsum()
    sku_picks['cum_pct'] = sku_picks['cum_picks'] / total_picks * 100

    # Assign velocity class
    def assign_velocity(pct):
        if pct <= 80:
            return 'Fast'  # A items - top 80% of picks
        elif pct <= 95:
            return 'Medium'  # B items
        else:
            return 'Slow'  # C items

    sku_picks['velocity_class'] = sku_picks['cum_pct'].apply(assign_velocity)

    return {
        "sku_velocity": sku_picks,
        "summary": {
            "total_skus": len(sku_picks),
            "fast_movers": len(sku_picks[sku_picks['velocity_class'] == 'Fast']),
            "medium_movers": len(sku_picks[sku_picks['velocity_class'] == 'Medium']),
            "slow_movers": len(sku_picks[sku_picks['velocity_class'] == 'Slow'])
        }
    }
```

### 2. Golden Zone Optimization

```python
def optimize_golden_zone(skus: pd.DataFrame, warehouse_config: dict):
    """
    Optimize placement in golden zone (ergonomic prime picking zone)

    Golden zone: waist to shoulder height, immediate reach
    """
    golden_zone = warehouse_config.get('golden_zone', {
        'height_min': 24,  # inches from floor
        'height_max': 54,
        'reach_max': 24  # inches from aisle
    })

    # Calculate golden zone capacity
    rack_config = warehouse_config.get('rack', {
        'bays': 100,
        'levels': 5,
        'positions_per_bay': 3
    })

    # Levels in golden zone (typically levels 2-3 of 5)
    golden_levels = [2, 3]  # Assuming 5 levels
    golden_positions = (rack_config['bays'] *
                       len(golden_levels) *
                       rack_config['positions_per_bay'])

    # Sort SKUs by pick frequency
    fast_skus = skus[skus['velocity_class'] == 'Fast'].copy()
    fast_skus = fast_skus.sort_values('pick_count', ascending=False)

    # Assign to golden zone
    assignments = []
    position_count = 0

    for idx, row in fast_skus.iterrows():
        if position_count < golden_positions:
            assignments.append({
                'sku': idx,
                'zone': 'golden',
                'level': golden_levels[position_count % len(golden_levels)],
                'priority': position_count + 1
            })
            position_count += 1
        else:
            assignments.append({
                'sku': idx,
                'zone': 'standard',
                'level': None,
                'priority': position_count + 1
            })

    return {
        "golden_zone_capacity": golden_positions,
        "skus_in_golden": position_count,
        "assignments": assignments,
        "golden_zone_pick_coverage": fast_skus.head(golden_positions)['pick_count'].sum() /
                                     skus['pick_count'].sum() * 100
    }
```

### 3. Pick Path Optimization

```python
def optimize_pick_path(picks: list, warehouse_layout: dict):
    """
    Optimize pick path through warehouse

    Uses traveling salesman heuristic
    """
    from scipy.spatial.distance import cdist
    import itertools

    # Get location coordinates for picks
    locations = []
    for pick in picks:
        loc = warehouse_layout['locations'].get(pick['location'])
        if loc:
            locations.append((pick['location'], loc['x'], loc['y']))

    # Calculate distance matrix
    coords = np.array([(l[1], l[2]) for l in locations])
    dist_matrix = cdist(coords, coords)

    # Nearest neighbor heuristic
    n = len(locations)
    visited = [False] * n
    path = [0]  # Start at first location
    visited[0] = True

    for _ in range(n - 1):
        current = path[-1]
        nearest = None
        nearest_dist = float('inf')

        for j in range(n):
            if not visited[j] and dist_matrix[current][j] < nearest_dist:
                nearest = j
                nearest_dist = dist_matrix[current][j]

        if nearest is not None:
            path.append(nearest)
            visited[nearest] = True

    # Calculate total distance
    total_distance = sum(dist_matrix[path[i]][path[i+1]]
                        for i in range(len(path)-1))

    # Return optimized sequence
    optimized_picks = [picks[i] for i in path]

    return {
        "optimized_sequence": optimized_picks,
        "total_distance": total_distance,
        "locations_count": n,
        "estimated_time_minutes": total_distance / warehouse_layout.get('walk_speed', 100) * 60
    }
```

### 4. Forward Pick Area Sizing

```python
def size_forward_pick_area(sku_data: pd.DataFrame, replenishment_cost: float,
                          space_cost_per_unit: float):
    """
    Determine optimal forward pick area size

    Balance replenishment cost vs. space cost
    """
    # Sort by velocity
    sku_data = sku_data.sort_values('picks_per_day', ascending=False)

    results = []
    cumulative_picks = 0
    total_picks = sku_data['picks_per_day'].sum()

    for i, (idx, row) in enumerate(sku_data.iterrows()):
        cumulative_picks += row['picks_per_day']
        pick_coverage = cumulative_picks / total_picks

        # Estimate costs
        forward_skus = i + 1
        space_cost = forward_skus * row.get('cube', 1) * space_cost_per_unit
        replen_trips = sku_data.head(forward_skus)['picks_per_day'].sum() / \
                      sku_data.head(forward_skus)['case_qty'].mean()
        replen_cost = replen_trips * replenishment_cost

        total_cost = space_cost + replen_cost

        results.append({
            'forward_skus': forward_skus,
            'pick_coverage': pick_coverage,
            'space_cost': space_cost,
            'replen_cost': replen_cost,
            'total_cost': total_cost
        })

        if pick_coverage >= 0.95:
            break

    # Find optimal
    optimal = min(results, key=lambda x: x['total_cost'])

    return {
        "analysis": results,
        "optimal_forward_skus": optimal['forward_skus'],
        "pick_coverage": optimal['pick_coverage'],
        "total_cost": optimal['total_cost']
    }
```

### 5. Slotting Assignment Algorithm

```python
def slot_assignment(skus: pd.DataFrame, locations: pd.DataFrame,
                   constraints: dict = None):
    """
    Assign SKUs to warehouse locations

    Considers:
    - Velocity (fast movers to best locations)
    - Cube (size compatibility)
    - Weight (heavy items at floor level)
    - Family grouping (related items together)
    """
    constraints = constraints or {}

    # Score each location
    def score_location(loc):
        score = 0
        # Distance from shipping (lower is better)
        score -= loc.get('distance_to_ship', 0) * 0.01
        # Ergonomic zone bonus
        if 24 <= loc.get('height', 0) <= 54:
            score += 10
        # Ground level for heavy
        if loc.get('level', 0) == 1:
            score += 5
        return score

    locations['score'] = locations.apply(score_location, axis=1)
    locations = locations.sort_values('score', ascending=False)

    # Sort SKUs by assignment priority
    skus['priority'] = skus['picks_per_day'] * 100 - skus.get('cube', 1)
    skus = skus.sort_values('priority', ascending=False)

    assignments = []
    used_locations = set()

    for sku_idx, sku in skus.iterrows():
        for loc_idx, loc in locations.iterrows():
            if loc_idx in used_locations:
                continue

            # Check constraints
            if sku.get('cube', 1) > loc.get('capacity', float('inf')):
                continue
            if sku.get('weight', 0) > loc.get('weight_limit', float('inf')):
                continue

            # Assign
            assignments.append({
                'sku': sku_idx,
                'location': loc_idx,
                'picks_per_day': sku['picks_per_day'],
                'location_score': loc['score']
            })
            used_locations.add(loc_idx)
            break

    return {
        "assignments": assignments,
        "assigned_count": len(assignments),
        "unassigned_skus": len(skus) - len(assignments)
    }
```

### 6. Slotting Performance Metrics

```python
def calculate_slotting_metrics(current_slotting: pd.DataFrame,
                               order_history: pd.DataFrame,
                               warehouse_config: dict):
    """
    Calculate slotting performance metrics
    """
    metrics = {}

    # Pick density (picks per foot traveled)
    total_picks = len(order_history)
    # Estimate travel based on current slotting
    travel_estimate = estimate_total_travel(current_slotting, order_history, warehouse_config)
    metrics['pick_density'] = total_picks / travel_estimate if travel_estimate > 0 else 0

    # Golden zone utilization
    golden_picks = order_history.merge(current_slotting, on='sku')
    golden_picks = golden_picks[golden_picks['zone'] == 'golden']
    metrics['golden_zone_pick_pct'] = len(golden_picks) / total_picks * 100

    # Slot utilization
    total_slots = len(current_slotting)
    active_slots = current_slotting[current_slotting['picks_per_day'] > 0]
    metrics['slot_utilization'] = len(active_slots) / total_slots * 100

    # Velocity alignment score (are fast movers in best spots?)
    current_slotting = current_slotting.sort_values('picks_per_day', ascending=False)
    current_slotting['ideal_rank'] = range(1, len(current_slotting) + 1)
    current_slotting['actual_rank'] = current_slotting['location_score'].rank(ascending=False)
    correlation = current_slotting['ideal_rank'].corr(current_slotting['actual_rank'])
    metrics['velocity_alignment'] = correlation

    return metrics

def estimate_total_travel(slotting, orders, config):
    # Simplified travel estimation
    avg_picks_per_order = len(orders) / orders['order_id'].nunique()
    avg_travel_per_pick = config.get('avg_aisle_length', 100) / 2
    return len(orders) * avg_travel_per_pick
```

## Process Integration

This skill integrates with the following processes:
- `warehouse-layout-slotting-optimization.js`
- `inventory-optimization-analysis.js`

## Output Format

```json
{
  "velocity_analysis": {
    "fast_movers": 150,
    "medium_movers": 450,
    "slow_movers": 2400
  },
  "golden_zone": {
    "capacity": 300,
    "pick_coverage": 72.5
  },
  "slotting_metrics": {
    "pick_density": 2.3,
    "velocity_alignment": 0.85
  },
  "recommendations": [
    "Move top 50 SKUs to golden zone",
    "Consider forward pick area for 200 SKUs"
  ]
}
```

## Best Practices

1. **Use actual pick data** - Not just sales or forecast
2. **Regular re-slotting** - Velocity changes over time
3. **Consider ergonomics** - Not just efficiency
4. **Family grouping** - Items ordered together
5. **Measure before/after** - Validate improvements
6. **Involve pickers** - They know the issues

## Constraints

- Requires historical pick data
- Physical constraints limit optimization
- Re-slotting has transition costs
- Balance optimization with operational flexibility
