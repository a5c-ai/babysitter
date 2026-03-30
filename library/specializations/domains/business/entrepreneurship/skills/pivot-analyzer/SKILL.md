---
name: pivot-analyzer
description: Analyze pivot decisions with evidence-based frameworks
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
metadata:
  specialization: entrepreneurship
  domain: business
  category: Strategy
  skill-id: SK-020
---

# Pivot Analyzer Skill

## Overview

The Pivot Analyzer skill provides evidence-based frameworks for analyzing pivot decisions. It enables startups to systematically evaluate whether to pivot or persevere by compiling validation evidence, scoring pivot signals, generating alternatives, and planning pivot execution with documented rationale.

## Capabilities

### Core Functions
- **Evidence Compilation**: Compile and organize validation evidence from customer discovery
- **Pivot Signal Scoring**: Score and weight signals indicating need for pivot
- **Alternative Generation**: Generate and categorize pivot alternatives
- **Option Evaluation**: Evaluate pivot options against defined criteria
- **Cost Calculation**: Calculate pivot costs (time, resources, opportunity)
- **Execution Planning**: Plan pivot execution with milestones and metrics
- **Rationale Documentation**: Document pivot rationale for stakeholders and investors
- **Progress Tracking**: Track post-pivot progress against goals

### Advanced Features
- Pivot type classification (customer, problem, solution, channel, etc.)
- Team alignment assessment
- Investor communication planning
- Resource reallocation modeling
- Risk assessment by pivot type
- Success probability estimation
- Competitor response prediction
- Market timing analysis

## Usage

### Input Requirements
- Current business model/hypothesis
- Validation evidence collected
- Key metrics and trends
- Customer feedback summary
- Market signals and changes
- Resource constraints
- Team capabilities

### Output Deliverables
- Pivot signal scorecard
- Evidence synthesis report
- Pivot alternatives matrix
- Evaluation criteria framework
- Cost-benefit analysis
- Recommended pivot type
- Execution roadmap
- Stakeholder communication plan

### Process Integration
This skill integrates with the following processes:
- `pivot-decision-framework.js` - Primary integration for all phases
- `product-market-fit-assessment.js` - PMF signal analysis
- `business-model-canvas.js` - Business model iteration
- `mvp-definition-development.js` - MVP pivot requirements

### Example Invocation
```
Skill: pivot-analyzer
Context: B2C mobile app struggling with retention
Input:
  - Current Model: Freemium B2C fitness app
  - Evidence:
    - DAU declining 10% MoM for 3 months
    - 40% of churned users cite "too generic"
    - Enterprise inquiries from 5 companies
    - High NPS among power users (small segment)
  - Runway: 8 months
Output:
  - Pivot Signal Score: 7.5/10 (Recommend Pivot)
  - Key Signals: Retention trend, market feedback, opportunity signals
  - Pivot Alternatives:
    1. Customer Segment Pivot: B2C to B2B (enterprise wellness)
    2. Zoom-in Pivot: Focus on power user segment
    3. Platform Pivot: Become API/SDK for other apps
  - Recommended: B2B pivot based on pull signals
  - Execution Plan: 12-week pivot roadmap
  - Investor Communication: Draft narrative
```

## Dependencies

- Lean Startup methodology frameworks
- Decision analysis tools
- Evidence tracking systems
- Financial modeling capabilities
- Communication templates

## Best Practices

1. Base pivot decisions on evidence, not intuition or frustration
2. Distinguish between "not working yet" and "fundamentally flawed"
3. Ensure sufficient runway to execute pivot (6+ months recommended)
4. Consider multiple pivot types, not just the obvious one
5. Evaluate what assets and learnings carry forward
6. Get team alignment before committing to pivot
7. Communicate pivot rationale clearly to investors
8. Set clear success metrics for the pivot
9. Time-box pivot validation (avoid endless pivoting)
10. Preserve optionality when possible
11. Consider hybrid approaches (pivot + partial perseverance)
12. Document learnings from pre-pivot phase for future reference
