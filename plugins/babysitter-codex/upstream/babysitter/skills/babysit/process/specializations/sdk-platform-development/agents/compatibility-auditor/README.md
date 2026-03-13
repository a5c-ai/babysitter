# Compatibility Auditor Agent

## Overview

The `compatibility-auditor` agent reviews API and SDK changes for backward compatibility violations. It audits changes against compatibility policy, identifies subtle breaking changes, suggests backward-compatible alternatives, and provides clear approve/reject decisions with rationale.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Principal Compatibility Engineer |
| **Experience** | 15+ years maintaining public APIs |
| **Background** | Led compatibility teams at major platforms |
| **Philosophy** | "Breaking changes should be deliberate and deprecate-first" |

## Core Principles

1. **Semver Compliance** - Breaking changes only in major versions
2. **Deprecate First** - Warn before removing
3. **Migration Path** - Always provide upgrade guidance
4. **Consumer Impact** - Consider all consumers
5. **Behavioral Stability** - Same inputs, same outputs
6. **Contract Integrity** - Honor documented behavior

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Breaking Changes** | Classification and detection |
| **Alternatives** | Backward-compatible suggestions |
| **Deprecation** | Timeline and policy enforcement |
| **Impact Analysis** | Consumer impact assessment |
| **Approval** | Audit decisions with rationale |
| **Migration** | Guidance and documentation |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(compatibilityAuditTask, {
  agentName: 'compatibility-auditor',
  prompt: {
    role: 'Principal Compatibility Engineer',
    task: 'Audit PR for backward compatibility',
    context: {
      baseBranch: 'main',
      headBranch: 'feature/new-api',
      apiChanges: await getApiDiff(),
      sdkChanges: await getSdkDiff(),
      policy: compatibilityPolicy
    },
    instructions: [
      'Identify all breaking changes',
      'Assess consumer impact',
      'Suggest alternatives if needed',
      'Provide approval decision'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Audit PR for compatibility
/agent compatibility-auditor audit \
  --pr 1234 \
  --policy standard

# Check specific change
/agent compatibility-auditor check \
  --endpoint "GET /users" \
  --change "remove field 'legacy_id'"

# Suggest alternatives
/agent compatibility-auditor alternatives \
  --change "change 'amount' type from int to object"

# Review deprecation
/agent compatibility-auditor deprecation \
  --feature "v1 authentication" \
  --sunset 2026-06-01
```

## Common Tasks

### 1. PR Compatibility Audit

```bash
/agent compatibility-auditor audit \
  --pr 1234 \
  --output detailed
```

Output includes:
- Decision (approved/rejected/conditional)
- Breaking change findings
- Consumer impact analysis
- Required actions

### 2. Breaking Change Analysis

```bash
/agent compatibility-auditor analyze \
  --base main \
  --head feature-branch
```

Identifies:
- Definite breaking changes
- Potentially breaking changes
- Safe changes

### 3. Alternative Suggestions

```bash
/agent compatibility-auditor suggest \
  --change "remove deprecated endpoint"
```

Provides:
- Backward-compatible alternatives
- Implementation steps
- Timeline recommendations

### 4. Deprecation Review

```bash
/agent compatibility-auditor deprecation-ready \
  --feature "/v1/users" \
  --sunset 2026-06-01
```

Verifies:
- Notice period observed
- Migration guide published
- Consumer notification sent
- Usage metrics acceptable

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `backward-compatibility-management.js` | Policy enforcement |
| `sdk-versioning-release-management.js` | Version decisions |
| `api-versioning-strategy.js` | API evolution |
| `api-design-specification.js` | Design review |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const auditCompatibilityTask = defineTask({
  name: 'audit-compatibility',
  description: 'Audit changes for backward compatibility',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `Compatibility Audit for PR #${inputs.prNumber}`,
      agent: {
        name: 'compatibility-auditor',
        prompt: {
          role: 'Principal Compatibility Engineer',
          task: 'Review changes for compatibility violations',
          context: {
            prNumber: inputs.prNumber,
            apiChanges: inputs.apiChanges,
            sdkChanges: inputs.sdkChanges,
            policy: inputs.policy
          },
          instructions: [
            'Classify all changes by breaking status',
            'Identify consumer impact',
            'Verify deprecation requirements',
            'Suggest alternatives for breaking changes',
            'Provide approval decision with rationale'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['decision', 'findings', 'versionImpact'],
          properties: {
            decision: { enum: ['APPROVED', 'APPROVED_CONDITIONAL', 'REJECTED'] },
            findings: { type: 'array' },
            versionImpact: { enum: ['none', 'patch', 'minor', 'major'] }
          }
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Breaking Change Categories

### Always Breaking

| Category | Examples |
|----------|----------|
| **Removal** | Endpoint, method, field removed |
| **Type Change** | Field type changed |
| **Requirement** | Optional to required |
| **Auth Change** | Auth method removed |

### Potentially Breaking

| Category | Examples |
|----------|----------|
| **Addition** | Required field in response |
| **Enum** | New enum values |
| **Default** | Default value changed |
| **Format** | Error message format |

### Never Breaking

| Category | Examples |
|----------|----------|
| **Addition** | New endpoint, optional field |
| **Performance** | Response time improvement |
| **Internal** | Implementation detail change |

## Deprecation Policy Reference

| Feature Type | Notice Period |
|--------------|---------------|
| Major feature | 12 months |
| Minor feature | 6 months |
| Parameter | 3 months |
| Internal only | 1 month |

### Required Documentation

- Deprecation date
- Sunset date
- Migration path
- Replacement feature
- Impact assessment

## Interaction Guidelines

### What to Expect

- **Thorough analysis** of all change impact
- **Conservative approach** favoring stability
- **Actionable alternatives** for breaking changes
- **Clear decisions** with rationale

### Best Practices

1. Provide complete diff context
2. Include consumer usage data
3. Share existing deprecation notices
4. Note business urgency

## Related Resources

- [api-diff-analyzer skill](../../skills/api-diff-analyzer/) - Change detection
- [semver-analyzer skill](../../skills/semver-analyzer/) - Version analysis
- [api-design-reviewer agent](../api-design-reviewer/) - Design review

## References

- [Semantic Versioning](https://semver.org/)
- [API Deprecation Best Practices](https://cloud.google.com/apis/design/compatibility)
- [Azure SDK Breaking Changes](https://azure.github.io/azure-sdk/general_design.html#breaking-changes)
- [Stripe API Versioning](https://stripe.com/blog/api-versioning)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-SDK-003
**Category:** Versioning and Compatibility
**Status:** Active
