---
name: compliance-validator
description: Validate compliance during migration with rule checking, audit trails, and security control validation
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Compliance Validator Skill

Validates compliance requirements during migration activities, checking rules, generating audit trails, and verifying security controls.

## Purpose

Enable compliance verification for:
- Compliance rule checking
- Audit trail generation
- Security control validation
- Policy enforcement
- Gap analysis

## Capabilities

### 1. Compliance Rule Checking
- Check against frameworks (SOC2, HIPAA, PCI)
- Verify organizational policies
- Validate technical controls
- Flag violations

### 2. Audit Trail Generation
- Log migration activities
- Track changes
- Document approvals
- Preserve evidence

### 3. Security Control Validation
- Verify encryption
- Check access controls
- Validate logging
- Test security measures

### 4. Policy Enforcement
- Apply security policies
- Enforce standards
- Block violations
- Alert on issues

### 5. Compliance Report Generation
- Generate audit reports
- Document controls
- Track remediation
- Produce evidence

### 6. Gap Analysis
- Identify compliance gaps
- Prioritize remediation
- Track closure
- Report progress

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| AWS Config | AWS compliance | API |
| Azure Policy | Azure compliance | API |
| Chef InSpec | Infrastructure testing | CLI |
| OPA | Policy as code | CLI |
| Prowler | Security auditing | CLI |
| ScoutSuite | Multi-cloud audit | CLI |

## Output Schema

```json
{
  "validationId": "string",
  "timestamp": "ISO8601",
  "frameworks": ["SOC2", "HIPAA"],
  "results": {
    "passed": "number",
    "failed": "number",
    "notApplicable": "number"
  },
  "controls": [
    {
      "id": "string",
      "framework": "string",
      "status": "passed|failed|na",
      "evidence": "string",
      "remediation": "string"
    }
  ],
  "auditTrail": {
    "location": "string",
    "entries": "number"
  }
}
```

## Integration with Migration Processes

- **cloud-migration**: Cloud compliance
- **security-remediation-migration**: Security compliance

## Related Skills

- `vulnerability-scanner`: Security scanning

## Related Agents

- `compliance-migration-agent`: Compliance orchestration
- `security-vulnerability-assessor`: Security assessment
