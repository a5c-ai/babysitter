---
name: supplier-development-planner
description: Supplier capability development and improvement planning skill
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: supply-chain
  domain: business
  category: supplier-management
  priority: standard
---

# Supplier Development Planner

## Overview

The Supplier Development Planner supports the design and execution of supplier capability development programs. It identifies capability gaps, designs improvement initiatives, tracks milestones, and measures the return on supplier development investments.

## Capabilities

- **Supplier Capability Gap Assessment**: Current vs. required capability analysis
- **Improvement Program Design**: Structured development plan creation
- **Joint Process Improvement Planning**: Collaborative improvement initiatives
- **Technology Adoption Roadmaps**: Supplier technology advancement planning
- **Performance Target Setting**: Measurable improvement objectives
- **Milestone Tracking**: Progress monitoring and reporting
- **Resource Requirement Planning**: Investment and effort estimation
- **ROI Calculation**: Development investment return analysis

## Input Schema

```yaml
development_plan_request:
  supplier_id: string
  capability_assessment:
    current_capabilities: object
    required_capabilities: object
    gaps: array
  improvement_areas: array
    - area: string
      priority: string
      current_state: string
      target_state: string
  resources_available:
    budget: float
    personnel: array
    timeline: string
  success_metrics: array
```

## Output Schema

```yaml
development_plan_output:
  supplier_id: string
  plan_name: string
  gap_analysis:
    critical_gaps: array
    improvement_opportunities: array
    prioritization: object
  development_program:
    objectives: array
    initiatives: array
      - initiative_name: string
        description: string
        activities: array
        milestones: array
        resources: object
        timeline: object
    success_metrics: array
  roadmap:
    phases: array
    key_milestones: array
    dependencies: array
  investment_analysis:
    total_investment: float
    expected_benefits: float
    roi_projection: float
    payback_period: string
  governance:
    review_cadence: string
    escalation_path: array
```

## Usage

### Capability Gap Assessment

```
Input: Supplier audit results, capability requirements
Process: Identify and prioritize gaps
Output: Gap analysis with improvement recommendations
```

### Development Program Design

```
Input: Priority gaps, available resources, timeline
Process: Design structured improvement program
Output: Comprehensive development plan with milestones
```

### ROI Analysis

```
Input: Development investment, expected improvements
Process: Model cost savings, quality improvements, capacity gains
Output: Business case with ROI projections
```

## Integration Points

- **Supplier Management Systems**: Capability and performance data
- **Quality Systems**: Audit results, improvement tracking
- **Project Management**: Initiative tracking
- **Tools/Libraries**: Improvement planning templates, project management

## Process Dependencies

- Supplier Development Program
- Quarterly Business Review (QBR) Facilitation
- Supplier Performance Scorecard

## Best Practices

1. Focus on mutually beneficial improvements
2. Establish clear governance and accountability
3. Define measurable success criteria upfront
4. Plan for knowledge transfer and sustainability
5. Celebrate milestones and successes
6. Document lessons learned for future programs
