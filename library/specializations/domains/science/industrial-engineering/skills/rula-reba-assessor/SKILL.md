---
name: rula-reba-assessor
description: Rapid Upper Limb Assessment (RULA) and Rapid Entire Body Assessment (REBA) skill for posture evaluation.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: ergonomics
  backlog-id: SK-IE-021
---

# rula-reba-assessor

You are **rula-reba-assessor** - a specialized skill for evaluating work postures using RULA and REBA methodologies.

## Overview

This skill enables AI-powered posture assessment including:
- RULA scoring for upper extremity tasks
- REBA scoring for whole body postures
- Body segment angle measurement guidance
- Risk level classification
- Action level determination
- Photo/video-based assessment
- Comparative assessment reports
- Improvement recommendation generation

## Capabilities

### 1. RULA Assessment

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class RULAInput:
    # Upper Arm (Group A)
    upper_arm_angle: float  # degrees from vertical
    upper_arm_abducted: bool = False
    shoulder_raised: bool = False
    arm_supported: bool = False

    # Lower Arm
    lower_arm_angle: float  # degrees from vertical
    working_across_midline: bool = False
    working_outside_body: bool = False

    # Wrist
    wrist_angle: float  # degrees from neutral
    wrist_bent_from_midline: bool = False
    wrist_twist: str = "mid"  # "mid" or "extreme"

    # Neck (Group B)
    neck_angle: float  # degrees from vertical
    neck_twisted: bool = False
    neck_side_bent: bool = False

    # Trunk
    trunk_angle: float  # degrees from vertical
    trunk_twisted: bool = False
    trunk_side_bent: bool = False

    # Legs
    legs_supported: bool = True

    # Activity
    muscle_use_score: int = 0  # 0 or 1
    force_load_score: int = 0  # 0, 1, 2, or 3

def calculate_rula(inputs: RULAInput):
    """
    Calculate RULA score
    """
    # Upper Arm Score (1-6)
    if inputs.upper_arm_angle <= 20:
        upper_arm = 1
    elif inputs.upper_arm_angle <= 45:
        upper_arm = 2
    elif inputs.upper_arm_angle <= 90:
        upper_arm = 3
    else:
        upper_arm = 4

    # Adjustments
    if inputs.shoulder_raised:
        upper_arm += 1
    if inputs.upper_arm_abducted:
        upper_arm += 1
    if inputs.arm_supported:
        upper_arm -= 1

    upper_arm = max(1, min(6, upper_arm))

    # Lower Arm Score (1-3)
    if 60 <= inputs.lower_arm_angle <= 100:
        lower_arm = 1
    else:
        lower_arm = 2

    if inputs.working_across_midline or inputs.working_outside_body:
        lower_arm += 1

    lower_arm = min(3, lower_arm)

    # Wrist Score (1-4)
    if inputs.wrist_angle == 0:
        wrist = 1
    elif abs(inputs.wrist_angle) <= 15:
        wrist = 2
    else:
        wrist = 3

    if inputs.wrist_bent_from_midline:
        wrist += 1

    wrist = min(4, wrist)

    # Wrist Twist (1-2)
    wrist_twist = 1 if inputs.wrist_twist == "mid" else 2

    # Table A lookup
    table_a = get_table_a_score(upper_arm, lower_arm, wrist, wrist_twist)

    # Neck Score (1-6)
    if inputs.neck_angle <= 10:
        neck = 1
    elif inputs.neck_angle <= 20:
        neck = 2
    elif inputs.neck_angle <= 45:
        neck = 3
    else:
        neck = 4

    if inputs.neck_twisted:
        neck += 1
    if inputs.neck_side_bent:
        neck += 1

    neck = min(6, neck)

    # Trunk Score (1-6)
    if inputs.trunk_angle == 0:
        trunk = 1
    elif inputs.trunk_angle <= 20:
        trunk = 2
    elif inputs.trunk_angle <= 60:
        trunk = 3
    else:
        trunk = 4

    if inputs.trunk_twisted:
        trunk += 1
    if inputs.trunk_side_bent:
        trunk += 1

    trunk = min(6, trunk)

    # Legs Score (1-2)
    legs = 1 if inputs.legs_supported else 2

    # Table B lookup
    table_b = get_table_b_score(neck, trunk, legs)

    # Posture scores
    posture_a = table_a + inputs.muscle_use_score + inputs.force_load_score
    posture_b = table_b + inputs.muscle_use_score + inputs.force_load_score

    # Final RULA score from Table C
    final_score = get_table_c_score(posture_a, posture_b)

    return {
        "final_score": final_score,
        "group_a_score": table_a,
        "group_b_score": table_b,
        "posture_a": posture_a,
        "posture_b": posture_b,
        "component_scores": {
            "upper_arm": upper_arm,
            "lower_arm": lower_arm,
            "wrist": wrist,
            "wrist_twist": wrist_twist,
            "neck": neck,
            "trunk": trunk,
            "legs": legs
        },
        "action_level": get_rula_action_level(final_score)
    }

def get_rula_action_level(score):
    if score <= 2:
        return {"level": 1, "action": "Posture acceptable if not maintained for long periods"}
    elif score <= 4:
        return {"level": 2, "action": "Further investigation needed, changes may be required"}
    elif score <= 6:
        return {"level": 3, "action": "Investigation and changes required soon"}
    else:
        return {"level": 4, "action": "Investigation and changes required immediately"}
```

### 2. REBA Assessment

```python
@dataclass
class REBAInput:
    # Group A (Trunk, Neck, Legs)
    trunk_angle: float
    trunk_twisted: bool = False
    trunk_side_bent: bool = False

    neck_angle: float
    neck_twisted: bool = False
    neck_side_bent: bool = False

    legs_bilateral: bool = True  # Both legs supporting
    knee_flexion: float = 0  # degrees

    # Group B (Upper Arms, Lower Arms, Wrists)
    upper_arm_angle: float
    shoulder_raised: bool = False
    upper_arm_abducted: bool = False
    arm_supported: bool = False

    lower_arm_angle: float

    wrist_angle: float
    wrist_twisted: bool = False

    # Load/Force
    load_kg: float = 0
    shock_or_rapid: bool = False

    # Coupling
    coupling: str = "good"  # good, fair, poor, unacceptable

    # Activity
    static_posture: bool = False
    repeated_actions: bool = False
    rapid_changes: bool = False

def calculate_reba(inputs: REBAInput):
    """
    Calculate REBA score
    """
    # Trunk Score (1-5)
    if inputs.trunk_angle == 0:
        trunk = 1
    elif abs(inputs.trunk_angle) <= 20:
        trunk = 2
    elif 20 < inputs.trunk_angle <= 60:
        trunk = 3
    else:
        trunk = 4

    if inputs.trunk_twisted:
        trunk += 1
    if inputs.trunk_side_bent:
        trunk += 1

    # Neck Score (1-3)
    if 0 <= inputs.neck_angle <= 20:
        neck = 1
    else:
        neck = 2

    if inputs.neck_twisted or inputs.neck_side_bent:
        neck += 1

    # Legs Score (1-4)
    legs = 1 if inputs.legs_bilateral else 2

    if 30 <= inputs.knee_flexion <= 60:
        legs += 1
    elif inputs.knee_flexion > 60:
        legs += 2

    # Table A
    table_a = get_reba_table_a(trunk, neck, legs)

    # Load/Force Score (0-3)
    if inputs.load_kg < 5:
        load = 0
    elif inputs.load_kg <= 10:
        load = 1
    else:
        load = 2

    if inputs.shock_or_rapid:
        load += 1

    score_a = table_a + load

    # Upper Arm Score (1-6)
    if inputs.upper_arm_angle <= 20:
        upper_arm = 1
    elif inputs.upper_arm_angle <= 45:
        upper_arm = 2
    elif inputs.upper_arm_angle <= 90:
        upper_arm = 3
    else:
        upper_arm = 4

    if inputs.shoulder_raised or inputs.upper_arm_abducted:
        upper_arm += 1
    if inputs.arm_supported:
        upper_arm -= 1

    # Lower Arm Score (1-2)
    if 60 <= inputs.lower_arm_angle <= 100:
        lower_arm = 1
    else:
        lower_arm = 2

    # Wrist Score (1-3)
    if abs(inputs.wrist_angle) <= 15:
        wrist = 1
    else:
        wrist = 2

    if inputs.wrist_twisted:
        wrist += 1

    # Table B
    table_b = get_reba_table_b(upper_arm, lower_arm, wrist)

    # Coupling Score (0-3)
    coupling_scores = {"good": 0, "fair": 1, "poor": 2, "unacceptable": 3}
    coupling = coupling_scores.get(inputs.coupling.lower(), 0)

    score_b = table_b + coupling

    # Table C
    table_c = get_reba_table_c(score_a, score_b)

    # Activity Score
    activity = 0
    if inputs.static_posture:
        activity += 1
    if inputs.repeated_actions:
        activity += 1
    if inputs.rapid_changes:
        activity += 1

    final_score = table_c + activity

    return {
        "final_score": final_score,
        "score_a": score_a,
        "score_b": score_b,
        "table_c": table_c,
        "activity_score": activity,
        "risk_level": get_reba_risk_level(final_score),
        "action_level": get_reba_action_level(final_score)
    }

def get_reba_risk_level(score):
    if score == 1:
        return "Negligible"
    elif score <= 3:
        return "Low"
    elif score <= 7:
        return "Medium"
    elif score <= 10:
        return "High"
    else:
        return "Very High"

def get_reba_action_level(score):
    if score == 1:
        return {"level": 0, "action": "None necessary"}
    elif score <= 3:
        return {"level": 1, "action": "May be necessary"}
    elif score <= 7:
        return {"level": 2, "action": "Necessary"}
    elif score <= 10:
        return {"level": 3, "action": "Necessary soon"}
    else:
        return {"level": 4, "action": "Necessary NOW"}
```

### 3. Angle Measurement Guidance

```python
def get_measurement_guidance(body_part: str):
    """
    Provide guidance for measuring body segment angles
    """
    guidance = {
        "trunk": {
            "reference": "Vertical line through hip",
            "measurement_point": "Angle between trunk and vertical",
            "neutral": "0 degrees (upright)",
            "tips": [
                "Use plumb line or vertical reference",
                "Measure at shoulder level relative to hip",
                "Note any twisting or side bending"
            ]
        },
        "neck": {
            "reference": "Vertical line through trunk",
            "measurement_point": "Angle of neck flexion/extension",
            "neutral": "0-10 degrees slight flexion",
            "tips": [
                "Measure from ear to shoulder alignment",
                "Note if looking up (extension) or down (flexion)",
                "Check for rotation and side bending"
            ]
        },
        "upper_arm": {
            "reference": "Vertical line through shoulder",
            "measurement_point": "Angle of upper arm from vertical",
            "neutral": "0-20 degrees",
            "tips": [
                "Measure from shoulder joint",
                "Note if arm is in front or behind body",
                "Check for shoulder elevation and abduction"
            ]
        },
        "lower_arm": {
            "reference": "Upper arm position",
            "measurement_point": "Angle at elbow joint",
            "neutral": "60-100 degrees (elbow bent)",
            "tips": [
                "Measure elbow flexion angle",
                "Note if forearm crosses body midline"
            ]
        },
        "wrist": {
            "reference": "Neutral forearm position",
            "measurement_point": "Angle of wrist flexion/extension",
            "neutral": "0 degrees (straight)",
            "tips": [
                "Measure deviation from straight line with forearm",
                "Note radial/ulnar deviation",
                "Check for wrist rotation"
            ]
        }
    }

    return guidance.get(body_part.lower(), {"error": "Unknown body part"})
```

### 4. Comparative Assessment

```python
def compare_postures(assessments: list, method: str = "RULA"):
    """
    Compare multiple posture assessments
    """
    comparisons = []

    for assessment in assessments:
        if method == "RULA":
            result = calculate_rula(assessment['inputs'])
        else:
            result = calculate_reba(assessment['inputs'])

        comparisons.append({
            "name": assessment.get('name', 'Unnamed'),
            "description": assessment.get('description', ''),
            "score": result['final_score'],
            "action_level": result['action_level'],
            "component_scores": result.get('component_scores', {})
        })

    # Sort by score
    comparisons.sort(key=lambda x: x['score'])

    # Identify improvements
    if len(comparisons) > 1:
        baseline = comparisons[-1]  # Worst score
        best = comparisons[0]

        improvement = {
            "score_reduction": baseline['score'] - best['score'],
            "baseline": baseline['name'],
            "best_option": best['name']
        }
    else:
        improvement = None

    return {
        "method": method,
        "comparisons": comparisons,
        "improvement_potential": improvement
    }
```

### 5. Recommendation Generator

```python
def generate_posture_recommendations(result: dict, method: str = "RULA"):
    """
    Generate specific recommendations based on assessment
    """
    recommendations = []
    component_scores = result.get('component_scores', {})

    # Analyze each component and recommend
    if method == "RULA":
        if component_scores.get('upper_arm', 0) >= 3:
            recommendations.append({
                "body_part": "Upper Arm",
                "issue": "Upper arm elevation too high",
                "suggestions": [
                    "Lower work surface",
                    "Raise worker platform",
                    "Bring work closer to body"
                ]
            })

        if component_scores.get('wrist', 0) >= 3:
            recommendations.append({
                "body_part": "Wrist",
                "issue": "Excessive wrist deviation",
                "suggestions": [
                    "Use ergonomic tools with inline grip",
                    "Adjust work angle",
                    "Redesign workstation layout"
                ]
            })

        if component_scores.get('neck', 0) >= 3:
            recommendations.append({
                "body_part": "Neck",
                "issue": "Neck flexion or extension excessive",
                "suggestions": [
                    "Position work at eye level",
                    "Use document holders",
                    "Adjust monitor height"
                ]
            })

        if component_scores.get('trunk', 0) >= 3:
            recommendations.append({
                "body_part": "Trunk",
                "issue": "Forward bending or twisting",
                "suggestions": [
                    "Raise work surface",
                    "Eliminate need to reach",
                    "Provide adjustable seating"
                ]
            })

    return {
        "action_level": result['action_level'],
        "recommendations": recommendations,
        "priority": recommendations[0]['body_part'] if recommendations else None
    }
```

## Process Integration

This skill integrates with the following processes:
- `ergonomic-risk-assessment.js`
- `workstation-design-optimization.js`

## Output Format

```json
{
  "method": "RULA",
  "final_score": 5,
  "action_level": {
    "level": 3,
    "action": "Investigation and changes required soon"
  },
  "component_scores": {
    "upper_arm": 3,
    "lower_arm": 2,
    "wrist": 3,
    "neck": 2,
    "trunk": 3
  },
  "recommendations": [
    {
      "body_part": "Upper Arm",
      "suggestions": ["Lower work surface"]
    }
  ]
}
```

## Best Practices

1. **Assess worst posture** - Evaluate most strenuous position
2. **Multiple observations** - Assess several cycles
3. **Use photos/video** - Capture postures for analysis
4. **Train observers** - Ensure consistent scoring
5. **Compare before/after** - Validate improvements
6. **Consider task duration** - Factor in exposure time

## Constraints

- Subjective measurement requires training
- Snap assessment - may miss variations
- Does not account for all risk factors
- Use with other tools for complete analysis
