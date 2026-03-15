---
name: license-compliance-checker
description: Automated license compliance verification for dependencies to ensure legal compliance during migration
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# License Compliance Checker Skill

Automated verification of license compliance across all project dependencies to ensure legal compliance during migration activities.

## Purpose

Enable comprehensive license compliance checking for:
- Dependency license identification
- Compatibility verification
- Copyleft license flagging
- Attribution requirement tracking
- Policy enforcement

## Capabilities

### 1. License Identification
- Extract licenses from dependencies
- Parse SPDX identifiers
- Detect custom licenses
- Handle multi-license packages

### 2. Compatibility Checking
- Verify license compatibility
- Check against project license
- Identify conflicting licenses
- Map dependency license chains

### 3. Copyleft License Flagging
- Detect GPL/AGPL licenses
- Identify viral clauses
- Flag distribution implications
- Alert on copyleft in proprietary projects

### 4. Attribution Requirement Tracking
- Collect NOTICE requirements
- Track attribution obligations
- Generate attribution documents
- Monitor compliance completeness

### 5. Policy Enforcement
- Define allowed/blocked licenses
- Enforce organizational policies
- Generate compliance reports
- Track policy violations

### 6. Compliance Report Generation
- Create audit-ready reports
- Generate SBOM with licenses
- Produce attribution files
- Export compliance evidence

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| FOSSA | Full compliance platform | API |
| WhiteSource | License scanning | API |
| Black Duck | Comprehensive analysis | API |
| license-checker | npm license checking | CLI |
| licensee | License detection | CLI |
| go-licenses | Go license checking | CLI |
| pip-licenses | Python license checking | CLI |

## Output Schema

```json
{
  "analysisId": "string",
  "timestamp": "ISO8601",
  "projectLicense": "string",
  "dependencies": [
    {
      "name": "string",
      "version": "string",
      "license": "string",
      "spdxId": "string",
      "compatible": "boolean",
      "attributionRequired": "boolean",
      "riskLevel": "high|medium|low|none"
    }
  ],
  "compliance": {
    "status": "compliant|non-compliant|review-required",
    "violations": [],
    "warnings": [],
    "attributionNeeded": []
  },
  "sbom": {
    "format": "SPDX|CycloneDX",
    "path": "string"
  }
}
```

## Integration with Migration Processes

- **dependency-analysis-updates**: License verification
- **legacy-codebase-assessment**: Compliance assessment

## Related Skills

- `dependency-scanner`: Dependency discovery
- `vulnerability-scanner`: Security + compliance

## Related Agents

- `dependency-modernization-agent`: License-safe updates
- `compliance-migration-agent`: Full compliance
