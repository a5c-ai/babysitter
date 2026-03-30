---
name: misra-c-analysis
description: MISRA C compliance checking and static analysis integration
category: Code Quality
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# MISRA C Static Analysis Skill

## Overview

This skill provides MISRA C compliance checking and static analysis integration for safety-critical embedded software development, ensuring code quality and standard compliance.

## Capabilities

### MISRA C:2012 Compliance
- Full rule set checking
- Mandatory rules enforcement
- Required rules verification
- Advisory rules analysis
- Directive compliance checking

### Static Analysis Integration
- PC-lint/PC-lint Plus integration
- Cppcheck configuration and usage
- Coverity static analysis
- Polyspace integration
- LDRA integration
- Parasoft C/C++test

### Violation Management
- Violation categorization
- Severity classification
- Suppression management
- False positive tracking
- Trend analysis

### Deviation Handling
- Deviation record generation
- Justification documentation
- Risk assessment documentation
- Approval workflow support
- Traceability maintenance

### Additional Standards
- CERT C guideline checking
- CWE weakness detection
- AUTOSAR C++14 (where applicable)
- IEC 61508 coding standards
- DO-178C coding standards

### Reporting
- Compliance reports generation
- Trend and metrics dashboards
- CI/CD integration reports
- Certification documentation

## Target Processes

- `misra-c-compliance.js` - MISRA C compliance checking
- `functional-safety-certification.js` - Safety standard compliance
- `device-driver-development.js` - Driver code quality

## Dependencies

- Static analysis tools (PC-lint, Cppcheck, Coverity, Polyspace)
- MISRA C:2012 guidelines document
- Rule configuration files

## Usage Context

This skill is invoked when tasks require:
- MISRA C compliance checking
- Static analysis configuration
- Deviation documentation
- Coding standard enforcement
- Safety certification support

## Rule Categories

### Mandatory Rules (143 rules)
Must always be followed; no deviations permitted.

### Required Rules (32 rules)
Must be followed unless formally deviated with documented justification.

### Advisory Rules (39 rules)
Should be followed; deviations need documentation but less formal.

### Directives (16 directives)
Guidelines that cannot be fully verified by static analysis.

## Configuration Example

### PC-lint Configuration (au-misra3.lnt)
```
// MISRA C:2012 configuration
+e9*, +e1*, +e2*, +e3*
-append(9001,[MISRA 2012 Rule 1.1, required])
-append(9002,[MISRA 2012 Rule 1.2, advisory])
```

### Cppcheck MISRA Configuration
```xml
<misra>
  <rule number="1.1" severity="error"/>
  <rule number="1.2" severity="warning"/>
  <suppress rule="15.5" file="legacy/*.c"/>
</misra>
```

## Deviation Record Template

```markdown
## Deviation Record DR-001

**Rule**: MISRA C:2012 Rule X.Y
**Location**: file.c, line 123
**Justification**: [Technical reason for deviation]
**Risk Assessment**: [Impact and mitigation]
**Approval**: [Approver name and date]
```
