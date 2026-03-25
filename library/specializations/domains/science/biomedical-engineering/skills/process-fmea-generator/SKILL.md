---
name: process-fmea-generator
description: Process Failure Mode and Effects Analysis (PFMEA) skill for manufacturing risk assessment
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - Bash
metadata:
  specialization: biomedical-engineering
  domain: science
  category: Sterilization and Manufacturing
  skill-id: BME-SK-028
---

# Process FMEA Generator Skill

## Purpose

The Process FMEA Generator Skill supports manufacturing risk assessment through systematic Process FMEA methodology, identifying potential process failures and control measures per AIAG guidelines and ISO 13485.

## Capabilities

- PFMEA worksheet generation
- Process step decomposition
- Failure mode identification by process type
- Control plan development
- Statistical process control recommendations
- Inspection point identification
- OOS/OOT handling procedures
- Process capability linkage
- Detection method specification
- Risk reduction verification
- Control plan integration

## Usage Guidelines

### When to Use
- Developing manufacturing processes
- Assessing process risks
- Designing control plans
- Planning process validation

### Prerequisites
- Process flow documented
- Equipment specifications available
- Quality requirements defined
- Historical process data accessible

### Best Practices
- Include cross-functional team
- Link to design FMEA outputs
- Integrate with control plans
- Update with process changes

## Process Integration

This skill integrates with the following processes:
- Design for Manufacturing and Assembly (DFMA)
- Sterilization Validation
- Design Control Process Implementation
- Medical Device Risk Management (ISO 14971)

## Dependencies

- AIAG PFMEA templates
- ISO 13485 requirements
- Process documentation
- SPC tools
- Control plan templates

## Configuration

```yaml
process-fmea-generator:
  process-types:
    - machining
    - molding
    - assembly
    - cleaning
    - packaging
    - sterilization
  rating-scales:
    severity: 1-10
    occurrence: 1-10
    detection: 1-10
  control-types:
    - prevention
    - detection
```

## Output Artifacts

- PFMEA worksheets
- Process flow diagrams
- Control plans
- SPC implementation plans
- Inspection procedures
- OOS/OOT procedures
- Action item tracking
- Risk reduction verification

## Quality Criteria

- All process steps analyzed
- Failure modes comprehensively identified
- Controls address high-risk items
- Detection methods effective
- Control plans complete
- Integration with design FMEA
