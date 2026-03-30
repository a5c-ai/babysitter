---
name: anthropometric-analyzer
description: Anthropometric data analysis skill for workstation design and accommodation.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: ergonomics
  backlog-id: SK-IE-022
---

# anthropometric-analyzer

You are **anthropometric-analyzer** - a specialized skill for using anthropometric data to design accommodating workspaces.

## Overview

This skill enables AI-powered anthropometric analysis including:
- Percentile calculations for design decisions
- Reach zone determination
- Work surface height recommendations
- Clearance dimension calculations
- Adjustability range specification
- Population accommodation analysis
- Design for 5th to 95th percentile
- Multi-population considerations

## Capabilities

### 1. Anthropometric Data Reference

```python
# US Adult Anthropometric Data (in inches)
# Based on NHANES and military surveys
ANTHROPOMETRIC_DATA = {
    "stature": {
        "male": {"5th": 64.0, "50th": 69.1, "95th": 74.4},
        "female": {"5th": 59.0, "50th": 63.8, "95th": 68.5}
    },
    "sitting_height": {
        "male": {"5th": 33.5, "50th": 35.7, "95th": 38.0},
        "female": {"5th": 31.1, "50th": 33.5, "95th": 35.6}
    },
    "eye_height_sitting": {
        "male": {"5th": 28.7, "50th": 31.0, "95th": 33.3},
        "female": {"5th": 26.6, "50th": 28.9, "95th": 31.2}
    },
    "shoulder_height_sitting": {
        "male": {"5th": 21.3, "50th": 23.3, "95th": 25.5},
        "female": {"5th": 19.5, "50th": 21.5, "95th": 23.6}
    },
    "elbow_height_sitting": {
        "male": {"5th": 7.4, "50th": 9.2, "95th": 11.0},
        "female": {"5th": 6.8, "50th": 8.5, "95th": 10.2}
    },
    "thigh_clearance": {
        "male": {"5th": 5.2, "50th": 6.0, "95th": 7.0},
        "female": {"5th": 4.8, "50th": 5.7, "95th": 6.8}
    },
    "knee_height_sitting": {
        "male": {"5th": 19.3, "50th": 21.4, "95th": 23.4},
        "female": {"5th": 17.8, "50th": 19.6, "95th": 21.4}
    },
    "popliteal_height": {  # Height to back of knee
        "male": {"5th": 15.5, "50th": 17.3, "95th": 19.1},
        "female": {"5th": 14.0, "50th": 15.7, "95th": 17.5}
    },
    "buttock_knee_length": {
        "male": {"5th": 21.4, "50th": 23.4, "95th": 25.4},
        "female": {"5th": 20.5, "50th": 22.4, "95th": 24.4}
    },
    "buttock_popliteal_length": {
        "male": {"5th": 17.3, "50th": 19.2, "95th": 21.1},
        "female": {"5th": 16.7, "50th": 18.5, "95th": 20.4}
    },
    "forward_reach": {
        "male": {"5th": 29.5, "50th": 32.6, "95th": 35.7},
        "female": {"5th": 26.3, "50th": 29.2, "95th": 32.1}
    },
    "shoulder_breadth": {
        "male": {"5th": 16.7, "50th": 18.3, "95th": 19.9},
        "female": {"5th": 14.5, "50th": 16.0, "95th": 17.6}
    },
    "hip_breadth_sitting": {
        "male": {"5th": 12.6, "50th": 14.2, "95th": 16.1},
        "female": {"5th": 13.0, "50th": 15.0, "95th": 17.4}
    }
}

def get_anthropometric_value(dimension: str, percentile: str,
                             gender: str = "combined"):
    """
    Get anthropometric value for a dimension
    """
    if gender == "combined":
        male_val = ANTHROPOMETRIC_DATA[dimension]["male"][percentile]
        female_val = ANTHROPOMETRIC_DATA[dimension]["female"][percentile]
        return (male_val + female_val) / 2
    else:
        return ANTHROPOMETRIC_DATA[dimension][gender.lower()][percentile]
```

### 2. Design for Percentile Population

```python
def design_for_percentile(dimension: str, design_type: str, gender: str = "combined"):
    """
    Recommend design dimension based on type of design

    design_type:
    - "reach": Use 5th percentile (shortest reach)
    - "clearance": Use 95th percentile (largest dimension)
    - "adjustable": Provide range 5th to 95th
    """
    if design_type == "reach":
        value = get_anthropometric_value(dimension, "5th", gender)
        explanation = "Design to 5th percentile to accommodate shortest reach"
    elif design_type == "clearance":
        value = get_anthropometric_value(dimension, "95th", gender)
        explanation = "Design to 95th percentile to accommodate largest users"
    elif design_type == "adjustable":
        low = get_anthropometric_value(dimension, "5th", gender)
        high = get_anthropometric_value(dimension, "95th", gender)
        value = {"min": low, "max": high}
        explanation = "Provide adjustability from 5th to 95th percentile"
    else:
        value = get_anthropometric_value(dimension, "50th", gender)
        explanation = "Using 50th percentile (average)"

    return {
        "dimension": dimension,
        "design_type": design_type,
        "value": value,
        "unit": "inches",
        "explanation": explanation
    }
```

### 3. Reach Zone Determination

```python
def calculate_reach_zones(forward_reach: float, shoulder_height: float):
    """
    Calculate primary, secondary, and tertiary reach zones
    """
    return {
        "primary_zone": {
            "description": "Frequent reaching, most comfortable",
            "horizontal_radius": forward_reach * 0.4,  # ~40% of max reach
            "height_range": {
                "min": shoulder_height * 0.7,
                "max": shoulder_height * 1.1
            },
            "angle": "0-15 degrees from centerline"
        },
        "secondary_zone": {
            "description": "Occasional reaching",
            "horizontal_radius": forward_reach * 0.6,  # ~60% of max reach
            "height_range": {
                "min": shoulder_height * 0.5,
                "max": shoulder_height * 1.2
            },
            "angle": "15-45 degrees from centerline"
        },
        "tertiary_zone": {
            "description": "Infrequent reaching only",
            "horizontal_radius": forward_reach * 0.9,  # ~90% of max reach
            "height_range": {
                "min": shoulder_height * 0.3,
                "max": shoulder_height * 1.4
            },
            "angle": "45-90 degrees from centerline"
        }
    }

def recommend_item_placement(item_frequency: str, worker_gender: str = "combined"):
    """
    Recommend placement based on frequency of use
    """
    forward_reach = get_anthropometric_value("forward_reach", "5th", worker_gender)
    shoulder_height = get_anthropometric_value("shoulder_height_sitting", "50th", worker_gender)

    zones = calculate_reach_zones(forward_reach, shoulder_height)

    if item_frequency == "frequent":
        zone = "primary_zone"
    elif item_frequency == "occasional":
        zone = "secondary_zone"
    else:
        zone = "tertiary_zone"

    return {
        "recommended_zone": zone,
        "zone_details": zones[zone],
        "design_note": f"Place within {zones[zone]['horizontal_radius']:.1f} inches horizontal reach"
    }
```

### 4. Work Surface Height Recommendations

```python
def recommend_work_surface_height(task_type: str, posture: str = "sitting",
                                  worker_gender: str = "combined"):
    """
    Recommend work surface height based on task type

    task_type: "precision", "light_assembly", "heavy_work"
    posture: "sitting" or "standing"
    """
    if posture == "sitting":
        elbow_height = get_anthropometric_value("elbow_height_sitting", "50th", worker_gender)
        seat_height = get_anthropometric_value("popliteal_height", "50th", worker_gender)
        base_height = seat_height + elbow_height

        adjustments = {
            "precision": {
                "adjustment": +4,  # Above elbow for close viewing
                "range": (base_height + 2, base_height + 6),
                "reason": "Higher for visual tasks requiring close work"
            },
            "light_assembly": {
                "adjustment": 0,  # At elbow height
                "range": (base_height - 2, base_height + 2),
                "reason": "At elbow height for typical hand work"
            },
            "heavy_work": {
                "adjustment": -4,  # Below elbow for force application
                "range": (base_height - 6, base_height - 2),
                "reason": "Below elbow to use body weight"
            }
        }
    else:  # Standing
        # Standing elbow height is approximately stature * 0.63
        stature = get_anthropometric_value("stature", "50th", worker_gender)
        elbow_height = stature * 0.63

        adjustments = {
            "precision": {
                "adjustment": +4,
                "range": (elbow_height + 2, elbow_height + 6),
                "reason": "Higher for visual precision tasks"
            },
            "light_assembly": {
                "adjustment": -2,
                "range": (elbow_height - 4, elbow_height),
                "reason": "Slightly below elbow for standing work"
            },
            "heavy_work": {
                "adjustment": -8,
                "range": (elbow_height - 10, elbow_height - 6),
                "reason": "Well below elbow for force application"
            }
        }

    task_adjustment = adjustments.get(task_type, adjustments["light_assembly"])
    recommended_height = (elbow_height if posture == "standing"
                         else seat_height + elbow_height) + task_adjustment["adjustment"]

    return {
        "task_type": task_type,
        "posture": posture,
        "recommended_height": round(recommended_height, 1),
        "adjustable_range": task_adjustment["range"],
        "reason": task_adjustment["reason"],
        "unit": "inches"
    }
```

### 5. Clearance Calculations

```python
def calculate_clearances(posture: str = "sitting", worker_gender: str = "combined"):
    """
    Calculate minimum clearance dimensions
    """
    if posture == "sitting":
        clearances = {
            "vertical_clearance_under_surface": {
                "minimum": get_anthropometric_value("thigh_clearance", "95th", worker_gender) +
                          get_anthropometric_value("popliteal_height", "95th", worker_gender) + 2,
                "dimension": "From floor to underside of work surface",
                "percentile_used": "95th",
                "reason": "Accommodate largest thigh + knee height"
            },
            "knee_room_depth": {
                "minimum": get_anthropometric_value("buttock_knee_length", "95th", worker_gender) + 2,
                "dimension": "Depth for knees under surface",
                "percentile_used": "95th"
            },
            "seat_width": {
                "minimum": get_anthropometric_value("hip_breadth_sitting", "95th", worker_gender) + 2,
                "dimension": "Seat pan width",
                "percentile_used": "95th"
            },
            "passage_width": {
                "minimum": get_anthropometric_value("shoulder_breadth", "95th", "male") + 4,
                "dimension": "Width for passage/egress",
                "percentile_used": "95th male"
            }
        }
    else:  # Standing
        clearances = {
            "overhead_clearance": {
                "minimum": get_anthropometric_value("stature", "95th", "male") + 4,
                "dimension": "Floor to overhead obstruction",
                "percentile_used": "95th male"
            },
            "work_aisle_width": {
                "minimum": 28,  # OSHA minimum
                "dimension": "Width for single-person passage",
                "standard": "OSHA"
            },
            "two_way_aisle_width": {
                "minimum": 44,
                "dimension": "Width for two-way traffic",
                "standard": "OSHA"
            }
        }

    return clearances
```

### 6. Adjustability Range Calculation

```python
def calculate_adjustability_range(dimension: str, accommodation_level: float = 0.90):
    """
    Calculate required adjustability range to accommodate population percentage

    accommodation_level: 0.90 for 90% (5th-95th), 0.95 for 95% (2.5th-97.5th)
    """
    # Get male and female data
    male_5th = ANTHROPOMETRIC_DATA[dimension]["male"]["5th"]
    male_95th = ANTHROPOMETRIC_DATA[dimension]["male"]["95th"]
    female_5th = ANTHROPOMETRIC_DATA[dimension]["female"]["5th"]
    female_95th = ANTHROPOMETRIC_DATA[dimension]["female"]["95th"]

    # Combined population range
    population_min = min(female_5th, male_5th)
    population_max = max(female_95th, male_95th)

    # Standard deviation estimate
    male_sd = (male_95th - male_5th) / 3.29  # 5th to 95th is 3.29 SDs
    female_sd = (female_95th - female_5th) / 3.29

    return {
        "dimension": dimension,
        "accommodation_level": f"{accommodation_level * 100}%",
        "required_range": {
            "min": round(population_min, 1),
            "max": round(population_max, 1)
        },
        "adjustment_span": round(population_max - population_min, 1),
        "male_range": {"5th": male_5th, "95th": male_95th},
        "female_range": {"5th": female_5th, "95th": female_95th},
        "design_recommendation": f"Provide adjustment from {population_min:.1f} to {population_max:.1f} inches"
    }
```

## Process Integration

This skill integrates with the following processes:
- `workstation-design-optimization.js`
- `ergonomic-risk-assessment.js`

## Output Format

```json
{
  "design_type": "Seated Workstation",
  "work_surface_height": {
    "recommended": 28.5,
    "adjustable_range": [26, 31],
    "unit": "inches"
  },
  "reach_zones": {
    "primary_radius": 11.8,
    "secondary_radius": 17.7
  },
  "clearances": {
    "under_surface": 25.5,
    "knee_depth": 27.4
  },
  "accommodation": "90% of mixed population"
}
```

## Best Practices

1. **Know your population** - Use appropriate data
2. **Design for adjustability** - When feasible
3. **Use correct percentiles** - Reach=5th, Clearance=95th
4. **Add margins** - Include safety buffers
5. **Consider clothing/PPE** - May add to dimensions
6. **Validate with users** - Test with actual workers

## Constraints

- Data varies by population
- Static dimensions may not reflect dynamic use
- Consider individual accommodations when needed
