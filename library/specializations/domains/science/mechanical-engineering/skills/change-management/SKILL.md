---
name: change-management
description: Skill for engineering change request and order processing through PLM systems
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: mechanical-engineering
  domain: science
  category: design-review-documentation
  priority: medium
  phase: 7
  tools-libraries:
    - PTC Windchill
    - Siemens Teamcenter
    - Dassault ENOVIA
---

# Engineering Change Management Skill

## Purpose

The Engineering Change Management skill provides capabilities for managing engineering changes through PLM systems, ensuring controlled modification of designs with proper impact assessment and approval workflow.

## Capabilities

- ECR/ECO workflow initiation
- Impact assessment guidance
- Affected item identification
- Approval routing configuration
- Effectivity management
- Documentation update tracking
- Interchangeability analysis
- Configuration management

## Usage Guidelines

### Change Management Framework

#### Change Types

| Type | Description | Urgency | Approval Level |
|------|-------------|---------|----------------|
| Class I | Form/fit/function change | Normal | Full review |
| Class II | Minor change, no F/F/F impact | Normal | Limited review |
| Deviation | Temporary non-conformance | Varies | Engineering |
| Waiver | Accept as-is before build | Varies | Engineering |
| Emergency | Safety/production critical | Urgent | Expedited |

#### Change Process Flow

```
1. Change Request (ECR)
   - Problem/opportunity identification
   - Preliminary impact assessment
   - Initial approval to investigate

2. Change Investigation
   - Detailed impact analysis
   - Solution development
   - Cost/schedule estimation

3. Change Order (ECO)
   - Formal change documentation
   - Approval routing
   - Implementation planning

4. Implementation
   - Document updates
   - Manufacturing notification
   - Effectivity management

5. Closure
   - Verification of implementation
   - Record completion
```

### Engineering Change Request (ECR)

#### ECR Content

```
Required information:
- Problem statement
- Proposed solution (if known)
- Originator and date
- Affected items (preliminary)
- Impact assessment (preliminary)
- Priority/urgency
- Supporting documentation
```

#### Impact Categories

| Category | Assessment Questions |
|----------|---------------------|
| Technical | Does it affect performance, reliability, safety? |
| Cost | What is development and recurring cost impact? |
| Schedule | What is timeline impact? |
| Manufacturing | Does it affect tooling, processes, suppliers? |
| Service | Does it affect spare parts, maintenance procedures? |
| Regulatory | Does it affect certifications, approvals? |

### Engineering Change Order (ECO)

#### ECO Content

```
Required sections:
1. Change description
   - What is changing
   - Why change is needed
   - How change will be implemented

2. Affected items list
   - Part numbers
   - Document numbers
   - Revision levels (from/to)

3. Impact assessment
   - By category (cost, schedule, technical)
   - Risk assessment

4. Interchangeability
   - Form/fit/function analysis
   - Backward compatibility

5. Effectivity
   - Serial number/date effectivity
   - Retrofit requirements

6. Implementation plan
   - Tasks and responsibilities
   - Timeline
   - Verification requirements
```

### Interchangeability Analysis

#### Interchangeability Codes

| Code | Meaning | Action |
|------|---------|--------|
| D | Direct interchangeable | Replace anywhere |
| O | One-way interchangeable | New replaces old only |
| N | Not interchangeable | Separate part number |
| R | Retrofittable | Can upgrade old units |

#### Assessment Criteria

```
Form:
- Dimensions unchanged?
- Mounting unchanged?
- Interfaces unchanged?

Fit:
- Assembly process unchanged?
- Mating parts unaffected?
- Clearances maintained?

Function:
- Performance unchanged?
- Reliability maintained?
- Safety unaffected?
```

### Approval Workflow

#### Standard Routing

```
Typical approval levels:
1. Originator - Complete ECR/ECO
2. Design Engineering - Technical review
3. Analysis Engineering - Impact verification
4. Manufacturing Engineering - Process review
5. Quality Assurance - Compliance review
6. Program Management - Cost/schedule review
7. Configuration Management - Release authority
8. Customer (if required) - Acceptance
```

#### Approval Criteria

| Role | Focus Areas |
|------|-------------|
| Design Engineering | Technical correctness |
| Manufacturing | Producibility, tooling |
| Quality | Inspection, compliance |
| Supply Chain | Supplier impact, cost |
| Program Management | Schedule, budget |
| Customer | Contract compliance |

### Effectivity Management

#### Effectivity Types

```
Serial number effectivity:
- Starting serial: S/N 100
- Ending serial: S/N 199 (or blank for ongoing)

Date effectivity:
- Effective date: 2026-02-01

Lot effectivity:
- Starting lot: LOT-2026-001
```

#### Implementation Planning

```
Implementation considerations:
- Work-in-process inventory
- Finished goods inventory
- Field units
- Spare parts inventory
- Documentation updates
- Training requirements
```

### Documentation Updates

#### Affected Document Types

| Type | Update Required | Responsibility |
|------|-----------------|----------------|
| Drawings | New revision | Design |
| Models | New revision | Design |
| Specifications | As needed | Engineering |
| Procedures | As needed | Manufacturing |
| Manuals | As needed | Publications |
| Training | As needed | Training |

## Process Integration

- ME-025: Engineering Change Management

## Input Schema

```json
{
  "change_type": "ECR|ECO|deviation|waiver",
  "problem_statement": "string",
  "proposed_solution": "string",
  "affected_items": [
    {
      "item_number": "string",
      "current_revision": "string",
      "item_type": "part|document|process"
    }
  ],
  "priority": "normal|urgent|emergency",
  "originator": "string",
  "supporting_documents": "array of references"
}
```

## Output Schema

```json
{
  "change_document": {
    "number": "string",
    "type": "ECR|ECO",
    "status": "draft|in_review|approved|implemented|closed"
  },
  "impact_assessment": {
    "technical": "string",
    "cost": "number",
    "schedule": "string",
    "manufacturing": "string"
  },
  "interchangeability": {
    "code": "D|O|N|R",
    "justification": "string"
  },
  "approval_routing": {
    "current_step": "string",
    "approvers": "array",
    "target_completion": "date"
  },
  "implementation_plan": {
    "tasks": "array",
    "effectivity": "object",
    "verification_method": "string"
  }
}
```

## Best Practices

1. Document problem clearly before proposing solution
2. Assess all impact categories thoroughly
3. Identify all affected items before approval
4. Define clear effectivity for implementation
5. Update all affected documentation
6. Verify implementation before closure

## Integration Points

- Connects with Design Review for change evaluation
- Feeds into Requirements Flowdown for traceability
- Supports Configuration Management for control
- Integrates with Quality for compliance
