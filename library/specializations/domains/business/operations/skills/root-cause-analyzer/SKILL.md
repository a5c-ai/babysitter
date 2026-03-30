---
name: root-cause-analyzer
description: Systematic root cause identification skill with 5 Whys, fishbone diagrams, fault tree analysis, and hypothesis testing
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: six-sigma-spc
---

# Root Cause Analyzer

## Overview

The Root Cause Analyzer skill provides comprehensive capabilities for systematic root cause identification and verification. It supports multiple analysis methods including 5 Whys, Ishikawa diagrams, fault tree analysis, and statistical hypothesis testing.

## Capabilities

- 5 Whys facilitation
- Ishikawa (fishbone) diagram creation
- Fault tree analysis (FTA)
- Hypothesis formulation
- Chi-square testing
- Correlation analysis
- Pareto chart generation
- Root cause verification

## Used By Processes

- SIX-005: Root Cause Analysis
- QMS-005: FMEA Facilitation
- CI-002: A3 Problem Solving

## Tools and Libraries

- Cause analysis tools
- Statistical testing libraries
- Visualization platforms
- Collaboration tools

## Usage

```yaml
skill: root-cause-analyzer
inputs:
  problem_statement: "25% increase in customer complaints for product X"
  analysis_method: "fishbone"  # 5_whys | fishbone | fta | is_is_not
  data:
    defect_counts_by_category:
      materials: 45
      methods: 23
      machines: 67
      manpower: 12
      measurement: 8
      environment: 5
  hypothesis_to_test: "Machine wear is causing increased defects"
outputs:
  - root_cause_diagram
  - potential_causes
  - verified_root_causes
  - pareto_analysis
  - statistical_verification
  - recommendations
```

## Analysis Methods

### 5 Whys

Ask "Why?" iteratively to drill down to root cause:
1. Why did the problem occur?
2. Why did that happen?
3. Why did that happen?
4. Why did that happen?
5. Why did that happen?

### Ishikawa (Fishbone) Categories

- **Man** (Manpower) - Training, skills, fatigue
- **Machine** - Equipment, tools, technology
- **Method** - Procedures, processes, policies
- **Material** - Raw materials, consumables
- **Measurement** - Inspection, calibration
- **Mother Nature** (Environment) - Temperature, humidity, conditions

### Fault Tree Analysis

- Top event (undesired outcome)
- AND gates (all inputs required)
- OR gates (any input sufficient)
- Basic events (root causes)

## Verification Techniques

| Technique | Use Case |
|-----------|----------|
| Chi-square test | Categorical data relationships |
| Correlation analysis | Continuous variable relationships |
| Regression | Predictive relationships |
| Designed experiments | Controlled cause-effect testing |
| Pareto analysis | Vital few vs. trivial many |

## Integration Points

- Quality Management Systems
- Corrective action systems
- Statistical analysis tools
- Knowledge management systems
