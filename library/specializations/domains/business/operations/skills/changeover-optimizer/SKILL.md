---
name: changeover-optimizer
description: Setup and changeover time reduction skill with SMED methodology and sequence optimization
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: workflow-automation
---

# Changeover Optimizer

## Overview

The Changeover Optimizer skill provides comprehensive capabilities for reducing setup and changeover times. It supports SMED (Single-Minute Exchange of Die) methodology, sequence optimization, and changeover time tracking.

## Capabilities

- Internal/external setup separation
- Changeover video analysis
- Parallel task identification
- Standardization opportunities
- Quick-release mechanisms
- Sequence optimization
- Changeover matrix
- Time reduction tracking

## Used By Processes

- LEAN-004: Kanban System Design
- CAP-002: Production Scheduling Optimization
- LEAN-003: Kaizen Event Facilitation

## Tools and Libraries

- Video analysis tools
- SMED templates
- Time study software
- Scheduling optimization

## Usage

```yaml
skill: changeover-optimizer
inputs:
  equipment: "Injection Molding Press 5"
  current_changeover_time: 120  # minutes
  target_changeover_time: 30
  changeover_data:
    video_analysis: "changeover_video_url"
    task_breakdown:
      - task: "Remove old mold"
        time: 15
        type: "internal"
      - task: "Get new mold from storage"
        time: 20
        type: "internal"
      - task: "Install new mold"
        time: 25
        type: "internal"
      - task: "Connect utilities"
        time: 15
        type: "internal"
      - task: "Adjust parameters"
        time: 25
        type: "internal"
      - task: "Run test shots"
        time: 20
        type: "internal"
outputs:
  - current_state_analysis
  - internal_external_separation
  - improvement_opportunities
  - optimized_procedure
  - changeover_matrix
  - implementation_plan
```

## SMED Methodology

### Stage 1: Separate Internal and External Setup

| Type | Definition | Goal |
|------|------------|------|
| Internal | Must stop machine | Minimize |
| External | Machine running | Maximize |

### Stage 2: Convert Internal to External

- Pre-stage tools and materials
- Pre-heat/pre-cool components
- Prepare documentation
- Pre-adjust settings

### Stage 3: Streamline All Operations

- Parallel tasks (multiple operators)
- Eliminate adjustments
- Standardize procedures
- Use quick-release mechanisms

## Changeover Analysis

```
Current State:
- Total time: 120 minutes
- Internal: 100 minutes
- External: 20 minutes

Improvement Opportunities:
1. Move mold retrieval to external: -20 min
2. Pre-heat mold: -10 min
3. Use quick-clamps: -15 min
4. Parallel connection work: -10 min
5. Eliminate test shots: -15 min

Target State:
- Total time: 30 minutes
- Internal: 25 minutes
- External: 35 minutes
```

## Changeover Matrix

| From / To | Product A | Product B | Product C |
|-----------|-----------|-----------|-----------|
| Product A | - | 30 min | 45 min |
| Product B | 35 min | - | 25 min |
| Product C | 40 min | 30 min | - |

## Quick Changeover Techniques

| Technique | Application |
|-----------|-------------|
| Quick-release clamps | Replace bolts |
| Intermediate jigs | Pre-positioned tooling |
| Color coding | Visual identification |
| One-turn fasteners | Reduce turns required |
| Standardized heights | Eliminate adjustments |
| Preset gauges | Eliminate measurement |

## Implementation Steps

1. Document current state (video)
2. Separate internal/external
3. Convert internal to external
4. Streamline internal setup
5. Streamline external setup
6. Standardize and train
7. Track and improve

## Integration Points

- Production scheduling systems
- Video analysis tools
- Training platforms
- OEE tracking systems
