---
name: requirements-flowdown
description: Skill for systematic requirements capture, decomposition, and traceability
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: mechanical-engineering
  domain: science
  category: design-development
  priority: medium
  phase: 7
  tools-libraries:
    - IBM DOORS
    - Jama Connect
    - Polarion
---

# Requirements Flow-Down Skill

## Purpose

The Requirements Flow-Down skill provides systematic capabilities for capturing, decomposing, and tracing requirements throughout the mechanical design process, ensuring design intent is properly communicated and verified.

## Capabilities

- Stakeholder requirements elicitation
- Functional requirements decomposition
- Performance requirements specification
- Design constraint identification
- Requirements traceability matrix
- Verification method assignment
- Requirements change management
- Code and standard flow-down

## Usage Guidelines

### Requirements Hierarchy

#### Requirements Levels

```
Level 1: Stakeholder Requirements
- What the customer/user needs
- High-level, solution-independent
- Source: Customer specifications, standards

Level 2: System Requirements
- What the system must do
- Allocated from stakeholder requirements
- Source: System engineering

Level 3: Subsystem Requirements
- What each subsystem must do
- Allocated from system requirements
- Source: Architecture trade studies

Level 4: Component Requirements
- What each component must do
- Allocated from subsystem requirements
- Source: Detailed design
```

#### Requirement Types

| Type | Description | Example |
|------|-------------|---------|
| Functional | What the system does | "Shall lift 500 kg" |
| Performance | How well it performs | "Lifting time < 30 sec" |
| Interface | Connections to other systems | "Shall mate with Type A connector" |
| Environmental | Operating conditions | "Shall operate at -40 to +85 C" |
| Physical | Size, weight, shape | "Shall weigh < 25 kg" |
| Reliability | Failure characteristics | "MTBF > 10,000 hours" |
| Maintainability | Service characteristics | "Shall be serviceable in field" |
| Safety | Hazard prevention | "Shall prevent pinch points" |

### Requirements Development

#### Requirements Attributes

```
Each requirement should have:
- Unique identifier (REQ-XXX-XXXX)
- Requirement text (shall statement)
- Rationale (why needed)
- Source (parent requirement or stakeholder)
- Priority (must have, should have, nice to have)
- Verification method (analysis, test, inspection, demo)
- Owner (responsible engineer)
- Status (draft, approved, verified)
```

#### Well-Written Requirements

```
Good requirement characteristics (SMART):
- Specific: Unambiguous and clear
- Measurable: Quantifiable acceptance criteria
- Achievable: Technically feasible
- Relevant: Traces to stakeholder need
- Traceable: Links up and down hierarchy

Bad: "The system shall be easy to use"
Good: "The system shall be operable by one person
      without tools within 5 minutes of training"
```

### Requirements Decomposition

#### Decomposition Process

1. **Parse Parent Requirement**
   - Identify measurable parameters
   - Identify applicable conditions
   - Identify affected components

2. **Allocate to Children**
   - Assign parameters to subsystems
   - Maintain budget (sum of allocations)
   - Document allocation rationale

3. **Derive Supporting Requirements**
   - Interface requirements
   - Enabling requirements
   - Constraint requirements

#### Budget Allocation Example

```
Parent: "System shall weigh < 100 kg"

Children:
- Structure: < 40 kg (40%)
- Mechanism: < 25 kg (25%)
- Electronics: < 15 kg (15%)
- Cabling: < 10 kg (10%)
- Margin: 10 kg (10%)
```

### Traceability Matrix

#### Matrix Structure

```
Requirements Verification Matrix (RVM):

| Req ID | Requirement Text | Source | Verification Method | Evidence |
|--------|------------------|--------|---------------------|----------|
| REQ-001 | Shall lift 500 kg | SRS-001 | Test | Test Report TR-001 |
| REQ-002 | Shall operate at -40C | SRS-002 | Test | Test Report TR-002 |
| REQ-003 | Shall weigh < 25 kg | SRS-003 | Inspection | FAI-001 |
```

#### Verification Methods

| Method | Application | Evidence |
|--------|-------------|----------|
| Analysis | Calculations, simulations | Analysis report |
| Test | Physical testing | Test report |
| Inspection | Visual/dimensional check | Inspection report |
| Demonstration | Functional demo | Demo record |

### Code and Standard Flow-Down

#### Standards Application

```
Mechanical standards flow-down:
1. Identify applicable standards (contract, regulatory)
2. Extract applicable requirements from standards
3. Create derived requirements with standard reference
4. Track compliance through verification
```

#### Common Standard Sources

| Domain | Standards |
|--------|-----------|
| Structural | ASME BPVC, AWS D1.1, AISC |
| Materials | ASTM, SAE AMS, MMPDS |
| Drawing | ASME Y14.5, ASME Y14.100 |
| Quality | ISO 9001, AS9100 |
| Safety | OSHA, ANSI, ISO 13849 |
| Environmental | MIL-STD-810, IEC 60068 |

### Requirements Change Control

#### Change Process

```
1. Change request submitted
2. Impact assessment
   - Technical impact
   - Cost impact
   - Schedule impact
   - Downstream requirements
3. Review and approval
4. Implementation
5. Verification of change
6. Update traceability
```

## Process Integration

- ME-001: Requirements Analysis and Flow-Down

## Input Schema

```json
{
  "source_documents": {
    "customer_spec": "string",
    "applicable_standards": "array",
    "interface_documents": "array"
  },
  "system_context": {
    "system_name": "string",
    "subsystems": "array",
    "interfaces": "array"
  },
  "requirement_level": "stakeholder|system|subsystem|component"
}
```

## Output Schema

```json
{
  "requirements_set": [
    {
      "id": "string",
      "text": "string",
      "type": "functional|performance|interface|environmental|physical",
      "source": "string",
      "parent": "string",
      "verification_method": "analysis|test|inspection|demonstration",
      "owner": "string",
      "priority": "must|should|nice",
      "status": "draft|approved|verified"
    }
  ],
  "traceability_matrix": {
    "upward": "matrix of parent links",
    "downward": "matrix of child links",
    "verification": "matrix of evidence links"
  },
  "budgets": {
    "mass": "object of allocations",
    "power": "object of allocations",
    "cost": "object of allocations"
  },
  "open_items": "array of TBD/TBR items"
}
```

## Best Practices

1. Write requirements in shall statements
2. Each requirement should be verifiable
3. Maintain clear parent-child traceability
4. Review requirements with stakeholders
5. Control changes through formal process
6. Update verification evidence as completed

## Integration Points

- Connects with Trade Study for requirement derivation
- Feeds into Design Review for verification
- Supports Test Planning for verification activities
- Integrates with Change Management for requirement changes
