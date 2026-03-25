---
name: five-s-auditor
description: 5S workplace organization audit skill with scoring, photo documentation, and sustainability tracking.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: lean-manufacturing
  backlog-id: SK-IE-012
---

# five-s-auditor

You are **five-s-auditor** - a specialized skill for conducting 5S workplace organization audits with comprehensive scoring and tracking.

## Overview

This skill enables AI-powered 5S auditing including:
- Sort (Seiri) red tag analysis
- Set in Order (Seiton) layout optimization scoring
- Shine (Seiso) cleanliness inspection
- Standardize (Seiketsu) visual management assessment
- Sustain (Shitsuke) audit scheduling
- Photo documentation and comparison
- Scoring trend analysis
- Action item tracking

## Prerequisites

- 5S audit checklists
- Camera for photo documentation
- Understanding of 5S principles

## Capabilities

### 1. 5S Audit Checklist

```python
from dataclasses import dataclass
from typing import List, Optional
from enum import Enum
import datetime

class Rating(Enum):
    POOR = 1
    FAIR = 2
    GOOD = 3
    EXCELLENT = 4
    WORLD_CLASS = 5

@dataclass
class AuditQuestion:
    category: str  # S1-S5
    question: str
    rating: Optional[Rating] = None
    notes: str = ""
    photo_reference: str = ""
    action_required: bool = False

class FiveSAudit:
    """
    Complete 5S audit structure
    """
    def __init__(self, area_name: str, auditor: str):
        self.area_name = area_name
        self.auditor = auditor
        self.date = datetime.datetime.now()
        self.questions = self._initialize_questions()

    def _initialize_questions(self):
        return {
            "S1_Sort": [
                AuditQuestion("S1", "Are there any unnecessary items in the work area?"),
                AuditQuestion("S1", "Have all items been evaluated with red tags?"),
                AuditQuestion("S1", "Is there a clear process for disposing of unneeded items?"),
                AuditQuestion("S1", "Are personal items stored appropriately?"),
                AuditQuestion("S1", "Are there any broken or damaged items present?"),
            ],
            "S2_SetInOrder": [
                AuditQuestion("S2", "Do all items have a designated location?"),
                AuditQuestion("S2", "Are locations clearly marked/labeled?"),
                AuditQuestion("S2", "Are frequently used items easily accessible?"),
                AuditQuestion("S2", "Is there a clear organization system (color coding, etc.)?"),
                AuditQuestion("S2", "Can anyone find items within 30 seconds?"),
            ],
            "S3_Shine": [
                AuditQuestion("S3", "Is the floor clean and free of debris?"),
                AuditQuestion("S3", "Is equipment clean and well-maintained?"),
                AuditQuestion("S3", "Are cleaning supplies readily available?"),
                AuditQuestion("S3", "Is there a cleaning schedule posted and followed?"),
                AuditQuestion("S3", "Are potential contamination sources identified?"),
            ],
            "S4_Standardize": [
                AuditQuestion("S4", "Are visual controls in place (floor markings, signs)?"),
                AuditQuestion("S4", "Are standard procedures documented and posted?"),
                AuditQuestion("S4", "Is there a visual management board?"),
                AuditQuestion("S4", "Are abnormalities easy to identify?"),
                AuditQuestion("S4", "Are standards consistent across similar areas?"),
            ],
            "S5_Sustain": [
                AuditQuestion("S5", "Are 5S audits conducted regularly?"),
                AuditQuestion("S5", "Is there management involvement/support?"),
                AuditQuestion("S5", "Are improvement suggestions encouraged?"),
                AuditQuestion("S5", "Are previous action items completed?"),
                AuditQuestion("S5", "Is 5S part of daily routine?"),
            ]
        }

    def rate_question(self, category: str, index: int, rating: Rating,
                     notes: str = "", photo: str = ""):
        self.questions[category][index].rating = rating
        self.questions[category][index].notes = notes
        self.questions[category][index].photo_reference = photo
        if rating.value <= 2:
            self.questions[category][index].action_required = True
```

### 2. Scoring and Analysis

```python
def calculate_scores(audit: FiveSAudit):
    """
    Calculate 5S scores by category and overall
    """
    scores = {}

    for category, questions in audit.questions.items():
        rated = [q for q in questions if q.rating is not None]
        if rated:
            avg_score = sum(q.rating.value for q in rated) / len(rated)
            max_score = 5 * len(questions)
            actual_score = sum(q.rating.value for q in rated)

            scores[category] = {
                "average": round(avg_score, 2),
                "percentage": round(actual_score / max_score * 100, 1),
                "questions_rated": len(rated),
                "total_questions": len(questions),
                "action_items": sum(1 for q in questions if q.action_required)
            }

    # Overall score
    all_ratings = [q.rating.value for cat in audit.questions.values()
                   for q in cat if q.rating]
    if all_ratings:
        scores["overall"] = {
            "average": round(sum(all_ratings) / len(all_ratings), 2),
            "percentage": round(sum(all_ratings) / (5 * len(all_ratings)) * 100, 1),
            "grade": get_grade(sum(all_ratings) / len(all_ratings))
        }

    return scores

def get_grade(avg_score):
    if avg_score >= 4.5:
        return "World Class"
    elif avg_score >= 4.0:
        return "Excellent"
    elif avg_score >= 3.0:
        return "Good"
    elif avg_score >= 2.0:
        return "Fair"
    else:
        return "Needs Improvement"
```

### 3. Red Tag Analysis (Sort)

```python
@dataclass
class RedTag:
    item_description: str
    location: str
    category: str  # tools, materials, equipment, documents, other
    condition: str  # good, damaged, obsolete
    last_used: Optional[datetime.date]
    disposition: str  # keep, relocate, dispose, sell
    value_estimate: float
    responsible_person: str
    decision_date: Optional[datetime.date] = None
    action_taken: str = ""

class RedTagTracking:
    """
    Track red-tagged items during Sort phase
    """
    def __init__(self, area_name: str):
        self.area_name = area_name
        self.tags: List[RedTag] = []
        self.start_date = datetime.date.today()

    def add_tag(self, tag: RedTag):
        self.tags.append(tag)

    def summary(self):
        dispositions = {}
        for tag in self.tags:
            dispositions[tag.disposition] = dispositions.get(tag.disposition, 0) + 1

        return {
            "total_items": len(self.tags),
            "disposition_breakdown": dispositions,
            "total_value": sum(t.value_estimate for t in self.tags),
            "pending_decisions": sum(1 for t in self.tags if not t.decision_date),
            "by_category": self._by_category()
        }

    def _by_category(self):
        categories = {}
        for tag in self.tags:
            if tag.category not in categories:
                categories[tag.category] = []
            categories[tag.category].append(tag.item_description)
        return categories
```

### 4. Visual Management Assessment

```python
def assess_visual_management(area_observations):
    """
    Evaluate visual management maturity
    """
    criteria = {
        "floor_markings": {
            "present": False,
            "compliant": False,
            "comments": ""
        },
        "tool_boards": {
            "present": False,
            "shadows_complete": False,
            "all_tools_present": False,
            "comments": ""
        },
        "labeling": {
            "locations_labeled": False,
            "consistent_format": False,
            "legible": False,
            "comments": ""
        },
        "status_boards": {
            "production_status": False,
            "quality_metrics": False,
            "safety_info": False,
            "updated_regularly": False,
            "comments": ""
        },
        "abnormality_signals": {
            "andon_present": False,
            "clear_escalation": False,
            "comments": ""
        }
    }

    # Score each criterion
    score = 0
    max_score = 0

    for category, items in criteria.items():
        for key, value in items.items():
            if key != "comments":
                max_score += 1
                if area_observations.get(category, {}).get(key):
                    score += 1

    return {
        "criteria": criteria,
        "score": score,
        "max_score": max_score,
        "percentage": round(score / max_score * 100, 1) if max_score > 0 else 0,
        "maturity_level": get_visual_maturity_level(score / max_score if max_score > 0 else 0)
    }

def get_visual_maturity_level(ratio):
    if ratio >= 0.9:
        return "Level 5: World Class"
    elif ratio >= 0.7:
        return "Level 4: Proactive"
    elif ratio >= 0.5:
        return "Level 3: Systematic"
    elif ratio >= 0.3:
        return "Level 2: Basic"
    else:
        return "Level 1: Initial"
```

### 5. Trend Analysis

```python
def analyze_audit_trends(audit_history: List[dict]):
    """
    Analyze 5S scores over time
    """
    if len(audit_history) < 2:
        return {"message": "Need at least 2 audits for trend analysis"}

    # Sort by date
    sorted_audits = sorted(audit_history, key=lambda x: x['date'])

    trends = {
        "overall": [],
        "S1_Sort": [],
        "S2_SetInOrder": [],
        "S3_Shine": [],
        "S4_Standardize": [],
        "S5_Sustain": []
    }

    for audit in sorted_audits:
        trends["overall"].append({
            "date": audit['date'],
            "score": audit['scores']['overall']['percentage']
        })
        for category in ["S1_Sort", "S2_SetInOrder", "S3_Shine",
                        "S4_Standardize", "S5_Sustain"]:
            if category in audit['scores']:
                trends[category].append({
                    "date": audit['date'],
                    "score": audit['scores'][category]['percentage']
                })

    # Calculate trend direction
    analysis = {}
    for category, data in trends.items():
        if len(data) >= 2:
            recent = data[-3:] if len(data) >= 3 else data
            first_score = recent[0]['score']
            last_score = recent[-1]['score']
            change = last_score - first_score

            analysis[category] = {
                "current_score": last_score,
                "change": round(change, 1),
                "trend": "improving" if change > 2 else "declining" if change < -2 else "stable",
                "data_points": len(data)
            }

    return analysis
```

### 6. Action Item Tracking

```python
@dataclass
class ActionItem:
    description: str
    category: str  # S1-S5
    priority: str  # high, medium, low
    responsible: str
    due_date: datetime.date
    status: str = "open"  # open, in_progress, completed, overdue
    completion_date: Optional[datetime.date] = None
    notes: str = ""

class ActionItemTracker:
    """
    Track 5S improvement actions
    """
    def __init__(self):
        self.items: List[ActionItem] = []

    def add_from_audit(self, audit: FiveSAudit):
        """Generate action items from audit findings"""
        for category, questions in audit.questions.items():
            for q in questions:
                if q.action_required:
                    self.items.append(ActionItem(
                        description=f"Address: {q.question} - {q.notes}",
                        category=category,
                        priority="high" if q.rating.value == 1 else "medium",
                        responsible="TBD",
                        due_date=datetime.date.today() + datetime.timedelta(days=14)
                    ))

    def status_summary(self):
        statuses = {"open": 0, "in_progress": 0, "completed": 0, "overdue": 0}

        for item in self.items:
            if item.status == "open" and item.due_date < datetime.date.today():
                item.status = "overdue"
            statuses[item.status] += 1

        return {
            "total": len(self.items),
            "by_status": statuses,
            "completion_rate": statuses["completed"] / len(self.items) * 100 if self.items else 0,
            "overdue_count": statuses["overdue"]
        }
```

## Process Integration

This skill integrates with the following processes:
- `5s-workplace-organization-implementation.js`
- `kaizen-event-facilitation.js`
- `standard-work-development.js`

## Output Format

```json
{
  "audit_info": {
    "area": "Assembly Line 3",
    "auditor": "John Smith",
    "date": "2024-01-15"
  },
  "scores": {
    "S1_Sort": {"percentage": 80, "grade": "Good"},
    "S2_SetInOrder": {"percentage": 85, "grade": "Good"},
    "S3_Shine": {"percentage": 70, "grade": "Fair"},
    "S4_Standardize": {"percentage": 75, "grade": "Good"},
    "S5_Sustain": {"percentage": 65, "grade": "Fair"},
    "overall": {"percentage": 75, "grade": "Good"}
  },
  "trend": "improving",
  "action_items": {
    "total": 5,
    "high_priority": 2,
    "overdue": 0
  },
  "next_audit_date": "2024-02-15"
}
```

## Best Practices

1. **Regular audits** - Weekly or bi-weekly consistency
2. **Rotate auditors** - Fresh eyes find more
3. **Take photos** - Visual evidence of progress
4. **Follow up on actions** - Close the loop
5. **Celebrate wins** - Recognize improvements
6. **Post results** - Transparency drives improvement

## Constraints

- Audits should be constructive, not punitive
- Include area workers in the process
- Document all findings objectively
- Track trends over time
