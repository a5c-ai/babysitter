---
name: fmea-facilitator
description: Failure Mode and Effects Analysis facilitation skill for products and processes with risk prioritization and control implementation
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: quality-management
---

# FMEA Facilitator

## Overview

The FMEA Facilitator skill provides comprehensive capabilities for facilitating Failure Mode and Effects Analysis. It supports both Design FMEA (DFMEA) and Process FMEA (PFMEA), risk prioritization using RPN or AP methodology, and control plan integration.

## Capabilities

- DFMEA (Design) facilitation
- PFMEA (Process) facilitation
- Severity/Occurrence/Detection scoring
- RPN (Risk Priority Number) calculation
- Action priority determination
- Control plan integration
- Recommended action tracking
- FMEA revision management

## Used By Processes

- QMS-005: FMEA Facilitation
- SIX-005: Root Cause Analysis
- QMS-001: ISO 9001 Implementation

## Tools and Libraries

- FMEA software
- AIAG templates
- Risk management tools
- Document management

## Usage

```yaml
skill: fmea-facilitator
inputs:
  fmea_type: "process"  # design | process
  scope: "Assembly process for Widget X"
  team:
    - "Process Engineer"
    - "Quality Engineer"
    - "Production Supervisor"
    - "Maintenance"
  process_steps:
    - step: "Install component A"
      function: "Secure component to housing"
    - step: "Torque fasteners"
      function: "Apply specified torque"
  methodology: "aiag_vda"  # traditional_rpn | aiag_vda
outputs:
  - fmea_worksheet
  - risk_assessment
  - action_plan
  - control_plan_inputs
  - revision_history
```

## FMEA Process

### Step 1: Planning and Preparation
- Define scope
- Assemble team
- Gather process flow
- Review similar FMEAs

### Step 2: Structure Analysis
- Identify process steps
- Define functions
- Establish requirements

### Step 3: Function Analysis
- Identify failure modes
- Determine effects
- Identify causes

### Step 4: Failure Analysis
- Rate Severity
- Rate Occurrence
- Rate Detection
- Calculate risk

### Step 5: Risk Analysis
- Prioritize risks
- Identify high-priority items
- Develop recommended actions

### Step 6: Optimization
- Implement actions
- Reassess risk
- Update FMEA

## Severity, Occurrence, Detection Scales

### Severity (S) - Effect on customer
| Rating | Criteria |
|--------|----------|
| 10 | Safety hazard without warning |
| 9-10 | Safety or regulatory compliance |
| 7-8 | High customer impact |
| 4-6 | Moderate impact |
| 2-3 | Minor impact |
| 1 | No effect |

### Occurrence (O) - Frequency of cause
| Rating | Frequency |
|--------|-----------|
| 10 | Very high (>100/1000) |
| 7-8 | High (20-50/1000) |
| 4-6 | Moderate (2-10/1000) |
| 2-3 | Low (<1/1000) |
| 1 | Remote (<0.01/1000) |

### Detection (D) - Ability to detect
| Rating | Detection Method |
|--------|-----------------|
| 10 | No detection method |
| 7-8 | Low probability of detection |
| 4-6 | Moderate detection |
| 2-3 | High detection probability |
| 1 | Certain detection |

## AIAG-VDA Action Priority (AP)

| AP Level | Action Required |
|----------|-----------------|
| High | Must take action |
| Medium | Should take action |
| Low | Could take action |

## Integration Points

- Control plan systems
- Design systems
- Quality Management Systems
- Risk management platforms
