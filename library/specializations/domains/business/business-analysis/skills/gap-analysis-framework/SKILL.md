---
name: gap-analysis-framework
description: Structured gap analysis with automated comparison and prioritization for current vs future state analysis
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: business-analysis
  domain: business
  id: SK-005
  category: Analysis
---

# Gap Analysis Framework

## Overview

The Gap Analysis Framework skill provides specialized capabilities for systematic comparison of current and future states, identification of gaps, root cause analysis, and prioritized improvement planning. This skill enables structured analysis that drives actionable improvement roadmaps.

## Capabilities

### Current-State vs Future-State Comparison
- Create structured current-state vs future-state comparisons
- Define comparison dimensions and criteria
- Quantify gaps with measurable metrics
- Generate visual comparison matrices

### Gap Matrix by Capability Area
- Generate gap matrices organized by capability area
- Assess maturity levels for each capability
- Calculate gap severity by dimension
- Create capability heat maps

### Root Cause Analysis
- Apply 5 Whys technique for gap root causes
- Create Fishbone (Ishikawa) diagrams
- Identify systemic vs symptomatic issues
- Link gaps to underlying causes

### Gap Severity Scoring
- Calculate gap severity scores using standardized criteria
- Weight gaps by business impact
- Factor in urgency and risk
- Generate composite severity ratings

### Impact/Effort Prioritization
- Prioritize gaps using impact/effort matrix
- Classify as Quick Wins, Major Projects, Fill-ins, or Thankless Tasks
- Calculate priority scores
- Generate prioritized gap lists

### Improvement Roadmap Generation
- Generate phased improvement roadmaps
- Define milestones and timelines
- Assign resource requirements
- Create dependency mappings

### Gap Closure Tracking
- Track gap closure progress over time
- Define closure criteria and metrics
- Monitor improvement velocity
- Generate progress dashboards

## Usage

### Create Gap Analysis
```
Perform gap analysis between current and future states:

Current State: [Description of current capabilities/processes]
Future State: [Description of desired capabilities/processes]

Identify gaps by capability area and calculate severity.
```

### Root Cause Analysis
```
Perform root cause analysis on these gaps:
[List of identified gaps]

Apply 5 Whys technique and create Fishbone diagram structure.
```

### Prioritize Gaps
```
Prioritize these gaps using impact/effort analysis:
[Gap list with descriptions]

Generate prioritization matrix and recommended sequence.
```

### Generate Improvement Roadmap
```
Create an improvement roadmap to close these gaps:
[Prioritized gap list]

Include phases, milestones, and resource requirements.
```

## Process Integration

This skill integrates with the following business analysis processes:
- process-gap-analysis.js - Core gap analysis activities
- change-readiness-assessment.js - Readiness gap identification
- change-impact-analysis.js - Impact gap assessment
- solution-options-analysis.js - Solution gap evaluation

## Dependencies

- Comparison algorithms
- Visualization libraries for matrices and diagrams
- Prioritization calculation engines
- Roadmap generation templates

## Gap Analysis Frameworks Reference

### Gap Severity Scoring Matrix
| Severity Level | Score | Description | Response |
|---------------|-------|-------------|----------|
| Critical | 5 | Prevents business operation | Immediate action |
| High | 4 | Significant business impact | Priority resolution |
| Medium | 3 | Moderate business impact | Planned resolution |
| Low | 2 | Minor business impact | Scheduled resolution |
| Minimal | 1 | Negligible impact | Monitor only |

### Impact/Effort Matrix Quadrants
| Quadrant | Impact | Effort | Strategy |
|----------|--------|--------|----------|
| Quick Wins | High | Low | Do first |
| Major Projects | High | High | Plan carefully |
| Fill-ins | Low | Low | Do if time permits |
| Thankless Tasks | Low | High | Avoid or defer |

### 5 Whys Template
```
Gap: [Statement of gap]
Why 1: [First level cause]
Why 2: [Second level cause]
Why 3: [Third level cause]
Why 4: [Fourth level cause]
Why 5: [Root cause]
```

### Fishbone Diagram Categories (6M)
1. **Manpower**: People-related causes
2. **Methods**: Process-related causes
3. **Machines**: Technology/tool causes
4. **Materials**: Input/resource causes
5. **Measurements**: Metric/monitoring causes
6. **Mother Nature**: Environmental causes

### Capability Maturity Levels
| Level | Name | Description |
|-------|------|-------------|
| 1 | Initial | Ad-hoc, unpredictable |
| 2 | Managed | Reactive, project-level |
| 3 | Defined | Proactive, organizational |
| 4 | Quantitatively Managed | Measured, controlled |
| 5 | Optimizing | Continuous improvement |
