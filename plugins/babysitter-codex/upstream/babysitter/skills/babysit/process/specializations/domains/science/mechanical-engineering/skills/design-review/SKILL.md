---
name: design-review
description: Skill for formal design review preparation and execution (PDR/CDR)
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
    - PLM systems
    - Requirements management tools
    - Presentation tools
---

# Design Review Management Skill

## Purpose

The Design Review Management skill provides capabilities for preparing and executing formal design reviews (PDR/CDR), enabling systematic verification of design maturity and stakeholder alignment.

## Capabilities

- Design review agenda preparation
- Review criteria and checklist development
- Technical presentation guidance
- Action item tracking and management
- Review board coordination
- Design maturity assessment
- Gate criteria verification
- Review meeting facilitation

## Usage Guidelines

### Design Review Types

#### Review Gate Framework

| Review | Timing | Purpose | Key Questions |
|--------|--------|---------|---------------|
| SRR | Requirements phase | Requirements complete | Are requirements understood? |
| PDR | Preliminary design | Design approach approved | Will the design work? |
| CDR | Detailed design | Design ready for build | Is the design complete? |
| TRR | Test readiness | Ready for qualification | Can we test this? |
| PRR | Production | Ready for manufacturing | Can we build this? |

#### Preliminary Design Review (PDR)

```
Entry criteria:
- Requirements baselined
- Preliminary design complete
- Key trade studies completed
- Risk assessment performed
- Preliminary analysis complete

Exit criteria:
- Design approach approved
- Requirements verified feasible
- Major risks identified and mitigated
- Development plan approved
- Resources allocated
```

#### Critical Design Review (CDR)

```
Entry criteria:
- Detailed design complete
- All analysis complete
- Drawings released for review
- Bill of materials complete
- Manufacturing plan drafted

Exit criteria:
- Design frozen
- Analysis approved
- Drawings approved for release
- Manufacturing plan approved
- Test plan approved
```

### Review Preparation

#### Agenda Development

```
Standard review agenda:
1. Introduction and objectives (15 min)
2. Requirements review (30 min)
3. Design overview (45 min)
4. Analysis summary (30 min)
5. Manufacturing approach (30 min)
6. Test approach (30 min)
7. Risk assessment (30 min)
8. Schedule and cost (15 min)
9. Action items and closure (30 min)
```

#### Review Package

1. **Documentation**
   - Design description
   - Requirements verification matrix
   - Analysis reports
   - Drawings/models
   - Risk register
   - Development schedule

2. **Presentation Materials**
   - Overview slides
   - Technical deep-dive backup
   - Supporting data
   - Action item log (from previous review)

### Review Checklists

#### Design Checklist (Mechanical)

```
Requirements:
[ ] All requirements allocated and traceable
[ ] Derived requirements documented
[ ] Interface requirements defined
[ ] Verification methods assigned

Design:
[ ] Design meets all requirements
[ ] Design intent documented
[ ] Material selections justified
[ ] Tolerances appropriate for function
[ ] Accessibility for maintenance
[ ] Safety considerations addressed

Analysis:
[ ] Structural analysis complete
[ ] Thermal analysis complete
[ ] Fatigue life adequate
[ ] Weight budget met
[ ] Margins documented

Manufacturing:
[ ] Design is manufacturable
[ ] Tolerances achievable
[ ] Special processes identified
[ ] Supplier capability verified
[ ] Cost estimate complete
```

#### Risk Assessment Checklist

```
For each risk:
[ ] Risk clearly defined
[ ] Likelihood assessed
[ ] Consequence assessed
[ ] Mitigation plan defined
[ ] Responsible party assigned
[ ] Target closure date set
[ ] Status tracked
```

### Review Execution

#### Review Board Composition

| Role | Responsibility | Required/Optional |
|------|---------------|-------------------|
| Chair | Lead review, decisions | Required |
| Secretary | Record actions | Required |
| Chief Engineer | Technical authority | Required |
| Design Lead | Present design | Required |
| Analysis Lead | Present analysis | Required |
| Manufacturing | Assess producibility | Required |
| Quality | Compliance verification | Required |
| Customer | Requirements owner | Situational |

#### Decision Criteria

```
Review outcomes:
- APPROVED: All criteria met, proceed to next phase
- CONDITIONAL: Proceed with identified conditions
- NOT APPROVED: Return to previous phase

Voting process:
- Unanimous for approval
- Document dissenting opinions
- Escalation path for unresolved issues
```

### Action Item Management

#### Action Item Content

```
Required information:
- Unique ID
- Description
- Assigned to
- Due date
- Priority (high/medium/low)
- Status
- Closure criteria
- Resolution summary
```

#### Tracking Process

```
Action item lifecycle:
1. Opened at review
2. Assigned and acknowledged
3. Work in progress
4. Resolution proposed
5. Reviewed and verified
6. Closed
```

## Process Integration

- ME-024: Design Review Process (PDR/CDR)

## Input Schema

```json
{
  "review_type": "SRR|PDR|CDR|TRR|PRR",
  "project_info": {
    "name": "string",
    "phase": "string",
    "schedule_date": "date"
  },
  "review_scope": {
    "systems": "array",
    "requirements": "array of requirement IDs"
  },
  "previous_actions": "array of action items",
  "attendees": {
    "required": "array",
    "optional": "array"
  }
}
```

## Output Schema

```json
{
  "review_package": {
    "agenda": "document reference",
    "presentation": "file reference",
    "checklists": "array of checklist references"
  },
  "review_results": {
    "decision": "approved|conditional|not_approved",
    "conditions": "array (if conditional)",
    "action_items": [
      {
        "id": "string",
        "description": "string",
        "assigned_to": "string",
        "due_date": "date",
        "priority": "high|medium|low"
      }
    ]
  },
  "maturity_assessment": {
    "overall_score": "number (1-5)",
    "by_area": "object",
    "gaps_identified": "array"
  },
  "meeting_minutes": "document reference"
}
```

## Best Practices

1. Distribute review package in advance (1 week minimum)
2. Pre-brief key stakeholders on critical issues
3. Focus review time on decisions, not presentations
4. Document all action items with clear ownership
5. Follow up on action items before next review
6. Maintain consistent review standards across projects

## Integration Points

- Connects with Requirements Flowdown for verification
- Feeds into Change Management for design changes
- Supports Test Planning for verification evidence
- Integrates with Quality for compliance
