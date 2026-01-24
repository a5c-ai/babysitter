---
name: iso-nanotechnology-compliance-checker
description: Regulatory compliance skill for ISO nanotechnology standards verification and documentation
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: nanotechnology
  domain: science
  category: infrastructure-quality
  priority: medium
  phase: 6
  tools-libraries:
    - ISO standards databases
    - Compliance management tools
---

# ISO Nanotechnology Compliance Checker

## Purpose

The ISO Nanotechnology Compliance Checker skill provides systematic verification of compliance with ISO nanotechnology standards, enabling proper documentation, terminology, and safety practices alignment.

## Capabilities

- ISO/TS 80004 terminology compliance
- ISO/TR 13014 characterization guidance
- ISO/TR 12885 safety practices
- Documentation template generation
- Compliance audit checklists
- Gap analysis reports

## Usage Guidelines

### Compliance Verification

1. **Standards Identification**
   - Identify applicable standards
   - Determine requirements
   - Map to current practices

2. **Gap Analysis**
   - Compare practices to requirements
   - Identify non-conformances
   - Prioritize remediation

3. **Documentation**
   - Generate compliant templates
   - Create audit trails
   - Prepare for certification

## Process Integration

- Nanomaterial Safety Assessment Pipeline
- Nanomaterial Scale-Up and Process Transfer

## Input Schema

```json
{
  "material_type": "string",
  "application_area": "medical|electronics|cosmetics|industrial",
  "standards_to_check": ["ISO/TS 80004", "ISO/TR 13014"],
  "current_documentation": "string (path)"
}
```

## Output Schema

```json
{
  "applicable_standards": [{
    "standard": "string",
    "title": "string",
    "relevance": "mandatory|recommended"
  }],
  "compliance_status": {
    "compliant": "number",
    "non_compliant": "number",
    "not_assessed": "number"
  },
  "gaps": [{
    "requirement": "string",
    "current_status": "string",
    "remediation": "string"
  }],
  "overall_rating": "compliant|partially_compliant|non_compliant"
}
```
