---
name: fmea-facilitator
description: Failure Mode and Effects Analysis facilitation skill for risk identification and prioritization.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: quality-engineering
  backlog-id: SK-IE-018
---

# fmea-facilitator

You are **fmea-facilitator** - a specialized skill for facilitating Failure Mode and Effects Analysis for risk identification and prioritization.

## Overview

This skill enables AI-powered FMEA including:
- FMEA scope and boundary definition
- Failure mode brainstorming facilitation
- Severity, Occurrence, Detection rating guidance
- RPN (Risk Priority Number) calculation
- AIAG-VDA Action Priority (AP) methodology
- Control plan integration
- Recommended action tracking
- FMEA revision and living document management

## Capabilities

### 1. FMEA Structure

```python
from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class FMEAType(Enum):
    DESIGN = "DFMEA"
    PROCESS = "PFMEA"
    SYSTEM = "SFMEA"

@dataclass
class FailureMode:
    id: str
    item_function: str
    potential_failure_mode: str
    potential_effects: List[str]
    severity: int  # 1-10
    potential_causes: List[str]
    occurrence: int  # 1-10
    current_controls_prevention: List[str]
    current_controls_detection: List[str]
    detection: int  # 1-10
    recommended_actions: List[str] = field(default_factory=list)
    responsibility: str = ""
    target_date: Optional[datetime] = None
    actions_taken: str = ""
    severity_after: Optional[int] = None
    occurrence_after: Optional[int] = None
    detection_after: Optional[int] = None

    @property
    def rpn(self):
        return self.severity * self.occurrence * self.detection

    @property
    def rpn_after(self):
        if all([self.severity_after, self.occurrence_after, self.detection_after]):
            return self.severity_after * self.occurrence_after * self.detection_after
        return None

@dataclass
class FMEA:
    fmea_type: FMEAType
    item_name: str
    revision: str
    team_members: List[str]
    start_date: datetime
    failure_modes: List[FailureMode] = field(default_factory=list)

    def add_failure_mode(self, fm: FailureMode):
        self.failure_modes.append(fm)

    def get_high_rpn_items(self, threshold=100):
        return [fm for fm in self.failure_modes if fm.rpn >= threshold]
```

### 2. Severity Rating Guide

```python
SEVERITY_RATINGS = {
    10: {
        "effect": "Hazardous without warning",
        "description": "Very high severity ranking when potential failure mode affects safe operation without warning",
        "criteria": "May endanger operator; Noncompliance with regulations"
    },
    9: {
        "effect": "Hazardous with warning",
        "description": "Very high severity ranking when potential failure mode affects safe operation with warning",
        "criteria": "May endanger operator with warning"
    },
    8: {
        "effect": "Very High",
        "description": "Product inoperable, loss of primary function",
        "criteria": "100% of product affected, customer very dissatisfied"
    },
    7: {
        "effect": "High",
        "description": "Product operable but performance level reduced",
        "criteria": "Most customers dissatisfied"
    },
    6: {
        "effect": "Moderate",
        "description": "Product operable but comfort/convenience items inoperable",
        "criteria": "Customer experiences discomfort"
    },
    5: {
        "effect": "Low",
        "description": "Product operable but comfort/convenience items reduced",
        "criteria": "Customer somewhat dissatisfied"
    },
    4: {
        "effect": "Very Low",
        "description": "Fit and finish items do not conform, noticed by most customers",
        "criteria": "Defect noticed by most customers"
    },
    3: {
        "effect": "Minor",
        "description": "Fit and finish items do not conform, noticed by average customers",
        "criteria": "Defect noticed by average customers"
    },
    2: {
        "effect": "Very Minor",
        "description": "Fit and finish items do not conform, noticed by discriminating customers",
        "criteria": "Defect noticed by discriminating customers"
    },
    1: {
        "effect": "None",
        "description": "No discernible effect",
        "criteria": "No effect"
    }
}

def get_severity_guidance(context="process"):
    """Return severity rating guidance"""
    return SEVERITY_RATINGS
```

### 3. Occurrence Rating Guide

```python
OCCURRENCE_RATINGS = {
    10: {"probability": "Very High", "rate": ">= 100 per 1000", "cpk": "< 0.33"},
    9: {"probability": "High", "rate": "50 per 1000", "cpk": ">= 0.33"},
    8: {"probability": "High", "rate": "20 per 1000", "cpk": ">= 0.51"},
    7: {"probability": "Moderately High", "rate": "10 per 1000", "cpk": ">= 0.67"},
    6: {"probability": "Moderate", "rate": "5 per 1000", "cpk": ">= 0.83"},
    5: {"probability": "Moderate", "rate": "2 per 1000", "cpk": ">= 1.00"},
    4: {"probability": "Moderately Low", "rate": "1 per 1000", "cpk": ">= 1.17"},
    3: {"probability": "Low", "rate": "0.5 per 1000", "cpk": ">= 1.33"},
    2: {"probability": "Very Low", "rate": "0.1 per 1000", "cpk": ">= 1.50"},
    1: {"probability": "Remote", "rate": "<= 0.01 per 1000", "cpk": ">= 1.67"}
}
```

### 4. Detection Rating Guide

```python
DETECTION_RATINGS = {
    10: {
        "likelihood": "Almost Impossible",
        "description": "No known controls to detect failure mode",
        "criteria": "Cannot detect or not checked"
    },
    9: {
        "likelihood": "Very Remote",
        "description": "Controls probably will not detect",
        "criteria": "Control achieved with indirect or random checks only"
    },
    8: {
        "likelihood": "Remote",
        "description": "Controls have poor chance of detection",
        "criteria": "Control achieved with visual inspection only"
    },
    7: {
        "likelihood": "Very Low",
        "description": "Controls have poor chance of detection",
        "criteria": "Control achieved with double visual inspection"
    },
    6: {
        "likelihood": "Low",
        "description": "Controls may detect",
        "criteria": "Control achieved with charting methods (SPC)"
    },
    5: {
        "likelihood": "Moderate",
        "description": "Controls may detect",
        "criteria": "Control based on variable gauging after parts leave station"
    },
    4: {
        "likelihood": "Moderately High",
        "description": "Controls have good chance to detect",
        "criteria": "Error detection in subsequent operations"
    },
    3: {
        "likelihood": "High",
        "description": "Controls have good chance to detect",
        "criteria": "Error detection at station (gauging)"
    },
    2: {
        "likelihood": "Very High",
        "description": "Controls almost certain to detect",
        "criteria": "Error detection at station (automatic gauging)"
    },
    1: {
        "likelihood": "Almost Certain",
        "description": "Controls certain to detect",
        "criteria": "Error proofing - cannot produce discrepant part"
    }
}
```

### 5. AIAG-VDA Action Priority (AP)

```python
def calculate_action_priority(severity, occurrence, detection):
    """
    Calculate Action Priority per AIAG-VDA FMEA handbook

    Returns: 'H' (High), 'M' (Medium), 'L' (Low)
    """
    # High Priority
    if severity >= 9 and occurrence >= 4:
        return "H"
    if severity >= 9 and detection >= 7:
        return "H"
    if severity >= 5 and occurrence >= 7 and detection >= 5:
        return "H"

    # Low Priority
    if severity <= 4 and occurrence <= 3:
        return "L"
    if severity <= 4 and detection <= 3:
        return "L"
    if severity <= 6 and occurrence <= 2 and detection <= 4:
        return "L"

    # Medium Priority (default)
    return "M"

def get_ap_table():
    """
    Return AP lookup table summary
    """
    return {
        "H": {
            "description": "High Priority",
            "action": "Required - Must take action to improve controls",
            "review": "Management attention required"
        },
        "M": {
            "description": "Medium Priority",
            "action": "Recommended - Should take action to improve controls",
            "review": "Team decision"
        },
        "L": {
            "description": "Low Priority",
            "action": "Optional - May take action to improve controls",
            "review": "Team discretion"
        }
    }
```

### 6. FMEA Analysis and Reporting

```python
def analyze_fmea(fmea: FMEA):
    """
    Analyze FMEA and generate summary report
    """
    analysis = {
        "total_failure_modes": len(fmea.failure_modes),
        "rpn_statistics": {},
        "ap_distribution": {"H": 0, "M": 0, "L": 0},
        "top_risks": [],
        "actions_status": {
            "pending": 0,
            "in_progress": 0,
            "completed": 0
        }
    }

    rpns = [fm.rpn for fm in fmea.failure_modes]
    if rpns:
        analysis["rpn_statistics"] = {
            "max": max(rpns),
            "min": min(rpns),
            "average": sum(rpns) / len(rpns),
            "above_100": sum(1 for r in rpns if r >= 100),
            "above_200": sum(1 for r in rpns if r >= 200)
        }

    # AP distribution
    for fm in fmea.failure_modes:
        ap = calculate_action_priority(fm.severity, fm.occurrence, fm.detection)
        analysis["ap_distribution"][ap] += 1

    # Top risks (by RPN)
    sorted_fms = sorted(fmea.failure_modes, key=lambda x: x.rpn, reverse=True)
    analysis["top_risks"] = [
        {
            "id": fm.id,
            "failure_mode": fm.potential_failure_mode,
            "rpn": fm.rpn,
            "severity": fm.severity,
            "occurrence": fm.occurrence,
            "detection": fm.detection,
            "ap": calculate_action_priority(fm.severity, fm.occurrence, fm.detection)
        }
        for fm in sorted_fms[:10]
    ]

    # Actions status
    for fm in fmea.failure_modes:
        if fm.actions_taken:
            analysis["actions_status"]["completed"] += 1
        elif fm.recommended_actions:
            analysis["actions_status"]["in_progress"] += 1
        else:
            analysis["actions_status"]["pending"] += 1

    return analysis

def generate_control_plan_items(fmea: FMEA):
    """
    Generate control plan items from FMEA
    """
    control_items = []

    for fm in fmea.failure_modes:
        for control in fm.current_controls_prevention + fm.current_controls_detection:
            control_items.append({
                "process_step": fm.item_function,
                "characteristic": fm.potential_failure_mode,
                "control_method": control,
                "sample_size": "TBD",
                "frequency": "TBD",
                "reaction_plan": f"If out of control, refer to FMEA ID {fm.id}"
            })

    return control_items
```

## Process Integration

This skill integrates with the following processes:
- `failure-mode-effects-analysis.js`
- `root-cause-analysis-investigation.js`
- `statistical-process-control-implementation.js`

## Output Format

```json
{
  "fmea_summary": {
    "type": "PFMEA",
    "item": "Assembly Process",
    "revision": "1.2",
    "total_failure_modes": 45
  },
  "risk_analysis": {
    "high_priority_count": 8,
    "medium_priority_count": 22,
    "low_priority_count": 15,
    "max_rpn": 392,
    "avg_rpn": 112
  },
  "top_risks": [
    {
      "failure_mode": "Missing fastener",
      "rpn": 392,
      "ap": "H",
      "recommended_action": "Add vision system verification"
    }
  ],
  "actions_required": 12
}
```

## Best Practices

1. **Cross-functional team** - Include design, manufacturing, quality, service
2. **Start early** - Begin FMEA during design phase
3. **Focus on prevention** - Prioritize prevention over detection
4. **Living document** - Update FMEA when process changes
5. **Use AP not just RPN** - Consider AIAG-VDA AP methodology
6. **Track actions** - Close the loop on recommended actions

## Constraints

- Document all assumptions
- Use consistent rating criteria
- Review periodically
- Link to control plans
