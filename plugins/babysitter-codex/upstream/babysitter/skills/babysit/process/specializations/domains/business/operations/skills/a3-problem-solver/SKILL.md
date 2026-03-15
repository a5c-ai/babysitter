---
name: a3-problem-solver
description: A3 problem-solving and status reporting skill with structured thinking and coaching support
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: continuous-improvement
---

# A3 Problem Solver

## Overview

The A3 Problem Solver skill provides comprehensive capabilities for structured problem-solving using the A3 methodology. It supports problem statement crafting, root cause investigation, countermeasure development, and PDCA-based follow-up tracking.

## Capabilities

- A3 template facilitation
- Problem statement crafting
- Current condition analysis
- Target condition definition
- Gap analysis
- Root cause investigation
- Countermeasure development
- Follow-up tracking

## Used By Processes

- CI-002: A3 Problem Solving
- LEAN-003: Kaizen Event Facilitation
- SIX-005: Root Cause Analysis

## Tools and Libraries

- A3 templates
- Coaching frameworks
- Collaboration tools
- Progress tracking systems

## Usage

```yaml
skill: a3-problem-solver
inputs:
  problem_type: "problem_solving"  # problem_solving | proposal | status_report
  problem_owner: "John Smith"
  coach: "Jane Doe"
  problem_description: "Customer lead time increased from 5 days to 8 days"
  current_condition:
    metric: "lead_time"
    current_value: 8
    unit: "days"
  target_condition:
    target_value: 4
    unit: "days"
    timeline: "90 days"
outputs:
  - a3_document
  - problem_statement
  - root_cause_analysis
  - countermeasure_plan
  - implementation_schedule
  - follow_up_checklist
```

## A3 Document Sections

### Left Side (Understanding)

| Section | Purpose |
|---------|---------|
| Background | Why is this important now? |
| Current Condition | What is happening today? |
| Target Condition | What should be happening? |
| Gap Analysis | What is the difference? |
| Root Cause Analysis | Why does the gap exist? |

### Right Side (Action)

| Section | Purpose |
|---------|---------|
| Countermeasures | What will we do? |
| Implementation Plan | How and when? |
| Follow-up | How will we verify? |
| Results | What did we achieve? |

## Problem Statement Criteria

A good problem statement:
- **Specific** - Clear and measurable
- **Observable** - Based on data/facts
- **Non-judgmental** - No blame
- **Gap-focused** - Current vs. target
- **Bounded** - Defined scope

### Example
Poor: "Quality is bad"
Good: "Defect rate on Line 3 increased from 2% to 5% in Q4 2025"

## A3 Thinking Process

### PDCA Cycle
1. **Plan** - Understand problem, identify root cause, develop countermeasures
2. **Do** - Implement countermeasures
3. **Check** - Verify results
4. **Act** - Standardize or adjust

## Coaching Questions

| Section | Coaching Questions |
|---------|-------------------|
| Problem | Is it measurable? Based on data? |
| Current | Do you understand the process? |
| Target | Is it realistic? Stretch enough? |
| Root Cause | Did you verify with data? |
| Countermeasures | Do they address root causes? |
| Implementation | Who, what, when? |

## Integration Points

- Project tracking systems
- Knowledge management
- Coaching platforms
- Performance dashboards
