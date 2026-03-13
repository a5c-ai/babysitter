---
name: standard-work-documenter
description: Standard work documentation skill for work instruction creation and maintenance.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: lean-manufacturing
  backlog-id: SK-IE-013
---

# standard-work-documenter

You are **standard-work-documenter** - a specialized skill for creating and maintaining standard work documentation for consistent and improvable operations.

## Overview

This skill enables AI-powered standard work documentation including:
- Work element breakdown
- Time observation recording
- Standard work combination sheet generation
- Standard work layout diagram creation
- Job instruction breakdown sheet formatting
- Standard WIP calculation
- Visual work instruction creation
- Multi-format output (print, digital, video)

## Capabilities

### 1. Work Element Breakdown

```python
from dataclasses import dataclass
from typing import List, Optional
from enum import Enum

class ElementType(Enum):
    MANUAL = "manual"  # Operator work
    WALK = "walk"  # Movement
    WAIT = "wait"  # Waiting for machine
    AUTO = "auto"  # Machine automatic time

@dataclass
class WorkElement:
    sequence: int
    description: str
    element_type: ElementType
    time_seconds: float
    key_points: List[str]
    safety_notes: str = ""
    quality_checks: List[str] = None
    tools_required: List[str] = None

class StandardWorkBreakdown:
    """
    Break down work into standardized elements
    """
    def __init__(self, operation_name: str, takt_time: float):
        self.operation_name = operation_name
        self.takt_time = takt_time
        self.elements: List[WorkElement] = []

    def add_element(self, description: str, element_type: ElementType,
                   time: float, key_points: List[str], **kwargs):
        element = WorkElement(
            sequence=len(self.elements) + 1,
            description=description,
            element_type=element_type,
            time_seconds=time,
            key_points=key_points,
            **kwargs
        )
        self.elements.append(element)
        return element

    def summary(self):
        manual_time = sum(e.time_seconds for e in self.elements
                        if e.element_type == ElementType.MANUAL)
        walk_time = sum(e.time_seconds for e in self.elements
                       if e.element_type == ElementType.WALK)
        wait_time = sum(e.time_seconds for e in self.elements
                       if e.element_type == ElementType.WAIT)
        auto_time = sum(e.time_seconds for e in self.elements
                       if e.element_type == ElementType.AUTO)

        total_cycle_time = manual_time + walk_time + wait_time

        return {
            "operation": self.operation_name,
            "total_elements": len(self.elements),
            "manual_time": manual_time,
            "walk_time": walk_time,
            "wait_time": wait_time,
            "auto_time": auto_time,
            "cycle_time": total_cycle_time,
            "takt_time": self.takt_time,
            "takt_attainment": self.takt_time / total_cycle_time * 100 if total_cycle_time > 0 else 0
        }
```

### 2. Time Observation Recording

```python
import numpy as np
from scipy import stats

class TimeStudyRecorder:
    """
    Record and analyze time observations
    """
    def __init__(self, operation_name: str, num_cycles: int = 10):
        self.operation_name = operation_name
        self.target_cycles = num_cycles
        self.observations = {}  # {element_name: [times]}

    def record_observation(self, element_name: str, time: float):
        if element_name not in self.observations:
            self.observations[element_name] = []
        self.observations[element_name].append(time)

    def analyze_element(self, element_name: str):
        times = self.observations.get(element_name, [])
        if not times:
            return None

        return {
            "element": element_name,
            "observations": len(times),
            "mean": np.mean(times),
            "std": np.std(times, ddof=1),
            "min": np.min(times),
            "max": np.max(times),
            "cv": np.std(times, ddof=1) / np.mean(times) * 100,
            "ci_95": stats.t.interval(0.95, len(times)-1,
                                      loc=np.mean(times),
                                      scale=stats.sem(times))
        }

    def calculate_standard_time(self, element_name: str,
                                performance_rating: float = 1.0,
                                allowance_factor: float = 1.15):
        """
        Standard Time = Normal Time x Allowance Factor
        Normal Time = Observed Time x Performance Rating
        """
        analysis = self.analyze_element(element_name)
        if not analysis:
            return None

        observed_time = analysis['mean']
        normal_time = observed_time * performance_rating
        standard_time = normal_time * allowance_factor

        return {
            "element": element_name,
            "observed_time": observed_time,
            "performance_rating": performance_rating,
            "normal_time": normal_time,
            "allowance_factor": allowance_factor,
            "standard_time": standard_time
        }
```

### 3. Standard Work Combination Sheet

```python
def generate_combination_sheet(elements: List[WorkElement], takt_time: float):
    """
    Generate standard work combination sheet
    Shows manual work, walk, wait, and auto time on timeline
    """
    sheet = {
        "header": {
            "operation": "",
            "takt_time": takt_time,
            "date": "",
            "revision": ""
        },
        "timeline": [],
        "totals": {
            "manual": 0,
            "walk": 0,
            "wait": 0,
            "auto": 0,
            "cycle_time": 0
        }
    }

    current_time = 0
    for element in elements:
        entry = {
            "sequence": element.sequence,
            "description": element.description,
            "type": element.element_type.value,
            "start_time": current_time,
            "duration": element.time_seconds,
            "end_time": current_time + element.time_seconds
        }
        sheet["timeline"].append(entry)

        # Update totals
        if element.element_type == ElementType.MANUAL:
            sheet["totals"]["manual"] += element.time_seconds
        elif element.element_type == ElementType.WALK:
            sheet["totals"]["walk"] += element.time_seconds
        elif element.element_type == ElementType.WAIT:
            sheet["totals"]["wait"] += element.time_seconds
        elif element.element_type == ElementType.AUTO:
            sheet["totals"]["auto"] += element.time_seconds

        # Auto time runs parallel, others sequential
        if element.element_type != ElementType.AUTO:
            current_time += element.time_seconds

    sheet["totals"]["cycle_time"] = current_time

    return sheet

def render_combination_chart(sheet, output_format='text'):
    """
    Render visual representation of combination sheet
    """
    takt = sheet["header"]["takt_time"]
    max_time = max(takt, sheet["totals"]["cycle_time"])

    # Text-based chart
    chart_width = 60
    scale = chart_width / max_time

    lines = []
    lines.append(f"Standard Work Combination Sheet")
    lines.append(f"Takt Time: {takt:.1f}s | Cycle Time: {sheet['totals']['cycle_time']:.1f}s")
    lines.append("=" * (chart_width + 20))

    # Draw takt line position
    takt_pos = int(takt * scale)

    for entry in sheet["timeline"]:
        start_pos = int(entry["start_time"] * scale)
        end_pos = int(entry["end_time"] * scale)

        # Choose symbol based on type
        symbols = {
            "manual": "M",
            "walk": "W",
            "wait": ".",
            "auto": "A"
        }
        symbol = symbols.get(entry["type"], "?")

        bar = " " * start_pos + symbol * (end_pos - start_pos)
        bar = bar[:chart_width]

        # Add takt marker
        if takt_pos < len(bar):
            bar = bar[:takt_pos] + "|" + bar[takt_pos+1:]

        lines.append(f"{entry['sequence']:2d}. {entry['description'][:15]:15s} {bar}")

    return "\n".join(lines)
```

### 4. Job Instruction Breakdown Sheet

```python
def generate_job_instruction_sheet(elements: List[WorkElement]):
    """
    Create Training Within Industry (TWI) style job instruction sheet
    """
    sheet = {
        "operation": "",
        "equipment": "",
        "materials": [],
        "safety_ppe": [],
        "steps": []
    }

    for element in elements:
        step = {
            "important_step": element.description,
            "key_points": element.key_points,
            "reasons": []
        }

        # Generate reasons for key points
        for kp in element.key_points:
            if "safety" in kp.lower():
                step["reasons"].append("Prevents injury")
            elif "quality" in kp.lower():
                step["reasons"].append("Ensures quality")
            elif any(word in kp.lower() for word in ["easy", "efficient"]):
                step["reasons"].append("Makes work easier")
            else:
                step["reasons"].append("Required for proper operation")

        if element.safety_notes:
            step["safety_highlight"] = element.safety_notes

        sheet["steps"].append(step)

    return sheet
```

### 5. Standard WIP Calculation

```python
def calculate_standard_wip(processes: List[dict], takt_time: float):
    """
    Calculate standard work-in-process inventory

    Standard WIP = Sum of:
    - In-process WIP (parts being worked on)
    - Buffer WIP (between processes if needed)
    """
    standard_wip = {
        "in_process": 0,
        "buffer": 0,
        "total": 0,
        "by_process": []
    }

    for i, process in enumerate(processes):
        # In-process WIP: 1 part per machine/operator
        in_process = process.get('num_machines', 1)

        # Buffer WIP: needed if cycle time > takt time or machine unreliability
        buffer = 0
        cycle_time = process.get('cycle_time', 0)
        uptime = process.get('uptime', 100) / 100

        if cycle_time > takt_time or uptime < 0.95:
            # Calculate buffer based on replenishment time
            buffer = max(1, int((cycle_time / takt_time) * (1 / uptime - 1)))

        standard_wip["by_process"].append({
            "process": process.get('name', f'Process {i+1}'),
            "in_process_wip": in_process,
            "buffer_wip": buffer
        })

        standard_wip["in_process"] += in_process
        standard_wip["buffer"] += buffer

    standard_wip["total"] = standard_wip["in_process"] + standard_wip["buffer"]

    return standard_wip
```

### 6. Visual Work Instruction Generation

```python
def generate_visual_instruction(elements: List[WorkElement], output_format='html'):
    """
    Generate visual work instructions with step-by-step guidance
    """
    if output_format == 'html':
        html = """
        <html>
        <head>
            <style>
                .step { margin: 20px; padding: 15px; border: 1px solid #ccc; }
                .step-number { font-size: 24px; font-weight: bold; color: #007bff; }
                .key-point { background-color: #fff3cd; padding: 5px; margin: 5px 0; }
                .safety { background-color: #f8d7da; padding: 5px; margin: 5px 0; }
                .quality { background-color: #d4edda; padding: 5px; margin: 5px 0; }
                .time { color: #6c757d; font-size: 12px; }
            </style>
        </head>
        <body>
            <h1>Visual Work Instructions</h1>
        """

        for element in elements:
            html += f"""
            <div class="step">
                <span class="step-number">{element.sequence}</span>
                <h3>{element.description}</h3>
                <p class="time">Target Time: {element.time_seconds:.1f} seconds</p>

                <h4>Key Points:</h4>
            """

            for kp in element.key_points:
                css_class = "key-point"
                if "safety" in kp.lower():
                    css_class = "safety"
                elif "quality" in kp.lower():
                    css_class = "quality"
                html += f'<div class="{css_class}">{kp}</div>'

            if element.safety_notes:
                html += f'<div class="safety"><strong>SAFETY:</strong> {element.safety_notes}</div>'

            if element.tools_required:
                html += f'<p><strong>Tools:</strong> {", ".join(element.tools_required)}</p>'

            html += "</div>"

        html += "</body></html>"
        return html

    return None
```

## Process Integration

This skill integrates with the following processes:
- `standard-work-development.js`
- `line-balancing-analysis.js`
- `kaizen-event-facilitation.js`

## Output Format

```json
{
  "operation": "Assembly Station 3",
  "elements": 8,
  "cycle_time_seconds": 52.5,
  "takt_time_seconds": 60.0,
  "takt_attainment_percent": 114.3,
  "breakdown": {
    "manual_time": 38.0,
    "walk_time": 6.5,
    "wait_time": 8.0
  },
  "standard_wip": 3,
  "documents_generated": [
    "combination_sheet.pdf",
    "job_instruction.pdf",
    "visual_instructions.html"
  ]
}
```

## Best Practices

1. **Observe multiple cycles** - Get representative times
2. **Include all elements** - Don't skip small tasks
3. **Document key points** - Capture the "how"
4. **Keep it visual** - Pictures > words
5. **Version control** - Track revisions
6. **Involve operators** - They know best

## Constraints

- Standard work must be achievable
- Safety is non-negotiable
- Update when process changes
- Train to the standard
