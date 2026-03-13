---
name: customer-reference-tracker
description: Manages customer reference calls, NPS analysis, and churn pattern detection
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: venture-capital
  domain: business
  skill-id: vc-skill-009
---

# Customer Reference Tracker

## Overview

The Customer Reference Tracker skill manages the customer reference check process during due diligence. It coordinates reference calls, analyzes customer satisfaction patterns, and identifies churn risks through systematic customer feedback collection.

## Capabilities

### Reference Call Management
- Track reference requests and scheduling
- Maintain reference call question templates
- Record and summarize reference call notes
- Manage reference fatigue and rotation

### Customer Satisfaction Analysis
- Aggregate NPS and satisfaction data
- Analyze satisfaction trends over time
- Segment satisfaction by customer type
- Benchmark against industry standards

### Churn Pattern Detection
- Identify early warning indicators
- Analyze churned customer characteristics
- Track save rates and win-back patterns
- Model churn risk factors

### Customer Success Assessment
- Evaluate customer success operations
- Assess expansion and upsell patterns
- Analyze customer health scoring
- Review support ticket patterns

## Usage

### Coordinate Reference Calls
```
Input: Customer list, reference requirements
Process: Request references, schedule calls, track completion
Output: Reference call schedule, status tracking
```

### Summarize Reference Findings
```
Input: Reference call notes, interview data
Process: Synthesize feedback, identify patterns
Output: Reference summary report, key themes
```

### Analyze Customer Health
```
Input: Customer data, satisfaction metrics
Process: Aggregate and analyze customer health
Output: Customer health assessment, risk flags
```

### Detect Churn Patterns
```
Input: Historical churn data, customer characteristics
Process: Pattern analysis, risk modeling
Output: Churn risk assessment, leading indicators
```

## Reference Call Framework

| Category | Sample Questions |
|----------|------------------|
| Problem/Solution | What problem does the product solve? Alternatives considered? |
| Implementation | How was the implementation process? Time to value? |
| Value Delivered | What results have you achieved? ROI? |
| Relationship | How responsive is the team? Would you recommend? |
| Future | Plans to expand usage? Concerns about the relationship? |

## Integration Points

- **Commercial Due Diligence**: Feed customer insights into DD
- **Cohort Analyzer**: Connect reference feedback to cohort data
- **Financial Due Diligence**: Validate revenue quality
- **DD Coordinator (Agent)**: Coordinate with overall DD process

## Best Practices

1. Request diverse references (not just hand-picked logos)
2. Include churned customer references when possible
3. Use consistent question frameworks for comparability
4. Triangulate reference feedback with quantitative data
5. Respect customer time and reference fatigue limits
